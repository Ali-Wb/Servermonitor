#pragma once

#include "collectors/snapshot.hpp"

#include <cstdint>
#include <map>
#include <string>
#include <vector>

class DockerCollector {
public:
    DockerCollector();
    std::vector<DockerContainer> getContainers();

private:
    int64_t cacheTsMs_;
    std::vector<DockerContainer> containersCache_;
    std::map<std::string, DockerContainer> statsCache_;

    std::string httpGetUnixSocket(const std::string& path) const;
    static int64_t parseRfc3339ToEpochSeconds(const std::string& created);
};
