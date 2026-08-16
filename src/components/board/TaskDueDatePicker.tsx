import { CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { formatProjectDeadline } from "@/services/project.service";
import { isTaskOverdue, todayDateInputValue } from "@/services/task.service";

type TaskDueDatePickerProps = {
  dueDate: string | null;
  column: string;
  disabled?: boolean;
  onChange: (dueDate: string | null) => void;
};

export function TaskDueDatePicker({ dueDate, column, disabled, onChange }: TaskDueDatePickerProps) {
  const overdue = isTaskOverdue({ due_date: dueDate, column });

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          aria-label={dueDate ? `Due ${formatProjectDeadline(dueDate)}` : "Set due date"}
          className={cn(
            "inline-flex items-center gap-1 rounded-lg px-1.5 py-0.5 transition-colors hover:bg-muted",
            overdue ? "font-semibold text-destructive" : "text-muted-foreground",
          )}
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <CalendarDays className="size-3.5" />
          {overdue ? `Overdue · ${formatProjectDeadline(dueDate)}` : formatProjectDeadline(dueDate)}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-64 space-y-3 rounded-2xl p-3"
        onClick={(e) => e.stopPropagation()}
      >
        <Input
          type="date"
          value={dueDate ?? ""}
          min={todayDateInputValue()}
          className="h-10 rounded-xl"
          onChange={(e) => onChange(e.target.value || null)}
        />
        {dueDate && (
          <Button variant="ghost" size="sm" className="w-full" onClick={() => onChange(null)}>
            Clear due date
          </Button>
        )}
      </PopoverContent>
    </Popover>
  );
}
