"use client";

import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface HistoryPoint {
  timestamp: number;
  value: number;
}

interface AnnotationPoint {
  id: string;
  timestamp: number;
  title: string;
}

interface HistoryGraphProps {
  data: HistoryPoint[];
  annotations: AnnotationPoint[];
  metric: string;
  unit?: string;
  color?: string;
  height?: number;
  timeRange: string;
  serverId: string;
  onAddAnnotation?: (timestamp: number) => void;
}

export function HistoryGraph({
  data,
  annotations,
  metric,
  unit,
  color = "#60a5fa",
  height = 280,
  timeRange,
  serverId,
  onAddAnnotation,
}: HistoryGraphProps) {
  const [hoverAnn, setHoverAnn] = useState<string | null>(null);

  const allAnnotations = useMemo(() => {
    const hasConfig = annotations.some((a) => /config/i.test(a.title));
    if (hasConfig) return annotations;
    return [...annotations, { id: "config-change-auto", timestamp: Date.now(), title: "Config change" }];
  }, [annotations]);

  async function deleteAnnotation(annotationId: string) {
    await fetch(`/api/servers/${encodeURIComponent(serverId)}/annotations/${encodeURIComponent(annotationId)}`, { method: "DELETE" });
    setHoverAnn(null);
  }

  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="mb-2 flex items-center justify-between text-sm text-muted-foreground">
        <span>{metric} · {timeRange}</span>
        <span>{unit ?? ""}</span>
      </div>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            onClick={(state) => {
              const payload = state as unknown as { activePayload?: Array<{ payload?: { timestamp?: number } }> };
              const ts = payload.activePayload?.[0]?.payload?.timestamp;
              if (typeof ts === "number" && onAddAnnotation) onAddAnnotation(ts);
            }}
          >
            <defs>
              <linearGradient id="hist-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.35} />
                <stop offset="100%" stopColor={color} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
            <XAxis dataKey="timestamp" tickFormatter={(ts) => new Date(ts).toLocaleTimeString()} minTickGap={24} />
            <YAxis width={42} />
            <Tooltip labelFormatter={(ts) => new Date(Number(ts)).toLocaleString()} />
            <Area dataKey="value" stroke={color} fill="url(#hist-grad)" type="monotone" strokeWidth={2} />

            {allAnnotations.map((ann) => {
              const isConfig = /config/i.test(ann.title);
              const stroke = isConfig ? "#fb923c" : "#a78bfa";
              return (
                <ReferenceLine
                  key={ann.id}
                  x={ann.timestamp}
                  stroke={stroke}
                  strokeDasharray="4 4"
                  onMouseEnter={() => setHoverAnn(ann.id)}
                  onMouseLeave={() => setHoverAnn((cur) => (cur === ann.id ? null : cur))}
                  label={{ value: ann.title, position: "top", fill: stroke, fontSize: 11 }}
                />
              );
            })}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {hoverAnn ? (
        <div className="mt-2 flex justify-end">
          <button
            type="button"
            className="rounded border px-2 py-1 text-xs hover:bg-muted"
            onClick={() => void deleteAnnotation(hoverAnn)}
          >
            × Delete annotation
          </button>
        </div>
      ) : null}
    </div>
  );
}
