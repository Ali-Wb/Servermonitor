#include "alerts/channels/channel.hpp"

bool sendSlack(const AgentConfig& config, const AlertMessage& /*message*/) {
    return !config.slack_webhook_url.empty();
}
