# VPSMon

VPSMon is a VPS/server health dashboard stack with a native collection agent, a terminal TUI, and a web UI. This document summarizes the operational model and current scaffold behavior.

## Components
- **Agent (`vpsmon/agent`)**: C++ collector, storage, alerting, and command server.
- **TUI (`vpsmon/agent/tui`)**: ncurses dashboard client for quick terminal checks.
- **Web (`vpsmon/web`)**: Next.js dashboard and API layer.

## Maintenance windows
- Maintenance windows suppress alerting in configured periods.
- Current limitation: split-brain can occur when multiple independent schedulers evaluate windows against stale state.
- Optional external guard: set `VPSMON_MAINTENANCE_CHECK_URL` so the web/API layer can confirm maintenance status from a central endpoint before notifications are sent.

## Per-metric silences
- Silences target individual metrics (for example CPU only) without muting all alerts.
- Current limitation: silences are primarily frontend-driven orchestration and not yet a fully enforced agent-side policy engine.

## Public share links
- Share links expose read-only dashboard views for selected server snapshots/summary data.
- Shared data can include health score, panel metrics, and selected historical charts.
- Excluded by design: API keys, auth secrets, and privileged admin settings.

## Alert cooldown persistence
- Cooldown state is persisted on disk and survives process restarts.
- This prevents alert storms after reboot/redeploy and avoids repeated notifications for the same active incident window.

## History `maxPoints` behavior
- History queries are automatically capped to 300 points.
- Reason: consistent payload size, safer browser rendering, and predictable API latency.

## Self-update TLS requirement
- Self-update is only available when the agent is compiled with TLS support.
- Build with `make TLS=1` to enable secure update workflow.
- Non-TLS builds should return a clear “TLS required” update response.

## TUI usage
`vpsmon-tui` supports:
- `--key` for authenticated requests.
- `--tls` for TLS connections (when compiled with TLS support).
- `--light-bg` for better readability on light terminals.

## Cron evaluator scope
Supported (current scaffold scope):
- Basic numeric ranges and fixed intervals.
- Standard 5-field cron-like expressions consumed by scheduler config.

Not fully supported yet:
- Advanced timezone-aware cron semantics and DST edge-case reconciliation.
- Full parity with enterprise cron extensions (`L`, `W`, `#`, macro aliases across all contexts).

## Custom widget expressions
- Supports expression arrays that combine multiple metric references.
- Validation catches malformed arrays, unknown metric keys, and invalid operator/value combinations.
- Errors are surfaced to UI so invalid widgets fail safely rather than crashing rendering.

## GDPR / privacy controls
- Audit logs support anonymization of selected identifying fields.
- Retention policies can be configured to reduce persistence windows.
- Opt-out mode can disable optional telemetry and audit enrichment flows.

## PDF export
- PDF summaries are always rendered in light mode (white background, dark text).
- Sections are customizable; only requested sections are included in output.
