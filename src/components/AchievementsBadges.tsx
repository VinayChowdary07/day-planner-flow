
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useGamification } from '@/hooks/useGamification';
import { Trophy, Lock } from 'lucide-react';

export const AchievementsBadges = () => {
  const { achievements, userAchievements, loading } = useGamification();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Achievements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const earnedAchievementIds = new Set(userAchievements.map(ua => ua.achievement_id));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Achievements ({userAchievements.length}/{achievements.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <div className="space-y-3">
            {achievements.map((achievement) => {
              const isEarned = earnedAchievementIds.has(achievement.id);
              const userAchievement = userAchievements.find(ua => ua.achievement_id === achievement.id);

              return (
                <div
                  key={achievement.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                    isEarned
                      ? 'bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950 dark:to-orange-950 border-yellow-200 dark:border-yellow-800'
                      : 'bg-muted/50 border-muted opacity-60'
                  }`}
                >
                  <div className={`text-2xl ${isEarned ? '' : 'grayscale'}`}>
                    {isEarned ? achievement.icon : <Lock className="h-6 w-6 text-muted-foreground" />}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className={`font-medium ${isEarned ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {achievement.title}
                      </h4>
                      {isEarned && (
                        <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">
                          Earned
                        </Badge>
                      )}
                    </div>
                    <p className={`text-xs ${isEarned ? 'text-muted-foreground' : 'text-muted-foreground/60'}`}>
                      {achievement.description}
                    </p>
                    {userAchievement && (
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                        Earned on {new Date(userAchievement.earned_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">
                      {achievement.requirement_type.replace('_', ' ')}
                    </div>
                    <div className="text-sm font-medium">
                      {achievement.requirement_value}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
