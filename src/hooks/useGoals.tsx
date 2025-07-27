
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Goal, GoalTask, GoalProgress, GoalFilters } from '@/types/goal';
import { Task } from '@/types/task';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

export const useGoals = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchGoals = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGoals(data || []);
    } catch (error) {
      console.error('Error fetching goals:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch goals',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  // Set up real-time subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('goals-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'goals',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Real-time goal update:', payload);
          fetchGoals();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchGoals]);

  const createGoal = async (goalData: Partial<Goal>) => {
    if (!user || !goalData.title) return;

    try {
      const { data, error } = await supabase
        .from('goals')
        .insert({
          title: goalData.title,
          description: goalData.description || null,
          start_date: goalData.start_date || null,
          end_date: goalData.end_date || null,
          target_count: goalData.target_count || null,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Goal created successfully',
      });

      return data;
    } catch (error) {
      console.error('Error creating goal:', error);
      toast({
        title: 'Error',
        description: 'Failed to create goal',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const updateGoal = async (id: string, updates: Partial<Goal>) => {
    try {
      const { data, error } = await supabase
        .from('goals')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Goal updated successfully',
      });

      return data;
    } catch (error) {
      console.error('Error updating goal:', error);
      toast({
        title: 'Error',
        description: 'Failed to update goal',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const deleteGoal = async (id: string) => {
    try {
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Goal deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting goal:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete goal',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const linkTaskToGoal = async (goalId: string, taskId: string) => {
    try {
      const { error } = await supabase
        .from('goal_tasks')
        .insert({
          goal_id: goalId,
          task_id: taskId,
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Task linked to goal successfully',
      });
    } catch (error) {
      console.error('Error linking task to goal:', error);
      toast({
        title: 'Error',
        description: 'Failed to link task to goal',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const unlinkTaskFromGoal = async (goalId: string, taskId: string) => {
    try {
      const { error } = await supabase
        .from('goal_tasks')
        .delete()
        .eq('goal_id', goalId)
        .eq('task_id', taskId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Task unlinked from goal successfully',
      });
    } catch (error) {
      console.error('Error unlinking task from goal:', error);
      toast({
        title: 'Error',
        description: 'Failed to unlink task from goal',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const getGoalProgress = async (goalId: string): Promise<GoalProgress | null> => {
    if (!user) return null;

    try {
      // Get goal details
      const { data: goal, error: goalError } = await supabase
        .from('goals')
        .select('*')
        .eq('id', goalId)
        .single();

      if (goalError) throw goalError;

      // Get all tasks linked to this goal
      const { data: goalTasks, error: taskError } = await supabase
        .from('goal_tasks')
        .select(`
          task_id,
          tasks (*)
        `)
        .eq('goal_id', goalId);

      if (taskError) throw taskError;

      const tasks = goalTasks?.map(gt => gt.tasks).filter(Boolean) as Task[] || [];
      
      let totalTasks = 0;
      let completedTasks = 0;
      let totalRecurringCompletions = 0;
      let hasInfiniteRecurring = false;

      for (const task of tasks) {
        if (task.parent_task_id) {
          // This is a recurring task instance
          totalRecurringCompletions++;
          if (task.status === 'complete') {
            completedTasks++;
          }
        } else if (task.recurrence && task.recurrence !== 'none') {
          // This is a recurring task template
          hasInfiniteRecurring = true;
          if (!task.recurrence_end_date) {
            hasInfiniteRecurring = true;
          } else {
            // Count expected instances within date range
            const startDate = new Date(task.task_date);
            const endDate = new Date(task.recurrence_end_date);
            const expectedInstances = calculateExpectedInstances(
              startDate,
              endDate,
              task.recurrence
            );
            totalTasks += expectedInstances;
          }
          
          // Count completed instances
          const { data: instances } = await supabase
            .from('tasks')
            .select('status')
            .eq('parent_task_id', task.id)
            .eq('status', 'complete');
          
          completedTasks += instances?.length || 0;
        } else {
          // Regular task
          totalTasks++;
          if (task.status === 'complete') {
            completedTasks++;
          }
        }
      }

      const percentage = hasInfiniteRecurring ? null : 
        totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      return {
        goal,
        totalTasks,
        completedTasks,
        totalRecurringCompletions,
        hasInfiniteRecurring,
        percentage,
      };
    } catch (error) {
      console.error('Error calculating goal progress:', error);
      return null;
    }
  };

  const filterGoals = (filters: GoalFilters): Goal[] => {
    return goals.filter(goal => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = 
          goal.title.toLowerCase().includes(searchLower) ||
          goal.description?.toLowerCase().includes(searchLower);
        
        if (!matchesSearch) return false;
      }

      // Status filter - would need progress calculation for each goal
      // For now, just return all for 'all' status
      if (filters.status === 'all') {
        return true;
      }

      return true;
    });
  };

  return {
    goals,
    loading,
    createGoal,
    updateGoal,
    deleteGoal,
    linkTaskToGoal,
    unlinkTaskFromGoal,
    getGoalProgress,
    filterGoals,
  };
};

/**
 * Calculate expected instances for a recurring task within a date range
 */
function calculateExpectedInstances(
  startDate: Date,
  endDate: Date,
  recurrence: string
): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  let count = 0;
  let current = new Date(start);

  while (current <= end) {
    count++;
    
    switch (recurrence) {
      case 'daily':
        current.setDate(current.getDate() + 1);
        break;
      case 'weekly':
        current.setDate(current.getDate() + 7);
        break;
      case 'monthly':
        current.setMonth(current.getMonth() + 1);
        break;
      default:
        current.setDate(current.getDate() + 1);
    }
  }

  return count;
}
