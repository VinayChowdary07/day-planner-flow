
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
      case 'high': return 'bg-red-100 text-red-700 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'complete' ? 'bg-green-50 border-green-200' : 'bg-white';
  };

  // Don't show subtasks for subtasks themselves
  const isSubtask = !!task.parent_task_id;

  return (
    <Card className={`p-4 transition-all duration-200 hover:shadow-md ${getStatusColor(task.status)} ${
      isDragging ? 'shadow-lg scale-105' : ''
    }`}>
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <Checkbox
              checked={task.status === 'complete'}
              onCheckedChange={() => onToggleComplete(task.id)}
              className="mt-1"
            />
            <div className="flex-1 min-w-0">
              <h3 className={`font-medium text-sm leading-5 ${
                task.status === 'complete' ? 'line-through text-muted-foreground' : ''
              }`}>
                {task.title}
              </h3>
              {task.description && (
                <p className={`text-xs text-muted-foreground mt-1 ${
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
              className={`text-xs ${getPriorityColor(task.priority)}`}
            >
              {task.priority}
            </Badge>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(task)}>
                  <Edit className="h-3 w-3 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onDelete(task.id)}
                  className="text-destructive"
                >
                  <Trash2 className="h-3 w-3 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{formatDate(task.task_date)}</span>
          </div>
          
          {task.start_time && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{task.start_time}</span>
              {task.end_time && <span>- {task.end_time}</span>}
            </div>
          )}
          
          {task.location && (
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span className="truncate max-w-20">{task.location}</span>
            </div>
          )}
          
          {task.recurrence && task.recurrence !== 'none' && (
            <Badge variant="secondary" className="text-xs">
              {task.recurrence}
            </Badge>
          )}
        </div>

        {task.tags && task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {task.tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs flex items-center gap-1">
                <Tag className="h-2 w-2" />
                {tag}
              </Badge>
            ))}
            {task.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
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
