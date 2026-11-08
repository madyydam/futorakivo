"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function formatDayLabel(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

// Axis ticks are short (10K); the tooltip carries the exact currency value.
const compactNumber = new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 });

export function TrendChart({
  title,
  icon: Icon,
  data,
  valueKey,
  color,
  valueFormatter,
  isLoading,
  emptyMessage,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  data: Record<string, string | number>[];
  valueKey: string;
  color: string;
  valueFormatter: (value: number) => string;
  isLoading: boolean;
  emptyMessage: string;
}) {
  const hasData = data.some((d) => Number(d[valueKey]) > 0);

  return (
    <Card className="flex flex-col gap-3 p-6 rounded-[24px] bg-white/90 dark:bg-card/90 border border-white/80 dark:border-border/60 shadow-[0_8px_30px_rgba(0,0,0,0.03)] backdrop-blur-xl">
      <h2 className="flex items-center gap-2 text-[18px] font-medium text-foreground">
        <Icon className="h-[18px] w-[18px] text-[#9f1239]" />
        {title}
      </h2>

      {isLoading ? (
        <Skeleton className="h-56 rounded-xl" />
      ) : !hasData ? (
        <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">
          {emptyMessage}
        </div>
      ) : (
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={formatDayLabel}
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                axisLine={{ stroke: "var(--border)" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
                width={44}
                tickFormatter={(v: number) => compactNumber.format(v)}
              />
              <Tooltip
                formatter={(value: number) => valueFormatter(value)}
                labelFormatter={(label: string) => formatDayLabel(label)}
                cursor={{ fill: "rgba(159, 18, 57, 0.05)" }}
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  backdropFilter: "blur(8px)",
                  border: "1px solid rgba(0,0,0,0.08)",
                  borderRadius: 12,
                  fontSize: 12,
                  fontWeight: 600,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                }}
              />
              <Bar
                dataKey={valueKey}
                fill={color}
                radius={[6, 6, 0, 0]}
                maxBarSize={36}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}
