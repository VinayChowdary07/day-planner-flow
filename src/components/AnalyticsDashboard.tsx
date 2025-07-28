
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
  Award
} from 'lucide-react';

export const AnalyticsDashboard = () => {
  const { tasks, loading: tasksLoading } = useTasks();
  const { projects, loading: projectsLoading } = useProjects();
  const { goals, loading: goalsLoading } = useGoals();

  // Calculate real-time statistics
  const tasksCompletedToday = tasks?.filter(task => {
    const today = new Date().toDateString();
    return task.completed && task.updated_at && 
           new Date(task.updated_at).toDateString() === today;
  }).length || 0;

  const activeProjects = projects?.filter(project => project.status === 'active').length || 0;
  
  const goalsInProgress = goals?.filter(goal => goal.status === 'in_progress').length || 0;
  
  const goalsAchievedThisWeek = goals?.filter(goal => {
    if (goal.status !== 'completed') return false;
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return goal.updated_at && new Date(goal.updated_at) >= weekAgo;
  }).length || 0;

  const totalTasksCompleted = tasks?.filter(task => task.completed).length || 0;
  const totalProjectsCompleted = projects?.filter(project => project.status === 'completed').length || 0;
  const totalGoalsAchieved = goals?.filter(goal => goal.status === 'completed').length || 0;

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
          <h1 className="text-2xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Real-time productivity insights and statistics</p>
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
              Goals In Progress
            </CardTitle>
            <Target className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
              {goalsInProgress}
            </div>
            <p className="text-xs text-purple-600 dark:text-purple-400">
              On track to achieve
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">
              Goals Achieved This Week
            </CardTitle>
            <Award className="h-4 w-4 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900 dark:text-green-100">
              {goalsAchievedThisWeek}
            </div>
            <p className="text-xs text-green-600 dark:text-green-400">
              Excellent progress!
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTasksCompleted}</div>
            <p className="text-xs text-muted-foreground">
              Lifetime completions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projects Completed</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProjectsCompleted}</div>
            <p className="text-xs text-muted-foreground">
              Successfully finished
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Goals Achieved</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalGoalsAchieved}</div>
            <p className="text-xs text-muted-foreground">
              Milestones reached
            </p>
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
