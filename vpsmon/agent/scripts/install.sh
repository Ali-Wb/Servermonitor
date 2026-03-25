#!/usr/bin/env bash
set -euo pipefail

TLS=0
TUI=0
for arg in "$@"; do
  case "$arg" in
    --tls) TLS=1 ;;
    --tui) TUI=1 ;;
    *) echo "Unknown arg: $arg"; exit 1 ;;
  esac
done

if command -v apt-get >/dev/null 2>&1; then
  sudo apt-get update
  sudo apt-get install -y build-essential make pkg-config curl ca-certificates libncurses5-dev
  if [[ "$TLS" -eq 1 ]]; then
    sudo apt-get install -y libssl-dev
  fi
elif command -v dnf >/dev/null 2>&1; then
  sudo dnf install -y gcc-c++ make ncurses-devel curl ca-certificates
  if [[ "$TLS" -eq 1 ]]; then
    sudo dnf install -y openssl-devel
  fi
elif command -v yum >/dev/null 2>&1; then
  sudo yum install -y gcc-c++ make ncurses-devel curl ca-certificates
  if [[ "$TLS" -eq 1 ]]; then
    sudo yum install -y openssl-devel
  fi
else
  echo "Unsupported OS package manager"
  exit 1
fi

if [[ "$TLS" -eq 1 ]]; then
  make -C "$(dirname "$0")/.." all CXXFLAGS+=" -DVPSMON_TLS=1"
else
  make -C "$(dirname "$0")/.." all
fi

if [[ "$TUI" -eq 1 ]]; then
  make -C "$(dirname "$0")/.." tui
fi

sudo make -C "$(dirname "$0")/.." install
if [[ "$TUI" -eq 1 ]]; then
  sudo make -C "$(dirname "$0")/.." install-tui
fi

sudo install -D -m 0644 "$(dirname "$0")/../vpsmon-agent.service" /etc/systemd/system/vpsmon-agent.service
if [[ ! -f /etc/vpsmon.conf ]]; then
  sudo install -D -m 0644 "$(dirname "$0")/../vpsmon.conf.example" /etc/vpsmon.conf
fi

sudo systemctl daemon-reload
sudo systemctl enable --now vpsmon-agent

echo "Install complete"
