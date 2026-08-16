import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Reveal({
  children,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return <div className={className}>{children}</div>;
}

export function Parallax({
  children,
  className,
}: {
  children: ReactNode;
  speed?: number;
  className?: string;
}) {
  return <div className={cn(className)}>{children}</div>;
}

export function Counter({
  to,
  suffix = "",
  prefix = "",
  decimals = 0,
  className,
}: {
  to: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  decimals?: number;
  className?: string;
}) {
  return (
    <span className={className}>
      {prefix}
      {to.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  );
}

export function ProgressRing({
  value,
  size = 64,
  stroke = 6,
  color = "var(--primary)",
  children,
}: {
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
  children?: ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;

  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--muted)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (c * value) / 100}
        />
      </svg>
      <span className="absolute text-xs font-bold">{children ?? `${value}%`}</span>
    </div>
  );
}

export function AnimatedBar({ value, color = "var(--primary)" }: { value: number; color?: string }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
      <div
        className="h-full rounded-full"
        style={{
          width: `${value}%`,
          background: color,
        }}
      />
    </div>
  );
}
