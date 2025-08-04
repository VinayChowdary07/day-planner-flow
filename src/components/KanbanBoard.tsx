
import { useKanban } from '@/hooks/useKanban';
import { KanbanColumn } from '@/components/KanbanColumn';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface KanbanBoardProps {
  projectId?: string;
}

export const KanbanBoard = ({ projectId }: KanbanBoardProps) => {
  const {
    kanbanTasks,
    draggedTask,
    loading,
    handleDragStart,
    handleDragEnd,
    handleDrop,
  } = useKanban(projectId);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading kanban board...</span>
        </CardContent>
      </Card>
    );
  }

  const columns = [
    { id: 'todo' as const, title: 'To Do', tasks: kanbanTasks.todo },
    { id: 'in-progress' as const, title: 'In Progress', tasks: kanbanTasks['in-progress'] },
    { id: 'done' as const, title: 'Done', tasks: kanbanTasks.done },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Task Board</h2>
          <p className="text-sm text-muted-foreground">
            Drag and drop tasks between columns to update their status
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {columns.map((column) => (
          <KanbanColumn
            key={column.id}
            title={column.title}
            tasks={column.tasks}
            columnId={column.id}
            onDrop={handleDrop}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            draggedTask={draggedTask}
          />
        ))}
      </div>
    </div>
  );
};
