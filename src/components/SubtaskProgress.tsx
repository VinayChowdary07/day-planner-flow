
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Clock, Target, TrendingUp } from 'lucide-react';

interface SubtaskProgressProps {
  progress: {
    has_subtasks: boolean;
    total_subtasks: number;
    completed_subtasks: number;
    progress_percentage: number | null;
  } | null;
}

export const SubtaskProgress = ({ progress }: SubtaskProgressProps) => {
  if (!progress?.has_subtasks) {
    return null;
  }

  const percentage = progress.progress_percentage || 0;
  const isComplete = percentage === 100;

  return (
    <div className="space-y-4 p-4 bg-gradient-to-br from-primary/5 via-primary/3 to-transparent rounded-xl border border-primary/10 shadow-sm hover:shadow-md hover:shadow-primary/5 transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full transition-all duration-300 ${
            isComplete 
              ? 'bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-950/30 dark:to-emerald-950/30' 
              : 'bg-gradient-to-br from-primary/10 to-primary/5'
          }`}>
            {isComplete ? (
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 animate-in zoom-in-50 duration-500" />
            ) : (
              <Clock className="h-5 w-5 text-primary animate-pulse" />
            )}
          </div>
          <div>
            <h4 className={`font-semibold text-sm transition-colors duration-300 ${
              isComplete ? 'text-green-700 dark:text-green-400' : 'text-foreground'
            }`}>
              {isComplete ? '🎉 All subtasks complete!' : 'Subtask Progress'}
            </h4>
            <p className="text-xs text-muted-foreground">
              {isComplete ? 'Great job finishing everything!' : 'Keep going, you\'re doing great!'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge 
            variant="outline" 
            className={`text-xs font-medium px-3 py-1.5 transition-all duration-300 ${
              isComplete 
                ? 'bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border-green-200/60 dark:from-green-950/20 dark:to-emerald-950/20 dark:text-green-400 dark:border-green-800/30' 
                : 'bg-gradient-to-r from-primary/5 to-primary/10 text-primary border-primary/20'
            }`}
          >
            <Target className="h-3 w-3 mr-1.5" />
            {progress.completed_subtasks}/{progress.total_subtasks}
          </Badge>
        </div>
      </div>
      
      {/* Progress Bar Section */}
      <div className="space-y-3">
        <div className="relative">
          <Progress 
            value={percentage} 
            className={`h-3 transition-all duration-700 ${
              isComplete 
                ? 'bg-green-100 dark:bg-green-950/30' 
                : 'bg-primary/10'
            }`}
          />
          {/* Progress glow effect */}
          <div 
            className={`absolute top-0 h-full rounded-full transition-all duration-700 ${
              isComplete 
                ? 'bg-gradient-to-r from-green-400/20 to-emerald-400/20 shadow-lg shadow-green-400/20' 
                : 'bg-gradient-to-r from-primary/20 to-primary/30 shadow-lg shadow-primary/20'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className={`h-3.5 w-3.5 transition-colors duration-300 ${
              isComplete ? 'text-green-600 dark:text-green-400' : 'text-primary'
            }`} />
            <span className="text-xs font-medium text-muted-foreground">
              {percentage}% complete
            </span>
          </div>
          
          {isComplete && (
            <div className="flex items-center gap-1.5 animate-in slide-in-from-right-3 duration-500">
              <span className="text-xs font-medium text-green-600 dark:text-green-400">
                🌟 Excellent work!
              </span>
            </div>
          )}
          
          {!isComplete && percentage > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-primary font-medium">
                {progress.total_subtasks - progress.completed_subtasks} remaining
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
