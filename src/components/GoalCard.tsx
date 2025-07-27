
import { useState, useEffect } from 'react';
import { Goal, GoalProgress } from '@/types/goal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Infinity, Target, Calendar, CheckCircle2, Edit, Trash2, Clock } from 'lucide-react';
import { useGoals } from '@/hooks/useGoals';

interface GoalCardProps {
  goal: Goal;
  onEdit?: (goal: Goal) => void;
  onDelete?: (goalId: string) => void;
}

export const GoalCard = ({ goal, onEdit, onDelete }: GoalCardProps) => {
  const [progress, setProgress] = useState<GoalProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getGoalProgress } = useGoals();

  useEffect(() => {
    const fetchProgress = async () => {
      setLoading(true);
      setError(null);
      try {
        const progressData = await getGoalProgress(goal.id);
        setProgress(progressData);
      } catch (err) {
        console.error('Error fetching goal progress:', err);
        setError('Failed to load progress');
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
  }, [goal.id, getGoalProgress]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString();
  };

  const getProgressText = () => {
    if (loading) return 'Loading...';
    if (error) return 'Error loading progress';
    if (!progress) return 'No progress data';
    
    if (progress.hasInfiniteRecurring) {
      return `${progress.completedTasks} completed / ∞`;
    }
    
    return `${progress.completedTasks} / ${progress.totalTasks} completed`;
  };

  const getProgressValue = () => {
    if (!progress || progress.hasInfiniteRecurring) return 0;
    return progress.percentage || 0;
  };

  const getProgressPercentage = () => {
    if (!progress || progress.hasInfiniteRecurring) return null;
    return progress.percentage;
  };

  const getPriorityColor = () => {
    if (!progress) return 'bg-gray-100 text-gray-700';
    if (progress.percentage === 100) return 'bg-green-100 text-green-700';
    if (progress.percentage && progress.percentage > 50) return 'bg-blue-100 text-blue-700';
    return 'bg-yellow-100 text-yellow-700';
  };

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Target className="h-4 w-4 text-blue-500" />
              <CardTitle className="text-base font-medium">{goal.title}</CardTitle>
            </div>
            {goal.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {goal.description}
              </p>
            )}
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {progress?.hasInfiniteRecurring ? (
                <Infinity className="h-4 w-4 text-blue-500" />
              ) : (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              )}
              <span className="text-sm font-medium">Progress</span>
            </div>
            <span className="text-sm text-muted-foreground">
              {getProgressText()}
            </span>
          </div>
          
          {progress?.hasInfiniteRecurring ? (
            <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-md">
              <Infinity className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Ongoing Goal</span>
            </div>
          ) : (
            <>
              <Progress 
                value={getProgressValue()} 
                className="h-2"
              />
              {getProgressPercentage() !== null && (
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0%</span>
                  <span className="font-medium">{getProgressPercentage()}%</span>
                  <span>100%</span>
                </div>
              )}
            </>
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
        {progress && !error && (
          <div className="flex gap-2 flex-wrap">
            <Badge variant="secondary" className={`text-xs ${getPriorityColor()}`}>
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
                <Clock className="h-3 w-3 mr-1" />
                {progress.totalRecurringCompletions} occurrences
              </Badge>
            )}
          </div>
        )}

        {/* Status indicator */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-xs font-medium text-muted-foreground">Active</span>
          </div>
          <span className="text-xs text-muted-foreground">
            Created {formatDate(goal.created_at)}
          </span>
        </div>

        {/* Error State */}
        {error && (
          <div className="text-sm text-destructive bg-destructive/10 p-2 rounded-md">
            {error}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
