import { useState, useEffect } from 'react';
import { Goal, GoalProgress } from '@/types/goal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Infinity, Target, Calendar, CheckCircle2, Edit, Trash2 } from 'lucide-react';
import { useGoals } from '@/hooks/useGoals';

interface GoalCardProps {
  goal: Goal;
  onEdit?: (goal: Goal) => void;
  onDelete?: (goalId: string) => void;
}

export const GoalCard = ({ goal, onEdit, onDelete }: GoalCardProps) => {
  const [progress, setProgress] = useState<GoalProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const { getGoalProgress } = useGoals();

  useEffect(() => {
    const fetchProgress = async () => {
      setLoading(true);
      const progressData = await getGoalProgress(goal.id);
      setProgress(progressData);
      setLoading(false);
    };

    fetchProgress();
  }, [goal.id, getGoalProgress]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString();
  };

  const getProgressText = () => {
    if (!progress) return 'Loading...';
    
    if (progress.hasInfiniteRecurring) {
      return `${progress.completedTasks} completed / ∞`;
    }
    
    return `${progress.completedTasks} / ${progress.totalTasks} completed`;
  };

  const getProgressValue = () => {
    if (!progress || progress.hasInfiniteRecurring) return 0;
    return progress.percentage || 0;
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{goal.title}</CardTitle>
            {goal.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {goal.description}
              </p>
            )}
          </div>
          <div className="flex gap-1 ml-2">
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(goal)}
                className="h-8 w-8 p-0"
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(goal.id)}
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1">
              {progress?.hasInfiniteRecurring ? (
                <Infinity className="h-4 w-4" />
              ) : (
                <Target className="h-4 w-4" />
              )}
              Progress
            </span>
            <span className="font-medium">
              {loading ? 'Loading...' : getProgressText()}
            </span>
          </div>
          
          {progress?.hasInfiniteRecurring ? (
            <div className="bg-secondary rounded-full h-4 flex items-center px-3">
              <div className="flex items-center gap-2 text-xs font-medium">
                <Infinity className="h-3 w-3" />
                <span>Ongoing Goal</span>
              </div>
            </div>
          ) : (
            <Progress 
              value={getProgressValue()} 
              className="h-3"
            />
          )}
          
          {!progress?.hasInfiniteRecurring && progress?.percentage !== null && (
            <p className="text-xs text-muted-foreground text-right">
              {progress.percentage}% complete
            </p>
          )}
        </div>

        {/* Date Range */}
        {(goal.start_date || goal.end_date) && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>
              {goal.start_date && formatDate(goal.start_date)}
              {goal.start_date && goal.end_date && ' - '}
              {goal.end_date && formatDate(goal.end_date)}
            </span>
          </div>
        )}

        {/* Task Metrics */}
        {progress && (
          <div className="flex gap-2 flex-wrap">
            <Badge variant="secondary" className="text-xs">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              {progress.completedTasks} completed
            </Badge>
            
            {!progress.hasInfiniteRecurring && (
              <Badge variant="outline" className="text-xs">
                <Target className="h-3 w-3 mr-1" />
                {progress.totalTasks} total
              </Badge>
            )}
            
            {progress.hasInfiniteRecurring && progress.totalRecurringCompletions > 0 && (
              <Badge variant="outline" className="text-xs">
                <Infinity className="h-3 w-3 mr-1" />
                {progress.totalRecurringCompletions} occurrences
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};