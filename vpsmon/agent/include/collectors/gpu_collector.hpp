#pragma once

#include "collectors/snapshot.hpp"

#include <vector>

class GpuCollector {
public:
    std::vector<GpuMetrics> collect() const;
};
