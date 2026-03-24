"use client";

import { useState } from "react";

import { useWidgets } from "@/hooks/useMetrics";

export function WidgetManager() {
  const [serverId, setServerId] = useState("local");
  const { data } = useWidgets(serverId);
  const items = data ?? [];

  return (
    <section className="rounded-lg border bg-card p-4 space-y-3">
      <h3 className="text-sm font-semibold">Widgets</h3>
      <input className="h-8 rounded border bg-background px-2 text-xs" value={serverId} onChange={(e) => setServerId(e.target.value)} />
      <table className="w-full text-left text-xs"><thead className="text-muted-foreground"><tr><th>Title</th><th>Expression</th><th>Unit</th></tr></thead><tbody>{items.map((item)=><tr key={item.id} className="border-t"><td className="py-1">{item.title}</td><td>{item.expression}</td><td>{item.unit}</td></tr>)}</tbody></table>
    </section>
  );
}
