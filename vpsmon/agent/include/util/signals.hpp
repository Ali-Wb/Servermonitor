#pragma once

namespace Signals {

void installSignalHandlers();
bool isStopRequested();
bool isReloadRequested();
void clearReloadRequested();

}  // namespace Signals
