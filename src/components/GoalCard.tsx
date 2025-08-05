
import { useState, useEffect } from 'react';
import { Goal, GoalProgress } from '@/types/goal';
import { Task } from '@/types/task';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Target, Calendar, Edit, Trash2, Trophy, User } from 'lucide-react';
import { useGoals } from '@/hooks/useGoals';
import { supabase } from '@/integrations/supabase/client';

interface GoalCardProps {
  goal: Goal;
  onEdit?: (goal: Goal) => void;
  onDelete?: (goalId: string) => void;
}

export const GoalCard = ({ goal, onEdit, onDelete }: GoalCardProps) => {
  const [progress, setProgress] = useState<GoalProgress | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const { getGoalProgress, getGoalTasks } = useGoals();

  const fetchGoalData = async () => {
    setLoading(true);
    try {
      const [progressData, linkedTasks] = await Promise.all([
        getGoalProgress(goal.id),
        getGoalTasks(goal.id)
      ]);
      
      setProgress(progressData);
      setTasks(linkedTasks);
    } catch (err) {
      console.error('Error fetching goal data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoalData();
  }, [goal.id, refreshKey]);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel(`goal-${goal.id}-realtime`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
        },
        () => {
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

  const getProgressColor = () => {
    if (!progress || progress.percentage === null) return 'bg-muted-foreground';
    
    if (progress.percentage >= 100) return 'bg-green-500 dark:bg-green-600';
    if (progress.percentage >= 70) return 'bg-blue-500 dark:bg-blue-600';
    if (progress.percentage >= 40) return 'bg-yellow-500 dark:bg-yellow-600';
    return 'bg-orange-500 dark:bg-orange-600';
  };

  const getCardBorderColor = () => {
    if (!progress || progress.percentage === null) return 'border-t-muted-foreground';
    
    if (progress.percentage >= 100) return 'border-t-green-500 dark:border-t-green-600';
    if (progress.percentage >= 70) return 'border-t-blue-500 dark:border-t-blue-600';
    if (progress.percentage >= 40) return 'border-t-yellow-500 dark:border-t-yellow-600';
    return 'border-t-orange-500 dark:border-t-orange-600';
  };

  const getStatColor = (type: 'completed' | 'remaining') => {
    if (type === 'completed') {
      return 'text-green-600 dark:text-green-400';
    }
    return 'text-blue-600 dark:text-blue-400';
  };

  const isCompleted = progress?.percentage === 100;
  const completedTasks = progress?.completedTasks || 0;
  const totalTasks = progress?.totalTasks || 0;
  const progressPercentage = progress?.percentage || 0;

  if (loading) {
    return (
      <Card className="h-96 bg-card">
        <CardContent className="p-6 h-full flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`relative bg-card hover:bg-accent/50 border-2 border-t-4 ${getCardBorderColor()} hover:shadow-xl transition-all duration-300 group h-96 flex flex-col`}>
      <CardHeader className="pb-4 flex-shrink-0">
        <div className="flex items-start justify-between">
          <div className="flex-1 pr-2">
            <div className="flex items-center gap-2 mb-2">
              <CardTitle className="text-xl font-bold text-foreground line-clamp-1 flex-1">{goal.title}</CardTitle>
              {isCompleted && (
                <div className="flex items-center gap-1">
                  <Trophy className="h-4 w-4 text-yellow-500" />
                  <Badge className="bg-green-600 text-white text-xs px-2 py-1 whitespace-nowrap">
                    completed
                  </Badge>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <User className="h-4 w-4" />
              <span>Personal</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(goal)}
                className="h-8 w-8 p-0 hover:bg-accent text-muted-foreground hover:text-foreground"
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(goal.id)}
                className="h-8 w-8 p-0 hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 flex-1 flex flex-col">
        {/* Description with fixed height */}
        <div className="h-16 mb-4 flex-shrink-0">
          {goal.description && (
            <p className="text-muted-foreground text-sm line-clamp-3">
              {goal.description}
            </p>
          )}
        </div>

        {/* Progress Section */}
        <div className="mb-4 flex-shrink-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-muted-foreground text-sm font-medium">Progress</span>
            <span className="text-foreground text-lg font-bold">{progressPercentage}%</span>
          </div>
          
          <div className="w-full bg-muted rounded-full h-2 mb-4">
            <div 
              className={`h-2 rounded-full transition-all duration-500 ${getProgressColor()}`}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Task Statistics */}
        <div className="grid grid-cols-2 gap-4 mb-6 flex-shrink-0">
          <div className="text-center">
            <div className={`text-2xl font-bold ${getStatColor('completed')}`}>{completedTasks}</div>
            <div className="text-muted-foreground text-sm">Tasks Done</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${getStatColor('remaining')}`}>{totalTasks - completedTasks}</div>
            <div className="text-muted-foreground text-sm">Remaining</div>
          </div>
        </div>

        {/* Tags section - reserved space for future use */}
        <div className="mb-4 min-h-[28px] flex-shrink-0">
          {goal.description && (
            <div className="flex flex-wrap gap-1">
              {goal.description.split(' ').slice(0, 3).map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Dates section at bottom - properly contained within card */}
        <div className="mt-auto space-y-2 text-xs text-muted-foreground flex-shrink-0">
          <div className="min-h-[16px]">
            {goal.start_date && (
              <div className="flex items-center gap-2">
                <Calendar className="h-3 w-3" />
                <span>Started: {formatDate(goal.start_date)}</span>
              </div>
            )}
          </div>
          <div className="min-h-[16px]">
            {goal.end_date && (
              <div className="flex items-center gap-2">
                <Target className="h-3 w-3" />
                <span>Target: {formatDate(goal.end_date)}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
