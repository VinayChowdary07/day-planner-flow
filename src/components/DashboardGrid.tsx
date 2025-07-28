
import { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { DashboardWidget } from './DashboardWidget';
import { TasksDashboard } from './TasksDashboard';
import { ProjectsDashboard } from './ProjectsDashboard';
import { GoalsDashboard } from './GoalsDashboard';
import { CalendarView } from './CalendarView';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Widget {
  id: string;
  type: 'tasks' | 'projects' | 'goals' | 'calendar';
  title: string;
  size: 'small' | 'medium' | 'large';
}

const defaultWidgets: Widget[] = [
  { id: 'tasks-1', type: 'tasks', title: 'Tasks', size: 'medium' },
  { id: 'calendar-1', type: 'calendar', title: 'Calendar', size: 'large' },
  { id: 'projects-1', type: 'projects', title: 'Projects', size: 'medium' },
  { id: 'goals-1', type: 'goals', title: 'Goals', size: 'small' },
];

const widgetComponents = {
  tasks: TasksDashboard,
  projects: ProjectsDashboard,
  goals: GoalsDashboard,
  calendar: CalendarView,
};

export const DashboardGrid = () => {
  const [widgets, setWidgets] = useState<Widget[]>(() => {
    const saved = localStorage.getItem('dashboard-widgets');
    return saved ? JSON.parse(saved) : defaultWidgets;
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    localStorage.setItem('dashboard-widgets', JSON.stringify(widgets));
  }, [widgets]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setWidgets((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over?.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const addWidget = (type: Widget['type']) => {
    const newWidget: Widget = {
      id: `${type}-${Date.now()}`,
      type,
      title: type.charAt(0).toUpperCase() + type.slice(1),
      size: 'medium',
    };
    setWidgets([...widgets, newWidget]);
  };

  const removeWidget = (id: string) => {
    setWidgets(widgets.filter(widget => widget.id !== id));
  };

  const renderWidgetContent = (widget: Widget) => {
    const Component = widgetComponents[widget.type];
    return <Component />;
  };

  return (
    <div className="space-y-6 p-2">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Widget
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => addWidget('tasks')}>
              Tasks Widget
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => addWidget('projects')}>
              Projects Widget
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => addWidget('goals')}>
              Goals Widget
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => addWidget('calendar')}>
              Calendar Widget
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 min-h-0">
          <SortableContext items={widgets.map(w => w.id)} strategy={rectSortingStrategy}>
            {widgets.map((widget) => (
              <DashboardWidget
                key={widget.id}
                id={widget.id}
                title={widget.title}
                size={widget.size}
                onRemove={() => removeWidget(widget.id)}
              >
                {renderWidgetContent(widget)}
              </DashboardWidget>
            ))}
          </SortableContext>
        </div>
      </DndContext>
    </div>
  );
};
