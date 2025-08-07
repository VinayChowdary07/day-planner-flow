
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { useGamification } from '@/hooks/useGamification';

export interface Subtask {
  id: string;
  title: string;
  status: 'complete' | 'incomplete';
  parent_task_id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface SubtaskProgress {
  has_subtasks: boolean;
  total_subtasks: number;
  completed_subtasks: number;
  progress_percentage: number | null;
}

export const useSubtasks = (parentTaskId: string) => {
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [progress, setProgress] = useState<SubtaskProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { awardXP, deductXP } = useGamification();

  const calculateProgress = useCallback((subtaskList: Subtask[]): SubtaskProgress => {
    const total = subtaskList.length;
    const completed = subtaskList.filter(s => s.status === 'complete').length;
    
    return {
      has_subtasks: total > 0,
      total_subtasks: total,
      completed_subtasks: completed,
      progress_percentage: total > 0 ? Math.round((completed / total) * 100) : null,
    };
  }, []);

  const fetchSubtasks = useCallback(async () => {
    if (!user || !parentTaskId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('parent_task_id', parentTaskId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const subtaskData = (data || []) as Subtask[];
      setSubtasks(subtaskData);
      setProgress(calculateProgress(subtaskData));
    } catch (error) {
      console.error('Error fetching subtasks:', error);
    } finally {
      setLoading(false);
    }
  }, [user, parentTaskId, calculateProgress]);

  useEffect(() => {
    fetchSubtasks();
  }, [fetchSubtasks]);

  // Real-time subscription for subtask changes
  useEffect(() => {
    if (!user || !parentTaskId) return;

    const channel = supabase
      .channel(`subtasks-${parentTaskId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `parent_task_id=eq.${parentTaskId}`,
        },
        (payload) => {
          console.log('Subtask real-time update:', payload);
          fetchSubtasks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, parentTaskId, fetchSubtasks]);

  const updateMainTaskStatus = useCallback(async (newProgress: SubtaskProgress) => {
    if (!user || !parentTaskId) return;

    try {
      // Get the main task details first
      const { data: mainTask, error: fetchError } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', parentTaskId)
        .single();

      if (fetchError || !mainTask) {
        console.error('Error fetching main task:', fetchError);
        return;
      }

      const wasComplete = mainTask.status === 'complete';
      const shouldBeComplete = newProgress.progress_percentage === 100;

      // Only update if status actually changed
      if (wasComplete !== shouldBeComplete) {
        const newStatus = shouldBeComplete ? 'complete' : 'incomplete';
        
        const { error: updateError } = await supabase
          .from('tasks')
          .update({ status: newStatus })
          .eq('id', parentTaskId);

        if (updateError) {
          console.error('Error updating main task status:', updateError);
          return;
        }

        // Handle XP changes
        if (shouldBeComplete && !wasComplete) {
          // Task became complete - award XP
          await awardXP(mainTask.priority as 'low' | 'medium' | 'high');
          toast({
            title: 'Task Completed!',
            description: 'All subtasks finished. XP awarded!',
          });
        } else if (!shouldBeComplete && wasComplete) {
          // Task became incomplete - deduct XP
          await deductXP(mainTask.priority as 'low' | 'medium' | 'high');
          toast({
            title: 'Task reverted to Incomplete',
            description: 'XP updated.',
            variant: 'destructive',
          });
        }

        console.log(`Main task ${parentTaskId} status updated to: ${newStatus}`);
      }
    } catch (error) {
      console.error('Error updating main task status:', error);
    }
  }, [user, parentTaskId, awardXP, deductXP]);

  const createSubtask = async (title: string) => {
    if (!user || !parentTaskId || !title.trim()) return;

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          title: title.trim(),
          parent_task_id: parentTaskId,
          user_id: user.id,
          status: 'incomplete',
          task_date: new Date().toISOString().split('T')[0],
          priority: 'medium',
          category: 'general',
          tags: [],
          order_position: subtasks.length,
        })
        .select()
        .single();

      if (error) throw error;

      const newSubtasks = [...subtasks, data as Subtask];
      setSubtasks(newSubtasks);
      const newProgress = calculateProgress(newSubtasks);
      setProgress(newProgress);
      
      // Update main task status if needed
      await updateMainTaskStatus(newProgress);

      toast({
        title: 'Success',
        description: 'Subtask created successfully',
      });

      return data;
    } catch (error) {
      console.error('Error creating subtask:', error);
      toast({
        title: 'Error',
        description: 'Failed to create subtask',
        variant: 'destructive',
      });
    }
  };

  const toggleSubtask = async (subtaskId: string) => {
    const subtask = subtasks.find(s => s.id === subtaskId);
    if (!subtask) return;

    const newStatus = subtask.status === 'complete' ? 'incomplete' : 'complete';

    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', subtaskId);

      if (error) throw error;

      const updatedSubtasks = subtasks.map(s =>
        s.id === subtaskId ? { ...s, status: newStatus } : s
      );
      
      setSubtasks(updatedSubtasks);
      const newProgress = calculateProgress(updatedSubtasks);
      setProgress(newProgress);
      
      // Update main task status based on new subtask progress
      await updateMainTaskStatus(newProgress);

    } catch (error) {
      console.error('Error toggling subtask:', error);
      toast({
        title: 'Error',
        description: 'Failed to update subtask',
        variant: 'destructive',
      });
    }
  };

  const deleteSubtask = async (subtaskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', subtaskId);

      if (error) throw error;

      const updatedSubtasks = subtasks.filter(s => s.id !== subtaskId);
      setSubtasks(updatedSubtasks);
      const newProgress = calculateProgress(updatedSubtasks);
      setProgress(newProgress);
      
      // Update main task status based on new subtask progress
      await updateMainTaskStatus(newProgress);

      toast({
        title: 'Success',
        description: 'Subtask deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting subtask:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete subtask',
        variant: 'destructive',
      });
    }
  };

  return {
    subtasks,
    progress,
    loading,
    createSubtask,
    toggleSubtask,
    deleteSubtask,
  };
};
