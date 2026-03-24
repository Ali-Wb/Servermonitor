"use client";

import cronstrue from "cronstrue";
import { useEffect, useMemo, useState } from "react";

import type { MaintenanceWindow } from "@/lib/schemas";

function parseCronExpression(expression: string): { valid: boolean; error?: string } {
  if (!expression.startsWith("cron:")) return { valid: false, error: "Cron schedules must start with cron:" };
  const body = expression.slice(5).trim();
  const parts = body.split(/\s+/);
  if (parts.length !== 5) return { valid: false, error: "Expected 5 cron fields" };
  const unsupported = ["L", "#", "JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC", "MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
  if (unsupported.some((token) => body.toUpperCase().includes(token))) {
    return { valid: false, error: "Unsupported cron syntax used" };
  }
  return { valid: true };
}

export function MaintenanceWindowEditor() {
  const [items, setItems] = useState<MaintenanceWindow[]>([]);
  const [serverId, setServerId] = useState("local");
  const [label, setLabel] = useState("");
  const [schedule, setSchedule] = useState("cron:0 2 * * *");
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { void fetch('/api/settings/maintenance').then((r) => r.json()).then((d: MaintenanceWindow[]) => setItems(d)); }, []);

  const preview = useMemo(() => {
    if (!schedule.startsWith('cron:')) return 'One-time schedule';
    try { return cronstrue.toString(schedule.slice(5)); } catch { return 'Invalid cron'; }
  }, [schedule]);

  const save = async () => {
    if (schedule.startsWith('cron:')) {
      const parsed = parseCronExpression(schedule);
      if (!parsed.valid) {
        setError(parsed.error ?? 'Invalid cron');
        return;
      }
    }
    setError(null);
    const response = await fetch('/api/settings/maintenance', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ serverId, label, schedule, durationMinutes, enabled: true }) });
    if (!response.ok) return;
    const created = await response.json() as MaintenanceWindow;
    setItems((prev) => [created, ...prev]);
  };

  return <section className="rounded-lg border bg-card p-4 space-y-3"><h3 className="text-sm font-semibold">Maintenance Window Editor</h3><p className="text-xs text-muted-foreground">Agent-level suppression requires VPSMON_MAINTENANCE_CHECK_URL in agent config.</p><div className="grid grid-cols-1 gap-2 md:grid-cols-4"><input className="h-8 rounded border bg-background px-2 text-xs" value={serverId} onChange={(e)=>setServerId(e.target.value)} placeholder="Server" /><input className="h-8 rounded border bg-background px-2 text-xs" value={label} onChange={(e)=>setLabel(e.target.value)} placeholder="Label" /><input className="h-8 rounded border bg-background px-2 text-xs md:col-span-2" value={schedule} onChange={(e)=>setSchedule(e.target.value)} placeholder="cron:* * * * *" /></div><div className="text-xs text-muted-foreground">{preview}</div><input type="number" className="h-8 rounded border bg-background px-2 text-xs" value={durationMinutes} onChange={(e)=>setDurationMinutes(Number(e.target.value))} /><button type="button" className="rounded border px-3 py-1 text-xs" onClick={() => void save()}>Save</button>{error ? <p className="text-xs text-red-500">{error}</p> : null}<table className="w-full text-left text-xs"><thead className="text-muted-foreground"><tr><th>Server</th><th>Label</th><th>Schedule</th></tr></thead><tbody>{items.map((item)=><tr key={item.id} className="border-t"><td className="py-1">{item.serverId}</td><td>{item.label}</td><td>{item.schedule}</td></tr>)}</tbody></table></section>;
}
