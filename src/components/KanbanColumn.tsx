
import { Task } from '@/types/task';
import { KanbanCard } from '@/components/KanbanCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { KanbanColumn as KanbanColumnType } from '@/hooks/useKanban';
import { Plus, ListTodo, Clock, CheckCircle } from 'lucide-react';

interface KanbanColumnProps {
  title: string;
  tasks: Task[];
  columnId: KanbanColumnType;
  onDrop: (column: KanbanColumnType) => void;
  onDragStart: (task: Task) => void;
  onDragEnd: () => void;
  draggedTask: Task | null;
}

const columnConfig = {
  todo: {
    icon: ListTodo,
    color: 'bg-blue-50 dark:bg-blue-950/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  'in-progress': {
    icon: Clock,
    color: 'bg-yellow-50 dark:bg-yellow-950/20',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
    iconColor: 'text-yellow-600 dark:text-yellow-400',
  },
  done: {
    icon: CheckCircle,
    color: 'bg-green-50 dark:bg-green-950/20',
    borderColor: 'border-green-200 dark:border-green-800',
    iconColor: 'text-green-600 dark:text-green-400',
  },
};

export const KanbanColumn = ({
  title,
  tasks,
  columnId,
  onDrop,
  onDragStart,
  onDragEnd,
  draggedTask,
}: KanbanColumnProps) => {
  const config = columnConfig[columnId];
  const Icon = config.icon;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add('ring-2', 'ring-primary/50');
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove('ring-2', 'ring-primary/50');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove('ring-2', 'ring-primary/50');
    onDrop(columnId);
  };

  return (
    <Card 
      className={`h-full transition-all duration-200 ${config.color} ${config.borderColor}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm font-medium">
          <div className="flex items-center gap-2">
            <Icon className={`h-4 w-4 ${config.iconColor}`} />
            <span>{title}</span>
          </div>
          <Badge variant="secondary" className="text-xs">
            {tasks.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-0 min-h-[400px] max-h-[70vh] overflow-y-auto">
          {tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Icon className={`h-8 w-8 mb-2 ${config.iconColor} opacity-50`} />
              <p className="text-sm text-center">
                {columnId === 'todo' && 'No tasks to do'}
                {columnId === 'in-progress' && 'No tasks in progress'}
                {columnId === 'done' && 'No completed tasks'}
              </p>
              <p className="text-xs text-center mt-1">
                Drag tasks here or create new ones
              </p>
            </div>
          ) : (
            tasks.map((task) => (
              <KanbanCard
                key={task.id}
                task={task}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                isDragging={draggedTask?.id === task.id}
              />
            ))
          )}
          
          {draggedTask && (
            <div className="border-2 border-dashed border-primary/30 rounded-lg p-4 text-center text-sm text-muted-foreground bg-primary/5">
              Drop here to move to {title}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
