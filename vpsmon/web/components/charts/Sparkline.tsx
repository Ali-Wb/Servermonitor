interface SparklinePoint {
  x: number;
  y: number;
}

interface SparklineProps {
  values: number[];
  width?: number;
  height?: number;
  color?: string;
  animated?: boolean;
}

function toPath(points: SparklinePoint[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  const path: string[] = [`M ${points[0].x} ${points[0].y}`];
  for (let i = 1; i < points.length; i += 1) {
    const p0 = points[i - 1];
    const p1 = points[i];
    const cx1 = p0.x + (p1.x - p0.x) / 3;
    const cx2 = p0.x + (2 * (p1.x - p0.x)) / 3;
    path.push(`C ${cx1} ${p0.y}, ${cx2} ${p1.y}, ${p1.x} ${p1.y}`);
  }
  return path.join(" ");
}

export function Sparkline({ values, width = 180, height = 52, color = "#60a5fa", animated = true }: SparklineProps) {
  if (values.length === 0) return <svg width={width} height={height} />;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = values.map((value, index) => ({
    x: (index / Math.max(1, values.length - 1)) * width,
    y: height - ((value - min) / range) * (height - 6) - 3,
  }));

  const line = toPath(points);
  const area = `${line} L ${width} ${height} L 0 ${height} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id="spark-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
        <clipPath id="spark-clip">
          <rect width={width} height={height}>
            {animated ? <animate attributeName="width" from="0" to={String(width)} dur="0.6s" fill="freeze" /> : null}
          </rect>
        </clipPath>
      </defs>

      <g clipPath="url(#spark-clip)">
        <path d={area} fill="url(#spark-grad)" />
        <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}
