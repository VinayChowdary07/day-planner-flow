
-- Add goal_id column to tasks table to link tasks with goals
ALTER TABLE public.tasks 
ADD COLUMN goal_id uuid REFERENCES public.goals(id) ON DELETE SET NULL;

-- Update the existing tasks table to enable realtime if not already enabled
ALTER TABLE public.tasks REPLICA IDENTITY FULL;
