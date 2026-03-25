"use client";

interface AgentOfflineProps {
  serverId?: string;
}

export function AgentOffline({ serverId }: AgentOfflineProps) {
  return (
    <section className="rounded-lg border border-red-500/30 bg-red-500/10 p-6 text-center text-sm text-red-100">
      <h2 className="font-semibold text-red-200">Agent offline</h2>
      <p className="mt-1">Unable to contact {serverId ?? "agent"}. Check connectivity, auth key, and service status.</p>
    </section>
  );
}
