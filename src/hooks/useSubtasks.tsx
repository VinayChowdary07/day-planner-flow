
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Task } from '@/types/task';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

interface SubtaskProgress {
  has_subtasks: boolean;
  total_subtasks: number;
  completed_subtasks: number;
  progress_percentage: number | null;
}

export const useSubtasks = (parentTaskId?: string) => {
  const [subtasks, setSubtasks] = useState<Task[]>([]);
  const [progress, setProgress] = useState<SubtaskProgress | null>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchSubtasks = useCallback(async () => {
    if (!user || !parentTaskId) {
      setSubtasks([]);
      setProgress(null);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('parent_task_id', parentTaskId)
        .order('order_position', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;

      setSubtasks((data || []) as Task[]);
      
      // Calculate progress
      await fetchProgress();
    } catch (error) {
      console.error('Error fetching subtasks:', error);
    } finally {
      setLoading(false);
    }
  }, [user, parentTaskId]);

  const fetchProgress = useCallback(async () => {
    if (!parentTaskId) return;

    try {
      const { data, error } = await supabase
        .rpc('calculate_task_progress', { task_id: parentTaskId });

      if (error) throw error;
      setProgress(data);
    } catch (error) {
      console.error('Error fetching task progress:', error);
    }
  }, [parentTaskId]);

  useEffect(() => {
    fetchSubtasks();
  }, [fetchSubtasks]);

  // Set up real-time subscription for subtasks
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
          
          if (payload.eventType === 'INSERT') {
            setSubtasks(prev => [payload.new as Task, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setSubtasks(prev => prev.map(task => 
              task.id === payload.new.id ? payload.new as Task : task
            ));
          } else if (payload.eventType === 'DELETE') {
            setSubtasks(prev => prev.filter(task => task.id !== payload.old.id));
          }
          
          // Refresh progress when subtasks change
          fetchProgress();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, parentTaskId, fetchProgress]);

  const createSubtask = async (subtaskData: Partial<Task>) => {
    if (!user || !parentTaskId || !subtaskData.title) return;

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          title: subtaskData.title,
          description: subtaskData.description || null,
          task_date: subtaskData.task_date || new Date().toISOString().split('T')[0],
          user_id: user.id,
          parent_task_id: parentTaskId,
          status: 'incomplete',
          priority: subtaskData.priority || 'medium',
          category: subtaskData.category || 'general',
          order_position: subtasks.length,
        })
        .select()
        .single();

      if (error) throw error;

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

  const updateSubtask = async (subtaskId: string, updates: Partial<Task>) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', subtaskId)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Subtask updated successfully',
      });

      return data;
    } catch (error) {
      console.error('Error updating subtask:', error);
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

  const toggleSubtaskComplete = async (subtaskId: string) => {
    const subtask = subtasks.find(t => t.id === subtaskId);
    if (!subtask) return;

    const newStatus = subtask.status === 'complete' ? 'incomplete' : 'complete';
    return updateSubtask(subtaskId, { status: newStatus });
  };

  return {
    subtasks,
    progress,
    loading,
    createSubtask,
    updateSubtask,
    deleteSubtask,
    toggleSubtaskComplete,
  };
};
