
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

export interface UserStats {
  id: string;
  user_id: string;
  total_xp: number;
  level: number;
  current_streak: number;
  longest_streak: number;
  last_task_completed_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface Achievement {
  id: string;
  key: string;
  title: string;
  description: string | null;
  icon: string;
  requirement_type: string;
  requirement_value: number;
  created_at: string;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  earned_at: string;
  achievement: Achievement;
}

export const useGamification = () => {
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Initialize user stats if they don't exist
  const initializeUserStats = useCallback(async () => {
    if (!user) return;

    try {
      const { data: existingStats, error: fetchError } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (fetchError && fetchError.code === 'PGRST116') {
        // User stats don't exist, create them
        const { data: newStats, error: createError } = await supabase
          .from('user_stats')
          .insert({
            user_id: user.id,
            total_xp: 0,
            level: 1,
            current_streak: 0,
            longest_streak: 0,
          })
          .select()
          .single();

        if (createError) throw createError;
        setUserStats(newStats as UserStats);
      } else if (!fetchError) {
        setUserStats(existingStats as UserStats);
      }
    } catch (error) {
      console.error('Error initializing user stats:', error);
    }
  }, [user]);

  // Fetch all achievements
  const fetchAchievements = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .order('requirement_value', { ascending: true });

      if (error) throw error;
      setAchievements(data as Achievement[]);
    } catch (error) {
      console.error('Error fetching achievements:', error);
    }
  }, []);

  // Fetch user achievements
  const fetchUserAchievements = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_achievements')
        .select(`
          *,
          achievement:achievements(*)
        `)
        .eq('user_id', user.id)
        .order('earned_at', { ascending: false });

      if (error) throw error;
      setUserAchievements(data as UserAchievement[]);
    } catch (error) {
      console.error('Error fetching user achievements:', error);
    }
  }, [user]);

  // Award XP for task completion
  const awardXP = useCallback(async (taskPriority: 'low' | 'medium' | 'high') => {
    if (!user || !userStats) return;

    const xpRewards = { low: 5, medium: 10, high: 15 };
    const xpToAward = xpRewards[taskPriority];
    const newTotalXP = userStats.total_xp + xpToAward;

    // Calculate new level
    const { data: levelData } = await supabase.rpc('calculate_level_from_xp', { xp: newTotalXP });
    const newLevel = levelData || 1;

    // Update streak
    const today = new Date().toISOString().split('T')[0];
    const lastCompletedDate = userStats.last_task_completed_date;
    
    let newStreak = userStats.current_streak;
    if (lastCompletedDate) {
      const lastDate = new Date(lastCompletedDate);
      const todayDate = new Date(today);
      const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        // Consecutive day
        newStreak += 1;
      } else if (diffDays > 1) {
        // Streak broken
        newStreak = 1;
      }
      // If diffDays === 0, it's the same day, keep current streak
    } else {
      // First task ever
      newStreak = 1;
    }

    const newLongestStreak = Math.max(userStats.longest_streak, newStreak);

    try {
      const { data: updatedStats, error } = await supabase
        .from('user_stats')
        .update({
          total_xp: newTotalXP,
          level: newLevel,
          current_streak: newStreak,
          longest_streak: newLongestStreak,
          last_task_completed_date: today,
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      setUserStats(updatedStats as UserStats);

      // Show XP toast immediately
      toast({
        title: `+${xpToAward} XP!`,
        description: `Task completed! Total XP: ${newTotalXP}`,
      });

      // Show level up toast if applicable
      if (newLevel > userStats.level) {
        toast({
          title: '🎉 Level Up!',
          description: `Congratulations! You're now level ${newLevel}!`,
        });
      }

      // Check for new achievements asynchronously
      setTimeout(() => {
        checkAndAwardAchievements(newTotalXP, newStreak, newLevel);
      }, 0);

    } catch (error) {
      console.error('Error awarding XP:', error);
    }
  }, [user, userStats]);

  // Deduct XP for task unchecking
  const deductXP = useCallback(async (taskPriority: 'low' | 'medium' | 'high') => {
    if (!user || !userStats) return;

    const xpRewards = { low: 5, medium: 10, high: 15 };
    const xpToDeduct = xpRewards[taskPriority];
    const newTotalXP = Math.max(0, userStats.total_xp - xpToDeduct);

    // Calculate new level
    const { data: levelData } = await supabase.rpc('calculate_level_from_xp', { xp: newTotalXP });
    const newLevel = levelData || 1;

    // Check if we need to recalculate streak (only if this was the only task completed today)
    const today = new Date().toISOString().split('T')[0];
    let newStreak = userStats.current_streak;
    
    // Check if there are any other completed tasks today
    const { count } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'complete')
      .eq('task_date', today);

    // If no completed tasks remain for today, reset streak logic
    if ((count || 0) === 0) {
      // Get the previous day's completion status to determine streak
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      const { count: yesterdayCount } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'complete')
        .eq('task_date', yesterdayStr);

      if ((yesterdayCount || 0) > 0) {
        // Had tasks yesterday, so current streak should be reduced by 1
        newStreak = Math.max(0, userStats.current_streak - 1);
      } else {
        // No tasks yesterday either, reset streak
        newStreak = 0;
      }
    }

    try {
      const { data: updatedStats, error } = await supabase
        .from('user_stats')
        .update({
          total_xp: newTotalXP,
          level: newLevel,
          current_streak: newStreak,
          last_task_completed_date: (count || 0) > 0 ? today : null,
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      setUserStats(updatedStats as UserStats);

      // Show XP deduction toast
      toast({
        title: `-${xpToDeduct} XP`,
        description: `Task unchecked! Total XP: ${newTotalXP}`,
        variant: 'destructive',
      });

      // Show level down toast if applicable
      if (newLevel < userStats.level) {
        toast({
          title: 'Level Down',
          description: `You're now level ${newLevel}`,
          variant: 'destructive',
        });
      }

    } catch (error) {
      console.error('Error deducting XP:', error);
    }
  }, [user, userStats]);

  // Check and award achievements
  const checkAndAwardAchievements = useCallback(async (totalXP: number, streak: number, level: number) => {
    if (!user) return;

    // Get total completed tasks count
    const { count: tasksCount } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'complete');

    // Get total completed goals count
    const { count: goalsCount } = await supabase
      .from('goals')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    // Get current user achievements
    const earnedAchievementIds = userAchievements.map(ua => ua.achievement_id);

    // Check each achievement
    for (const achievement of achievements) {
      if (earnedAchievementIds.includes(achievement.id)) continue;

      let shouldAward = false;

      switch (achievement.requirement_type) {
        case 'tasks_completed':
          shouldAward = (tasksCount || 0) >= achievement.requirement_value;
          break;
        case 'streak_days':
          shouldAward = streak >= achievement.requirement_value;
          break;
        case 'xp_earned':
          shouldAward = totalXP >= achievement.requirement_value;
          break;
        case 'goals_completed':
          shouldAward = (goalsCount || 0) >= achievement.requirement_value;
          break;
      }

      if (shouldAward) {
        try {
          await supabase
            .from('user_achievements')
            .insert({
              user_id: user.id,
              achievement_id: achievement.id,
            });

          // Show achievement toast with celebration
          toast({
            title: `🏆 Achievement Unlocked!`,
            description: `${achievement.icon} ${achievement.title}`,
          });

          // Refresh user achievements
          await fetchUserAchievements();
        } catch (error) {
          console.error('Error awarding achievement:', error);
        }
      }
    }
  }, [user, achievements, userAchievements, fetchUserAchievements]);

  // Get XP needed for next level
  const getXPForNextLevel = useCallback(async (currentLevel: number) => {
    const { data } = await supabase.rpc('get_xp_for_level', { target_level: currentLevel + 1 });
    return data || 0;
  }, []);

  useEffect(() => {
    if (user) {
      initializeUserStats();
      fetchAchievements();
      fetchUserAchievements();
    }
  }, [user, initializeUserStats, fetchAchievements, fetchUserAchievements]);

  useEffect(() => {
    setLoading(false);
  }, [userStats, achievements, userAchievements]);

  return {
    userStats,
    achievements,
    userAchievements,
    loading,
    awardXP,
    deductXP,
    getXPForNextLevel,
    refreshStats: initializeUserStats,
  };
};
