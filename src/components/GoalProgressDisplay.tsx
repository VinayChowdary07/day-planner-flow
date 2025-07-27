
import { GoalProgress } from '@/types/goal';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Clock, Target, Infinity, TrendingUp } from 'lucide-react';

interface GoalProgressDisplayProps {
  progress: GoalProgress | null;
  loading: boolean;
  error: string | null;
}

export const GoalProgressDisplay = ({ progress, loading, error }: GoalProgressDisplayProps) => {
  if (loading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="h-4 w-24 bg-muted animate-pulse rounded"></div>
          <div className="h-4 w-16 bg-muted animate-pulse rounded"></div>
        </div>
        <div className="h-2 bg-muted animate-pulse rounded"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (!progress) {
    return (
      <div className="text-sm text-muted-foreground p-3 bg-muted/30 rounded-lg">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4" />
          <span>No progress data available</span>
        </div>
      </div>
    );
  }

  const getProgressText = () => {
    if (progress.hasInfiniteRecurring) {
      return `${progress.completedTasks} task${progress.completedTasks !== 1 ? 's' : ''} completed`;
    }
    return `${progress.completedTasks} of ${progress.totalTasks} tasks completed`;
  };

  const getProgressValue = () => {
    if (progress.hasInfiniteRecurring) return 0;
    return progress.percentage || 0;
  };

  const getProgressColor = () => {
    if (progress.hasInfiniteRecurring) return 'bg-blue-500';
    const percentage = progress.percentage || 0;
    if (percentage >= 100) return 'bg-green-500';
    if (percentage >= 70) return 'bg-blue-500';
    if (percentage >= 40) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  return (
    <div className="space-y-4">
      {/* Progress Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {progress.hasInfiniteRecurring ? (
            <div className="flex items-center gap-1 text-blue-600">
              <Infinity className="h-4 w-4" />
              <span className="text-sm font-medium">Ongoing Goal</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-green-600">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm font-medium">Progress</span>
            </div>
          )}
        </div>
        <Badge variant="secondary" className="text-xs">
          {getProgressText()}
        </Badge>
      </div>

      {/* Progress Bar or Infinite Indicator */}
      {progress.hasInfiniteRecurring ? (
        <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
            <Infinity className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">Continuous Progress</span>
          </div>
          <div className="ml-auto">
            <Badge className="bg-blue-600 text-white">
              {progress.completedTasks} completed
            </Badge>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="relative">
            <Progress 
              value={getProgressValue()} 
              className="h-3 transition-all duration-500 ease-in-out"
            />
            <div 
              className={`absolute inset-0 ${getProgressColor()} h-3 rounded-full transition-all duration-500 ease-in-out`}
              style={{ width: `${getProgressValue()}%` }}
            ></div>
          </div>
          
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground">0%</span>
            <div className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-green-500" />
              <span className="font-medium text-green-700">
                {progress.percentage || 0}%
              </span>
            </div>
            <span className="text-muted-foreground">100%</span>
          </div>
        </div>
      )}

      {/* Statistics Row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <div>
            <p className="text-xs text-green-700">Completed</p>
            <p className="text-lg font-bold text-green-800">{progress.completedTasks}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
          {progress.hasInfiniteRecurring ? (
            <>
              <Clock className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-xs text-blue-700">Recurring</p>
                <p className="text-lg font-bold text-blue-800">{progress.totalRecurringCompletions}</p>
              </div>
            </>
          ) : (
            <>
              <Target className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-xs text-blue-700">Total</p>
                <p className="text-lg font-bold text-blue-800">{progress.totalTasks}</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
