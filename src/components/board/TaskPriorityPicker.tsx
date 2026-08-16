import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { TASK_PRIORITIES } from "@/services/task.service";

const priorityStyle: Record<string, string> = {
  Urgent: "bg-destructive/12 text-destructive",
  High: "bg-warning/15 text-warning",
  Medium: "bg-primary-soft text-primary",
  Low: "bg-muted text-muted-foreground",
};

type TaskPriorityPickerProps = {
  priority: string;
  disabled?: boolean;
  onChange: (priority: string) => void;
};

export function TaskPriorityPicker({ priority, disabled, onChange }: TaskPriorityPickerProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          aria-label={`Priority ${priority}`}
          className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-bold transition-transform hover:scale-105",
            priorityStyle[priority] ?? "bg-muted text-muted-foreground",
          )}
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          {priority}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-36 rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {TASK_PRIORITIES.map((value) => (
          <DropdownMenuItem key={value} className="rounded-xl" onSelect={() => onChange(value)}>
            <span
              className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold", priorityStyle[value])}
            >
              {value}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
