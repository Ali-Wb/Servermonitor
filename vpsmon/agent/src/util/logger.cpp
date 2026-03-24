#include "util/logger.hpp"

#include <chrono>
#include <ctime>
#include <iomanip>
#include <iostream>
#include <sstream>

#include <unistd.h>

Logger& Logger::instance() {
    static Logger logger;
    return logger;
}

Logger::Logger()
    : level_(Level::INFO),
      useColor_(isatty(STDERR_FILENO) != 0) {
}

Logger::~Logger() = default;

void Logger::setLevel(Level level) {
    std::lock_guard<std::mutex> lock(mutex_);
    level_ = level;
}

void Logger::setLogFile(const std::string& path) {
    std::lock_guard<std::mutex> lock(mutex_);
    file_.close();
    file_.open(path, std::ios::app);
}

void Logger::log(Level level, const std::string& message) {
    std::lock_guard<std::mutex> lock(mutex_);
    if (static_cast<int>(level) < static_cast<int>(level_)) {
        return;
    }

    const std::string line = "[" + timestampNow() + "] [" + levelToString(level) + "] " + message;

    if (useColor_) {
        std::cerr << levelColor(level) << line << "\033[0m" << std::endl;
    } else {
        std::cerr << line << std::endl;
    }

    if (file_.is_open()) {
        file_ << line << std::endl;
    }
}

std::string Logger::levelToString(Level level) {
    switch (level) {
        case Level::DEBUG: return "DEBUG";
        case Level::INFO: return "INFO";
        case Level::WARN: return "WARN";
        case Level::ERROR: return "ERROR";
    }

    return "INFO";
}

const char* Logger::levelColor(Level level) {
    switch (level) {
        case Level::DEBUG: return "\033[36m";
        case Level::INFO: return "\033[32m";
        case Level::WARN: return "\033[33m";
        case Level::ERROR: return "\033[31m";
    }

    return "\033[0m";
}

std::string Logger::timestampNow() {
    const auto now = std::chrono::system_clock::now();
    const auto timePoint = std::chrono::system_clock::to_time_t(now);
    const auto ms = std::chrono::duration_cast<std::chrono::milliseconds>(
        now.time_since_epoch()) % 1000;

    std::tm localTime{};
    localtime_r(&timePoint, &localTime);

    std::ostringstream stream;
    stream << std::put_time(&localTime, "%Y-%m-%d %H:%M:%S")
           << '.' << std::setw(3) << std::setfill('0') << ms.count();
    return stream.str();
}
