import { Loader2, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ConfirmDeleteDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  pending?: boolean;
  onConfirm: () => void;
  /** Soften copy for non-destructive removals (e.g. remove member / photo). */
  tone?: "danger" | "caution";
};

export function ConfirmDeleteDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  pending = false,
  onConfirm,
  tone = "danger",
}: ConfirmDeleteDialogProps) {
  const iconWrap =
    tone === "danger"
      ? "bg-destructive/10 text-destructive ring-destructive/15"
      : "bg-amber-500/10 text-amber-700 ring-amber-500/20 dark:text-amber-400";

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (pending) return;
        onOpenChange(next);
      }}
    >
      <AlertDialogContent className="gap-0 overflow-hidden border-border/70 p-0 shadow-2xl sm:max-w-md sm:rounded-3xl">
        <div
          className={cn(
            "pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b",
            tone === "danger"
              ? "from-destructive/[0.08] to-transparent"
              : "from-amber-500/[0.08] to-transparent",
          )}
        />

        <AlertDialogHeader className="relative space-y-4 px-6 pb-2 pt-6 text-left sm:text-left">
          <div
            className={cn(
              "flex size-12 items-center justify-center rounded-2xl ring-1",
              iconWrap,
            )}
          >
            <Trash2 className="size-5" strokeWidth={2.25} />
          </div>
          <div className="space-y-2">
            <AlertDialogTitle className="text-xl font-bold tracking-tight text-foreground">
              {title}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[0.95rem] leading-relaxed text-muted-foreground">
              {description}
            </AlertDialogDescription>
          </div>
        </AlertDialogHeader>

        <AlertDialogFooter className="relative gap-2 border-t border-border/60 bg-muted/30 px-6 py-4 sm:space-x-0">
          <AlertDialogCancel
            disabled={pending}
            className="mt-0 h-11 rounded-2xl border-border/80 bg-background px-5"
          >
            {cancelLabel}
          </AlertDialogCancel>
          <Button
            type="button"
            variant="destructive"
            className="h-11 rounded-2xl px-5 shadow-sm"
            disabled={pending}
            onClick={() => onConfirm()}
          >
            {pending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Working…
              </>
            ) : (
              confirmLabel
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/** Highlight a name inside delete copy without breaking the sentence. */
export function DeleteEntityName({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-semibold text-foreground">“{children}”</span>
  );
}
