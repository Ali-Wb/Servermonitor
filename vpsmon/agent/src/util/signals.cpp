#include "util/signals.hpp"

#include <atomic>
#include <csignal>

namespace {

std::atomic<bool> stopRequested{false};
std::atomic<bool> reloadRequested{false};

void handleSignal(int signalNumber) {
    if (signalNumber == SIGINT || signalNumber == SIGTERM) {
        stopRequested.store(true);
    } else if (signalNumber == SIGHUP) {
        reloadRequested.store(true);
    }
}

void registerSignal(int signalNumber) {
    struct sigaction action {};
    action.sa_handler = handleSignal;
    sigemptyset(&action.sa_mask);
    action.sa_flags = 0;
    sigaction(signalNumber, &action, nullptr);
}

}  // namespace

namespace Signals {

void installSignalHandlers() {
    registerSignal(SIGINT);
    registerSignal(SIGTERM);
    registerSignal(SIGHUP);
}

bool isStopRequested() {
    return stopRequested.load();
}

bool isReloadRequested() {
    return reloadRequested.load();
}

void clearReloadRequested() {
    reloadRequested.store(false);
}

}  // namespace Signals
