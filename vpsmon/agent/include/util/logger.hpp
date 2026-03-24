#pragma once

#include <fstream>
#include <mutex>
#include <string>

class Logger {
public:
    enum class Level {
        DEBUG = 0,
        INFO = 1,
        WARN = 2,
        ERROR = 3,
    };

    static Logger& instance();

    void setLevel(Level level);
    void setLogFile(const std::string& path);
    void log(Level level, const std::string& message);

private:
    Logger();
    ~Logger();

    Logger(const Logger&) = delete;
    Logger& operator=(const Logger&) = delete;

    static std::string levelToString(Level level);
    static const char* levelColor(Level level);
    static std::string timestampNow();

    std::mutex mutex_;
    Level level_;
    std::ofstream file_;
    bool useColor_;
};

#define LOG_DEBUG(message) Logger::instance().log(Logger::Level::DEBUG, (message))
#define LOG_INFO(message) Logger::instance().log(Logger::Level::INFO, (message))
#define LOG_WARN(message) Logger::instance().log(Logger::Level::WARN, (message))
#define LOG_ERROR(message) Logger::instance().log(Logger::Level::ERROR, (message))
