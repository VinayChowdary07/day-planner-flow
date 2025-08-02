
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Project, ProjectFilters } from '@/types/project';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

export const useProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchProjects = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      console.log('Fetching projects for user:', user.id);
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      console.log('Fetched projects:', data?.length || 0);
      setProjects((data || []) as Project[]);
    } catch (error) {
      console.error('Error fetching projects:', error);
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
    fetchProjects();
  }, [fetchProjects]);

  // Enhanced real-time subscription with better event handling
  useEffect(() => {
    if (!user) return;

    console.log('Setting up real-time subscription for projects');
    const channel = supabase
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
          
          // Handle different event types for immediate UI updates
          if (payload.eventType === 'INSERT') {
            console.log('Project inserted:', payload.new);
            setProjects(prev => [payload.new as Project, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            console.log('Project updated:', payload.new);
            setProjects(prev => prev.map(project => 
              project.id === payload.new.id ? payload.new as Project : project
            ));
          } else if (payload.eventType === 'DELETE') {
            console.log('Project deleted:', payload.old);
            setProjects(prev => prev.filter(project => project.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up projects real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [user]);

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

  const filterProjects = (filters: ProjectFilters): Project[] => {
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
