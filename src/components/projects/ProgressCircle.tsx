import { useEffect, useState } from "react";

type ProgressCircleProps = {
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
};

export function ProgressCircle({
  value,
  size = 64,
  stroke = 6,
  color = "#14B8A6",
}: ProgressCircleProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timeout = window.setTimeout(() => setProgress(clamped), 80);
    return () => window.clearTimeout(timeout);
  }, [clamped]);

  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--muted)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - (circumference * progress) / 100}
          style={{ transition: "stroke-dashoffset 1.1s cubic-bezier(0.22,1,0.36,1)" }}
        />
      </svg>
      <span className="absolute text-xs font-bold tabular-nums">{clamped}%</span>
    </div>
  );
}
