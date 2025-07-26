import { useState } from 'react';
import { Task } from '@/types/task';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Clock, MapPin, Edit2, Trash2, MoreVertical } from 'lucide-react';
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
  low: 'bg-blue-500/10 text-blue-700 border-blue-200',
  medium: 'bg-yellow-500/10 text-yellow-700 border-yellow-200',
  high: 'bg-red-500/10 text-red-700 border-red-200',
};

const categoryColors = {
  work: 'bg-purple-500/10 text-purple-700',
  personal: 'bg-green-500/10 text-green-700',
  health: 'bg-pink-500/10 text-pink-700',
  general: 'bg-gray-500/10 text-gray-700',
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

  const formatTime = (time: string) => {
    return new Date(`1970-01-01T${time}`).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`transition-all duration-200 hover:shadow-md ${
        task.status === 'complete' ? 'opacity-75' : ''
      } ${isDragging ? 'shadow-lg' : ''}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Checkbox
            checked={task.status === 'complete'}
            onCheckedChange={handleToggleComplete}
            disabled={isCompleting}
            className="mt-1"
          />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3
                className={`font-medium text-sm leading-tight ${
                  task.status === 'complete' ? 'line-through text-muted-foreground' : ''
                }`}
              >
                {task.title}
              </h3>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(task)}>
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onDelete(task.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {task.description && (
              <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                {task.description}
              </p>
            )}

            <div className="flex flex-wrap gap-1 mb-2">
              <Badge
                variant="outline"
                className={`text-xs ${priorityColors[task.priority as keyof typeof priorityColors]}`}
              >
                {task.priority}
              </Badge>
              <Badge
                variant="outline"
                className={`text-xs ${categoryColors[task.category as keyof typeof categoryColors]}`}
              >
                {task.category}
              </Badge>
              {task.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>

            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              {(task.start_time || task.end_time) && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>
                    {task.start_time && formatTime(task.start_time)}
                    {task.start_time && task.end_time && ' - '}
                    {task.end_time && formatTime(task.end_time)}
                  </span>
                </div>
              )}
              {task.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  <span className="truncate">{task.location}</span>
                </div>
              )}
            </div>
          </div>
          
          <div
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-muted/50"
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