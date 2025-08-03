
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Clock, Target } from 'lucide-react';

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
    <div className="mt-3 space-y-3 p-3 bg-gradient-to-r from-muted/30 to-muted/20 rounded-lg border border-border/40">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isComplete ? (
            <CheckCircle2 className="h-4 w-4 text-success animate-in zoom-in-50 duration-300" />
          ) : (
            <Clock className="h-4 w-4 text-primary" />
          )}
          <span className="text-sm font-medium text-foreground">
            {isComplete ? 'All subtasks complete!' : 'Progress'}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge 
            variant={isComplete ? "default" : "secondary"} 
            className={`text-xs px-2 py-1 ${
              isComplete 
                ? 'bg-success text-success-foreground' 
                : 'bg-muted text-muted-foreground'
            }`}
          >
            <Target className="h-3 w-3 mr-1" />
            {progress.completed_subtasks}/{progress.total_subtasks}
          </Badge>
        </div>
      </div>
      
      <div className="space-y-2">
        <Progress 
          value={percentage} 
          className={`h-2 transition-all duration-500 ${
            isComplete ? 'bg-success/20' : ''
          }`}
        />
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            {percentage}% complete
          </span>
          {isComplete && (
            <span className="text-success font-medium animate-in slide-in-from-right-2 duration-300">
              🎉 Well done!
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
