import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Task, TaskFilters } from '@/types/task';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { useGamification } from '@/hooks/useGamification';

export const useTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { awardXP, deductXP } = useGamification();

  const fetchTasks = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      console.log('Fetching tasks for user:', user.id);
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .is('parent_task_id', null) // Only fetch main tasks, not subtasks
        .order('order_position', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching tasks:', error);
        throw error;
      }
      
      console.log('Fetched tasks:', data?.length || 0);
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

    console.log('Setting up real-time subscription for tasks');
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
          
          const taskData = payload.new as Task;
          
          // Handle different event types, but only for main tasks (not subtasks)
          if (payload.eventType === 'INSERT') {
            console.log('Task inserted:', payload.new);
            // Only add to main tasks if it's not a subtask
            if (!taskData?.parent_task_id) {
              setTasks(prev => [payload.new as Task, ...prev]);
            }
          } else if (payload.eventType === 'UPDATE') {
            console.log('Task updated:', payload.new);
            // Only update in main tasks if it's not a subtask
            if (!taskData?.parent_task_id) {
              setTasks(prev => prev.map(task => 
                task.id === payload.new.id ? payload.new as Task : task
              ));
            }
          } else if (payload.eventType === 'DELETE') {
            console.log('Task deleted:', payload.old);
            // Remove from main tasks regardless (in case it was converted from main to subtask)
            setTasks(prev => prev.filter(task => task.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [user]);

  const createTask = async (taskData: Partial<Task>) => {
    if (!user || !taskData.title || !taskData.task_date) {
      console.error('Missing required data for task creation');
      return;
    }

    try {
      console.log('Creating task:', taskData);
      
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
        const taskDate = new Date(taskData.task_date);
        let nextDay = new Date(taskDate);
        
        // Calculate the first next occurrence based on recurrence type
        switch (taskData.recurrence) {
          case 'daily':
            nextDay.setDate(taskDate.getDate() + 1);
            break;
          case 'weekly':
            nextDay.setDate(taskDate.getDate() + 7);
            break;
          case 'monthly':
            nextDay.setMonth(taskDate.getMonth() + 1);
            break;
        }
        
        insertData.next_occurrence = nextDay.toISOString();
        console.log('Set next occurrence for recurring task:', insertData.next_occurrence);
      }

      console.log('Final insert data:', insertData);

      const { data, error } = await supabase
        .from('tasks')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('Supabase error creating task:', error);
        throw error;
      }

      console.log('Task created successfully:', data);
      
      // Trigger recurring task generation if this is a recurring task
      if (data.recurrence && data.recurrence !== 'none') {
        console.log('Triggering recurring task generation for new recurring task');
        try {
          await supabase.functions.invoke('generate-recurring-tasks');
        } catch (funcError) {
          console.warn('Failed to trigger recurring task generation:', funcError);
        }
      }
      
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
    if (!id) {
      console.error('No task ID provided for update');
      return;
    }

    try {
      console.log('Updating task:', id, 'with updates:', updates);
      
      // Clean and validate the updates data
      const cleanUpdates: any = {};
      
      // Handle each field properly
      if (updates.title !== undefined) cleanUpdates.title = updates.title;
      if (updates.description !== undefined) cleanUpdates.description = updates.description || null;
      if (updates.task_date !== undefined) cleanUpdates.task_date = updates.task_date;
      if (updates.start_time !== undefined) cleanUpdates.start_time = updates.start_time?.trim() || null;
      if (updates.end_time !== undefined) cleanUpdates.end_time = updates.end_time?.trim() || null;
      if (updates.location !== undefined) cleanUpdates.location = updates.location || null;
      if (updates.priority !== undefined) cleanUpdates.priority = updates.priority;
      if (updates.category !== undefined) cleanUpdates.category = updates.category;
      if (updates.status !== undefined) cleanUpdates.status = updates.status;
      if (updates.tags !== undefined) cleanUpdates.tags = updates.tags || [];
      if (updates.recurrence !== undefined) cleanUpdates.recurrence = updates.recurrence || 'none';
      if (updates.recurrence_end_date !== undefined) cleanUpdates.recurrence_end_date = updates.recurrence_end_date || null;
      if (updates.project_id !== undefined) cleanUpdates.project_id = updates.project_id || null;
      if (updates.goal_id !== undefined) cleanUpdates.goal_id = updates.goal_id || null;
      if (updates.order_position !== undefined) cleanUpdates.order_position = updates.order_position;

      // Handle template and next_occurrence logic for recurring tasks
      if (updates.recurrence !== undefined) {
        cleanUpdates.is_template = updates.recurrence && updates.recurrence !== 'none';
        
        if (updates.recurrence && updates.recurrence !== 'none' && updates.task_date) {
          const taskDate = new Date(updates.task_date);
          let nextDay = new Date(taskDate);
          
          switch (updates.recurrence) {
            case 'daily':
              nextDay.setDate(taskDate.getDate() + 1);
              break;
            case 'weekly':
              nextDay.setDate(taskDate.getDate() + 7);
              break;
            case 'monthly':
              nextDay.setMonth(taskDate.getMonth() + 1);
              break;
          }
          
          cleanUpdates.next_occurrence = nextDay.toISOString();
        } else {
          cleanUpdates.next_occurrence = null;
        }
      }

      console.log('Clean updates data:', cleanUpdates);

      const { data, error } = await supabase
        .from('tasks')
        .update(cleanUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Supabase error updating task:', error);
        throw error;
      }

      console.log('Task updated successfully:', data);
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
    if (!id) {
      console.error('No task ID provided for deletion');
      return;
    }

    try {
      console.log('Deleting task:', id);
      
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Supabase error deleting task:', error);
        throw error;
      }

      console.log('Task deleted successfully:', id);
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
    if (!task) {
      console.error('Task not found for completion toggle:', id);
      return;
    }

    // Check if task has subtasks
    const { count: subtaskCount } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('parent_task_id', id);

    if (subtaskCount && subtaskCount > 0) {
      // Task has subtasks - prevent manual toggle
      toast({
        title: 'Cannot toggle manually',
        description: 'This task has subtasks. Complete all subtasks to mark the main task as complete.',
        variant: 'destructive',
      });
      return;
    }

    const wasComplete = task.status === 'complete';
    const newStatus = wasComplete ? 'incomplete' : 'complete';
    console.log('Toggling task status:', id, 'from', task.status, 'to', newStatus);
    
    const result = await updateTask(id, { status: newStatus });
    
    if (result) {
      if (newStatus === 'complete') {
        // Award XP for completing task
        try {
          await awardXP(task.priority as 'low' | 'medium' | 'high');
        } catch (error) {
          console.error('Error awarding XP:', error);
        }
      } else {
        // Deduct XP for unchecking task
        try {
          await deductXP(task.priority as 'low' | 'medium' | 'high');
        } catch (error) {
          console.error('Error deducting XP:', error);
        }
      }
    }
    
    return result;
  };

  const reorderTasks = async (reorderedTasks: Task[]) => {
    try {
      console.log('Reordering tasks:', reorderedTasks.length);
      
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
      console.log('Tasks reordered successfully');
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
