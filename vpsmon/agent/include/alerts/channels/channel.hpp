#pragma once

#include "config/config.hpp"

#include <string>

struct AlertMessage {
    std::string title;
    std::string body;
    std::string severity;
};

bool sendSlack(const AgentConfig& config, const AlertMessage& message);
bool sendDiscord(const AgentConfig& config, const AlertMessage& message);
bool sendTelegram(const AgentConfig& config, const AlertMessage& message);
bool sendSmtp(const AgentConfig& config, const AlertMessage& message);
bool sendPagerDuty(const AgentConfig& config, const AlertMessage& message);
bool sendWebhook(const AgentConfig& config, const AlertMessage& message);
