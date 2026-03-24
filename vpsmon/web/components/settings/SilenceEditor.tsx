"use client";

import { useState } from "react";

import type { Silence } from "@/lib/schemas";

export function SilenceEditor() {
  const [serverId, setServerId] = useState("local");
  const [metric, setMetric] = useState("cpu_usage");
  const [reason, setReason] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [items, setItems] = useState<Silence[]>([]);

  const load = async (sid: string) => {
    const data = await fetch(`/api/servers/${encodeURIComponent(sid)}/silences`).then((r) => r.json()) as Silence[];
    setItems(data);
  };

  const create = async () => {
    const exp = expiresAt ? new Date(expiresAt).getTime() : null;
    await fetch(`/api/servers/${encodeURIComponent(serverId)}/silences`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ metric, reason, expiresAt: exp }) });
    await load(serverId);
  };

  const remove = async (id: string) => {
    await fetch(`/api/servers/${encodeURIComponent(serverId)}/silences/${encodeURIComponent(id)}`, { method: 'DELETE' });
    await load(serverId);
  };

  return <section className="rounded-lg border bg-card p-4 space-y-3"><h3 className="text-sm font-semibold">Silence Manager</h3><div className="grid grid-cols-1 gap-2 md:grid-cols-5"><input className="h-8 rounded border bg-background px-2 text-xs" value={serverId} onChange={(e)=>{setServerId(e.target.value); void load(e.target.value);}} placeholder="serverId" /><input className="h-8 rounded border bg-background px-2 text-xs" value={metric} onChange={(e)=>setMetric(e.target.value)} placeholder="metric" /><input className="h-8 rounded border bg-background px-2 text-xs" value={reason} onChange={(e)=>setReason(e.target.value)} placeholder="reason" /><input type="date" className="h-8 rounded border bg-background px-2 text-xs" value={expiresAt} onChange={(e)=>setExpiresAt(e.target.value)} /><button type="button" className="rounded border px-2 py-1 text-xs" onClick={() => void create()}>Create</button></div><table className="w-full text-left text-xs"><thead className="text-muted-foreground"><tr><th>Server</th><th>Metric</th><th>Reason</th><th>Created by</th><th>Expires</th><th /></tr></thead><tbody>{items.map((item)=><tr key={item.id} className="border-t"><td className="py-1">{item.serverId}</td><td>{item.metric}</td><td>{item.reason}</td><td>{item.createdBy}</td><td>{item.expiresAt ? new Date(item.expiresAt).toLocaleString() : 'Never'}</td><td><button type="button" className="rounded border px-2 py-0.5" onClick={() => void remove(item.id)}>Delete</button></td></tr>)}</tbody></table></section>;
}
