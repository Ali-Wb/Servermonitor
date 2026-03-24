#include "alerts/channels/channel.hpp"

bool sendWebhook(const AgentConfig& config, const AlertMessage& /*message*/) {
    return !config.webhook_url.empty();
}
