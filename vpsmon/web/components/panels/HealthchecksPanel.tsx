"use client";

import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import type { HealthcheckResult } from "@/lib/schemas";

interface HealthchecksPanelProps { checks: HealthcheckResult[] }

export function HealthchecksPanel({ checks }: HealthchecksPanelProps) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const sorted = useMemo(() => [...checks].sort((a, b) => Number(a.status === "passing") - Number(b.status === "passing")), [checks]);
  const passing = checks.filter((c) => c.status === "passing").length;

  return (
    <section className="rounded-lg border bg-card p-4">
      <div className="mb-2 flex items-center gap-2"><h3 className="text-sm font-medium">Healthchecks</h3><Badge>{passing}/{checks.length}</Badge></div>
      <div className="space-y-2">
        {sorted.map((check) => (
          <article key={check.id} className="rounded border p-2 text-xs">
            <button type="button" className="flex w-full items-center justify-between text-left" onClick={() => setExpanded((v) => (v === check.id ? null : check.id))}>
              <span className="font-mono">{check.command}</span>
              <Badge className={check.status === "passing" ? "bg-emerald-600" : "bg-red-600 text-white"}>{check.status}</Badge>
            </button>
            {expanded === check.id ? <pre className="mt-2 max-h-40 overflow-auto rounded bg-muted p-2 whitespace-pre-wrap">{check.stdout || "(no stdout)"}</pre> : null}
          </article>
        ))}
      </div>
    </section>
  );
}
