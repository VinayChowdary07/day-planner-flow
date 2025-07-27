
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Task, TaskFilters } from '@/types/task';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

export const useTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchTasks = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('order_position', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks((data || []) as Task[]);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch tasks',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Set up real-time subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('tasks-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Real-time task update:', payload);
          fetchTasks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchTasks]);

  const createTask = async (taskData: Partial<Task>) => {
    if (!user || !taskData.title || !taskData.task_date) return;

    try {
      // Handle empty time fields to prevent PostgreSQL errors
      const insertData: any = {
        title: taskData.title,
        task_date: taskData.task_date,
        user_id: user.id,
        status: 'incomplete' as const,
        order_position: tasks.length,
        description: taskData.description || null,
        start_time: taskData.start_time?.trim() || null,
        end_time: taskData.end_time?.trim() || null,
        location: taskData.location || null,
        tags: taskData.tags || [],
        priority: taskData.priority || 'medium',
        category: taskData.category || 'general',
        recurrence: taskData.recurrence || 'none',
        recurrence_end_date: taskData.recurrence_end_date || null,
        is_template: taskData.recurrence && taskData.recurrence !== 'none',
        project_id: taskData.project_id || null,
        goal_id: taskData.goal_id || null,
      };

      // Set next_occurrence for recurring tasks
      if (taskData.recurrence && taskData.recurrence !== 'none') {
        const nextDay = new Date(taskData.task_date);
        nextDay.setDate(nextDay.getDate() + 1);
        insertData.next_occurrence = nextDay.toISOString();
      }

      const { data, error } = await supabase
        .from('tasks')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Task created successfully',
      });

      return data;
    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        title: 'Error',
        description: 'Failed to create task',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Task updated successfully',
      });

      return data;
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: 'Error',
        description: 'Failed to update task',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const deleteTask = async (id: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Task deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting task:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete task',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const toggleTaskComplete = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const newStatus = task.status === 'complete' ? 'incomplete' : 'complete';
    return updateTask(id, { status: newStatus });
  };

  const reorderTasks = async (reorderedTasks: Task[]) => {
    try {
      const updates = reorderedTasks.map((task, index) => ({
        id: task.id,
        order_position: index,
      }));

      for (const update of updates) {
        await supabase
          .from('tasks')
          .update({ order_position: update.order_position })
          .eq('id', update.id);
      }

      setTasks(reorderedTasks);
    } catch (error) {
      console.error('Error reordering tasks:', error);
      toast({
        title: 'Error',
        description: 'Failed to reorder tasks',
        variant: 'destructive',
      });
    }
  };

  const filterTasks = (filters: TaskFilters): Task[] => {
    return tasks.filter(task => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = 
          task.title.toLowerCase().includes(searchLower) ||
          task.description?.toLowerCase().includes(searchLower) ||
          task.tags.some(tag => tag.toLowerCase().includes(searchLower));
        
        if (!matchesSearch) return false;
      }

      // Status filter
      if (filters.status !== 'all' && task.status !== filters.status) {
        return false;
      }

      // Priority filter
      if (filters.priority !== 'all' && task.priority !== filters.priority) {
        return false;
      }

      // Category filter
      if (filters.category !== 'all' && task.category !== filters.category) {
        return false;
      }

      // Date range filter
      const taskDate = new Date(task.task_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      switch (filters.dateRange) {
        case 'today':
          const todayStr = today.toISOString().split('T')[0];
          return task.task_date === todayStr;
        
        case 'week':
          const weekStart = new Date(today);
          weekStart.setDate(today.getDate() - today.getDay());
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          return taskDate >= weekStart && taskDate <= weekEnd;
        
        case 'month':
          const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
          const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
          return taskDate >= monthStart && taskDate <= monthEnd;
        
        default:
          return true;
      }
    });
  };

  return {
    tasks,
    loading,
    createTask,
    updateTask,
    deleteTask,
    toggleTaskComplete,
    reorderTasks,
    filterTasks,
  };
};
