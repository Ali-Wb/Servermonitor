#pragma once

#include "collectors/snapshot.hpp"

#include <vector>

class ProcessCollector {
public:
    std::vector<ProcessInfo> collectTop(int topN) const;
};
