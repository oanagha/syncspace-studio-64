import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { projectDetailQueryKey } from "@/services/project.service";
import { deleteTask, taskDetailQueryKey, taskQueryKey, type ProjectTask } from "@/services/task.service";

export function useDeleteTask(projectId: number, onDeleted?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: number) => deleteTask(taskId),
    onMutate: async (taskId) => {
      const key = taskQueryKey(projectId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<{ tasks: ProjectTask[] }>(key);
      queryClient.setQueryData<{ tasks: ProjectTask[] }>(key, (current) =>
        current ? { tasks: current.tasks.filter((task) => task.id !== taskId) } : current,
      );
      return { previous };
    },
    onError: (err, _taskId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(taskQueryKey(projectId), context.previous);
      }
      toast.error(err instanceof Error ? err.message : "Failed to delete task.");
    },
    onSuccess: (_data, taskId) => {
      toast.success("Task deleted");
      onDeleted?.();
      void queryClient.removeQueries({ queryKey: taskDetailQueryKey(taskId) });
      void queryClient.invalidateQueries({ queryKey: projectDetailQueryKey(projectId) });
      void queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}
