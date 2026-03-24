import { Badge } from "@/components/ui/badge";

interface ServerHeaderProps {
  hostname: string;
  uptime: string;
  loadAvg1: number;
  loadAvg5: number;
  loadAvg15: number;
  isOnline: boolean;
  lastUpdated: number;
  agentVersion?: string;
  versionMismatch?: boolean;
  isMaintenance?: boolean;
  maintenanceLabel?: string;
  healthScore?: number;
}

export function ServerHeader({
  hostname,
  uptime,
  loadAvg1,
  loadAvg5,
  loadAvg15,
  isOnline,
  lastUpdated,
  agentVersion,
  versionMismatch,
  isMaintenance,
  maintenanceLabel,
  healthScore,
}: ServerHeaderProps) {
  const ageSeconds = Math.max(0, Math.floor((Date.now() - lastUpdated) / 1000));

  return (
    <section className="space-y-2 rounded-lg border bg-card p-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:items-center">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold">{hostname}</h1>
          <Badge className={isOnline ? "" : "bg-red-600 text-white"}>{isOnline ? "Online" : "Offline"}</Badge>
        </div>
        <div className="text-sm text-muted-foreground">
          Uptime: <span className="font-medium text-foreground">{uptime}</span> · Load: {loadAvg1.toFixed(2)} / {loadAvg5.toFixed(2)} / {loadAvg15.toFixed(2)}
        </div>
        <div className="text-right text-sm">
          <div>Health: <span className="font-semibold">{healthScore ?? "—"}</span></div>
          <div className="text-muted-foreground">Updated {ageSeconds}s ago</div>
        </div>
      </div>

      {versionMismatch ? (
        <div className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-300">
          Agent version mismatch{agentVersion ? `: ${agentVersion}` : ""}.
        </div>
      ) : null}

      {isMaintenance ? (
        <div className="rounded-md border border-purple-500/40 bg-purple-500/10 px-3 py-2 text-sm text-purple-300">
          {maintenanceLabel ?? "In maintenance window"}
        </div>
      ) : null}
    </section>
  );
}
