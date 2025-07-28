
import { useMemo } from 'react';
import { Task } from '@/types/task';
import { Project } from '@/types/project';
import { Goal } from '@/types/goal';
import { CheckCircle, FolderOpen, Target, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface RecentActivityProps {
  tasks: Task[];
  projects: Project[];
  goals: Goal[];
}

interface ActivityItem {
  id: string;
  type: 'task' | 'project' | 'goal';
  title: string;
  action: string;
  timestamp: Date;
  icon: React.ComponentType<any>;
  color: string;
}

export const RecentActivity = ({ tasks, projects, goals }: RecentActivityProps) => {
  const recentActivities = useMemo(() => {
    const activities: ActivityItem[] = [];
    
    // Add recent task completions
    tasks?.forEach(task => {
      if (task.status === 'complete' && task.updated_at) {
        activities.push({
          id: `task-${task.id}`,
          type: 'task',
          title: task.title,
          action: 'completed',
          timestamp: new Date(task.updated_at),
          icon: CheckCircle,
          color: 'text-blue-600 dark:text-blue-400',
        });
      }
    });
    
    // Add recent project updates
    projects?.forEach(project => {
      if (project.updated_at) {
        activities.push({
          id: `project-${project.id}`,
          type: 'project',
          title: project.name,
          action: project.status === 'completed' ? 'completed' : 'updated',
          timestamp: new Date(project.updated_at),
          icon: FolderOpen,
          color: 'text-orange-600 dark:text-orange-400',
        });
      }
    });
    
    // Add recent goal achievements
    goals?.forEach(goal => {
      if (goal.updated_at) {
        const isAchieved = goal.end_date && new Date(goal.end_date) < new Date();
        activities.push({
          id: `goal-${goal.id}`,
          type: 'goal',
          title: goal.title,
          action: isAchieved ? 'achieved' : 'updated',
          timestamp: new Date(goal.updated_at),
          icon: Target,
          color: 'text-purple-600 dark:text-purple-400',
        });
      }
    });
    
    // Sort by timestamp (most recent first) and take top 10
    return activities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10);
  }, [tasks, projects, goals]);

  if (recentActivities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <Clock className="h-8 w-8 mb-2" />
        <p className="text-sm">No recent activity</p>
        <p className="text-xs">Complete tasks, update projects, or achieve goals to see activity here</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-h-64 overflow-y-auto">
      {recentActivities.map((activity) => {
        const Icon = activity.icon;
        return (
          <div key={activity.id} className="flex items-start space-x-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
            <Icon className={`h-4 w-4 mt-0.5 ${activity.color}`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {activity.title}
              </p>
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                <span className="capitalize">{activity.action}</span>
                <span>•</span>
                <span>{formatDistanceToNow(activity.timestamp, { addSuffix: true })}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
