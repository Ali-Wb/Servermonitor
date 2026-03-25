#pragma once

#include <string>

struct UpdateResult {
    bool ok;
    std::string installedPath;
    std::string error;
};

class SelfUpdater {
public:
    static UpdateResult performUpdate(const std::string& owner, const std::string& repo);
};
