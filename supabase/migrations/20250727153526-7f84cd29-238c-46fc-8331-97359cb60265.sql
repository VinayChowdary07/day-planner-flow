
-- Add goal_id column to tasks table if it doesn't exist
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS goal_id UUID;

-- Add foreign key constraint for goal_id
ALTER TABLE public.tasks ADD CONSTRAINT fk_tasks_goal_id 
FOREIGN KEY (goal_id) REFERENCES public.goals(id) ON DELETE SET NULL;

-- Enable real-time updates for all tables
ALTER TABLE public.tasks REPLICA IDENTITY FULL;
ALTER TABLE public.projects REPLICA IDENTITY FULL;
ALTER TABLE public.goals REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.projects;
ALTER PUBLICATION supabase_realtime ADD TABLE public.goals;
