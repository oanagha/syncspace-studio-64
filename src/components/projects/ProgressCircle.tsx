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
          strokeDashoffset={circumference - (circumference * clamped) / 100}
        />
      </svg>
      <span className="absolute text-xs font-bold tabular-nums">{clamped}%</span>
    </div>
  );
}
