import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getUser } from "@/lib/auth";
import { memberAvatarColor, memberInitials } from "@/services/project.service";
import {
  commentQueryKey,
  createComment,
  formatCommentTime,
  listComments,
  type TaskComment,
} from "@/services/comment.service";
import { notificationQueryKey } from "@/services/notification.service";

type TaskCommentsProps = {
  taskId: number;
};

export function TaskComments({ taskId }: TaskCommentsProps) {
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");
  const user = getUser();

  const commentsQuery = useQuery({
    queryKey: commentQueryKey(taskId),
    queryFn: () => listComments(taskId),
    enabled: Number.isInteger(taskId) && taskId > 0,
  });
  const comments = commentsQuery.data?.comments ?? [];

  const mutation = useMutation({
    mutationFn: (text: string) => createComment(taskId, text),
    onMutate: async (text) => {
      const key = commentQueryKey(taskId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<{ comments: TaskComment[] }>(key);
      const optimistic: TaskComment = {
        id: -Date.now(),
        task_id: taskId,
        content: text,
        user: { id: user?.id ?? 0, name: user?.name || "You" },
        created_at: new Date().toISOString(),
      };
      queryClient.setQueryData<{ comments: TaskComment[] }>(key, (current) => ({
        comments: [...(current?.comments ?? previous?.comments ?? []), optimistic],
      }));
      setContent("");
      return { previous, text };
    },
    onError: (err, text, context) => {
      if (context?.previous) {
        queryClient.setQueryData(commentQueryKey(taskId), context.previous);
      }
      setContent(text);
      toast.error(err instanceof Error ? err.message : "Failed to add comment.");
    },
    onSuccess: (data) => {
      queryClient.setQueryData<{ comments: TaskComment[] }>(commentQueryKey(taskId), (current) => {
        const withoutOptimistic = (current?.comments ?? []).filter((item) => item.id > 0);
        if (withoutOptimistic.some((item) => item.id === data.comment.id)) {
          return { comments: withoutOptimistic };
        }
        return { comments: [...withoutOptimistic, data.comment] };
      });
      void queryClient.invalidateQueries({ queryKey: notificationQueryKey() });
    },
  });

  const submit = () => {
    const text = content.trim();
    if (!text) {
      toast.error("Comment cannot be empty");
      return;
    }
    mutation.mutate(text);
  };

  return (
    <div className="space-y-3 border-t border-border pt-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold">Comments</h3>
        <span className="text-xs font-semibold text-muted-foreground">{comments.length}</span>
      </div>

      <div className="max-h-48 space-y-3 overflow-y-auto pr-1">
        {commentsQuery.isLoading ? (
          <p className="text-xs text-muted-foreground">Loading comments…</p>
        ) : comments.length === 0 ? (
          <p className="text-xs text-muted-foreground">No comments yet. Start the discussion.</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-2.5">
              <span
                className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full text-[10px] font-bold text-primary-foreground"
                style={{ background: memberAvatarColor(comment.user.id) }}
              >
                {memberInitials(comment.user.name)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <p className="truncate text-xs font-bold">{comment.user.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {formatCommentTime(comment.created_at)}
                  </p>
                </div>
                <p className="mt-0.5 whitespace-pre-wrap text-sm leading-relaxed">{comment.content}</p>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="space-y-2">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              submit();
            }
          }}
          rows={2}
          maxLength={2000}
          placeholder="Write a comment. Use @name to mention a teammate."
          className="rounded-2xl"
        />
        <div className="flex justify-end">
          <Button
            type="button"
            variant="hero"
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              submit();
            }}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Send />}
            {mutation.isPending ? "Posting..." : "Comment"}
          </Button>
        </div>
      </div>
    </div>
  );
}
