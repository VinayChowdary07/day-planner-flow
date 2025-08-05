
import React, { useMemo } from 'react';
import { format, parseISO, isSameDay } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, Star, CheckCircle2, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TimedItem } from '@/types/task';
import { useCalendarResize } from '@/hooks/useCalendarResize';

interface AgendaViewProps {
  selectedDate: Date;
  events: any[];
  tasks: any[];
  onUpdateEvent: (id: string, updates: any) => Promise<void>;
  onUpdateTask: (id: string, updates: any) => Promise<void>;
}

export const AgendaView: React.FC<AgendaViewProps> = ({
  selectedDate,
  events,
  tasks,
  onUpdateEvent,
  onUpdateTask,
}) => {
  const { resizeState, startResize, handleResize, finishResize } = useCalendarResize(
    async (id: string, updates: { start_time?: string; end_time?: string }) => {
      // Determine if it's an event or task and call appropriate update function
      const isEvent = events.some(e => e.id === id);
      if (isEvent) {
        await onUpdateEvent(id, updates);
      } else {
        await onUpdateTask(id, updates);
      }
    }
  );

  // Convert events and tasks to timed items
  const timedItems = useMemo<TimedItem[]>(() => {
    const items: TimedItem[] = [];
    
    // Add events for selected date
    events.forEach(event => {
      const eventDate = parseISO(event.start_datetime);
      if (isSameDay(eventDate, selectedDate)) {
        items.push({
          id: event.id,
          title: event.title,
          start: parseISO(event.start_datetime),
          end: parseISO(event.end_datetime),
          type: 'event',
          color: event.color,
        });
      }
    });

    // Add tasks for selected date
    tasks.forEach(task => {
      const taskDate = new Date(task.task_date);
      if (isSameDay(taskDate, selectedDate) && task.start_time && task.end_time) {
        const startDateTime = new Date(`${task.task_date}T${task.start_time}`);
        const endDateTime = new Date(`${task.task_date}T${task.end_time}`);
        
        items.push({
          id: task.id,
          title: task.title,
          start: startDateTime,
          end: endDateTime,
          type: 'task',
          category: task.category,
          status: task.status,
          priority: task.priority,
        });
      }
    });

    return items.sort((a, b) => a.start.getTime() - b.start.getTime());
  }, [events, tasks, selectedDate]);

  // Generate hour slots (7 AM to 10 PM)
  const hourSlots = useMemo(() => {
    const slots = [];
    for (let hour = 7; hour <= 22; hour++) {
      slots.push({
        time: `${hour.toString().padStart(2, '0')}:00`,
        label: format(new Date(2024, 0, 1, hour), 'ha'),
      });
    }
    return slots;
  }, []);

  // Calculate item positions
  const getItemStyle = (item: TimedItem) => {
    const startHour = item.start.getHours() + item.start.getMinutes() / 60;
    const endHour = item.end.getHours() + item.end.getMinutes() / 60;
    
    // Position relative to 7 AM start
    const top = Math.max(0, (startHour - 7) * 60); // 60px per hour
    const height = Math.max(30, (endHour - startHour) * 60);
    
    return {
      top: `${top}px`,
      height: `${height}px`,
      position: 'absolute' as const,
      left: '60px',
      right: '16px',
      zIndex: 10,
    };
  };

  // Handle mouse events for resizing
  React.useEffect(() => {
    if (resizeState.isResizing) {
      const handleMouseMove = (e: MouseEvent) => handleResize(e);
      const handleMouseUp = () => {
        const item = timedItems.find(i => i.id === resizeState.itemId);
        if (item) finishResize(item);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [resizeState, handleResize, finishResize, timedItems]);

  return (
    <Card className="bg-card/60 backdrop-blur-sm border border-border/60 shadow-lg">
      <CardContent className="p-0">
        <div className="relative">
          {/* Time grid */}
          <div className="relative" style={{ height: '960px' }}> {/* 16 hours * 60px */}
            {/* Hour lines */}
            {hourSlots.map((slot, index) => (
              <div key={slot.time} className="absolute left-0 right-0 flex items-center">
                <div 
                  className="text-sm text-muted-foreground font-medium w-12 text-right pr-2"
                  style={{ top: `${index * 60}px` }}
                >
                  {slot.label}
                </div>
                <div 
                  className="flex-1 border-t border-border/30"
                  style={{ top: `${index * 60}px` }}
                />
              </div>
            ))}

            {/* Timed items */}
            {timedItems.map((item) => {
              const itemStyle = getItemStyle(item);
              const isTask = item.type === 'task';
              
              return (
                <div
                  key={item.id}
                  data-item-id={item.id}
                  className={cn(
                    "group rounded-lg border-l-4 p-3 cursor-pointer transition-all duration-200 hover:shadow-md",
                    "bg-gradient-to-r backdrop-blur-sm",
                    isTask 
                      ? "border-dashed bg-amber-50/90 border-amber-400 hover:bg-amber-100/90 dark:bg-amber-950/20 dark:hover:bg-amber-950/30"
                      : "bg-blue-50/90 border-blue-400 hover:bg-blue-100/90 dark:bg-blue-950/20 dark:hover:bg-blue-950/30"
                  )}
                  style={{
                    ...itemStyle,
                    borderLeftColor: item.color || (isTask ? '#f59e0b' : '#3b82f6'),
                  }}
                >
                  {/* Resize handles */}
                  <div
                    className="absolute top-0 left-0 right-0 h-1 cursor-ns-resize opacity-0 group-hover:opacity-100 bg-primary/20 transition-opacity"
                    onMouseDown={(e) => startResize(item.id, 'top', e, e.currentTarget.parentElement!)}
                  />
                  <div
                    className="absolute bottom-0 left-0 right-0 h-1 cursor-ns-resize opacity-0 group-hover:opacity-100 bg-primary/20 transition-opacity"
                    onMouseDown={(e) => startResize(item.id, 'bottom', e, e.currentTarget.parentElement!)}
                  />

                  <div className="flex items-start gap-2 relative z-10">
                    {isTask && (
                      item.status === 'complete' ? 
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" /> :
                        <Circle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <h4 className={cn(
                        "font-semibold text-sm mb-1 truncate",
                        isTask && item.status === 'complete' && "line-through opacity-75"
                      )}>
                        {item.title}
                      </h4>
                      
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                        <Clock className="w-3 h-3" />
                        <span>
                          {format(item.start, 'HH:mm')} - {format(item.end, 'HH:mm')}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {isTask && item.priority === 'high' && (
                          <Badge variant="destructive" className="text-xs py-0">
                            <Star className="w-3 h-3 mr-1 fill-current" />
                            High
                          </Badge>
                        )}
                        
                        {item.category && (
                          <Badge variant="secondary" className="text-xs py-0">
                            {item.category}
                          </Badge>
                        )}

                        {isTask && (
                          <Badge 
                            variant={item.status === 'complete' ? 'default' : 'outline'}
                            className="text-xs py-0"
                          >
                            {item.status}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Empty state */}
            {timedItems.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No scheduled items for this day</p>
                  <p className="text-sm">Add start and end times to see items here</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
