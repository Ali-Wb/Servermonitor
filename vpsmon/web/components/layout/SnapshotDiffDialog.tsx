"use client";

import type { Snapshot } from "@/lib/schemas";

interface DiffRow {
  metric: string;
  baseline: number;
  current: number;
  deltaPercent: number;
  deltaAbsolute: number;
}

interface SnapshotDiffDialogProps {
  baseline: Snapshot;
  current: Snapshot;
  baselineTs: number;
  onClose: () => void;
}

function collectNumericScalars(value: unknown, prefix: string, out: Record<string, number>) {
  if (typeof value === "number" && Number.isFinite(value)) {
    out[prefix] = value;
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectNumericScalars(item, `${prefix}[${index}]`, out));
    return;
  }
  if (value && typeof value === "object") {
    for (const [key, nested] of Object.entries(value)) {
      const path = prefix.length > 0 ? `${prefix}.${key}` : key;
      collectNumericScalars(nested, path, out);
    }
  }
}

function buildDiffRows(baseline: Snapshot, current: Snapshot): DiffRow[] {
  const base: Record<string, number> = {};
  const now: Record<string, number> = {};
  collectNumericScalars(baseline, "", base);
  collectNumericScalars(current, "", now);

  return Object.keys(base)
    .filter((metric) => metric in now)
    .map((metric) => {
      const b = base[metric];
      const c = now[metric];
      const abs = c - b;
      const pct = b === 0 ? (abs === 0 ? 0 : 100) : (abs / Math.abs(b)) * 100;
      return {
        metric,
        baseline: b,
        current: c,
        deltaPercent: pct,
        deltaAbsolute: abs,
      };
    })
    .filter((row) => Math.abs(row.deltaPercent) >= 5)
    .sort((a, b) => Math.abs(b.deltaPercent) - Math.abs(a.deltaPercent));
}

export function SnapshotDiffDialog({ baseline, current, baselineTs, onClose }: SnapshotDiffDialogProps) {
  const rows = buildDiffRows(baseline, current);

  const clearBaseline = () => {
    window.localStorage.removeItem("vpsmon-baseline-snapshot");
    window.localStorage.removeItem("vpsmon-baseline-ts");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[80vh] w-full max-w-5xl overflow-hidden rounded-lg border bg-background shadow-xl">
        <div className="border-b px-4 py-3">
          <h2 className="text-sm font-semibold">Snapshot Diff</h2>
          <p className="text-xs text-muted-foreground">Baseline taken at {new Date(baselineTs).toLocaleString()}</p>
        </div>

        <div className="max-h-[60vh] overflow-auto px-4 py-3">
          <table className="w-full text-left text-xs">
            <thead className="text-muted-foreground">
              <tr><th>Metric</th><th>Baseline</th><th>Current</th><th>Delta</th><th>Arrow</th></tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.metric} className="border-t">
                  <td className="py-1 font-mono">{row.metric}</td>
                  <td className="font-mono">{row.baseline.toFixed(2)}</td>
                  <td className="font-mono">{row.current.toFixed(2)}</td>
                  <td className={`font-mono ${row.deltaPercent >= 0 ? "text-red-500" : "text-emerald-500"}`}>{row.deltaPercent >= 0 ? "+" : ""}{row.deltaPercent.toFixed(1)}%</td>
                  <td>{row.deltaPercent > 0 ? "↑" : row.deltaPercent < 0 ? "↓" : "→"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end gap-2 border-t px-4 py-3">
          <button type="button" onClick={clearBaseline} className="rounded border px-3 py-1 text-xs">Clear Baseline</button>
          <button type="button" onClick={onClose} className="rounded border px-3 py-1 text-xs">Close</button>
        </div>
      </div>
    </div>
  );
}
