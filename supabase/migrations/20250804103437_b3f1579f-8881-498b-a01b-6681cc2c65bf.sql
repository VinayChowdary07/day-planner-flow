
-- Create user stats table to track XP, level, and streaks
CREATE TABLE public.user_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL UNIQUE,
  total_xp INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_task_completed_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create achievements table to define available badges
CREATE TABLE public.achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key VARCHAR(50) NOT NULL UNIQUE,
  title VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(10) NOT NULL,
  requirement_type VARCHAR(50) NOT NULL, -- 'tasks_completed', 'streak_days', 'xp_earned', 'goals_completed'
  requirement_value INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user achievements table to track earned badges
CREATE TABLE public.user_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  achievement_id UUID REFERENCES public.achievements NOT NULL,
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- Enable RLS on all new tables
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_stats
CREATE POLICY "Users can view their own stats" 
  ON public.user_stats 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own stats" 
  ON public.user_stats 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stats" 
  ON public.user_stats 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- RLS policies for achievements (read-only for all authenticated users)
CREATE POLICY "All users can view achievements" 
  ON public.achievements 
  FOR SELECT 
  TO authenticated
  USING (true);

-- RLS policies for user_achievements
CREATE POLICY "Users can view their own achievements" 
  ON public.user_achievements 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own achievements" 
  ON public.user_achievements 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Insert default achievements
INSERT INTO public.achievements (key, title, description, icon, requirement_type, requirement_value) VALUES
('first_task', 'First Task Completed', 'Complete your very first task', '🎯', 'tasks_completed', 1),
('task_master_10', 'Task Master', 'Complete 10 tasks', '⭐', 'tasks_completed', 10),
('task_champion_50', 'Task Champion', 'Complete 50 tasks', '🏆', 'tasks_completed', 50),
('task_legend_100', 'Task Legend', 'Complete 100 tasks', '👑', 'tasks_completed', 100),
('streak_3', '3-Day Streak', 'Complete tasks for 3 consecutive days', '🔥', 'streak_days', 3),
('streak_7', '7-Day Streak', 'Complete tasks for 7 consecutive days', '🚀', 'streak_days', 7),
('streak_30', 'Month Warrior', 'Complete tasks for 30 consecutive days', '💪', 'streak_days', 30),
('xp_100', '100 XP Club', 'Earn 100 experience points', '✨', 'xp_earned', 100),
('xp_500', 'XP Expert', 'Earn 500 experience points', '💫', 'xp_earned', 500),
('xp_1000', 'XP Master', 'Earn 1000 experience points', '🌟', 'xp_earned', 1000),
('goals_5', '5 Goals Crushed', 'Complete 5 goals', '🎖️', 'goals_completed', 5),
('early_bird', 'Early Bird', 'Complete a task before 9 AM', '🐦', 'tasks_completed', 1);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_user_stats_updated_at 
  BEFORE UPDATE ON public.user_stats 
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

-- Create function to calculate level from XP
CREATE OR REPLACE FUNCTION public.calculate_level_from_xp(xp INTEGER)
RETURNS INTEGER
LANGUAGE SQL
IMMUTABLE
AS $$
  SELECT CASE 
    WHEN xp < 100 THEN 1
    WHEN xp < 250 THEN 2
    WHEN xp < 500 THEN 3
    WHEN xp < 1000 THEN 4
    WHEN xp < 2000 THEN 5
    ELSE 5 + ((xp - 2000) / 500)
  END;
$$;

-- Create function to get XP needed for next level
CREATE OR REPLACE FUNCTION public.get_xp_for_level(target_level INTEGER)
RETURNS INTEGER
LANGUAGE SQL
IMMUTABLE
AS $$
  SELECT CASE 
    WHEN target_level <= 1 THEN 0
    WHEN target_level = 2 THEN 100
    WHEN target_level = 3 THEN 250
    WHEN target_level = 4 THEN 500
    WHEN target_level = 5 THEN 1000
    ELSE 2000 + ((target_level - 5) * 500)
  END;
$$;
