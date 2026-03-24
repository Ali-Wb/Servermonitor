"use client";

import type { DockerContainer } from "@/lib/schemas";
import { formatBytes } from "@/lib/format";

interface DockerPanelProps {
  containers: DockerContainer[];
}

function formatUptime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "—";
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  return `${hours}h ${mins}m`;
}

export function DockerPanel({ containers }: DockerPanelProps) {
  return (
    <section className="rounded-lg border bg-card p-4">
      <h3 className="mb-3 text-sm font-medium">Docker</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="text-muted-foreground">
            <tr>
              <th className="py-1">Name</th><th>Image</th><th>CPU%</th><th>Memory</th><th>Uptime</th><th>State</th>
            </tr>
          </thead>
          <tbody>
            {containers.map((item) => (
              <tr key={item.id} className="border-t">
                <td className="py-1 font-mono">{item.name}</td>
                <td className="font-mono text-[11px]">{item.image}</td>
                <td className="font-mono">{item.cpuPercent.toFixed(1)}</td>
                <td className="font-mono">{formatBytes(item.memoryUsageBytes)} / {formatBytes(item.memoryLimitBytes)}</td>
                <td className="font-mono">{formatUptime(item.uptimeSeconds)}</td>
                <td>{item.state}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">Stats refresh every 5s.</p>
    </section>
  );
}
