#pragma once

#include "collectors/snapshot.hpp"

class RamCollector {
public:
    RamMetrics collect() const;
};
