"use client";

import { ChevronDown, TrendingUp } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "@/lib/utils";

export interface RevenueDataPoint {
  day: string;
  amount: number;
  isToday?: boolean;
}

const DEFAULT_WEEK_DATA: RevenueDataPoint[] = [
  { day: "Mon", amount: 62400 },
  { day: "Tue", amount: 68500 },
  { day: "Wed", amount: 74200 },
  { day: "Thu", amount: 71000 },
  { day: "Fri", amount: 89600 },
  { day: "Sat", amount: 104200 },
  { day: "Today", amount: 84250, isToday: true },
];

function formatDayFromIso(iso: string, isLast: boolean): string {
  if (isLast) return "Today";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", { weekday: "short" });
  } catch {
    return iso;
  }
}

// Custom Milestone Dot with white ring
function CustomMilestoneDot(props: any) {
  const { cx, cy, index, dataLength, payload } = props;
  const isLast = index === (dataLength ?? DEFAULT_WEEK_DATA.length) - 1 || payload?.isToday;

  return (
    <g key={`dot-${index}`}>
      <circle
        cx={cx}
        cy={cy}
        r={isLast ? 5 : 4}
        fill={isLast ? "#881337" : "#9f1239"}
        stroke="#ffffff"
        strokeWidth={2}
      />
      {isLast && (
        // Floating pill badge over Today's data point matching the reference UI
        <g transform={`translate(${cx - 36}, ${cy - 36})`}>
          <rect
            width="72"
            height="26"
            rx="8"
            fill="#ffffff"
            stroke="#e2e8f0"
            strokeWidth="1"
            filter="drop-shadow(0 4px 6px rgba(0,0,0,0.06))"
          />
          <text
            x="36"
            y="17"
            textAnchor="middle"
            fill="#0f172a"
            fontSize="11"
            fontWeight="700"
            fontFamily="monospace, sans-serif"
          >
            ₹{payload?.amount ? Number(payload.amount).toLocaleString("en-IN") : "84,250"}
          </text>
        </g>
      )}
    </g>
  );
}

// Custom X-Axis Tick that highlights 'Today' in wine red
function CustomXAxisTick({ x, y, payload }: any) {
  const isToday = payload.value === "Today";
  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={14}
        textAnchor="middle"
        fill={isToday ? "#9f1239" : "#64748b"}
        fontSize={12}
        fontWeight={isToday ? "700" : "500"}
      >
        {payload.value}
      </text>
    </g>
  );
}

export function LuxuryRevenueChart({
  data,
  rawTrends,
  averageLabel,
  className,
}: {
  data?: RevenueDataPoint[];
  rawTrends?: { date: string; amount: number }[];
  averageLabel?: string;
  className?: string;
}) {
  // If rawTrends is provided and has items, transform it
  const chartData: RevenueDataPoint[] = (() => {
    if (data && data.length > 0) return data;
    if (rawTrends && rawTrends.length > 0) {
      return rawTrends.map((t, idx) => {
        const isLast = idx === rawTrends.length - 1;
        return {
          day: formatDayFromIso(t.date, isLast),
          amount: Number(t.amount) || 0,
          isToday: isLast,
        };
      });
    }
    return DEFAULT_WEEK_DATA;
  })();

  const avgVal = Math.round(
    chartData.reduce((acc, curr) => acc + curr.amount, 0) / (chartData.length || 1),
  );
  const displayAvg = averageLabel ?? `Average ₹${avgVal.toLocaleString("en-IN")}/day`;

  return (
    <div
      className={cn(
        "flex flex-col justify-between rounded-[26px] bg-white/90 dark:bg-card/90 p-6 border border-white/80 dark:border-border/60 shadow-[0_8px_30px_rgba(0,0,0,0.03)] backdrop-blur-xl",
        className,
      )}
    >
      {/* Chart Header */}
      <div className="flex items-center justify-between pb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-[#9f1239]" />
          <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
            Revenue — Last 7 Days
          </h3>
        </div>

        {/* Average Pill Dropdown Button */}
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-full border border-slate-200/80 dark:border-border bg-white/80 dark:bg-card px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-2xs hover:bg-slate-50 transition-colors"
        >
          <span>{displayAvg}</span>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </button>
      </div>

      {/* Chart Container */}
      <div className="h-[250px] w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 38, right: 12, bottom: 0, left: -14 }}
          >
            <defs>
              <linearGradient id="revSplineGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#9f1239" stopOpacity={0.25} />
                <stop offset="60%" stopColor="#9f1239" stopOpacity={0.08} />
                <stop offset="100%" stopColor="#9f1239" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(148, 163, 184, 0.2)"
              vertical={false}
            />

            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={<CustomXAxisTick />}
              interval={0}
            />

            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              ticks={[0, 25000, 50000, 75000, 100000]}
              tickFormatter={(v) => (v === 0 ? "0k" : `${Math.round(v / 1000)}k`)}
              domain={[0, (dataMax: number) => Math.max(105000, dataMax * 1.15)]}
              width={40}
            />

            <Tooltip
              formatter={(value: any) => [
                `₹${Number(value).toLocaleString("en-IN")}`,
                "Revenue",
              ]}
              labelFormatter={(label) => `Day: ${label}`}
              contentStyle={{
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                backdropFilter: "blur(8px)",
                borderRadius: "14px",
                border: "1px solid rgba(0,0,0,0.08)",
                boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
                fontSize: "12px",
                fontWeight: "600",
              }}
            />

            <Area
              type="monotone"
              dataKey="amount"
              stroke="#9f1239"
              strokeWidth={2.5}
              fill="url(#revSplineGrad)"
              dot={<CustomMilestoneDot dataLength={chartData.length} />}
              activeDot={{ r: 6, fill: "#881337", stroke: "#ffffff", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
