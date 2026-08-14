import { Link } from "@tanstack/react-router";
import { ProgressCircle } from "@/components/projects/ProgressCircle";
import {
  formatProjectDeadline,
  memberAvatarColor,
  memberInitials,
  PROJECT_STATUS_STYLES,
  type Project,
} from "@/services/project.service";
import { cn } from "@/lib/utils";

type ProjectCardProps = {
  project: Project;
  subtitle: string;
  index?: number;
};

export function ProjectCard({ project, subtitle, index = 0 }: ProjectCardProps) {
  const statusStyle = PROJECT_STATUS_STYLES[project.status] ?? PROJECT_STATUS_STYLES["On Track"]!;
  const visibleMembers = project.members.slice(0, 3);
  const extraCount = Math.max(project.members.length - visibleMembers.length, 0);

  return (
    <Link
      to="/app/projects/$id"
      params={{ id: String(project.id) }}
      className="surface-card hover-lift block p-6 outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-ring/60"
      style={{
        animation: `fade-up .28s cubic-bezier(.22,1,.36,1) ${Math.min(index * 20, 100)}ms both`,
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <span
            className={cn(
              "inline-block rounded-full px-2.5 py-1 text-[10px] font-bold",
              statusStyle.badge,
            )}
          >
            {project.status}
          </span>
          <h2 className="mt-3 truncate text-lg font-bold">{project.title}</h2>
          <p className="truncate text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <ProgressCircle value={project.progress} color={statusStyle.stroke} />
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <div className="flex -space-x-2">
          {visibleMembers.map((member) => (
            <span
              key={member.id}
              title={member.name}
              className="grid size-8 place-items-center rounded-full border-2 border-card text-[10px] font-bold text-primary-foreground"
              style={{
                background: member.avatar
                  ? `center / cover url(${member.avatar})`
                  : memberAvatarColor(member.id),
              }}
            >
              {!member.avatar && memberInitials(member.name)}
            </span>
          ))}
          {extraCount > 0 && (
            <span className="grid size-8 place-items-center rounded-full border-2 border-card bg-muted text-[10px] font-bold text-muted-foreground">
              +{extraCount}
            </span>
          )}
          {project.members.length === 0 && (
            <span className="grid size-8 place-items-center rounded-full border-2 border-card bg-muted text-[10px] font-bold text-muted-foreground">
              —
            </span>
          )}
        </div>
        <p className="shrink-0 text-xs text-muted-foreground">
          {project.completed_tasks}/{project.total_tasks} tasks · due{" "}
          {formatProjectDeadline(project.deadline)}
        </p>
      </div>
    </Link>
  );
}
