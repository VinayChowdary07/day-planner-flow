
import { useState, useEffect } from 'react';
import { Goal } from '@/types/goal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Target, Trophy, Clock, TrendingUp, RefreshCw } from 'lucide-react';
import { useGoals } from '@/hooks/useGoals';
import { GoalCard } from '@/components/GoalCard';
import { GoalForm } from '@/components/GoalForm';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const GoalsDashboard = () => {
  const { goals, loading, createGoal, updateGoal, deleteGoal, getGoalProgress } = useGoals();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isGoalFormOpen, setIsGoalFormOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [goalStats, setGoalStats] = useState({
    total: 0,
    active: 0,
    completed: 0,
    avgProgress: 0
  });
  const { user } = useAuth();

  // Force refresh function
  const forceRefresh = async () => {
    setIsRefreshing(true);
    setRefreshTrigger(prev => prev + 1);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  // Calculate goal statistics with proper progress tracking
  const calculateStats = async () => {
    if (!goals.length) {
      setGoalStats({ total: 0, active: 0, completed: 0, avgProgress: 0 });
      return;
    }

    console.log('Calculating stats for goals:', goals.length);

    let totalProgress = 0;
    let completedCount = 0;
    let activeCount = 0;
    let validProgressCount = 0;

    // Process each goal to get its progress
    for (const goal of goals) {
      try {
        const progress = await getGoalProgress(goal.id);
        console.log(`Goal ${goal.title} progress:`, progress);
        
        if (progress) {
          const percentage = progress.percentage || 0;
          totalProgress += percentage;
          validProgressCount++;
          
          if (percentage >= 100) {
            completedCount++;
          } else {
            activeCount++;
          }
        } else {
          // If no progress data, consider it active with 0% progress
          activeCount++;
          validProgressCount++;
        }
      } catch (error) {
        console.error('Error calculating progress for goal:', goal.id, error);
        // Still count it as active even if there's an error
        activeCount++;
        validProgressCount++;
      }
    }

    const avgProgress = validProgressCount > 0 ? Math.round(totalProgress / validProgressCount) : 0;

    const newStats = {
      total: goals.length,
      active: activeCount,
      completed: completedCount,
      avgProgress: avgProgress
    };

    console.log('Calculated stats:', newStats);
    setGoalStats(newStats);
  };

  // Recalculate stats whenever goals change or refresh is triggered
  useEffect(() => {
    if (goals.length >= 0) { // Check for >= 0 to handle empty arrays
      calculateStats();
    }
  }, [goals, refreshTrigger]);

  // Enhanced real-time subscription for all relevant tables
  useEffect(() => {
    if (!user) return;

    console.log('Setting up real-time subscriptions for goals dashboard');

    const channel = supabase
      .channel('goals-dashboard-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Tasks table changed:', payload);
          setRefreshTrigger(prev => prev + 1);
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
          console.log('Goal_tasks table changed:', payload);
          setRefreshTrigger(prev => prev + 1);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'goals',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Goals table changed:', payload);
          setRefreshTrigger(prev => prev + 1);
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up real-time subscriptions');
      supabase.removeChannel(channel);
    };
  }, [user]);

  const filteredGoals = goals.filter(goal => {
    const matchesSearch = goal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         goal.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleCreateGoal = async (goalData: Partial<Goal>) => {
    try {
      await createGoal(goalData);
      setIsGoalFormOpen(false);
      forceRefresh();
    } catch (error) {
      console.error('Error creating goal:', error);
    }
  };

  const handleUpdateGoal = async (goalData: Partial<Goal>) => {
    if (!editingGoal?.id) return;
    try {
      await updateGoal(editingGoal.id, goalData);
      setEditingGoal(null);
      forceRefresh();
    } catch (error) {
      console.error('Error updating goal:', error);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (confirm('Are you sure you want to delete this goal? This action cannot be undone.')) {
      try {
        await deleteGoal(goalId);
        forceRefresh();
      } catch (error) {
        console.error('Error deleting goal:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading goals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Goals Dashboard</h1>
          <p className="text-muted-foreground mt-1">Track your progress and achieve your objectives</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={forceRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => setIsGoalFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Goal
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Goals</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{goalStats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Goals</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{goalStats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                <Trophy className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{goalStats.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <Clock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Progress</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{goalStats.avgProgress}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search goals, tags, descriptions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Goals Grid */}
      <div className="space-y-4">
        {filteredGoals.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-6xl mb-4">🎯</div>
              <h3 className="text-lg font-semibold mb-2">No goals yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first goal to start tracking your progress
              </p>
              <Button onClick={() => setIsGoalFormOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Goal
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredGoals.map((goal) => (
              <div key={`${goal.id}-${refreshTrigger}`} className="animate-fade-in">
                <GoalCard
                  goal={goal}
                  onEdit={(goal) => setEditingGoal(goal)}
                  onDelete={handleDeleteGoal}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Goal Form Modals */}
      <GoalForm
        isOpen={isGoalFormOpen}
        onClose={() => setIsGoalFormOpen(false)}
        onSubmit={handleCreateGoal}
      />

      <GoalForm
        isOpen={!!editingGoal}
        onClose={() => setEditingGoal(null)}
        onSubmit={handleUpdateGoal}
        goal={editingGoal}
      />
    </div>
  );
};
