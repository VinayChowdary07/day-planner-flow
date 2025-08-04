
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useGamification } from '@/hooks/useGamification';
import { Trophy, Flame, Star, TrendingUp } from 'lucide-react';

export const GameStats = () => {
  const { userStats, loading, getXPForNextLevel } = useGamification();
  const [xpForNextLevel, setXpForNextLevel] = useState(0);
  const [xpProgress, setXpProgress] = useState(0);

  useEffect(() => {
    if (userStats && !loading) {
      const fetchXpInfo = async () => {
        const nextLevelXp = await getXPForNextLevel(userStats.level);
        const currentLevelXp = userStats.level === 1 ? 0 : await getXPForNextLevel(userStats.level - 1);
        
        setXpForNextLevel(nextLevelXp);
        
        if (nextLevelXp > currentLevelXp) {
          const progress = ((userStats.total_xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100;
          setXpProgress(Math.min(progress, 100));
        } else {
          setXpProgress(100);
        }
      };

      fetchXpInfo();
    }
  }, [userStats, loading, getXPForNextLevel]);

  if (loading || !userStats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-muted rounded w-16"></div>
              <div className="h-4 w-4 bg-muted rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-12 mb-1"></div>
              <div className="h-3 bg-muted rounded w-20"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Level & XP */}
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">
            Level & XP
          </CardTitle>
          <Star className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-2">
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
              Level {userStats.level}
            </div>
            <Badge variant="outline" className="text-xs">
              {userStats.total_xp} XP
            </Badge>
          </div>
          <div className="space-y-1">
            <Progress value={xpProgress} className="h-2" />
            <p className="text-xs text-blue-600 dark:text-blue-400">
              {xpForNextLevel - userStats.total_xp} XP to next level
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Current Streak */}
      <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-300">
            Current Streak
          </CardTitle>
          <Flame className="h-4 w-4 text-orange-600 dark:text-orange-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
            {userStats.current_streak} {userStats.current_streak > 0 ? '🔥' : ''}
          </div>
          <p className="text-xs text-orange-600 dark:text-orange-400">
            {userStats.current_streak > 0 ? 'Days in a row!' : 'Complete a task to start'}
          </p>
        </CardContent>
      </Card>

      {/* Longest Streak */}
      <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">
            Best Streak
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-900 dark:text-green-100">
            {userStats.longest_streak}
          </div>
          <p className="text-xs text-green-600 dark:text-green-400">
            Personal best
          </p>
        </CardContent>
      </Card>

      {/* Total XP */}
      <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">
            Total Experience
          </CardTitle>
          <Trophy className="h-4 w-4 text-purple-600 dark:text-purple-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
            {userStats.total_xp.toLocaleString()}
          </div>
          <p className="text-xs text-purple-600 dark:text-purple-400">
            Experience points earned
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
