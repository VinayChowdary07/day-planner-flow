
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTasks } from '@/hooks/useTasks';
import { useProjects } from '@/hooks/useProjects';
import { useGoals } from '@/hooks/useGoals';
import { ProductivityChart } from './ProductivityChart';
import { RecentActivity } from './RecentActivity';
import { 
  CheckCircle, 
  Clock, 
  Target, 
  FolderOpen, 
  TrendingUp, 
  Calendar,
  Award,
  BarChart3
} from 'lucide-react';

export const AnalyticsDashboard = () => {
  const { tasks, loading: tasksLoading } = useTasks();
  const { projects, loading: projectsLoading } = useProjects();
  const { goals, loading: goalsLoading, getGoalProgress } = useGoals();
  const [goalsProgress, setGoalsProgress] = useState<Array<{ goalId: string; progress: number; totalTasks: number; completedTasks: number }>>([]);

  // Calculate goal progress for all goals
  useEffect(() => {
    const calculateAllGoalsProgress = async () => {
      if (!goals || goals.length === 0) {
        setGoalsProgress([]);
        return;
      }

      const progressData = [];
      for (const goal of goals) {
        const progress = await getGoalProgress(goal.id);
        if (progress) {
          progressData.push({
            goalId: goal.id,
            progress: progress.percentage || 0,
            totalTasks: progress.totalTasks,
            completedTasks: progress.completedTasks,
          });
        }
      }
      setGoalsProgress(progressData);
    };

    calculateAllGoalsProgress();
  }, [goals, getGoalProgress, tasks]); // Re-calculate when tasks change

  // Calculate real-time statistics with proper error handling
  const tasksCompletedToday = tasks?.filter(task => {
    if (!task.updated_at) return false;
    const today = new Date().toDateString();
    return task.status === 'complete' && 
           new Date(task.updated_at).toDateString() === today;
  }).length || 0;

  const activeProjects = projects?.filter(project => project.status === 'active').length || 0;
  
  const goalsInProgress = goals?.filter(goal => {
    // A goal is in progress if it has an end_date in the future or no end_date
    if (!goal.end_date) return true;
    return new Date(goal.end_date) >= new Date();
  }).length || 0;
  
  // Calculate completed goals based on their progress
  const goalsCompleted = goalsProgress.filter(progress => progress.progress === 100).length;
  
  const goalsAchievedThisWeek = goalsProgress.filter(progress => {
    return progress.progress === 100; // Consider 100% progress as achieved
  }).length;

  // Total counts - these should include ALL items regardless of status
  const totalTasks = tasks?.length || 0;
  const totalProjects = projects?.length || 0;
  const totalGoals = goals?.length || 0;

  // Completed counts
  const totalTasksCompleted = tasks?.filter(task => task.status === 'complete').length || 0;
  const totalProjectsCompleted = projects?.filter(project => project.status === 'completed').length || 0;
  const totalGoalsAchieved = goalsCompleted;

  // Completion rates
  const taskCompletionRate = totalTasks > 0 ? Math.round((totalTasksCompleted / totalTasks) * 100) : 0;
  const projectCompletionRate = totalProjects > 0 ? Math.round((totalProjectsCompleted / totalProjects) * 100) : 0;
  const goalAchievementRate = totalGoals > 0 ? Math.round((totalGoalsAchieved / totalGoals) * 100) : 0;

  // Calculate average goal progress
  const averageGoalProgress = goalsProgress.length > 0 
    ? Math.round(goalsProgress.reduce((sum, progress) => sum + progress.progress, 0) / goalsProgress.length)
    : 0;

  const isLoading = tasksLoading || projectsLoading || goalsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Real-time productivity insights and comprehensive statistics</p>
        </div>
        <Badge variant="outline" className="text-xs">
          <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
          Live Updates
        </Badge>
      </div>

      {/* Top Highlight Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">
              Tasks Completed Today
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
              {tasksCompletedToday}
            </div>
            <p className="text-xs text-blue-600 dark:text-blue-400">
              Keep up the momentum!
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-300">
              Active Projects
            </CardTitle>
            <FolderOpen className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
              {activeProjects}
            </div>
            <p className="text-xs text-orange-600 dark:text-orange-400">
              Currently in progress
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">
              Average Goal Progress
            </CardTitle>
            <Target className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
              {averageGoalProgress}%
            </div>
            <p className="text-xs text-purple-600 dark:text-purple-400">
              Across all goals
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">
              Goals Completed
            </CardTitle>
            <Award className="h-4 w-4 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900 dark:text-green-100">
              {goalsCompleted}
            </div>
            <p className="text-xs text-green-600 dark:text-green-400">
              100% progress achieved
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Total and Completion Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTasks}</div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle className="h-3 w-3 text-green-600" />
              <span>{totalTasksCompleted} completed ({taskCompletionRate}%)</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProjects}</div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle className="h-3 w-3 text-blue-600" />
              <span>{totalProjectsCompleted} completed ({projectCompletionRate}%)</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Goals</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalGoals}</div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Award className="h-3 w-3 text-purple-600" />
              <span>{totalGoalsAchieved} achieved ({goalAchievementRate}%)</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              7-Day Productivity Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ProductivityChart tasks={tasks} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RecentActivity tasks={tasks} projects={projects} goals={goals} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
