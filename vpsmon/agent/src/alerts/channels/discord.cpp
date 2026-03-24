#include "alerts/channels/channel.hpp"

bool sendDiscord(const AgentConfig& config, const AlertMessage& /*message*/) {
    return !config.discord_webhook_url.empty();
}
