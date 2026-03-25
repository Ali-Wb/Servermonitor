#include <arpa/inet.h>
#include <netdb.h>
#include <netinet/in.h>
#include <ncurses.h>
#include <sys/socket.h>
#include <unistd.h>

#include <algorithm>
#include <chrono>
#include <cstdint>
#include <cstdio>
#include <cstring>
#include <sstream>
#include <string>
#include <thread>
#include <vector>

#ifdef VPSMON_TLS
#include <openssl/ssl.h>
#include <openssl/err.h>
#endif

struct ServerTarget {
    std::string name;
    std::string host;
    int port = 7070;
};

struct Options {
    std::string host = "127.0.0.1";
    int port = 7070;
    std::string key;
    bool tls = false;
    bool lightBg = false;
    std::vector<ServerTarget> servers;
};

Options parseArgs(int argc, char** argv) {
    Options o;
    for (int i = 1; i < argc; ++i) {
        const std::string arg = argv[i];
        if (arg == "--host" && i + 1 < argc) o.host = argv[++i];
        else if (arg == "--port" && i + 1 < argc) o.port = std::stoi(argv[++i]);
        else if (arg == "--key" && i + 1 < argc) o.key = argv[++i];
        else if (arg == "--tls") o.tls = true;
        else if (arg == "--light-bg") o.lightBg = true;
        else if (arg == "--servers" && i + 1 < argc) {
            std::stringstream ss(argv[++i]);
            std::string item;
            while (std::getline(ss, item, ',')) {
                std::stringstream is(item);
                std::string name, host, port;
                std::getline(is, name, ':');
                std::getline(is, host, ':');
                std::getline(is, port, ':');
                if (!name.empty() && !host.empty() && !port.empty()) o.servers.push_back({name, host, std::stoi(port)});
            }
        }
    }
    if (o.servers.empty()) o.servers.push_back({"default", o.host, o.port});
    return o;
}

std::string requestSnapshot(const ServerTarget& target, const std::string& key, bool tls) {
    std::string payload = "{\"cmd\":\"snapshot\"";
    if (!key.empty()) payload += ",\"key\":\"" + key + "\"";
    payload += "}\n";

#ifdef VPSMON_TLS
    if (tls) {
        SSL_library_init();
        SSL_load_error_strings();
        SSL_CTX* ctx = SSL_CTX_new(TLS_client_method());
        if (!ctx) return "{\"error\":\"tls ctx failed\"}";

        addrinfo hints{};
        hints.ai_socktype = SOCK_STREAM;
        addrinfo* res = nullptr;
        if (getaddrinfo(target.host.c_str(), std::to_string(target.port).c_str(), &hints, &res) != 0) {
            SSL_CTX_free(ctx);
            return "{\"error\":\"dns failed\"}";
        }
        int fd = -1;
        for (addrinfo* it = res; it != nullptr; it = it->ai_next) {
            fd = socket(it->ai_family, it->ai_socktype, it->ai_protocol);
            if (fd < 0) continue;
            if (connect(fd, it->ai_addr, it->ai_addrlen) == 0) break;
            close(fd);
            fd = -1;
        }
        freeaddrinfo(res);
        if (fd < 0) {
            SSL_CTX_free(ctx);
            return "{\"error\":\"connect failed\"}";
        }

        SSL* ssl = SSL_new(ctx);
        SSL_set_fd(ssl, fd);
        if (SSL_connect(ssl) <= 0) {
            SSL_free(ssl);
            close(fd);
            SSL_CTX_free(ctx);
            return "{\"error\":\"ssl connect failed\"}";
        }
        SSL_write(ssl, payload.c_str(), static_cast<int>(payload.size()));
        std::string out;
        char c = 0;
        while (SSL_read(ssl, &c, 1) > 0) {
            if (c == '\n') break;
            out.push_back(c);
        }
        SSL_shutdown(ssl);
        SSL_free(ssl);
        close(fd);
        SSL_CTX_free(ctx);
        return out;
    }
#else
    if (tls) {
        std::fprintf(stderr, "TUI TLS requires compilation with make tui-tls\n");
        std::exit(1);
    }
#endif

    int fd = socket(AF_INET, SOCK_STREAM, 0);
    if (fd < 0) return "{\"error\":\"socket failed\"}";
    sockaddr_in addr{};
    addr.sin_family = AF_INET;
    addr.sin_port = htons(static_cast<uint16_t>(target.port));
    if (inet_pton(AF_INET, target.host.c_str(), &addr.sin_addr) != 1) {
        close(fd);
        return "{\"error\":\"invalid host\"}";
    }
    if (connect(fd, reinterpret_cast<sockaddr*>(&addr), sizeof(addr)) != 0) {
        close(fd);
        return "{\"error\":\"connect failed\"}";
    }
    send(fd, payload.c_str(), payload.size(), 0);
    std::string out;
    char c = 0;
    while (recv(fd, &c, 1, 0) > 0) {
        if (c == '\n') break;
        out.push_back(c);
    }
    close(fd);
    return out;
}

int main(int argc, char** argv) {
    Options options = parseArgs(argc, argv);

    initscr();
    cbreak();
    noecho();
    keypad(stdscr, TRUE);
    nodelay(stdscr, TRUE);
    start_color();

    if (options.lightBg) {
        init_pair(1, COLOR_GREEN, COLOR_WHITE);
        init_pair(2, COLOR_YELLOW, COLOR_WHITE);
        init_pair(3, COLOR_RED, COLOR_WHITE);
        init_pair(4, COLOR_BLUE, COLOR_WHITE);
    } else {
        init_pair(1, COLOR_GREEN, COLOR_BLACK);
        init_pair(2, COLOR_YELLOW, COLOR_BLACK);
        init_pair(3, COLOR_RED, COLOR_BLACK);
        init_pair(4, COLOR_CYAN, COLOR_BLACK);
    }

    int active = 0;
    while (true) {
        erase();
        mvprintw(0, 0, "vpsmon-tui | TAB switch server | q quit");
        for (std::size_t i = 0; i < options.servers.size(); ++i) {
            if (static_cast<int>(i) == active) attron(A_REVERSE);
            mvprintw(1, static_cast<int>(i * 20), "%s", options.servers[i].name.c_str());
            if (static_cast<int>(i) == active) attroff(A_REVERSE);
        }

        const ServerTarget& target = options.servers[static_cast<std::size_t>(active)];
        const std::string snapshot = requestSnapshot(target, options.key, options.tls);
        mvprintw(3, 0, "Server: %s (%s:%d)", target.name.c_str(), target.host.c_str(), target.port);
        mvprintw(5, 0, "Snapshot JSON:");
        mvprintw(6, 0, "%.*s", COLS - 1, snapshot.c_str());

        refresh();
        const int ch = getch();
        if (ch == 'q' || ch == 'Q') break;
        if (ch == '\t') active = (active + 1) % static_cast<int>(options.servers.size());

        std::this_thread::sleep_for(std::chrono::milliseconds(500));
    }

    endwin();
    return 0;
}
