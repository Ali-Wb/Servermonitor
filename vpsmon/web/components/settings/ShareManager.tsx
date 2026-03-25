"use client";

import { useEffect, useState } from "react";

import type { ShareToken } from "@/lib/schemas";

function maskToken(token: string): string {
  if (token.length < 8) return "••••";
  return `${token.slice(0, 4)}…${token.slice(-4)}`;
}

export function ShareManager() {
  const [items, setItems] = useState<ShareToken[]>([]);
  const [serverId, setServerId] = useState("local");
  const [label, setLabel] = useState("Read-only");
  const [expiresAt, setExpiresAt] = useState("");

  const load = async () => {
    const data = await fetch('/api/share').then((r) => r.json()) as ShareToken[];
    setItems(data);
  };

  useEffect(() => { void load(); }, []);

  const create = async () => {
    const exp = expiresAt ? new Date(expiresAt).getTime() : null;
    await fetch('/api/share', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ serverId, label, expiresAt: exp }) });
    await load();
  };

  const revoke = async (token: string) => {
    await fetch(`/api/share/${encodeURIComponent(token)}`, { method: 'DELETE' });
    await load();
  };

  const copy = async (token: string) => {
    const url = `${window.location.origin}/share/${token}`;
    await navigator.clipboard.writeText(url);
  };

  return <section className="rounded-lg border bg-card p-4 space-y-3"><h3 className="text-sm font-semibold">Share Manager</h3><div className="grid grid-cols-1 gap-2 md:grid-cols-4"><input className="h-8 rounded border bg-background px-2 text-xs" value={serverId} onChange={(e)=>setServerId(e.target.value)} placeholder="serverId" /><input className="h-8 rounded border bg-background px-2 text-xs" value={label} onChange={(e)=>setLabel(e.target.value)} /><input type="date" className="h-8 rounded border bg-background px-2 text-xs" value={expiresAt} onChange={(e)=>setExpiresAt(e.target.value)} /><button type="button" className="rounded border px-2 py-1 text-xs" onClick={() => void create()}>Create</button></div><table className="w-full text-left text-xs"><thead className="text-muted-foreground"><tr><th>Label</th><th>Server</th><th>Created</th><th>Expires</th><th>Token</th><th>Actions</th></tr></thead><tbody>{items.map((item)=><tr key={item.id} className="border-t"><td className="py-1">{item.label}</td><td>{item.serverId}</td><td>{new Date(item.createdAt).toLocaleString()}</td><td>{item.expiresAt ? new Date(item.expiresAt).toLocaleString() : 'Never'}</td><td>{maskToken(item.token)}</td><td className="space-x-1"><button type="button" className="rounded border px-2 py-0.5" onClick={() => void copy(item.token)}>Copy link</button><button type="button" className="rounded border px-2 py-0.5" onClick={() => void revoke(item.id)}>Revoke</button></td></tr>)}</tbody></table></section>;
}
