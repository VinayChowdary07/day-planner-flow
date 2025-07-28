
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
    if (progress.totalTasks === 0) {
      return "No tasks assigned";
    }
    return `${progress.completedTasks} of ${progress.totalTasks} tasks completed`;
  };

  const getProgressValue = () => {
    return progress.percentage || 0;
  };

  const getProgressColor = () => {
    const percentage = progress.percentage || 0;
    if (percentage >= 100) return 'bg-green-500';
    if (percentage >= 70) return 'bg-blue-500';
    if (percentage >= 40) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  const getStatusBadge = () => {
    if (progress.totalTasks === 0) {
      return (
        <Badge variant="outline" className="text-xs">
          No tasks
        </Badge>
      );
    }
    
    if (progress.percentage === 100) {
      return (
        <Badge className="bg-green-600 text-white text-xs">
          Complete
        </Badge>
      );
    }
    
    return (
      <Badge variant="secondary" className="text-xs">
        {progress.percentage}% complete
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      {/* Progress Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {progress.hasInfiniteRecurring ? (
            <div className="flex items-center gap-1 text-blue-600">
              <Infinity className="h-4 w-4" />
              <span className="text-sm font-medium">Recurring Goal</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-green-600">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm font-medium">Progress</span>
            </div>
          )}
        </div>
        {getStatusBadge()}
      </div>

      {/* Progress Bar */}
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

      {/* Task Summary */}
      <div className="text-center text-sm text-muted-foreground">
        {getProgressText()}
      </div>

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
          <Target className="h-4 w-4 text-blue-600" />
          <div>
            <p className="text-xs text-blue-700">Total</p>
            <p className="text-lg font-bold text-blue-800">{progress.totalTasks}</p>
          </div>
        </div>
      </div>

      {/* Recurring Tasks Info */}
      {progress.hasInfiniteRecurring && progress.totalRecurringCompletions > 0 && (
        <div className="flex items-center gap-2 p-2 bg-purple-50 rounded-lg">
          <Clock className="h-4 w-4 text-purple-600" />
          <div>
            <p className="text-xs text-purple-700">Recurring Completions</p>
            <p className="text-lg font-bold text-purple-800">{progress.totalRecurringCompletions}</p>
          </div>
        </div>
      )}
    </div>
  );
};
