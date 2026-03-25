FROM ubuntu:22.04

RUN apt-get update && apt-get install -y --no-install-recommends \
    g++ make ca-certificates libssl-dev libncurses5-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY . .
RUN make all

# NOTE: run with --pid=host so /proc and host metrics are visible.
CMD ["/app/build/bin/vpsmon-agent", "--config", "/etc/vpsmon.conf"]
