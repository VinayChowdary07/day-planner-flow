
import React from 'react';
import { Clock, MapPin, CheckCircle2, Circle, Move } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { TimedItem } from '@/types/task';

interface ResizableCalendarItemProps {
  item: any;
  type: 'event' | 'task';
  onClick: () => void;
  onDragStart: (id: string, type: 'event' | 'task', data: any) => void;
  onResizeStart?: (id: string, handle: 'top' | 'bottom', e: React.MouseEvent) => void;
  className?: string;
  showDuration?: boolean;
}

export const ResizableCalendarItem: React.FC<ResizableCalendarItemProps> = ({
  item,
  type,
  onClick,
  onDragStart,
  onResizeStart,
  className,
  showDuration = false,
}) => {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/json', JSON.stringify({
      id: item.id,
      type: type,
      data: item
    }));
    onDragStart(item.id, type, item);
    
    const target = e.target as HTMLElement;
    target.classList.add('opacity-50');
  };

  const handleDragEnd = (e: React.DragEvent) => {
    const target = e.target as HTMLElement;
    target.classList.remove('opacity-50');
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick();
  };

  const getItemStyle = () => {
    if (type === 'event') {
      return {
        backgroundColor: item.color + '15',
        borderColor: item.color,
        color: item.color,
      };
    } else {
      return {
        backgroundColor: item.status === 'complete' ? '#10b98115' : '#f59e0b15',
        borderColor: item.status === 'complete' ? '#10b981' : '#f59e0b',
        color: item.status === 'complete' ? '#10b981' : '#f59e0b',
      };
    }
  };

  const hasTimeRange = item.start_time && item.end_time;

  return (
    <div
      draggable={true}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
      className={cn(
        'group relative text-xs p-2 rounded-md border-l-2 cursor-grab active:cursor-grabbing',
        'hover:shadow-sm transition-all duration-200 select-none',
        type === 'task' && 'border-dashed',
        hasTimeRange && showDuration && 'min-h-[60px]',
        className
      )}
      style={{
        ...getItemStyle(),
        outline: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none',
        userSelect: 'none',
      }}
    >
      {/* Resize handles - only show for items with duration */}
      {hasTimeRange && onResizeStart && (
        <>
          <div
            className="absolute top-0 left-0 right-0 h-1 cursor-ns-resize opacity-0 group-hover:opacity-100 bg-primary/30 transition-opacity rounded-t-md"
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onResizeStart(item.id, 'top', e);
            }}
          />
          <div
            className="absolute bottom-0 left-0 right-0 h-1 cursor-ns-resize opacity-0 group-hover:opacity-100 bg-primary/30 transition-opacity rounded-b-md"
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onResizeStart(item.id, 'bottom', e);
            }}
          />
        </>
      )}

      <div className="flex items-start gap-2">
        <Move className="w-3 h-3 opacity-50 group-hover:opacity-100 transition-opacity mt-0.5 flex-shrink-0" />
        
        {type === 'task' && (
          item.status === 'complete' ? 
            <CheckCircle2 className="w-3 h-3 flex-shrink-0 mt-0.5" /> :
            <Circle className="w-3 h-3 flex-shrink-0 mt-0.5" />
        )}
        
        <div className="flex-1 min-w-0">
          <div className={cn(
            "font-medium truncate mb-1",
            type === 'task' && item.status === 'complete' && "line-through opacity-75"
          )}>
            {item.title}
          </div>
          
          {/* Time display */}
          {hasTimeRange && (
            <div className="flex items-center gap-1 text-xs opacity-75 mb-1">
              <Clock className="w-3 h-3" />
              <span>
                {item.start_time} - {item.end_time}
              </span>
            </div>
          )}

          {/* Event time for events without separate start/end time fields */}
          {type === 'event' && !item.is_all_day && !hasTimeRange && (
            <div className="flex items-center gap-1 text-xs opacity-75 mb-1">
              <Clock className="w-3 h-3" />
              <span>
                {format(parseISO(item.start_datetime), 'HH:mm')}
              </span>
            </div>
          )}
          
          {item.location && (
            <div className="flex items-center gap-1 text-xs opacity-75">
              <MapPin className="w-3 h-3" />
              <span className="truncate">{item.location}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
