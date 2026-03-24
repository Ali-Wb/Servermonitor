#include "alerts/channels/channel.hpp"

bool sendSmtp(const AgentConfig& config, const AlertMessage& /*message*/) {
#ifdef VPSMON_TLS
    return !config.smtp_host.empty() && !config.smtp_from.empty();
#else
    (void)config;
    return false;
#endif
}
