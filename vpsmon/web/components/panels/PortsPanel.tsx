"use client";

import type { OpenPort } from "@/lib/schemas";

interface PortsPanelProps { ports: OpenPort[] }

const WELL_KNOWN_PORTS: Record<number, string> = {
  22: "SSH",
  53: "DNS",
  80: "HTTP",
  123: "NTP",
  443: "HTTPS",
  3306: "MySQL",
  5432: "PostgreSQL",
  6379: "Redis",
};

export function PortsPanel({ ports }: PortsPanelProps) {
  const sorted = [...ports].sort((a, b) => a.port - b.port);
  return (
    <section className="rounded-lg border bg-card p-4">
      <h3 className="mb-2 text-sm font-medium">Open Ports</h3>
      <table className="w-full text-left text-xs">
        <thead className="text-muted-foreground"><tr><th>Port</th><th>Protocol</th><th>Service</th><th>Process</th></tr></thead>
        <tbody>
          {sorted.map((port) => (
            <tr key={`${port.protocol}-${port.port}-${port.address}`} className="border-t">
              <td className="py-1 font-mono">{port.port}</td>
              <td>{port.protocol.toUpperCase()}</td>
              <td>{WELL_KNOWN_PORTS[port.port] ?? "—"}</td>
              <td>{port.processName ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
