
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
    if (!progress || progress.percentage === null) return 'bg-gray-400';
    
    if (progress.percentage >= 100) return 'bg-green-500';
    if (progress.percentage >= 70) return 'bg-blue-500';
    if (progress.percentage >= 40) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  const getCardBorderColor = () => {
    if (!progress || progress.percentage === null) return 'border-t-gray-400';
    
    if (progress.percentage >= 100) return 'border-t-green-500';
    if (progress.percentage >= 70) return 'border-t-blue-500';
    if (progress.percentage >= 40) return 'border-t-yellow-500';
    return 'border-t-orange-500';
  };

  const isCompleted = progress?.percentage === 100;
  const completedTasks = progress?.completedTasks || 0;
  const totalTasks = progress?.totalTasks || 0;
  const progressPercentage = progress?.percentage || 0;

  if (loading) {
    return (
      <Card className="h-64 bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700">
        <CardContent className="p-6 h-full flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`relative bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 border-t-4 ${getCardBorderColor()} hover:shadow-xl transition-all duration-300 group`}>
      {/* Trophy icon for completed goals */}
      {isCompleted && (
        <div className="absolute top-4 right-4 z-10">
          <Trophy className="h-6 w-6 text-yellow-500" />
        </div>
      )}

      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <CardTitle className="text-xl font-bold text-white">{goal.title}</CardTitle>
              {isCompleted && (
                <Badge className="bg-green-600 text-white text-xs px-2 py-1">
                  completed
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-2 text-slate-400 text-sm mb-3">
              <User className="h-4 w-4" />
              <span>Personal</span>
            </div>

            {goal.description && (
              <p className="text-slate-300 text-sm mb-4 line-clamp-2">
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
                className="h-8 w-8 p-0 hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(goal.id)}
                className="h-8 w-8 p-0 hover:bg-red-900 text-slate-400 hover:text-red-400"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Progress Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-300 text-sm font-medium">Progress</span>
            <span className="text-white text-lg font-bold">{progressPercentage}%</span>
          </div>
          
          <div className="w-full bg-slate-700 rounded-full h-2 mb-4">
            <div 
              className={`h-2 rounded-full transition-all duration-500 ${getProgressColor()}`}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Task Statistics */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-400">{completedTasks}</div>
            <div className="text-slate-400 text-sm">Tasks Done</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">{totalTasks - completedTasks}</div>
            <div className="text-slate-400 text-sm">Milestones</div>
          </div>
        </div>

        {/* Tags */}
        {goal.description && (
          <div className="flex flex-wrap gap-1 mb-4">
            {goal.description.split(' ').slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs bg-slate-800 text-slate-300 border-slate-600">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Dates */}
        <div className="space-y-2 text-xs text-slate-400">
          {goal.start_date && (
            <div className="flex items-center gap-2">
              <Calendar className="h-3 w-3" />
              <span>Started: {formatDate(goal.start_date)}</span>
            </div>
          )}
          {goal.end_date && (
            <div className="flex items-center gap-2">
              <Target className="h-3 w-3" />
              <span>Target: {formatDate(goal.end_date)}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
