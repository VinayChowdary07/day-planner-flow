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

  const calculateProgress = useCallback((tasks: Task[]) => {
    if (tasks.length === 0) {
      setProgress(null);
      return;
    }

    const completedCount = tasks.filter(task => task.status === 'complete').length;
    const totalCount = tasks.length;
    const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
    
    setProgress({
      has_subtasks: true,
      total_subtasks: totalCount,
      completed_subtasks: completedCount,
      progress_percentage: percentage
    });
  }, []);

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

      const subtaskData = (data || []) as Task[];
      setSubtasks(subtaskData);
      calculateProgress(subtaskData);
    } catch (error) {
      console.error('Error fetching subtasks:', error);
    } finally {
      setLoading(false);
    }
  }, [user, parentTaskId, calculateProgress]);

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
            const newSubtask = payload.new as Task;
            setSubtasks(prev => {
              const updated = [newSubtask, ...prev];
              calculateProgress(updated);
              return updated;
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedSubtask = payload.new as Task;
            setSubtasks(prev => {
              const updated = prev.map(task => 
                task.id === updatedSubtask.id ? updatedSubtask : task
              );
              calculateProgress(updated);
              return updated;
            });
          } else if (payload.eventType === 'DELETE') {
            const deletedSubtask = payload.old as Task;
            setSubtasks(prev => {
              const updated = prev.filter(task => task.id !== deletedSubtask.id);
              calculateProgress(updated);
              return updated;
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, parentTaskId, calculateProgress]);

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
          tags: subtaskData.tags || [],
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
