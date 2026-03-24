#pragma once

namespace Signals {

void installSignalHandlers();
bool isStopRequested();
bool isReloadRequested();
void clearReloadRequested();

}  // namespace Signals

class SignalHandler {
public:
    static void setup();
    static bool stopRequested();
    static bool reloadRequested();
    static void clearReloadRequested();
};
