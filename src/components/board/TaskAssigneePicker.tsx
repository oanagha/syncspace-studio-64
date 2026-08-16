import { UserPlus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { memberAvatarColor, memberInitials } from "@/services/project.service";
import type { TaskAssignee } from "@/services/task.service";

export type AssigneeOption = {
  id: number;
  name: string;
};

type TaskAssigneePickerProps = {
  assignee: TaskAssignee | null;
  members: AssigneeOption[];
  disabled?: boolean;
  onAssign: (assigneeId: number | null) => void;
};

export function TaskAssigneePicker({
  assignee,
  members,
  disabled,
  onAssign,
}: TaskAssigneePickerProps) {
  const options =
    assignee && !members.some((member) => member.id === assignee.id)
      ? [{ id: assignee.id, name: assignee.name }, ...members]
      : members;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          aria-label={assignee ? `Assigned to ${assignee.name}` : "Assign task"}
          title={assignee ? assignee.name : "Assign"}
          className={cn(
            "grid size-6 place-items-center rounded-full text-[9px] font-bold transition-transform hover:scale-110",
            assignee
              ? "text-primary-foreground"
              : "border border-dashed border-border text-muted-foreground",
          )}
          style={assignee ? { background: memberAvatarColor(assignee.id) } : undefined}
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          {assignee ? memberInitials(assignee.name) : <UserPlus className="size-3" />}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-52 rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <DropdownMenuLabel>Assign to</DropdownMenuLabel>
        <DropdownMenuItem className="rounded-xl" onSelect={() => onAssign(null)}>
          Unassigned
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {options.length === 0 ? (
          <DropdownMenuItem disabled className="rounded-xl">
            No workspace members
          </DropdownMenuItem>
        ) : (
          options.map((member) => (
            <DropdownMenuItem
              key={member.id}
              className="gap-2 rounded-xl"
              onSelect={() => onAssign(member.id)}
            >
              <span
                className="grid size-6 place-items-center rounded-full text-[9px] font-bold text-primary-foreground"
                style={{ background: memberAvatarColor(member.id) }}
              >
                {memberInitials(member.name)}
              </span>
              <span className="truncate">{member.name}</span>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
