
import { useState } from 'react';
import { Task } from '@/types/task';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Clock, MapPin, Edit2, Trash2, MoreVertical, Calendar, Tag } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onToggleComplete: (id: string) => void;
}

const priorityColors = {
  low: 'bg-blue-50 text-blue-700 border-blue-200',
  medium: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  high: 'bg-red-50 text-red-700 border-red-200',
};

const priorityIcons = {
  low: '🔵',
  medium: '🟡',
  high: '🔴',
};

const categoryColors = {
  work: 'bg-purple-50 text-purple-700 border-purple-200',
  personal: 'bg-green-50 text-green-700 border-green-200',
  health: 'bg-pink-50 text-pink-700 border-pink-200',
  finance: 'bg-orange-50 text-orange-700 border-orange-200',
  general: 'bg-gray-50 text-gray-700 border-gray-200',
};

export const TaskCard = ({ task, onEdit, onDelete, onToggleComplete }: TaskCardProps) => {
  const [isCompleting, setIsCompleting] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleToggleComplete = async () => {
    setIsCompleting(true);
    await onToggleComplete(task.id);
    setIsCompleting(false);
  };

  const handleEdit = () => {
    console.log('Edit task:', task.id);
    onEdit(task);
  };

  const handleDelete = () => {
    console.log('Delete task:', task.id);
    onDelete(task.id);
  };

  const formatTime = (time: string) => {
    return new Date(`1970-01-01T${time}`).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString([], {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`group transition-all duration-200 hover:shadow-lg border-l-4 ${
        task.status === 'complete' 
          ? 'opacity-75 border-l-green-400 bg-green-50/30' 
          : 'border-l-primary hover:border-l-primary/80'
      } ${isDragging ? 'shadow-xl z-10' : ''}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Checkbox
            checked={task.status === 'complete'}
            onCheckedChange={handleToggleComplete}
            disabled={isCompleting}
            className="mt-1 h-5 w-5"
          />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="flex-1">
                <h3
                  className={`font-semibold text-base leading-tight mb-1 ${
                    task.status === 'complete' ? 'line-through text-muted-foreground' : 'text-foreground'
                  }`}
                >
                  {task.title}
                </h3>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <Calendar className="h-3 w-3" />
                  <span>{formatDate(task.task_date)}</span>
                  {(task.start_time || task.end_time) && (
                    <>
                      <Clock className="h-3 w-3 ml-2" />
                      <span>
                        {task.start_time && formatTime(task.start_time)}
                        {task.start_time && task.end_time && ' - '}
                        {task.end_time && formatTime(task.end_time)}
                      </span>
                    </>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleEdit}
                  className="h-8 w-8 p-0 opacity-60 hover:opacity-100 transition-opacity"
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDelete}
                  className="h-8 w-8 p-0 opacity-60 hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {task.description && (
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {task.description}
              </p>
            )}

            <div className="flex flex-wrap gap-2 mb-3">
              <Badge
                variant="outline"
                className={`text-xs font-medium ${priorityColors[task.priority as keyof typeof priorityColors]}`}
              >
                <span className="mr-1">{priorityIcons[task.priority as keyof typeof priorityIcons]}</span>
                {task.priority} priority
              </Badge>
              
              <Badge
                variant="outline"
                className={`text-xs font-medium ${categoryColors[task.category as keyof typeof categoryColors]}`}
              >
                {task.category}
              </Badge>
              
              {task.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  <Tag className="h-3 w-3 mr-1" />
                  {tag}
                </Badge>
              ))}
            </div>

            {task.location && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span className="truncate">{task.location}</span>
              </div>
            )}
          </div>
          
          <div
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-2 rounded-md hover:bg-muted/50 transition-colors"
          >
            <div className="flex flex-col gap-1">
              <div className="w-1 h-1 bg-muted-foreground rounded-full"></div>
              <div className="w-1 h-1 bg-muted-foreground rounded-full"></div>
              <div className="w-1 h-1 bg-muted-foreground rounded-full"></div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
