import { Sparkline } from "@/components/charts/Sparkline";

interface LatencySparklineProps {
  values: number[];
}

export function LatencySparkline({ values }: LatencySparklineProps) {
  const clamped = values.map((v) => Math.min(200, Math.max(0, v)));
  const current = clamped.length ? clamped[clamped.length - 1] : null;

  return (
    <div className="flex items-center gap-3">
      <Sparkline values={clamped} color="#22d3ee" width={140} height={42} />
      <div className="text-sm font-medium">{current === null ? "—" : `${Math.round(current)}ms`}</div>
    </div>
  );
}
