#pragma once

#include "collectors/snapshot.hpp"

class FdCollector {
public:
    FdMetrics collect() const;
};
