#include "util/self_updater.hpp"

#ifdef VPSMON_TLS

#include <openssl/evp.h>
#include <openssl/sha.h>
#include <openssl/ssl.h>
#include <openssl/err.h>

#include <arpa/inet.h>
#include <netdb.h>
#include <signal.h>
#include <sys/socket.h>
#include <unistd.h>

#include <array>
#include <chrono>
#include <cstdio>
#include <cstdlib>
#include <fstream>
#include <sstream>
#include <string>

namespace {

std::string httpsGet(const std::string& host, const std::string& path) {
    SSL_library_init();
    SSL_load_error_strings();
    const SSL_METHOD* method = TLS_client_method();
    SSL_CTX* ctx = SSL_CTX_new(method);
    if (!ctx) return "";

    addrinfo hints{};
    hints.ai_socktype = SOCK_STREAM;
    hints.ai_family = AF_UNSPEC;
    addrinfo* result = nullptr;
    if (getaddrinfo(host.c_str(), "443", &hints, &result) != 0) {
        SSL_CTX_free(ctx);
        return "";
    }

    int sock = -1;
    for (addrinfo* it = result; it != nullptr; it = it->ai_next) {
        sock = socket(it->ai_family, it->ai_socktype, it->ai_protocol);
        if (sock < 0) continue;
        if (connect(sock, it->ai_addr, it->ai_addrlen) == 0) break;
        close(sock);
        sock = -1;
    }
    freeaddrinfo(result);
    if (sock < 0) {
        SSL_CTX_free(ctx);
        return "";
    }

    SSL* ssl = SSL_new(ctx);
    SSL_set_fd(ssl, sock);
    SSL_set_tlsext_host_name(ssl, host.c_str());
    if (SSL_connect(ssl) <= 0) {
        SSL_free(ssl);
        close(sock);
        SSL_CTX_free(ctx);
        return "";
    }

    std::string req = "GET " + path + " HTTP/1.1\r\nHost: " + host + "\r\nUser-Agent: vpsmon-agent\r\nConnection: close\r\n\r\n";
    SSL_write(ssl, req.c_str(), static_cast<int>(req.size()));

    std::string body;
    std::array<char, 4096> buf{};
    int n = 0;
    while ((n = SSL_read(ssl, buf.data(), static_cast<int>(buf.size()))) > 0) {
        body.append(buf.data(), static_cast<std::size_t>(n));
    }

    SSL_shutdown(ssl);
    SSL_free(ssl);
    close(sock);
    SSL_CTX_free(ctx);

    const std::size_t split = body.find("\r\n\r\n");
    if (split == std::string::npos) return "";
    return body.substr(split + 4);
}

std::string findJsonValue(const std::string& json, const std::string& key, std::size_t start = 0) {
    const std::string needle = "\"" + key + "\":";
    const std::size_t p = json.find(needle, start);
    if (p == std::string::npos) return "";
    const std::size_t quoteStart = json.find('"', p + needle.size());
    if (quoteStart == std::string::npos) return "";
    const std::size_t quoteEnd = json.find('"', quoteStart + 1);
    if (quoteEnd == std::string::npos) return "";
    return json.substr(quoteStart + 1, quoteEnd - quoteStart - 1);
}

std::string sha256File(const std::string& path) {
    std::ifstream in(path, std::ios::binary);
    if (!in.is_open()) return "";

    EVP_MD_CTX* ctx = EVP_MD_CTX_new();
    EVP_DigestInit_ex(ctx, EVP_sha256(), nullptr);
    std::array<char, 4096> buf{};
    while (in.good()) {
        in.read(buf.data(), static_cast<std::streamsize>(buf.size()));
        const std::streamsize got = in.gcount();
        if (got > 0) EVP_DigestUpdate(ctx, buf.data(), static_cast<std::size_t>(got));
    }

    unsigned char hash[SHA256_DIGEST_LENGTH]{};
    unsigned int len = 0;
    EVP_DigestFinal_ex(ctx, hash, &len);
    EVP_MD_CTX_free(ctx);

    std::ostringstream out;
    out << std::hex;
    for (unsigned int i = 0; i < len; ++i) {
        out.width(2);
        out.fill('0');
        out << static_cast<int>(hash[i]);
    }
    return out.str();
}

}  // namespace

UpdateResult SelfUpdater::performUpdate(const std::string& owner, const std::string& repo) {
    const int64_t ts = std::chrono::duration_cast<std::chrono::seconds>(
        std::chrono::system_clock::now().time_since_epoch()).count();
    const std::string dir = "/tmp/vpsmon-update-" + std::to_string(ts);
    std::system(("mkdir -p '" + dir + "'").c_str());

    const std::string latest = httpsGet("api.github.com", "/repos/" + owner + "/" + repo + "/releases/latest");
    if (latest.empty()) return {false, "", "failed to fetch latest release"};

    std::string assetTar;
    std::string assetSha;
    std::size_t offset = 0;
    while (true) {
        const std::size_t p = latest.find("\"browser_download_url\":", offset);
        if (p == std::string::npos) break;
        const std::string url = findJsonValue(latest, "browser_download_url", p);
        if (url.find("vpsmon-agent-linux-amd64.tar.gz") != std::string::npos) assetTar = url;
        if (url.find(".sha256") != std::string::npos) assetSha = url;
        offset = p + 1;
    }

    if (assetTar.empty() || assetSha.empty()) return {false, "", "release assets not found"};

    const std::string tarPath = dir + "/vpsmon-agent-linux-amd64.tar.gz";
    const std::string shaPath = dir + "/vpsmon-agent-linux-amd64.tar.gz.sha256";
    if (std::system(("curl -fsSL '" + assetTar + "' -o '" + tarPath + "'").c_str()) != 0) return {false, "", "failed to download tarball"};
    if (std::system(("curl -fsSL '" + assetSha + "' -o '" + shaPath + "'").c_str()) != 0) return {false, "", "failed to download sha256"};

    std::ifstream shaIn(shaPath);
    std::string expected;
    shaIn >> expected;
    const std::string actual = sha256File(tarPath);
    if (expected.empty() || actual != expected) {
        std::system(("rm -rf '" + dir + "'").c_str());
        return {false, "", "SHA256 verification failed"};
    }

    if (std::system(("tar -xzf '" + tarPath + "' -C '" + dir + "'").c_str()) != 0) return {false, "", "failed to extract update"};
    const std::string newBin = dir + "/vpsmon-agent";
    if (std::system("cp /usr/local/bin/vpsmon-agent /usr/local/bin/vpsmon-agent.bak") != 0) return {false, "", "failed to backup current binary"};
    if (std::system(("cp '" + newBin + "' /usr/local/bin/vpsmon-agent").c_str()) != 0) return {false, "", "failed to install updated binary"};
    if (std::system("chmod +x /usr/local/bin/vpsmon-agent") != 0) return {false, "", "failed to chmod updated binary"};

    kill(getpid(), SIGTERM);
    return {true, "/usr/local/bin/vpsmon-agent", ""};
}

#else

UpdateResult SelfUpdater::performUpdate(const std::string&, const std::string&) {
    return {false, "", "self-update requires TLS — recompile with make TLS=1"};
}

#endif
