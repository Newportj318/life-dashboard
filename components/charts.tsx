"use client";

// Single-series charts following the dataviz rules: thin marks, hairline solid grid,
// hover + keyboard tooltips, and a table view so no value is hover-only.

import { useEffect, useRef, useState } from "react";

export type Point = { key: string; label: string; value: number };

// Each area's chart hue, validated against light and dark card surfaces.
export type Tone = "purple" | "emerald";
const TONES: Record<Tone, { fill: string; stroke: string }> = {
  purple: { fill: "fill-purple-500", stroke: "stroke-purple-500" },
  emerald: { fill: "fill-emerald-600", stroke: "stroke-emerald-600" },
};

export type Formatter = (v: number) => string;
const defaultFormat = (unit: string): Formatter => (v) =>
  `${v.toLocaleString("en-AU", { maximumFractionDigits: 1 })}${unit}`;
// Axis ticks stay bare numbers; the chart heading names the unit.
const defaultTick: Formatter = (v) => v.toLocaleString("en-AU", { maximumFractionDigits: 1 });

const PAD = { top: 16, right: 16, bottom: 28, left: 40 };

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

function niceStep(range: number, count = 4) {
  const raw = Math.max(range, 1e-9) / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  return [1, 2, 2.5, 5, 10].map((m) => m * mag).find((st) => st >= raw)!;
}

/** Round-numbered ticks covering [lo, hi]. */
function ticksBetween(lo: number, hi: number, count = 4) {
  const step = niceStep(hi - lo, count);
  const start = Math.floor(lo / step) * step;
  const ticks = [];
  for (let v = start; v < hi + step * 0.999; v += step) ticks.push(Math.round(v * 1e6) / 1e6);
  return ticks;
}


function Tooltip({ x, y, width, point, format }: { x: number; y: number; width: number; point: Point; format: Formatter }) {
  const left = Math.min(Math.max(x, 60), width - 60);
  return (
    <div
      className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-2.5 py-1.5 shadow-md"
      style={{ left, top: y - 8 }}
    >
      <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap">{format(point.value)}</div>
      <div className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{point.label}</div>
    </div>
  );
}

function Grid({ ticks, y, width, tick }: { ticks: number[]; y: (v: number) => number; width: number; tick: Formatter }) {
  return (
    <g>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={PAD.left} x2={width - PAD.right} y1={y(t)} y2={y(t)} className="stroke-gray-200 dark:stroke-gray-800" strokeWidth={1} />
          <text x={PAD.left - 8} y={y(t)} dy="0.32em" textAnchor="end" className="fill-gray-500 dark:fill-gray-400 text-[11px] tabular-nums">
            {tick(t)}
          </text>
        </g>
      ))}
    </g>
  );
}

export function TableView({
  data,
  unit = "",
  format,
  columns,
}: {
  data: Point[];
  unit?: string;
  format?: Formatter;
  columns: [string, string];
}) {
  const f = format ?? defaultFormat(unit);
  return (
    <details className="mt-3 text-sm">
      <summary className="cursor-pointer text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">Show table</summary>
      <table className="mt-2 w-full">
        <thead>
          <tr className="text-left text-xs text-gray-500 dark:text-gray-400">
            <th className="py-1 font-medium">{columns[0]}</th>
            <th className="py-1 text-right font-medium">{columns[1]}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {data.map((d) => (
            <tr key={d.key}>
              <td className="py-1">{d.label}</td>
              <td className="py-1 text-right tabular-nums">{f(d.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}

type ChartProps = {
  data: Point[];
  label: string;
  unit?: string;
  height?: number;
  tone?: Tone;
  format?: Formatter; // tooltip, labels, table
  tick?: Formatter; // axis ticks
};

export function BarChart({ data, unit = "", height = 200, label, tone = "purple", format, tick }: ChartProps) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [active, setActive] = useState<number | null>(null);
  const f = format ?? defaultFormat(unit);
  const tickFmt = tick ?? defaultTick;

  const ticks = ticksBetween(0, Math.max(1, ...data.map((d) => d.value)));
  const top = ticks.at(-1)!;
  const plotW = Math.max(0, width - PAD.left - PAD.right);
  const band = data.length ? plotW / data.length : 0;
  const barW = Math.min(24, band * 0.6);
  const y = (v: number) => PAD.top + (height - PAD.top - PAD.bottom) * (1 - v / top);
  const base = y(0);
  const labelEvery = Math.ceil(data.length / Math.max(1, Math.floor(plotW / 48)));

  return (
    <div ref={ref} className="relative w-full" style={{ height }}>
      {width > 0 && (
        <svg width={width} height={height} role="img" aria-label={label}>
          <Grid ticks={ticks} y={y} width={width} tick={tickFmt} />
          {data.map((d, i) => {
            const cx = PAD.left + band * i + band / 2;
            const h = base - y(d.value);
            const r = Math.min(4, h);
            const x0 = cx - barW / 2;
            const x1 = cx + barW / 2;
            const yt = base - h;
            // Rounded data-end, square at the baseline.
            const path = h > 0
              ? `M${x0},${base} V${yt + r} Q${x0},${yt} ${x0 + r},${yt} H${x1 - r} Q${x1},${yt} ${x1},${yt + r} V${base} Z`
              : "";
            return (
              <g key={d.key}>
                {path && <path d={path} className={`${TONES[tone].fill} transition-opacity ${active !== null && active !== i ? "opacity-50" : ""}`} />}
                {i % labelEvery === 0 && (
                  <text x={cx} y={height - 8} textAnchor="middle" className="fill-gray-500 dark:fill-gray-400 text-[11px]">
                    {d.label}
                  </text>
                )}
                <rect
                  x={PAD.left + band * i}
                  y={PAD.top}
                  width={band}
                  height={base - PAD.top}
                  fill="transparent"
                  tabIndex={0}
                  aria-label={`${d.label}: ${f(d.value)}`}
                  onPointerEnter={() => setActive(i)}
                  onPointerLeave={() => setActive(null)}
                  onFocus={() => setActive(i)}
                  onBlur={() => setActive(null)}
                  className="outline-none"
                />
              </g>
            );
          })}
          <line x1={PAD.left} x2={width - PAD.right} y1={base} y2={base} className="stroke-gray-300 dark:stroke-gray-700" strokeWidth={1} />
        </svg>
      )}
      {active !== null && width > 0 && (
        <Tooltip
          x={PAD.left + band * active + band / 2}
          y={y(data[active].value)}
          width={width}
          point={data[active]}
          format={f}
        />
      )}
    </div>
  );
}

export function LineChart({ data, unit = "", height = 200, label, tone = "purple", format, tick }: ChartProps) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [active, setActive] = useState<number | null>(null);
  const f = format ?? defaultFormat(unit);
  const tickFmt = tick ?? defaultTick;

  const values = data.map((d) => d.value);
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const spread = Math.max(rawMax - rawMin, Math.abs(rawMax) * 0.01, 1e-6);
  // Changes are small relative to the total (bodyweight, net worth), so the axis hugs the data.
  const ticksAbove = ticksBetween(rawMin - spread * 0.15, rawMax + spread * 0.15);
  const lo = ticksAbove[0];
  const hi = ticksAbove.at(-1)!;

  const endLabel = f(data.at(-1)?.value ?? 0);
  const endRoom = endLabel.length * 7 + 12;
  const plotW = Math.max(0, width - PAD.left - PAD.right - endRoom); // room for the end label
  const x = (i: number) => PAD.left + (data.length > 1 ? (plotW * i) / (data.length - 1) : plotW / 2);
  const y = (v: number) => PAD.top + (height - PAD.top - PAD.bottom) * (1 - (v - lo) / (hi - lo));
  const line = data.map((d, i) => `${i ? "L" : "M"}${x(i)},${y(d.value)}`).join(" ");
  const area = `${line} L${x(data.length - 1)},${y(lo)} L${x(0)},${y(lo)} Z`;
  const last = data.length - 1;

  const onMove = (e: React.PointerEvent<SVGRectElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const i = data.length > 1 ? Math.round((px / rect.width) * (data.length - 1)) : 0;
    setActive(Math.min(last, Math.max(0, i)));
  };

  if (!data.length) return null;

  return (
    <div ref={ref} className="relative w-full" style={{ height }}>
      {width > 0 && (
        <svg width={width} height={height} role="img" aria-label={label}>
          <Grid ticks={ticksAbove} y={y} width={width - endRoom} tick={tickFmt} />
          <path d={area} className={TONES[tone].fill} fillOpacity={0.1} />
          <path d={line} className={TONES[tone].stroke} strokeWidth={2} fill="none" strokeLinejoin="round" strokeLinecap="round" />
          {[0, last].filter((v, i, a) => a.indexOf(v) === i).map((i) => (
            <text key={i} x={x(i)} y={height - 8} textAnchor={i === 0 ? "start" : "end"} className="fill-gray-500 dark:fill-gray-400 text-[11px]">
              {data[i].label}
            </text>
          ))}
          {active !== null && (
            <line x1={x(active)} x2={x(active)} y1={PAD.top} y2={y(lo)} className="stroke-gray-400 dark:stroke-gray-500" strokeWidth={1} />
          )}
          {/* End marker with a surface ring, plus its direct label. */}
          <circle cx={x(active ?? last)} cy={y(data[active ?? last].value)} r={4} className={`${TONES[tone].fill} stroke-white dark:stroke-gray-900`} strokeWidth={2} />
          <text x={x(last) + 8} y={y(data[last].value)} dy="0.32em" className="fill-gray-900 dark:fill-gray-100 text-xs font-semibold">
            {endLabel}
          </text>
          <rect
            x={PAD.left}
            y={PAD.top}
            width={plotW}
            height={y(lo) - PAD.top}
            fill="transparent"
            tabIndex={0}
            aria-label={`${label}. Use arrow keys to read values.`}
            onPointerMove={onMove}
            onPointerLeave={() => setActive(null)}
            onFocus={() => setActive(last)}
            onBlur={() => setActive(null)}
            onKeyDown={(e) => {
              if (e.key === "ArrowLeft") setActive((a) => Math.max(0, (a ?? last) - 1));
              if (e.key === "ArrowRight") setActive((a) => Math.min(last, (a ?? last) + 1));
            }}
            className="outline-none"
          />
        </svg>
      )}
      {active !== null && width > 0 && (
        <Tooltip x={x(active)} y={y(data[active].value)} width={width} point={data[active]} format={f} />
      )}
    </div>
  );
}

export function Sparkline({ values, label }: { values: number[]; label: string }) {
  const w = 96;
  const h = 28;
  if (values.length < 2) return <span className="text-xs text-gray-400">—</span>;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const x = (i: number) => 2 + ((w - 8) * i) / (values.length - 1);
  const y = (v: number) => 4 + (h - 8) * (max === min ? 0.5 : 1 - (v - min) / (max - min));
  const d = values.map((v, i) => `${i ? "L" : "M"}${x(i)},${y(v)}`).join(" ");
  return (
    <svg width={w} height={h} role="img" aria-label={label} className="shrink-0">
      <path d={d} className="stroke-purple-500" strokeWidth={2} fill="none" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={x(values.length - 1)} cy={y(values.at(-1)!)} r={3} className="fill-purple-500 stroke-white dark:stroke-gray-900" strokeWidth={2} />
    </svg>
  );
}
