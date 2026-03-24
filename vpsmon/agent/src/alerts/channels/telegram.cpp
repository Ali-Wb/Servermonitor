#include "alerts/channels/channel.hpp"

bool sendTelegram(const AgentConfig& config, const AlertMessage& /*message*/) {
#ifdef VPSMON_TLS
    return !config.telegram_bot_token.empty() && !config.telegram_chat_id.empty();
#else
    (void)config;
    return false;
#endif
}
