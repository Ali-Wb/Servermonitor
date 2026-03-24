#include "server/tcp_server.hpp"

#ifdef VPSMON_TLS

#include "util/logger.hpp"

#include <openssl/err.h>
#include <openssl/ssl.h>

bool TlsServer::initTls(const std::string& certFile, const std::string& keyFile) {
    SSL_library_init();
    SSL_load_error_strings();
    const SSL_METHOD* method = TLS_server_method();
    SSL_CTX* ctx = SSL_CTX_new(method);
    if (ctx == nullptr) {
        LOG_WARN("TLS init failed: SSL_CTX_new");
        return false;
    }

    const bool certOk = SSL_CTX_use_certificate_file(ctx, certFile.c_str(), SSL_FILETYPE_PEM) == 1;
    const bool keyOk = SSL_CTX_use_PrivateKey_file(ctx, keyFile.c_str(), SSL_FILETYPE_PEM) == 1;
    if (!certOk || !keyOk) {
        LOG_WARN("TLS init failed: cert/key load");
        SSL_CTX_free(ctx);
        return false;
    }

    SSL_CTX_free(ctx);
    return true;
}

#endif
