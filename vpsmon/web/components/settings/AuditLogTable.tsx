"use client";

import { useEffect, useState } from "react";

import type { AuditEntry } from "@/lib/schemas";

export function AuditLogTable() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);

  useEffect(() => {
    void fetch("/api/auth/audit?limit=200").then((res) => res.json()).then((data: AuditEntry[]) => setEntries(data));
  }, []);

  return (
    <section className="rounded-lg border bg-card p-4 space-y-2">
      <h3 className="text-sm font-semibold">Audit Log</h3>
      <p className="text-xs text-muted-foreground">IP addresses are anonymized by default (last octet replaced). To disable: set VPSMON_AUDIT_ANONYMIZE_IPS=false in environment. Entries older than VPSMON_AUDIT_RETENTION_DAYS are automatically purged.</p>
      <table className="w-full text-left text-xs"><thead className="text-muted-foreground"><tr><th>Time</th><th>IP</th><th>Role</th><th>Success</th></tr></thead><tbody>{entries.map((entry) => <tr key={entry.id} className="border-t"><td className="py-1">{new Date(entry.timestamp).toLocaleString()}</td><td>{entry.ip}</td><td>{entry.role ?? "—"}</td><td>{entry.success ? "Yes" : "No"}</td></tr>)}</tbody></table>
    </section>
  );
}
