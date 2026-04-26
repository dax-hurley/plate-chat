"use client";

import { cn } from "@/lib/utils";

export type ChartSeries = {
  name: string;
  color: string;
  points: { x: string; y: number }[];
};

function collectSortedX(series: ChartSeries[]): string[] {
  const xs = new Set<string>();
  for (const s of series) {
    for (const p of s.points) xs.add(p.x);
  }
  return [...xs].sort((a, b) => a.localeCompare(b));
}

function bounds(series: ChartSeries[]) {
  let min = Infinity;
  let max = -Infinity;
  for (const s of series) {
    for (const p of s.points) {
      if (Number.isFinite(p.y)) {
        min = Math.min(min, p.y);
        max = Math.max(max, p.y);
      }
    }
  }
  if (!Number.isFinite(min) || min === max) {
    return { min: 0, max: 1 };
  }
  const pad = (max - min) * 0.08 || 0.5;
  return { min: min - pad, max: max + pad };
}

export function LineChart({
  series,
  height = 200,
  className,
  valueFormat = (n: number) => String(Math.round(n * 10) / 10),
  xAxisLabel = "Calendar day",
  yAxisLabel = "Value",
}: {
  series: ChartSeries[];
  height?: number;
  className?: string;
  valueFormat?: (n: number) => string;
  /** Shown below the date tick marks (x-axis). */
  xAxisLabel?: string;
  /** Shown along the left side of the plot area (y-axis). */
  yAxisLabel?: string;
}) {
  const xs = collectSortedX(series);
  if (xs.length === 0 || series.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        No data in this range.
      </p>
    );
  }

  const { min: y0, max: y1 } = bounds(series);
  const w = 100;
  const h = 100;
  const n = xs.length;
  const xAt = (i: number) => (n <= 1 ? 50 : (i / (n - 1)) * w);
  const yAt = (y: number) =>
    h - ((y - y0) / (y1 - y0 || 1)) * (h - 8) - 4;

  const legendAbove = series.length > 1;

  const lines: { d: string; color: string; name: string }[] = [];
  for (const s of series) {
    const map = new Map(s.points.map((p) => [p.x, p.y]));
    const parts: string[] = [];
    for (let i = 0; i < n; i++) {
      const yv = map.get(xs[i]);
      if (yv == null || !Number.isFinite(yv)) continue;
      const x = xAt(i);
      const y = yAt(yv);
      parts.push(parts.length === 0 ? `M ${x} ${y}` : `L ${x} ${y}`);
    }
    if (parts.length) {
      lines.push({ d: parts.join(" "), color: s.color, name: s.name });
    }
  }

  const legend = (
    <ul
      role="list"
      className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1.5 text-xs"
    >
      {series.map((s, i) => (
        <li
          key={`${i}-${s.name}`}
          className="inline-flex items-center gap-1.5"
        >
          <span
            className="inline-block size-2 shrink-0 rounded-full"
            style={{ backgroundColor: s.color }}
            aria-hidden
          />
          <span>{s.name}</span>
        </li>
      ))}
    </ul>
  );

  const yTickFractions = [1, 0.75, 0.5, 0.25, 0] as const;
  const yTickValues = yTickFractions.map((t) => y0 + t * (y1 - y0));

  const xTickLabels =
    n <= 1
      ? [xs[0]!]
      : n === 2
        ? [xs[0]!, xs[1]!]
        : [xs[0]!, xs[Math.floor((n - 1) / 2)]!, xs[n - 1]!];

  const plotSvg = (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      className="text-foreground w-full"
      style={{ height }}
      aria-hidden
    >
      {/* Y-axis & X-axis baselines */}
      <line
        x1={0}
        y1={h}
        x2={w}
        y2={h}
        stroke="currentColor"
        strokeOpacity={0.22}
        strokeWidth={0.45}
        vectorEffect="non-scaling-stroke"
      />
      <line
        x1={0}
        y1={0}
        x2={0}
        y2={h}
        stroke="currentColor"
        strokeOpacity={0.22}
        strokeWidth={0.45}
        vectorEffect="non-scaling-stroke"
      />
      {yTickFractions.map((t) => {
        const yv = y0 + t * (y1 - y0);
        const y = yAt(yv);
        return (
          <line
            key={`grid-${t}`}
            x1={0}
            x2={w}
            y1={y}
            y2={y}
            stroke="currentColor"
            strokeOpacity={0.08}
            strokeWidth={0.35}
          />
        );
      })}
      {lines.map((ln, i) => (
        <path
          key={`${i}-${ln.name}`}
          d={ln.d}
          fill="none"
          stroke={ln.color}
          strokeWidth={1.2}
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </svg>
  );

  const yTickColumn = (
    <div
      className="text-muted-foreground flex w-[2.75rem] shrink-0 flex-col justify-between py-px text-[0.65rem] leading-none tabular-nums"
      style={{ height, minHeight: height }}
      aria-hidden
    >
      {yTickValues.map((yv, i) => (
        <span key={i} className="block text-right">
          {valueFormat(yv)}
        </span>
      ))}
    </div>
  );

  const plotColumn = (
    <div className="min-w-0 flex-1">
      <div className="flex gap-1.5">
        {yTickColumn}
        <div className="min-w-0 flex-1">{plotSvg}</div>
      </div>
      {!legendAbove ? (
        <div className="mt-2" role="region" aria-label="Chart legend">
          {legend}
        </div>
      ) : null}
      <div className="text-muted-foreground mt-2 flex gap-1.5 text-[0.65rem] tabular-nums">
        <div className="w-[2.75rem] shrink-0" aria-hidden />
        <div className="flex min-w-0 flex-1 justify-between gap-1">
          {xTickLabels.map((lab, i) => (
            <span key={`${lab}-${i}`} className="min-w-0 truncate">
              {lab}
            </span>
          ))}
        </div>
      </div>
      <p className="text-muted-foreground mt-1.5 text-center text-xs font-semibold tracking-wide">
        {xAxisLabel}
      </p>
    </div>
  );

  return (
    <div className={cn("w-full", className)}>
      {legendAbove ? (
        <div className="mb-2" role="region" aria-label="Chart legend">
          {legend}
        </div>
      ) : null}
      <div className="flex items-stretch gap-2">
        <div
          className="text-muted-foreground flex w-9 shrink-0 items-center justify-center text-xs font-semibold leading-snug"
          style={{
            writingMode: "vertical-rl",
            transform: "rotate(180deg)",
            minHeight: height,
          }}
        >
          {yAxisLabel}
        </div>
        {plotColumn}
      </div>
    </div>
  );
}
