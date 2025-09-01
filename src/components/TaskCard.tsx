
import React from 'react';
import { Task } from '@/types/task';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Calendar, Clock, MapPin, Tag, Edit, Trash2, MoreVertical } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { SubtaskProgress } from '@/components/SubtaskProgress';
import { SubtaskList } from '@/components/SubtaskList';
import { TaskCompletionAnimation } from '@/components/TaskCompletionAnimation';
import { useSubtasks } from '@/hooks/useSubtasks';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onToggleComplete: (id: string) => void;
  isDragging?: boolean;
}

export const TaskCard = ({ task, onEdit, onDelete, onToggleComplete, isDragging }: TaskCardProps) => {
  const { progress, toggleMainTaskComplete } = useSubtasks(task.id);
  
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
      case 'high': return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800/30';
      case 'medium': return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800/30';
      case 'low': return 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800/30';
      default: return 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800/50 dark:text-gray-400 dark:border-gray-700';
    }
  };

  const getCardStyle = (status: string, priority: string) => {
    if (status === 'complete') {
      return 'bg-gradient-to-br from-green-50/50 to-emerald-50/30 border-green-200/60 dark:from-green-950/20 dark:to-emerald-950/10 dark:border-green-800/30 shadow-green-100/20 dark:shadow-green-950/20';
    }
    
    switch (priority) {
      case 'high':
        return 'bg-gradient-to-br from-white to-red-50/20 border-red-100/40 dark:from-card dark:to-red-950/10 dark:border-red-900/20 shadow-red-100/10 dark:shadow-red-950/10';
      case 'medium':
        return 'bg-gradient-to-br from-white to-amber-50/20 border-amber-100/40 dark:from-card dark:to-amber-950/10 dark:border-amber-900/20 shadow-amber-100/10 dark:shadow-amber-950/10';
      case 'low':
        return 'bg-gradient-to-br from-white to-green-50/20 border-green-100/40 dark:from-card dark:to-green-950/10 dark:border-green-900/20 shadow-green-100/10 dark:shadow-green-950/10';
      default:
        return 'bg-gradient-to-br from-white to-gray-50/30 border-gray-200/60 dark:from-card dark:to-gray-800/10 dark:border-gray-700/40';
    }
  };

  // Don't show subtasks for subtasks themselves
  const isSubtask = !!task.parent_task_id;
  
  // Check if this task has subtasks
  const hasSubtasks = progress?.has_subtasks || false;

  // Reusable function to toggle task completion
  const toggleTaskCompletion = (taskId: string, isCompleted: boolean) => {
    if (hasSubtasks) {
      // Use the subtask toggle function for tasks with subtasks
      toggleMainTaskComplete();
    } else {
      // Use the parent toggle function for regular tasks
      onToggleComplete(taskId);
    }
  };

  const handleToggleClick = (checked: boolean) => {
    toggleTaskCompletion(task.id, !checked);
  };

  const isCompleted = task.status === 'complete';

  return (
    <Card className={`
      relative overflow-hidden transition-all duration-500 ease-out
      ${getCardStyle(task.status, task.priority)}
      ${isDragging ? 'scale-105 rotate-1 shadow-2xl z-50' : 'hover:shadow-lg hover:shadow-primary/5'}
      ${isCompleted ? 'opacity-75' : ''}
      group border-l-4 ${
        task.priority === 'high' ? 'border-l-red-400 dark:border-l-red-500' :
        task.priority === 'medium' ? 'border-l-amber-400 dark:border-l-amber-500' :
        task.priority === 'low' ? 'border-l-green-400 dark:border-l-green-500' :
        'border-l-gray-300 dark:border-l-gray-600'
      }
    `}>
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-primary/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative p-5 space-y-4">
        {/* Header Section */}
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 pt-1">
            <div className="relative">
              <Switch
                checked={isCompleted}
                onCheckedChange={handleToggleClick}
                className="transition-all duration-300 data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-green-500 data-[state=checked]:to-emerald-600 hover:shadow-md hover:shadow-primary/20"
              />
              {isCompleted && (
                <div className="absolute -top-2 -left-2">
                  <TaskCompletionAnimation 
                    isCompleted={true} 
                    showConfetti={true}
                  />
                </div>
              )}
            </div>
          </div>
          
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <h3 className={`font-semibold text-base leading-6 transition-all duration-300 ${
                isCompleted 
                  ? 'line-through text-muted-foreground/70' 
                  : 'text-foreground group-hover:text-primary/90'
              }`}>
                {task.title}
                {hasSubtasks && (
                  <Badge variant="outline" className="ml-2 text-xs">
                    Has subtasks
                  </Badge>
                )}
              </h3>
              
              <div className="flex items-center gap-2 flex-shrink-0">
                <Badge 
                  variant="outline" 
                  className={`text-xs font-medium px-2.5 py-1 transition-all duration-300 ${getPriorityColor(task.priority)} hover:shadow-sm`}
                >
                  {task.priority.toUpperCase()}
                </Badge>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-primary/10 hover:text-primary rounded-full hover:scale-110"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40 shadow-lg border-border/50">
                    <DropdownMenuItem 
                      onClick={() => onEdit(task)}
                      className="cursor-pointer hover:bg-primary/5 transition-colors duration-200 gap-2"
                    >
                      <Edit className="h-4 w-4" />
                      Edit Task
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => onDelete(task.id)}
                      className="text-destructive cursor-pointer hover:bg-destructive/10 transition-colors duration-200 gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete Task
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            
            {task.description && (
              <p className={`text-sm leading-5 transition-all duration-300 ${
                isCompleted 
                  ? 'line-through text-muted-foreground/60' 
                  : 'text-muted-foreground'
              }`}>
                {task.description}
              </p>
            )}
          </div>
        </div>

        {/* Metadata Section */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/5 border border-primary/10 rounded-full text-xs font-medium text-primary hover:bg-primary/10 transition-colors duration-200">
            <Calendar className="h-3.5 w-3.5" />
            <span>{formatDate(task.task_date)}</span>
          </div>
          
          {task.start_time && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200/60 rounded-full text-xs font-medium text-blue-700 dark:bg-blue-950/30 dark:border-blue-800/30 dark:text-blue-400">
              <Clock className="h-3.5 w-3.5" />
              <span>
                {task.start_time}
                {task.end_time && <span className="text-blue-500 dark:text-blue-400"> - {task.end_time}</span>}
              </span>
            </div>
          )}
          
          {task.location && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 border border-purple-200/60 rounded-full text-xs font-medium text-purple-700 dark:bg-purple-950/30 dark:border-purple-800/30 dark:text-purple-400">
              <MapPin className="h-3.5 w-3.5" />
              <span className="truncate max-w-24">{task.location}</span>
            </div>
          )}
          
          {task.recurrence && task.recurrence !== 'none' && (
            <Badge 
              variant="secondary" 
              className="text-xs px-3 py-1.5 bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 border-indigo-200/60 dark:from-indigo-950/30 dark:to-purple-950/30 dark:text-indigo-400 dark:border-indigo-800/30"
            >
              🔄 {task.recurrence}
            </Badge>
          )}
        </div>

        {/* Tags Section */}
        {task.tags && task.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {task.tags.slice(0, 4).map((tag, index) => (
              <Badge 
                key={index} 
                variant="outline" 
                className="text-xs flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 border-emerald-200/60 hover:from-emerald-100 hover:to-teal-100 transition-all duration-200 dark:from-emerald-950/20 dark:to-teal-950/20 dark:text-emerald-400 dark:border-emerald-800/30"
              >
                <Tag className="h-2.5 w-2.5" />
                {tag}
              </Badge>
            ))}
            {task.tags.length > 4 && (
              <Badge 
                variant="outline" 
                className="text-xs px-2.5 py-1 bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100 transition-colors duration-200 dark:bg-gray-800/50 dark:text-gray-400 dark:border-gray-700 dark:hover:bg-gray-800"
              >
                +{task.tags.length - 4} more
              </Badge>
            )}
          </div>
        )}

        {/* Subtask Progress */}
        {!isSubtask && progress?.has_subtasks && (
          <div className="border-t border-border/40 pt-4">
            <SubtaskProgress progress={progress} />
          </div>
        )}

        {/* Subtask List */}
        {!isSubtask && (
          <div className="border-t border-border/30 pt-3">
            <SubtaskList parentTaskId={task.id} />
          </div>
        )}
      </div>
    </Card>
  );
};
