
import { useState, useEffect } from 'react';
import { Goal, GoalProgress } from '@/types/goal';
import { Task } from '@/types/task';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Infinity, Target, Calendar, CheckCircle2, Edit, Trash2, Clock, ChevronDown, ChevronUp, List } from 'lucide-react';
import { useGoals } from '@/hooks/useGoals';
import { supabase } from '@/integrations/supabase/client';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface GoalCardProps {
  goal: Goal;
  onEdit?: (goal: Goal) => void;
  onDelete?: (goalId: string) => void;
}

export const GoalCard = ({ goal, onEdit, onDelete }: GoalCardProps) => {
  const [progress, setProgress] = useState<GoalProgress | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const { getGoalProgress, getGoalTasks } = useGoals();

  const fetchGoalData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch progress and tasks
      const [progressData, linkedTasks] = await Promise.all([
        getGoalProgress(goal.id),
        getGoalTasks(goal.id)
      ]);
      
      setProgress(progressData);
      setTasks(linkedTasks);
    } catch (err) {
      console.error('Error fetching goal data:', err);
      setError('Failed to load goal data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoalData();
  }, [goal.id]);

  // Listen for task changes that might affect this goal
  useEffect(() => {
    const channel = supabase
      .channel(`goal-${goal.id}-updates`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
        },
        () => {
          console.log('Task change detected for goal:', goal.id);
          fetchGoalData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'goal_tasks',
        },
        () => {
          console.log('Goal-task link change detected for goal:', goal.id);
          fetchGoalData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [goal.id]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString();
  };

  const getProgressText = () => {
    if (loading) return 'Loading...';
    if (error) return 'Error loading progress';
    if (!progress) return 'No progress data';
    
    if (progress.hasInfiniteRecurring) {
      return `${progress.completedTasks} completed`;
    }
    
    return `${progress.completedTasks} / ${progress.totalTasks} completed`;
  };

  const getProgressValue = () => {
    if (!progress || progress.hasInfiniteRecurring) return 0;
    return progress.percentage || 0;
  };

  const getTaskStatusColor = (status: string) => {
    return status === 'complete' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800';
  };

  const formatTaskDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString([], {
      month: 'short',
      day: 'numeric'
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'low': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
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
              {progress?.percentage !== null && (
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0%</span>
                  <span className="font-medium">{progress?.percentage}%</span>
                  <span>100%</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Linked Tasks Section */}
        {tasks.length > 0 && (
          <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
            <CollapsibleTrigger asChild>
              <Button 
                variant="ghost" 
                className="w-full justify-between p-2 h-auto"
                size="sm"
              >
                <div className="flex items-center gap-2">
                  <List className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">
                    Linked Tasks ({tasks.length})
                  </span>
                </div>
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 mt-2">
              {tasks.map((task) => (
                <div 
                  key={task.id} 
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-md border"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className={`text-sm font-medium truncate ${
                        task.status === 'complete' ? 'line-through text-muted-foreground' : ''
                      }`}>
                        {task.title}
                      </p>
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${getPriorityColor(task.priority)}`}
                      >
                        {task.priority}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>{formatTaskDate(task.task_date)}</span>
                      {task.recurrence && task.recurrence !== 'none' && (
                        <Badge variant="outline" className="text-xs">
                          {task.recurrence}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Badge 
                    variant="secondary" 
                    className={`text-xs ${getTaskStatusColor(task.status)}`}
                  >
                    {task.status}
                  </Badge>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}

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
            <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
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
                {progress.totalRecurringCompletions} recurring
              </Badge>
            )}

            {tasks.length > 0 && (
              <Badge variant="outline" className="text-xs">
                <List className="h-3 w-3 mr-1" />
                {tasks.length} linked
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
