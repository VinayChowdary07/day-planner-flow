
import { useState, useEffect } from 'react';
import { Goal, GoalProgress } from '@/types/goal';
import { Task } from '@/types/task';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Target, Calendar, Edit, Trash2, List, ChevronDown, ChevronUp, CheckCircle2, Clock, TrendingUp } from 'lucide-react';
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
  const [refreshKey, setRefreshKey] = useState(0);
  const { getGoalProgress, getGoalTasks } = useGoals();

  // Force refresh function
  const forceRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const fetchGoalData = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log(`Fetching data for goal: ${goal.id}`);
      
      const [progressData, linkedTasks] = await Promise.all([
        getGoalProgress(goal.id),
        getGoalTasks(goal.id)
      ]);
      
      console.log(`Goal ${goal.id} - Progress:`, progressData);
      console.log(`Goal ${goal.id} - Tasks:`, linkedTasks);
      
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
  }, [goal.id, refreshKey]);

  // Enhanced real-time subscription with immediate updates
  useEffect(() => {
    console.log(`Setting up real-time listeners for goal: ${goal.id}`);
    
    const channel = supabase
      .channel(`goal-${goal.id}-realtime`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
        },
        (payload) => {
          console.log(`Task change detected for goal ${goal.id}:`, payload);
          // Immediate refresh on any task change
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
          console.log(`Goal-task association change for goal ${goal.id}:`, payload);
          // Immediate refresh on goal-task associations
          fetchGoalData();
        }
      )
      .subscribe();

    return () => {
      console.log(`Cleaning up real-time listeners for goal: ${goal.id}`);
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
        {/* Real-time Task Statistics */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-700">Task Progress</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={forceRefresh}
              className="h-6 w-6 p-0 opacity-50 hover:opacity-100"
            >
              <TrendingUp className="h-3 w-3" />
            </Button>
          </div>
          
          {loading ? (
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-2 bg-gray-200 rounded animate-pulse"></div>
            </div>
          ) : error ? (
            <div className="text-red-600 text-sm">{error}</div>
          ) : progress ? (
            <div className="space-y-3">
              {/* Task Count Display */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">
                    {progress.completedTasks} of {progress.totalTasks} tasks completed
                  </span>
                </div>
                <Badge className="bg-blue-100 text-blue-800 text-xs">
                  {tasks.length} total
                </Badge>
              </div>

              {/* Progress Bar */}
              {!progress.hasInfiniteRecurring && (
                <div className="space-y-2">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-2.5 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${progress.percentage || 0}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>0%</span>
                    <span className="font-medium">{progress.percentage || 0}%</span>
                    <span>100%</span>
                  </div>
                </div>
              )}

              {/* Recurring Tasks Indicator */}
              {progress.hasInfiniteRecurring && (
                <div className="flex items-center gap-2 text-blue-600">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">Ongoing goal with recurring tasks</span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-gray-500 text-sm">No task data available</div>
          )}
        </div>

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
