# Changelog

All notable changes to this project will be documented in this file.

## [0.1.0] - 2026-03-25

### Added
- Initial VPSMon monorepo scaffold with C++ monitoring agent, ncurses TUI, Next.js web UI, Docker setup, docs, and project tooling.
- Native agent subsystem boundaries for collectors (CPU, RAM, disk, network, Docker, GPU, ports, processes, file descriptors, service watchers), snapshot composition, storage, alert engine, scheduler, logger, config parser, and signal handling.
- TCP server command handling with auth key support, rate limiting, request parsing, and baseline TLS hooks.
- CLI modes for `--json`, `--metrics`, and `--check-config` plus validation reporting semantics.
- Self-update implementation path gated behind TLS builds (`make TLS=1`) with release lookup, SHA256 verification, safe install workflow, and non-TLS fallback errors.
- Persistent data handling for alert cooldowns, recurring scheduler state, API keys, and metrics downsampling/retention scaffolding.
- TUI application with server tab selection and flags for `--host`, `--port`, `--key`, `--tls`, `--light-bg`, and `--servers`.
- Web frontend scaffold (Next.js App Router + TypeScript + zod) including dashboard pages, compare views, settings screens, API routes, provider/hook layer, chart components, and reusable UI primitives.
- API feature surface for snapshots, history, uptime, bandwidth, logs, exports, test alerts, updates, silences, shares, groups, maintenance windows, thresholds, annotations, comments, and auth/audit operations.
- Public sharing flow scaffolding with tokenized routes and server-side guardrails.
- Audit logging/anonymization and storage helpers for privacy-aware operations.
- PDF export scaffolding with customizable sections and guaranteed light-mode rendering.
- Docker artifacts for agent and web images, plus root `docker-compose.yml` with host PID requirements and persisted volumes.
- Example environment/config files (`vpsmon.conf.example`, `.env.local.example`) and a systemd unit (`vpsmon-agent.service`).
- Baseline docs (`README.md`, `vpsmon/README.md`, `PLAN.md`, `CONTEXT.md`) and release metadata (`VERSION`, bump script).

### Notes
- 0.1.0 is a scaffold/baseline release intended to establish architecture and interfaces for subsequent implementation hardening.
