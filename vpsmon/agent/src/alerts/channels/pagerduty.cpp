#include "alerts/channels/channel.hpp"

bool sendPagerDuty(const AgentConfig& config, const AlertMessage& /*message*/) {
    return !config.pagerduty_integration_key.empty();
}
