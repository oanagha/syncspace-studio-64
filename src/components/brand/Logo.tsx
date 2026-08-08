import { cn } from "@/lib/utils";

export function Logo({ className, mark = false }: { className?: string; mark?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span className="relative grid size-9 shrink-0 place-items-center rounded-xl gradient-brand shadow-glow">
        <svg viewBox="0 0 24 24" className="size-5" fill="none" aria-hidden>
          <path
            d="M12 3.2 20 7.6v8.8L12 20.8 4 16.4V7.6L12 3.2Z"
            stroke="white"
            strokeWidth="1.6"
            strokeLinejoin="round"
            opacity="0.85"
          />
          <circle cx="12" cy="12" r="3" fill="white" />
        </svg>
      </span>
      {!mark && (
        <span className="text-[1.05rem] font-extrabold tracking-tight">
          Sync<span className="gradient-text">Space</span>
        </span>
      )}
    </span>
  );
}

export function LoadingMark({ label = "Syncing your workspace" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center gap-4 py-16">
      <span className="relative grid size-16 place-items-center rounded-3xl gradient-brand shadow-glow animate-spin-slow">
        <svg viewBox="0 0 24 24" className="size-8" fill="none" aria-hidden>
          <circle cx="12" cy="12" r="8" stroke="white" strokeWidth="1.6" strokeDasharray="10 8" />
          <circle cx="12" cy="12" r="3" fill="white" />
        </svg>
      </span>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
