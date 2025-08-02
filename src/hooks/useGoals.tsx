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
      console.log('Fetching goals for user:', user.id);
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      console.log('Fetched goals:', data?.length || 0);
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

  // Enhanced real-time subscription for goals and related tables
  useEffect(() => {
    if (!user) return;

    console.log('Setting up real-time subscriptions for goals');
    
    const channel = supabase
      .channel('goals-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'goals',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Real-time goal update:', payload.eventType, payload);
          
          if (payload.eventType === 'INSERT') {
            console.log('Goal inserted:', payload.new);
            setGoals(prev => [payload.new as Goal, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            console.log('Goal updated:', payload.new);
            setGoals(prev => prev.map(goal => 
              goal.id === payload.new.id ? payload.new as Goal : goal
            ));
          } else if (payload.eventType === 'DELETE') {
            console.log('Goal deleted:', payload.old);
            setGoals(prev => prev.filter(goal => goal.id !== payload.old.id));
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'goal_tasks',
        },
        (payload) => {
          console.log('Goal tasks relationship changed:', payload.eventType, payload);
          // Trigger a refetch of goals when goal-task relationships change
          // This ensures goal progress calculations stay up to date
          fetchGoals();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Task changed (affects goal progress):', payload.eventType, payload);
          // When tasks change, it affects goal progress, so we need to update
          // This is especially important for task status changes
          fetchGoals();
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up goals real-time subscriptions');
      supabase.removeChannel(channel);
    };
  }, [user, fetchGoals]);

  const createGoal = async (goalData: Partial<Goal>) => {
    if (!user || !goalData.title) return;

    try {
      console.log('Creating goal:', goalData);
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

      console.log('Goal created successfully:', data);
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
    if (!id) {
      console.error('No goal ID provided for update');
      return;
    }

    try {
      const cleanUpdates: any = {};
      
      if (updates.title !== undefined) cleanUpdates.title = updates.title;
      if (updates.description !== undefined) cleanUpdates.description = updates.description || null;
      if (updates.start_date !== undefined) cleanUpdates.start_date = updates.start_date || null;
      if (updates.end_date !== undefined) cleanUpdates.end_date = updates.end_date || null;
      if (updates.target_count !== undefined) cleanUpdates.target_count = updates.target_count || null;

      console.log('Updating goal:', id, 'with clean updates:', cleanUpdates);

      const { data, error } = await supabase
        .from('goals')
        .update(cleanUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      console.log('Goal updated successfully:', data);
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
      console.log('Deleting goal:', id);
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', id);

      if (error) throw error;

      console.log('Goal deleted successfully:', id);
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
      console.log('Linking task to goal:', taskId, '->', goalId);
      const { error } = await supabase
        .from('goal_tasks')
        .insert({
          goal_id: goalId,
          task_id: taskId,
        });

      if (error) throw error;

      console.log('Task linked to goal successfully');
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
      console.log('Unlinking task from goal:', taskId, 'from', goalId);
      const { error } = await supabase
        .from('goal_tasks')
        .delete()
        .eq('goal_id', goalId)
        .eq('task_id', taskId);

      if (error) throw error;

      console.log('Task unlinked from goal successfully');
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

  const getGoalTasks = async (goalId: string): Promise<Task[]> => {
    try {
      console.log('Fetching tasks for goal:', goalId);
      
      // First, get all tasks that have the goal_id directly set
      const { data: directTasks, error: directError } = await supabase
        .from('tasks')
        .select('*')
        .eq('goal_id', goalId);

      if (directError) {
        console.error('Error fetching direct tasks:', directError);
      }

      // Then, get tasks linked through goal_tasks junction table
      const { data: linkedTasks, error: linkedError } = await supabase
        .from('goal_tasks')
        .select(`
          task_id,
          tasks (*)
        `)
        .eq('goal_id', goalId);

      if (linkedError) {
        console.error('Error fetching linked tasks:', linkedError);
      }

      // Combine both results
      const allTasks: Task[] = [];
      
      // Add direct tasks with proper type casting
      if (directTasks) {
        allTasks.push(...directTasks.map(task => ({
          ...task,
          status: task.status as 'complete' | 'incomplete',
          priority: task.priority as 'low' | 'medium' | 'high',
          recurrence: task.recurrence as 'none' | 'daily' | 'weekly' | 'monthly'
        })));
      }

      // Add linked tasks (avoiding duplicates) with proper type casting
      if (linkedTasks) {
        const linkedTasksData = linkedTasks
          .map(lt => lt.tasks)
          .filter(Boolean)
          .filter(task => !allTasks.find(t => t.id === task.id))
          .map(task => ({
            ...task,
            status: task.status as 'complete' | 'incomplete',
            priority: task.priority as 'low' | 'medium' | 'high',
            recurrence: task.recurrence as 'none' | 'daily' | 'weekly' | 'monthly'
          })) as Task[];
        
        allTasks.push(...linkedTasksData);
      }

      console.log(`Found ${allTasks.length} tasks for goal ${goalId}:`, allTasks);
      return allTasks;
    } catch (error) {
      console.error('Error fetching goal tasks:', error);
      return [];
    }
  };

  const getGoalProgress = async (goalId: string): Promise<GoalProgress | null> => {
    if (!user) return null;

    try {
      console.log('Calculating progress for goal:', goalId);
      
      const { data: goal, error: goalError } = await supabase
        .from('goals')
        .select('*')
        .eq('id', goalId)
        .single();

      if (goalError) {
        console.error('Error fetching goal:', goalError);
        throw goalError;
      }

      const tasks = await getGoalTasks(goalId);
      
      // Simple calculation: completed tasks / total tasks
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(task => task.status === 'complete').length;
      
      // Check if any tasks are recurring for the infinite indicator
      const hasInfiniteRecurring = tasks.some(task => task.recurrence && task.recurrence !== 'none');
      
      // Count recurring completions for display purposes
      const totalRecurringCompletions = tasks.filter(task => 
        task.recurrence && task.recurrence !== 'none' && task.status === 'complete'
      ).length;

      // Calculate percentage: if no tasks, show 0%; otherwise show actual percentage
      const percentage = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

      const progress = {
        goal,
        totalTasks,
        completedTasks,
        totalRecurringCompletions,
        hasInfiniteRecurring,
        percentage,
      };

      console.log(`Progress for goal ${goalId}:`, progress);
      return progress;
    } catch (error) {
      console.error('Error calculating goal progress:', error);
      return null;
    }
  };

  const filterGoals = (filters: GoalFilters): Goal[] => {
    return goals.filter(goal => {
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = 
          goal.title.toLowerCase().includes(searchLower) ||
          goal.description?.toLowerCase().includes(searchLower);
        
        if (!matchesSearch) return false;
      }

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
    getGoalTasks,
    filterGoals,
  };
};
