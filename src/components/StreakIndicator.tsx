
import { Badge } from '@/components/ui/badge';
import { useGamification } from '@/hooks/useGamification';
import { Flame } from 'lucide-react';

interface StreakIndicatorProps {
  className?: string;
}

export const StreakIndicator = ({ className }: StreakIndicatorProps) => {
  const { userStats, loading } = useGamification();

  if (loading || !userStats || userStats.current_streak === 0) {
    return null;
  }

  return (
    <Badge 
      variant="outline" 
      className={`flex items-center gap-1 bg-orange-50 border-orange-200 text-orange-800 dark:bg-orange-950 dark:border-orange-800 dark:text-orange-200 ${className}`}
    >
      <Flame className="h-3 w-3" />
      {userStats.current_streak} day{userStats.current_streak !== 1 ? 's' : ''}
    </Badge>
  );
};
