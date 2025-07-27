
import { useState, useEffect } from 'react';
import { Goal, GoalProgress } from '@/types/goal';
import { Task } from '@/types/task';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Target, Calendar, Edit, Trash2, List, ChevronDown, ChevronUp } from 'lucide-react';
import { useGoals } from '@/hooks/useGoals';
import { supabase } from '@/integrations/supabase/client';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { GoalProgressDisplay } from '@/components/GoalProgressDisplay';
import { GoalTaskPreview } from '@/components/GoalTaskPreview';

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

  // Enhanced real-time subscription for immediate updates
  useEffect(() => {
    const channel = supabase
      .channel(`goal-${goal.id}-enhanced-updates`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
        },
        (payload) => {
          console.log('Task change detected for goal:', goal.id, payload);
          // Immediate refresh for any task changes
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
        (payload) => {
          console.log('Goal-task link change detected for goal:', goal.id, payload);
          // Immediate refresh for goal-task associations
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
    return new Date(dateString).toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getGoalStatusColor = () => {
    if (!progress) return 'border-l-gray-400';
    
    if (progress.hasInfiniteRecurring) {
      return 'border-l-blue-500';
    }
    
    const percentage = progress.percentage || 0;
    if (percentage >= 100) return 'border-l-green-500';
    if (percentage >= 70) return 'border-l-blue-500';
    if (percentage >= 40) return 'border-l-yellow-500';
    return 'border-l-orange-500';
  };

  const getGoalStatusText = () => {
    if (!progress) return 'No Progress';
    
    if (progress.hasInfiniteRecurring) {
      return 'Ongoing';
    }
    
    const percentage = progress.percentage || 0;
    if (percentage >= 100) return 'Completed';
    if (percentage >= 70) return 'Nearly Done';
    if (percentage >= 40) return 'In Progress';
    return 'Getting Started';
  };

  const getGoalStatusBadgeColor = () => {
    if (!progress) return 'bg-gray-100 text-gray-700';
    
    if (progress.hasInfiniteRecurring) {
      return 'bg-blue-100 text-blue-700';
    }
    
    const percentage = progress.percentage || 0;
    if (percentage >= 100) return 'bg-green-100 text-green-700';
    if (percentage >= 70) return 'bg-blue-100 text-blue-700';
    if (percentage >= 40) return 'bg-yellow-100 text-yellow-700';
    return 'bg-orange-100 text-orange-700';
  };

  return (
    <Card className={`group hover:shadow-xl transition-all duration-300 border-l-4 ${getGoalStatusColor()} bg-gradient-to-br from-white to-gray-50/50`}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Target className="h-5 w-5 text-blue-500" />
              <CardTitle className="text-lg font-semibold">{goal.title}</CardTitle>
              <Badge 
                variant="secondary" 
                className={`text-xs font-medium ${getGoalStatusBadgeColor()}`}
              >
                {getGoalStatusText()}
              </Badge>
            </div>
            {goal.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 ml-8">
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
                className="h-8 w-8 p-0 hover:bg-blue-100"
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(goal.id)}
                className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-red-100"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Enhanced Progress Display */}
        <GoalProgressDisplay 
          progress={progress}
          loading={loading}
          error={error}
        />

        {/* Task Preview Section */}
        {tasks.length > 0 && (
          <div className="border-t pt-4">
            <GoalTaskPreview tasks={tasks} maxPreview={2} />
          </div>
        )}

        {/* Expandable Full Task List */}
        {tasks.length > 2 && (
          <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
            <CollapsibleTrigger asChild>
              <Button 
                variant="ghost" 
                className="w-full justify-between p-3 h-auto hover:bg-muted/50 transition-colors"
                size="sm"
              >
                <div className="flex items-center gap-2">
                  <List className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">
                    View All Tasks ({tasks.length})
                  </span>
                </div>
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 mt-3">
              <div className="grid gap-2">
                {tasks.slice(2).map((task) => (
                  <Card key={task.id} className="p-3 bg-muted/20 border-muted">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className={`text-sm font-medium truncate ${
                            task.status === 'complete' ? 'line-through text-muted-foreground' : ''
                          }`}>
                            {task.title}
                          </p>
                          <Badge 
                            variant="outline" 
                            className="text-xs"
                          >
                            {task.priority}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(task.task_date)}</span>
                          {task.recurrence && task.recurrence !== 'none' && (
                            <Badge variant="outline" className="text-xs">
                              {task.recurrence}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ml-2 ${
                          task.status === 'complete' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-orange-100 text-orange-800'
                        }`}
                      >
                        {task.status}
                      </Badge>
                    </div>
                  </Card>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Goal Date Range */}
        {(goal.start_date || goal.end_date) && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t">
            <Calendar className="h-4 w-4" />
            <span>
              {goal.start_date && formatDate(goal.start_date)}
              {goal.start_date && goal.end_date && ' → '}
              {goal.end_date && formatDate(goal.end_date)}
            </span>
          </div>
        )}

        {/* Footer with creation date */}
        <div className="flex items-center justify-between pt-3 border-t text-xs text-muted-foreground">
          <span>Created {formatDate(goal.created_at)}</span>
          {tasks.length > 0 && (
            <span>{tasks.length} task{tasks.length !== 1 ? 's' : ''} linked</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
