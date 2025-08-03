
import React from 'react';
import { Task } from '@/types/task';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar, Clock, MapPin, Tag, Edit, Trash2, MoreVertical } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { SubtaskProgress } from '@/components/SubtaskProgress';
import { SubtaskList } from '@/components/SubtaskList';
import { useSubtasks } from '@/hooks/useSubtasks';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onToggleComplete: (id: string) => void;
  isDragging?: boolean;
}

export const TaskCard = ({ task, onEdit, onDelete, onToggleComplete, isDragging }: TaskCardProps) => {
  const { progress } = useSubtasks(task.id);
  
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
      case 'high': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'medium': return 'bg-warning/10 text-warning border-warning/20';
      case 'low': return 'bg-success/10 text-success border-success/20';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'complete' 
      ? 'bg-success/5 border-success/20 shadow-success/10' 
      : 'bg-card border-border hover:shadow-md hover:border-border/60';
  };

  // Don't show subtasks for subtasks themselves
  const isSubtask = !!task.parent_task_id;

  return (
    <Card className={`p-4 transition-all duration-300 ${getStatusColor(task.status)} ${
      isDragging ? 'shadow-lg scale-105 rotate-1' : ''
    } hover:shadow-md group`}>
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <Checkbox
              checked={task.status === 'complete'}
              onCheckedChange={() => onToggleComplete(task.id)}
              className="mt-1 data-[state=checked]:bg-success data-[state=checked]:border-success transition-colors duration-200"
            />
            <div className="flex-1 min-w-0">
              <h3 className={`font-medium text-sm leading-5 transition-all duration-200 ${
                task.status === 'complete' ? 'line-through text-muted-foreground' : 'text-foreground'
              }`}>
                {task.title}
              </h3>
              {task.description && (
                <p className={`text-xs text-muted-foreground mt-1 transition-all duration-200 ${
                  task.status === 'complete' ? 'line-through' : ''
                }`}>
                  {task.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Badge 
              variant="outline" 
              className={`text-xs transition-colors duration-200 ${getPriorityColor(task.priority)}`}
            >
              {task.priority}
            </Badge>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-muted"
                >
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-36">
                <DropdownMenuItem 
                  onClick={() => onEdit(task)}
                  className="cursor-pointer hover:bg-muted transition-colors duration-200"
                >
                  <Edit className="h-3 w-3 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onDelete(task.id)}
                  className="text-destructive cursor-pointer hover:bg-destructive/10 transition-colors duration-200"
                >
                  <Trash2 className="h-3 w-3 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5 px-2 py-1 bg-muted/30 rounded-md">
            <Calendar className="h-3 w-3" />
            <span className="font-medium">{formatDate(task.task_date)}</span>
          </div>
          
          {task.start_time && (
            <div className="flex items-center gap-1.5 px-2 py-1 bg-muted/30 rounded-md">
              <Clock className="h-3 w-3" />
              <span>{task.start_time}</span>
              {task.end_time && <span>- {task.end_time}</span>}
            </div>
          )}
          
          {task.location && (
            <div className="flex items-center gap-1.5 px-2 py-1 bg-muted/30 rounded-md">
              <MapPin className="h-3 w-3" />
              <span className="truncate max-w-24">{task.location}</span>
            </div>
          )}
          
          {task.recurrence && task.recurrence !== 'none' && (
            <Badge variant="secondary" className="text-xs px-2 py-1">
              {task.recurrence}
            </Badge>
          )}
        </div>

        {task.tags && task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {task.tags.slice(0, 3).map((tag, index) => (
              <Badge 
                key={index} 
                variant="outline" 
                className="text-xs flex items-center gap-1 px-2 py-1 bg-primary/5 text-primary border-primary/20 hover:bg-primary/10 transition-colors duration-200"
              >
                <Tag className="h-2 w-2" />
                {tag}
              </Badge>
            ))}
            {task.tags.length > 3 && (
              <Badge 
                variant="outline" 
                className="text-xs px-2 py-1 bg-muted/50 text-muted-foreground border-border hover:bg-muted transition-colors duration-200"
              >
                +{task.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Subtask Progress */}
        {!isSubtask && <SubtaskProgress progress={progress} />}

        {/* Subtask List */}
        {!isSubtask && <SubtaskList parentTaskId={task.id} />}
      </div>
    </Card>
  );
};
