
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Project, ProjectFilters } from '@/types/project';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

export interface ProjectWithProgress extends Project {
  totalTasks: number;
  completedTasks: number;
  progressPercentage: number;
}

export const useProjects = () => {
  const [projects, setProjects] = useState<ProjectWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchProjectsWithProgress = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      console.log('Fetching projects with progress for user:', user.id);
      
      // Fetch projects
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (projectsError) throw projectsError;

      // For each project, calculate task progress
      const projectsWithProgress: ProjectWithProgress[] = await Promise.all(
        (projectsData || []).map(async (project) => {
          const { data: tasks, error: tasksError } = await supabase
            .from('tasks')
            .select('id, status')
            .eq('project_id', project.id)
            .eq('user_id', user.id)
            .is('parent_task_id', null); // Only main tasks

          if (tasksError) {
            console.error('Error fetching tasks for project:', project.id, tasksError);
            return {
              ...project,
              status: project.status as 'active' | 'completed' | 'archived',
              totalTasks: 0,
              completedTasks: 0,
              progressPercentage: 0,
            };
          }

          const totalTasks = tasks?.length || 0;
          const completedTasks = tasks?.filter(task => task.status === 'complete').length || 0;
          const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

          return {
            ...project,
            status: project.status as 'active' | 'completed' | 'archived',
            totalTasks,
            completedTasks,
            progressPercentage,
          };
        })
      );

      console.log('Fetched projects with progress:', projectsWithProgress.length);
      setProjects(projectsWithProgress);
    } catch (error) {
      console.error('Error fetching projects with progress:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch projects',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProjectsWithProgress();
  }, [fetchProjectsWithProgress]);

  // Enhanced real-time subscription with task updates
  useEffect(() => {
    if (!user) return;

    console.log('Setting up real-time subscriptions for projects and tasks');
    
    // Projects subscription
    const projectsChannel = supabase
      .channel('projects-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'projects',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Real-time project update:', payload.eventType, payload);
          fetchProjectsWithProgress(); // Refresh all projects with progress
        }
      )
      .subscribe();

    // Tasks subscription to update project progress when tasks change
    const tasksChannel = supabase
      .channel('tasks-realtime-projects')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Real-time task update affecting projects:', payload.eventType, payload);
          // Only refresh if the task has a project_id
          const taskData = payload.new as any || payload.old as any;
          if (taskData?.project_id) {
            fetchProjectsWithProgress(); // Refresh all projects with progress
          }
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up projects and tasks real-time subscriptions');
      supabase.removeChannel(projectsChannel);
      supabase.removeChannel(tasksChannel);
    };
  }, [user, fetchProjectsWithProgress]);

  const createProject = async (projectData: Partial<Project>) => {
    if (!user || !projectData.name) return;

    try {
      console.log('Creating project:', projectData);
      const { data, error } = await supabase
        .from('projects')
        .insert({
          name: projectData.name,
          description: projectData.description || null,
          color: projectData.color || '#3B82F6',
          status: projectData.status || 'active',
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      console.log('Project created successfully:', data);
      toast({
        title: 'Success',
        description: 'Project created successfully',
      });

      return data as Project;
    } catch (error) {
      console.error('Error creating project:', error);
      toast({
        title: 'Error',
        description: 'Failed to create project',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const updateProject = async (id: string, updates: Partial<Project>) => {
    try {
      console.log('Updating project:', id, 'with updates:', updates);
      const { data, error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      console.log('Project updated successfully:', data);
      toast({
        title: 'Success',
        description: 'Project updated successfully',
      });

      return data as Project;
    } catch (error) {
      console.error('Error updating project:', error);
      toast({
        title: 'Error',
        description: 'Failed to update project',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const deleteProject = async (id: string) => {
    try {
      console.log('Deleting project:', id);
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

      if (error) throw error;

      console.log('Project deleted successfully:', id);
      toast({
        title: 'Success',
        description: 'Project deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting project:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete project',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const filterProjects = (filters: ProjectFilters): ProjectWithProgress[] => {
    return projects.filter(project => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = 
          project.name.toLowerCase().includes(searchLower) ||
          project.description?.toLowerCase().includes(searchLower);
        
        if (!matchesSearch) return false;
      }

      // Status filter
      if (filters.status !== 'all' && project.status !== filters.status) {
        return false;
      }

      return true;
    });
  };

  return {
    projects,
    loading,
    createProject,
    updateProject,
    deleteProject,
    filterProjects,
  };
};
