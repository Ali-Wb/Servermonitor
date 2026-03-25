#pragma once

#include "collectors/snapshot.hpp"

#include <vector>

class PortCollector {
public:
    std::vector<OpenPort> collect() const;
};
