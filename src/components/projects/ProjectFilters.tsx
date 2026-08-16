import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ProjectFiltersProps = {
  search: string;
  status: string;
  sort: string;
  disabled?: boolean;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onSortChange: (value: string) => void;
};

export function ProjectFilters({
  search,
  status,
  sort,
  disabled,
  onSearchChange,
  onStatusChange,
  onSortChange,
}: ProjectFiltersProps) {
  return (
    <div className="surface-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
      <div className="relative min-w-0 flex-1">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search projects..."
          disabled={disabled}
          className="h-11 rounded-2xl pl-9"
        />
      </div>
      <Select value={status} onValueChange={onStatusChange} disabled={Boolean(disabled)}>
        <SelectTrigger className="h-11 w-full rounded-2xl sm:w-44">
          <SelectValue placeholder="All Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="On Track">On Track</SelectItem>
          <SelectItem value="At Risk">At Risk</SelectItem>
          <SelectItem value="Completed">Completed</SelectItem>
        </SelectContent>
      </Select>
      <Select value={sort} onValueChange={onSortChange} disabled={Boolean(disabled)}>
        <SelectTrigger className="h-11 w-full rounded-2xl sm:w-48">
          <SlidersHorizontal className="size-4" />
          <SelectValue placeholder="Sort by Progress" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="progress">Sort by Progress</SelectItem>
          <SelectItem value="name">Sort by Name</SelectItem>
          <SelectItem value="deadline">Sort by Deadline</SelectItem>
          <SelectItem value="recent">Sort by Recent</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
