
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle } from 'lucide-react';

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

  return (
    <div className="mt-2 space-y-2">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3 text-green-500" />
          <span className="text-muted-foreground">Subtasks</span>
        </div>
        <Badge variant="outline" className="text-xs">
          {progress.completed_subtasks}/{progress.total_subtasks}
        </Badge>
      </div>
      
      <div className="space-y-1">
        <Progress value={percentage} className="h-1.5" />
        <div className="text-center text-xs text-muted-foreground">
          {percentage}% complete
        </div>
      </div>
    </div>
  );
};
