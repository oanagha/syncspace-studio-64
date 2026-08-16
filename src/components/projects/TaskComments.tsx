import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Pencil, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  ConfirmDeleteDialog,
} from "@/components/ux/ConfirmDeleteDialog";
import { getUser } from "@/lib/auth";
import { useWorkspace } from "@/hooks/useWorkspace";
import { memberAvatarColor, memberInitials } from "@/services/project.service";
import {
  commentQueryKey,
  createComment,
  deleteComment,
  formatCommentTime,
  listComments,
  updateComment,
  type TaskComment,
} from "@/services/comment.service";
import { notificationQueryKey } from "@/services/notification.service";

type TaskCommentsProps = {
  taskId: number;
};

function canDeleteComment(comment: TaskComment, userId: number | undefined, role?: string | null) {
  if (!userId) return false;
  if (comment.user.id === userId) return true;
  return role === "Owner" || role === "Admin";
}

export function TaskComments({ taskId }: TaskCommentsProps) {
  const queryClient = useQueryClient();
  const { activeWorkspace } = useWorkspace();
  const [content, setContent] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");
  const [pendingDelete, setPendingDelete] = useState<TaskComment | null>(null);
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

  const editMutation = useMutation({
    mutationFn: ({ commentId, text }: { commentId: number; text: string }) =>
      updateComment(taskId, commentId, text),
    onSuccess: (data) => {
      queryClient.setQueryData<{ comments: TaskComment[] }>(commentQueryKey(taskId), (current) => ({
        comments: (current?.comments ?? []).map((item) =>
          item.id === data.comment.id ? data.comment : item,
        ),
      }));
      setEditingId(null);
      setEditContent("");
      toast.success("Comment updated");
      void queryClient.invalidateQueries({ queryKey: commentQueryKey(taskId) });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to update comment.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (commentId: number) => deleteComment(taskId, commentId),
    onSuccess: (_data, commentId) => {
      queryClient.setQueryData<{ comments: TaskComment[] }>(commentQueryKey(taskId), (current) => ({
        comments: (current?.comments ?? []).filter((item) => item.id !== commentId),
      }));
      if (editingId === commentId) {
        setEditingId(null);
        setEditContent("");
      }
      toast.success("Comment deleted");
      void queryClient.invalidateQueries({ queryKey: commentQueryKey(taskId) });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to delete comment.");
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

  const startEdit = (comment: TaskComment) => {
    setEditingId(comment.id);
    setEditContent(comment.content);
  };

  const saveEdit = (commentId: number) => {
    const text = editContent.trim();
    if (!text) {
      toast.error("Comment cannot be empty");
      return;
    }
    editMutation.mutate({ commentId, text });
  };

  return (
    <div className="space-y-3 border-t border-border pt-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold">Comments</h3>
        <span className="text-xs font-semibold text-muted-foreground">{comments.length}</span>
      </div>

      <div className="max-h-56 space-y-3 overflow-y-auto pr-1">
        {commentsQuery.isLoading ? (
          <p className="text-xs text-muted-foreground">Loading comments…</p>
        ) : comments.length === 0 ? (
          <p className="text-xs text-muted-foreground">No comments yet. Start the discussion.</p>
        ) : (
          comments.map((comment) => {
            const isOwn = user?.id === comment.user.id;
            const canDelete = canDeleteComment(comment, user?.id, activeWorkspace?.role);
            const isEditing = editingId === comment.id;
            const deleting =
              deleteMutation.isPending && deleteMutation.variables === comment.id;

            return (
              <div key={comment.id} className="flex gap-2.5">
                <span
                  className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full text-[10px] font-bold text-primary-foreground"
                  style={{ background: memberAvatarColor(comment.user.id) }}
                >
                  {memberInitials(comment.user.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <p className="truncate text-xs font-bold">{comment.user.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {formatCommentTime(comment.created_at)}
                    </p>
                  </div>

                  {isEditing ? (
                    <div className="mt-1.5 space-y-2">
                      <Textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={2}
                        maxLength={2000}
                        className="rounded-2xl"
                        disabled={editMutation.isPending}
                      />
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="hero"
                          size="sm"
                          disabled={editMutation.isPending}
                          onClick={() => saveEdit(comment.id)}
                        >
                          {editMutation.isPending ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : null}
                          {editMutation.isPending ? "Saving…" : "Save"}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={editMutation.isPending}
                          onClick={() => {
                            setEditingId(null);
                            setEditContent("");
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="mt-0.5 whitespace-pre-wrap text-sm leading-relaxed">
                        {comment.content}
                      </p>
                      {(isOwn || canDelete) && (
                        <div className="mt-1 flex gap-1">
                          {isOwn && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs"
                              disabled={editMutation.isPending || deleteMutation.isPending}
                              onClick={() => startEdit(comment)}
                            >
                              <Pencil className="size-3" /> Edit
                            </Button>
                          )}
                          {canDelete && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
                              disabled={editMutation.isPending || deleteMutation.isPending}
                              onClick={() => setPendingDelete(comment)}
                            >
                              {deleting ? (
                                <Loader2 className="size-3 animate-spin" />
                              ) : (
                                <Trash2 className="size-3" />
                              )}
                              Delete
                            </Button>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })
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

      <ConfirmDeleteDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(next) => {
          if (!next) setPendingDelete(null);
        }}
        title="Delete comment?"
        description="This comment will be permanently removed. This cannot be undone."
        confirmLabel="Delete comment"
        pending={deleteMutation.isPending}
        onConfirm={() => {
          if (!pendingDelete) return;
          deleteMutation.mutate(pendingDelete.id, {
            onSuccess: () => setPendingDelete(null),
          });
        }}
      />
    </div>
  );
}
