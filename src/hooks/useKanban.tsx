
import { useState, useCallback } from 'react';
import { Task } from '@/types/task';
import { useTasks } from '@/hooks/useTasks';
import { toast } from '@/hooks/use-toast';

export type KanbanColumn = 'todo' | 'in-progress' | 'done';

export interface KanbanTask extends Task {
  kanban_status?: KanbanColumn;
}

export const useKanban = (projectId?: string) => {
  const { tasks, updateTask, loading } = useTasks();
  const [draggedTask, setDraggedTask] = useState<KanbanTask | null>(null);

  // Filter tasks by project if projectId is provided
  const projectTasks = projectId 
    ? tasks.filter(task => task.project_id === projectId)
    : tasks;

  // Map task status to kanban columns
  const getKanbanStatus = (task: Task): KanbanColumn => {
    if (task.status === 'complete') return 'done';
    // Use category or priority to determine initial column placement
    if (task.priority === 'high' || task.category === 'work') return 'in-progress';
    return 'todo';
  };

  // Group tasks by kanban columns
  const kanbanTasks = {
    todo: projectTasks.filter(task => getKanbanStatus(task) === 'todo'),
    'in-progress': projectTasks.filter(task => getKanbanStatus(task) === 'in-progress'),
    done: projectTasks.filter(task => getKanbanStatus(task) === 'done'),
  };

  const handleDragStart = useCallback((task: KanbanTask) => {
    setDraggedTask(task);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedTask(null);
  }, []);

  const moveTask = useCallback(async (taskId: string, newColumn: KanbanColumn) => {
    try {
      const updates: Partial<Task> = {};
      
      // Update task status based on column
      if (newColumn === 'done') {
        updates.status = 'complete';
      } else {
        updates.status = 'incomplete';
        // Optionally update priority or category based on column
        if (newColumn === 'in-progress') {
          updates.priority = 'high';
        }
      }

      await updateTask(taskId, updates);
      
      toast({
        title: 'Success',
        description: `Task moved to ${newColumn.replace('-', ' ')}`,
      });
    } catch (error) {
      console.error('Error moving task:', error);
      toast({
        title: 'Error',
        description: 'Failed to move task',
        variant: 'destructive',
      });
    }
  }, [updateTask]);

  const handleDrop = useCallback((column: KanbanColumn) => {
    if (draggedTask) {
      moveTask(draggedTask.id, column);
    }
  }, [draggedTask, moveTask]);

  return {
    kanbanTasks,
    draggedTask,
    loading,
    handleDragStart,
    handleDragEnd,
    handleDrop,
    moveTask,
  };
};
