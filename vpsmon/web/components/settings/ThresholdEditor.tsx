"use client";

import { useEffect, useState } from "react";

export function ThresholdEditor() {
  const [thresholds, setThresholds] = useState<Record<string, number>>({});

  useEffect(() => { void fetch('/api/settings/thresholds').then((r) => r.json()).then((d: Record<string, number>) => setThresholds(d)); }, []);

  const save = async () => {
    await fetch('/api/settings/thresholds', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(thresholds) });
  };

  return (
    <section className="rounded-lg border bg-card p-4 space-y-2">
      <h3 className="text-sm font-semibold">Threshold Editor</h3>
      <p className="text-xs text-muted-foreground">Note: Agent alert thresholds and frontend display thresholds are separate (dual-threshold system).</p>
      <div className="space-y-2">{Object.entries(thresholds).map(([metric, value]) => <div key={metric} className="flex items-center gap-2 text-xs"><label className="w-48">{metric}</label><input type="number" className="h-8 rounded border bg-background px-2" value={value} onChange={(e) => setThresholds((prev) => ({ ...prev, [metric]: Number(e.target.value) }))} /></div>)}</div>
      <button type="button" className="rounded border px-3 py-1 text-xs" onClick={() => void save()}>Save</button>
    </section>
  );
}
