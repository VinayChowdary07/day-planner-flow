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

  // Map task status to kanban columns - updated logic
  const getKanbanStatus = (task: Task): KanbanColumn => {
    if (task.status === 'complete') return 'done';
    
    // Check if task has been explicitly moved to a kanban column
    // We'll use a combination of status and a custom field approach
    if (task.status === 'incomplete') {
      // If priority is high and category suggests active work, put in progress
      if (task.priority === 'high' && (task.category === 'work' || task.category === 'urgent')) {
        return 'in-progress';
      }
      // Otherwise, default to todo for incomplete tasks
      return 'todo';
    }
    
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
      
      // Update task status and properties based on column
      if (newColumn === 'done') {
        updates.status = 'complete';
      } else if (newColumn === 'in-progress') {
        updates.status = 'incomplete';
        updates.priority = 'high';
        updates.category = 'work'; // Set category to indicate active work
      } else if (newColumn === 'todo') {
        updates.status = 'incomplete';
        // Reset priority to medium and category to general for todo items
        updates.priority = 'medium';
        updates.category = 'general';
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
