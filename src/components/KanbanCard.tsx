
import { useState } from 'react';
import { Task } from '@/types/task';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar, Clock, MapPin, Tag, AlertCircle, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

interface KanbanCardProps {
  task: Task;
  onDragStart: (task: Task) => void;
  onDragEnd: () => void;
  isDragging?: boolean;
}

export const KanbanCard = ({ task, onDragStart, onDragEnd, isDragging }: KanbanCardProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <AlertCircle className="h-3 w-3" />;
      case 'medium': return <Clock className="h-3 w-3" />;
      case 'low': return <CheckCircle2 className="h-3 w-3" />;
      default: return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <Card 
        className={`mb-3 cursor-move transition-all duration-200 hover:shadow-md ${
          isDragging ? 'opacity-50 rotate-2 scale-105' : 'hover:scale-[1.02]'
        }`}
        draggable
        onDragStart={() => onDragStart(task)}
        onDragEnd={onDragEnd}
      >
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <h4 className="font-medium text-sm line-clamp-2 flex-1">{task.title}</h4>
              <Badge 
                variant="secondary" 
                className={`ml-2 text-xs ${getPriorityColor(task.priority)}`}
              >
                {getPriorityIcon(task.priority)}
                <span className="ml-1 capitalize">{task.priority}</span>
              </Badge>
            </div>

            {task.description && (
              <p className="text-xs text-muted-foreground line-clamp-2">
                {task.description}
              </p>
            )}

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{format(new Date(task.task_date), 'MMM dd')}</span>
              </div>
              
              {task.tags && task.tags.length > 0 && (
                <div className="flex items-center gap-1">
                  <Tag className="h-3 w-3" />
                  <span>{task.tags.length}</span>
                </div>
              )}
            </div>

            <DialogTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full text-xs h-7 mt-2 hover:bg-muted"
              >
                View Details
              </Button>
            </DialogTrigger>
          </div>
        </CardContent>
      </Card>

      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>{task.title}</span>
            <Badge className={getPriorityColor(task.priority)}>
              {getPriorityIcon(task.priority)}
              <span className="ml-1 capitalize">{task.priority}</span>
            </Badge>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {task.description && (
            <div>
              <h5 className="font-medium text-sm mb-2">Description</h5>
              <p className="text-sm text-muted-foreground">{task.description}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>{format(new Date(task.task_date), 'MMMM dd, yyyy')}</span>
            </div>

            {task.start_time && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{task.start_time}</span>
                {task.end_time && <span>- {task.end_time}</span>}
              </div>
            )}

            {task.location && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{task.location}</span>
              </div>
            )}

            <div className="flex items-center gap-2 text-sm">
              <Tag className="h-4 w-4 text-muted-foreground" />
              <Badge variant="outline" className="text-xs">
                {task.category}
              </Badge>
            </div>
          </div>

          {task.tags && task.tags.length > 0 && (
            <div>
              <h5 className="font-medium text-sm mb-2">Tags</h5>
              <div className="flex flex-wrap gap-1">
                {task.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
