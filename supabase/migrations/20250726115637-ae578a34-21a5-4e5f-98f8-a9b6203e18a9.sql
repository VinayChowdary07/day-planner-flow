-- Create goals table
CREATE TABLE public.goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  target_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

-- Create policies for goals
CREATE POLICY "Users can view their own goals" 
ON public.goals 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own goals" 
ON public.goals 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own goals" 
ON public.goals 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own goals" 
ON public.goals 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create goal_tasks junction table
CREATE TABLE public.goal_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(goal_id, task_id)
);

-- Enable RLS for goal_tasks
ALTER TABLE public.goal_tasks ENABLE ROW LEVEL SECURITY;

-- Create policies for goal_tasks
CREATE POLICY "Users can view their own goal_tasks" 
ON public.goal_tasks 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.goals 
    WHERE goals.id = goal_tasks.goal_id 
    AND goals.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create their own goal_tasks" 
ON public.goal_tasks 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.goals 
    WHERE goals.id = goal_tasks.goal_id 
    AND goals.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own goal_tasks" 
ON public.goal_tasks 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.goals 
    WHERE goals.id = goal_tasks.goal_id 
    AND goals.user_id = auth.uid()
  )
);

-- Add triggers for goals updated_at
CREATE TRIGGER update_goals_updated_at
BEFORE UPDATE ON public.goals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add parent_task_id for recurring task instances
ALTER TABLE public.tasks 
ADD COLUMN parent_task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE;

-- Add recurrence_end_date for recurring tasks
ALTER TABLE public.tasks 
ADD COLUMN recurrence_end_date DATE;

-- Add next_occurrence for tracking when to generate next instance
ALTER TABLE public.tasks 
ADD COLUMN next_occurrence TIMESTAMP WITH TIME ZONE;

-- Add is_template column to distinguish original recurring tasks from instances
ALTER TABLE public.tasks 
ADD COLUMN is_template BOOLEAN DEFAULT false;

-- Create indexes for performance
CREATE INDEX idx_goals_user_id ON public.goals(user_id);
CREATE INDEX idx_goal_tasks_goal_id ON public.goal_tasks(goal_id);
CREATE INDEX idx_goal_tasks_task_id ON public.goal_tasks(task_id);
CREATE INDEX idx_tasks_parent_task_id ON public.tasks(parent_task_id);
CREATE INDEX idx_tasks_next_occurrence ON public.tasks(next_occurrence) WHERE next_occurrence IS NOT NULL;

-- Enable realtime for goals
ALTER TABLE public.goals REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.goals;

-- Enable realtime for goal_tasks
ALTER TABLE public.goal_tasks REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.goal_tasks;