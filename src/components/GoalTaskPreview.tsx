
import { Task } from '@/types/task';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Calendar, Clock, Flag, CheckCircle2, Circle } from 'lucide-react';

interface GoalTaskPreviewProps {
  tasks: Task[];
  maxPreview?: number;
}

export const GoalTaskPreview = ({ tasks, maxPreview = 3 }: GoalTaskPreviewProps) => {
  const sortedTasks = [...tasks].sort((a, b) => {
    // Sort by status (incomplete first), then by date
    if (a.status !== b.status) {
      return a.status === 'incomplete' ? -1 : 1;
    }
    return new Date(a.task_date).getTime() - new Date(b.task_date).getTime();
  });

  const previewTasks = sortedTasks.slice(0, maxPreview);
  const remainingCount = tasks.length - maxPreview;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString([], { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    return status === 'complete' ? (
      <CheckCircle2 className="h-3 w-3 text-green-600" />
    ) : (
      <Circle className="h-3 w-3 text-gray-400" />
    );
  };

  if (tasks.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        <div className="text-2xl mb-2">📋</div>
        <p className="text-sm">No tasks assigned yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-muted-foreground">Recent Tasks</h4>
        <Badge variant="outline" className="text-xs">
          {tasks.length} total
        </Badge>
      </div>

      <div className="space-y-2">
        {previewTasks.map((task) => (
          <Card key={task.id} className="p-3 hover:bg-muted/30 transition-colors">
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                {getStatusIcon(task.status)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h5 className={`text-sm font-medium truncate ${
                    task.status === 'complete' ? 'line-through text-muted-foreground' : ''
                  }`}>
                    {task.title}
                  </h5>
                  <Badge 
                    variant="outline" 
                    className={`text-xs shrink-0 ${getPriorityColor(task.priority)}`}
                  >
                    {task.priority}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(task.task_date)}</span>
                  </div>
                  
                  {task.start_time && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{task.start_time}</span>
                    </div>
                  )}
                  
                  {task.recurrence && task.recurrence !== 'none' && (
                    <Badge variant="secondary" className="text-xs">
                      {task.recurrence}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {remainingCount > 0 && (
        <div className="text-center">
          <Badge variant="secondary" className="text-xs">
            +{remainingCount} more task{remainingCount !== 1 ? 's' : ''}
          </Badge>
        </div>
      )}
    </div>
  );
};
