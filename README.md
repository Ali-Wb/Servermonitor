# VPSMon

A full-stack VPS and server monitoring platform with a native collector agent, terminal TUI, and modern web dashboard.

VPSMon is designed for operators who want lightweight host-side metric collection and a rich central UI for day-to-day observability workflows: health scoring, incident response, alerting, maintenance windows, silencing, historical trend views, and export/share capabilities.

---

## Table of Contents

- [Why VPSMon](#why-vpsmon)
- [Architecture](#architecture)
- [Core Features](#core-features)
- [Technology Stack](#technology-stack)
- [Repository Layout](#repository-layout)
- [How It Works](#how-it-works)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [Build and Run](#build-and-run)
- [Release & Versioning](#release--versioning)
- [Operational Notes & Limitations](#operational-notes--limitations)
- [Security & Privacy](#security--privacy)
- [Troubleshooting](#troubleshooting)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

---

## Why VPSMon

- **Native host collection**: low overhead collector path in C++.
- **Operator-friendly UI**: dashboard, panels, compare views, and alert workflows.
- **Terminal-first support**: ncurses TUI for quick checks over SSH.
- **Structured APIs**: web routes + typed schema contracts.
- **Deployment flexibility**: local dev, containerized setup, and service-unit-based installs.

---

## Architecture

VPSMon is organized as a monorepo with three major parts:

1. **Agent (`vpsmon/agent`)**
   - Collects host metrics (CPU, RAM, disk, network, processes, ports, services, Docker, GPU, etc.).
   - Stores/downsamples data and exposes command handlers over TCP (optional TLS build path).
   - Handles alerting, cooldown persistence, scheduling, and config validation.

2. **Web (`vpsmon/web`)**
   - Next.js App Router frontend + API endpoints.
   - Hosts dashboards, settings, management workflows, exports, and share links.
   - Serves as central control plane and presentation layer.

3. **TUI (`vpsmon/agent/tui`)**
   - ncurses terminal dashboard.
   - Useful for remote diagnostics where browser access is unavailable.

---

## Core Features

- Multi-metric host snapshots and historical trend retrieval.
- Health score model and status-driven summaries.
- Alert workflows with cooldown persistence.
- Maintenance windows and silence controls.
- Public share-link support (read-only scoped views).
- Config validation mode and metrics/json CLI output from agent.
- PDF summary export with section-level selection.
- Docker and service-install scaffolding.

---

## Technology Stack

### Agent / TUI
- **C++17**
- **ncurses** (TUI)
- **OpenSSL** (TLS/update path when enabled)
- **SQLite (vendored stub in scaffold)**
- **GNU Make**

### Web
- **Next.js** (App Router)
- **React + TypeScript**
- **zod** for runtime schema validation
- **@tanstack/react-query** for data-fetching patterns
- **@react-pdf/renderer** for PDF report generation

### Tooling / Ops
- **Docker / Docker Compose**
- **Bash scripts** (install + version bump)
- **systemd unit scaffold**

---

## Repository Layout

```text
.
├── README.md
├── CHANGELOG.md
├── VERSION
├── docker-compose.yml
├── scripts/
│   └── bump-version.sh
└── vpsmon/
    ├── README.md
    ├── agent/
    │   ├── include/
    │   ├── src/
    │   ├── tui/
    │   ├── Makefile
    │   └── vpsmon.conf.example
    └── web/
        ├── app/
        ├── components/
        ├── hooks/
        ├── lib/
        ├── providers/
        └── package.json
```

---

## How It Works

1. Agent collects and normalizes host signals.
2. Metrics are persisted and optionally downsampled for efficient history queries.
3. Command handlers expose snapshot/history/update/check endpoints to clients.
4. Web API consumes those agent interactions and presents data via UI and exports.
5. Alert engine uses thresholds/schedules/silences/cooldowns to reduce noise and avoid storms.

---

## Getting Started

### Prerequisites

- Linux environment (recommended for full agent/TUI behavior)
- `g++`, `make`
- `node` + `npm`
- Optional: Docker + Docker Compose

### 1) Clone

```bash
git clone <your-repo-url>
cd Servermonitor
```

### 2) Build agent

```bash
make -C vpsmon/agent all
```

Enable TLS build path:

```bash
make -C vpsmon/agent TLS=1 all
```

### 3) Install web dependencies and run dev server

```bash
cd vpsmon/web
npm install
npm run dev
```

### 4) Optional: run with Docker Compose

```bash
docker compose up --build
```

---

## Configuration

- Agent example config: `vpsmon/agent/vpsmon.conf.example`
- Web env template: `vpsmon/web/.env.local.example`
- Compose defaults: `docker-compose.yml`

Recommended flow:

1. Copy example config/env files.
2. Set auth keys, host/port, storage paths.
3. If using maintenance checks, set `VPSMON_MAINTENANCE_CHECK_URL`.
4. For self-update functionality, compile agent with TLS support.

---

## Build and Run

### Agent CLI modes

```bash
./vpsmon/agent/build/bin/vpsmon-agent --json
./vpsmon/agent/build/bin/vpsmon-agent --metrics
./vpsmon/agent/build/bin/vpsmon-agent --check-config
```

### TUI

```bash
make -C vpsmon/agent tui
./vpsmon/agent/build/bin/vpsmon-tui --host 127.0.0.1 --port 9000
```

Useful flags:
- `--key` auth key
- `--tls` TLS transport (TLS build required)
- `--light-bg` light terminal palette

---

## Release & Versioning

- Current release marker is stored in `VERSION`.
- Changelog entries are maintained in `CHANGELOG.md`.
- Bump script:

```bash
./scripts/bump-version.sh patch
# or: major | minor
```

The bump script updates `VERSION`, inserts a new changelog section template, stages files, and commits the bump.

---

## Operational Notes & Limitations

- History query responses are capped (max points) to protect API/UI performance.
- Self-update path requires TLS-enabled build.
- Some advanced cron semantics are intentionally out-of-scope in this scaffold phase.
- Per-metric silences currently rely on frontend-driven orchestration and are not yet a complete policy engine.
- Maintenance windows can have distributed-state edge cases without centralized coordination.

For deeper operational detail, see `vpsmon/README.md`.

---

## Security & Privacy

- Authentication keys are supported for command/API access.
- Audit logging and anonymization hooks are scaffolded.
- Share links are intended to expose scoped read-only data, excluding secrets/admin credentials.
- Review and harden all defaults before production deployment.

---

## Troubleshooting

- **Agent won’t start**: run `--check-config` and validate filesystem/socket permissions.
- **No metrics in web**: verify agent endpoint + auth key and inspect web API logs.
- **TUI connection issues**: confirm host/port/TLS mode and key alignment.
- **PDF export issues**: ensure web dependencies are installed (`@react-pdf/renderer`).

---

## Roadmap

This repository currently provides a production-oriented scaffold. Next iterations typically focus on:

- deeper unit/integration test coverage,
- alert policy hardening,
- richer RBAC/auth flows,
- improved distributed maintenance/scheduling semantics,
- packaging and deployment automation.

---

## Contributing

1. Create a feature branch.
2. Keep changes scoped and documented.
3. Update `CHANGELOG.md` / docs for user-facing behavior.
4. Submit PR with summary, rationale, and test evidence.

---

## License

No license file is currently included in this scaffold. Add a project license (for example MIT/Apache-2.0) before public distribution.
