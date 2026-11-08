"use client";

import { cn } from "@/lib/utils";

/**
 * Smooth SVG bezier curve wave with vertical gradient area fill.
 * Matches the wine-red sparkline in the Today's Revenue card.
 */
export function SparklineWave({
  className = "h-14 w-32",
  color = "#9f1239",
}: {
  className?: string;
  color?: string;
}) {
  return (
    <div className={cn("relative shrink-0 overflow-hidden", className)}>
      <svg
        viewBox="0 0 140 45"
        fill="none"
        className="h-full w-full"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="wineWaveGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.28" />
            <stop offset="100%" stopColor={color} stopOpacity="0.0" />
          </linearGradient>
        </defs>
        {/* Shaded Area */}
        <path
          d="M0,35 Q18,33 30,28 T60,24 T85,14 T110,18 T140,5 L140,45 L0,45 Z"
          fill="url(#wineWaveGrad)"
        />
        {/* Stroke Curve */}
        <path
          d="M0,35 Q18,33 30,28 T60,24 T85,14 T110,18 T140,5"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    </div>
  );
}

/**
 * Ascending 5-column mini vertical bar sparkline.
 * Matches the Orders / Tables / Queue cards in the reference design.
 */
export function SparklineBars({
  className = "h-10 w-12",
  color = "#9f1239",
  heights = [30, 48, 42, 72, 100],
}: {
  className?: string;
  color?: string;
  heights?: number[];
}) {
  return (
    <div className={cn("flex items-end justify-end gap-1 shrink-0", className)}>
      {heights.map((h, i) => (
        <span
          key={i}
          style={{
            height: `${h}%`,
            backgroundColor: color,
            opacity: 0.2 + (i / heights.length) * 0.8,
          }}
          className="w-1.5 rounded-full transition-all"
        />
      ))}
    </div>
  );
}

/**
 * Mini smooth amber curve for Low stock items.
 */
export function SparklineAmberCurve({
  className = "h-7 w-20",
}: {
  className?: string;
}) {
  return (
    <div className={cn("relative shrink-0 overflow-hidden", className)}>
      <svg
        viewBox="0 0 100 30"
        fill="none"
        className="h-full w-full"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="amberCurveGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
          </linearGradient>
        </defs>
        <path
          d="M0,24 Q25,23 45,18 T75,10 T100,6 L100,30 L0,30 Z"
          fill="url(#amberCurveGrad)"
        />
        <path
          d="M0,24 Q25,23 45,18 T75,10 T100,6"
          stroke="#f59e0b"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    </div>
  );
}

