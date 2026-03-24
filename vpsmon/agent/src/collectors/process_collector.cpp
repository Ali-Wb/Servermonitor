#include "collectors/process_collector.hpp"

#include <algorithm>
#include <cctype>
#include <dirent.h>
#include <fstream>
#include <sstream>
#include <string>

std::vector<ProcessInfo> ProcessCollector::collectTop(int topN) const {
    std::vector<ProcessInfo> processes;

    DIR* proc = opendir("/proc");
    if (!proc) {
        return processes;
    }

    struct dirent* entry = nullptr;
    while ((entry = readdir(proc)) != nullptr) {
        std::string name = entry->d_name;
        if (name.empty() || !std::all_of(name.begin(), name.end(), ::isdigit)) {
            continue;
        }

        const int pid = std::stoi(name);

        std::ifstream statFile("/proc/" + name + "/stat");
        std::ifstream statusFile("/proc/" + name + "/status");
        if (!statFile.is_open() || !statusFile.is_open()) {
            continue;
        }

        std::string statLine;
        std::getline(statFile, statLine);
        const std::size_t lparen = statLine.find('(');
        const std::size_t rparen = statLine.rfind(')');
        if (lparen == std::string::npos || rparen == std::string::npos || rparen <= lparen) {
            continue;
        }

        ProcessInfo info;
        info.pid = pid;
        info.name = statLine.substr(lparen + 1, rparen - lparen - 1);

        std::stringstream after(statLine.substr(rparen + 2));
        char state = 'S';
        after >> state;
        info.state = std::string(1, state);

        std::vector<long long> fields;
        long long value = 0;
        while (after >> value) {
            fields.push_back(value);
        }

        if (fields.size() > 12) {
            const long long utime = fields[11];
            const long long stime = fields[12];
            info.cpuPercent = static_cast<double>(utime + stime) / 100.0;
        }

        std::string line;
        int64_t vmRssKb = 0;
        int64_t vmSizeKb = 0;
        while (std::getline(statusFile, line)) {
            if (line.rfind("VmRSS:", 0) == 0) {
                std::stringstream ss(line.substr(6));
                ss >> vmRssKb;
            } else if (line.rfind("VmSize:", 0) == 0) {
                std::stringstream ss(line.substr(7));
                ss >> vmSizeKb;
            }
        }

        info.rssBytes = vmRssKb * 1024;
        info.memoryPercent = vmSizeKb > 0 ? static_cast<double>(vmRssKb) * 100.0 / static_cast<double>(vmSizeKb) : 0.0;
        processes.push_back(info);
    }

    closedir(proc);

    std::sort(processes.begin(), processes.end(), [](const ProcessInfo& a, const ProcessInfo& b) {
        return a.cpuPercent > b.cpuPercent;
    });

    if (topN > 0 && static_cast<int>(processes.size()) > topN) {
        processes.resize(static_cast<std::size_t>(topN));
    }

    return processes;
}
