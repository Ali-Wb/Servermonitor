"use client";

import { useEffect, useState } from "react";

import type { StoredKey } from "@/lib/schemas";

export function KeyManager() {
  const [keys, setKeys] = useState<StoredKey[]>([]);
  const [label, setLabel] = useState("");
  const [role, setRole] = useState<"admin" | "readonly">("readonly");
  const [expiresAt, setExpiresAt] = useState("");
  const [plain, setPlain] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/auth/keys").then((res) => res.json()).then((data: StoredKey[]) => setKeys(data));
  }, []);

  const create = async () => {
    const exp = expiresAt ? new Date(expiresAt).getTime() : null;
    const response = await fetch("/api/auth/keys", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ label, role, expiresAt: exp }) });
    if (!response.ok) return;
    const created = await response.json() as { plaintext: string };
    setPlain(created.plaintext);
    const all = await fetch("/api/auth/keys").then((res) => res.json()) as StoredKey[];
    setKeys(all);
  };

  const revoke = async (id: string) => {
    await fetch(`/api/auth/keys/${encodeURIComponent(id)}`, { method: "DELETE" });
    setKeys((prev) => prev.filter((key) => key.id !== id));
  };

  return (
    <section className="rounded-lg border bg-card p-4 space-y-3">
      <h3 className="text-sm font-semibold">Key Manager</h3>
      <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
        <input className="h-9 rounded border bg-background px-2 text-sm" placeholder="Label" value={label} onChange={(e) => setLabel(e.target.value)} />
        <select className="h-9 rounded border bg-background px-2 text-sm" value={role} onChange={(e) => setRole(e.target.value as "admin" | "readonly")}><option value="readonly">readonly</option><option value="admin">admin</option></select>
        <input className="h-9 rounded border bg-background px-2 text-sm" type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
        <button type="button" className="rounded border px-3 py-1 text-xs" onClick={() => void create()}>Create</button>
      </div>
      {plain ? <p className="text-xs">New key: <code>{plain}</code></p> : null}
      <table className="w-full text-left text-xs"><thead className="text-muted-foreground"><tr><th>Label</th><th>Role</th><th>Expires</th><th /></tr></thead><tbody>{keys.map((key) => { const expired = key.expiresAt !== null && key.expiresAt <= Date.now(); return <tr key={key.id} className="border-t"><td className="py-1">{key.label}</td><td>{key.role}</td><td>{key.expiresAt ? new Date(key.expiresAt).toLocaleString() : "Never"}{expired ? <span className="ml-2 rounded bg-red-600 px-1 py-0.5 text-white">Expired</span> : null}</td><td><button type="button" className="rounded border px-2 py-0.5" onClick={() => void revoke(key.id)}>Revoke</button></td></tr>;})}</tbody></table>
    </section>
  );
}
