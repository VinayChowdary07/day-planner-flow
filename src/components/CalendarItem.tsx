
import React from 'react';
import { Clock, MapPin, CheckCircle, Circle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

interface CalendarItemProps {
  item: any;
  type: 'event' | 'task';
  onClick: () => void;
  onDragStart: (id: string, type: 'event' | 'task', data: any) => void;
  className?: string;
}

export const CalendarItem: React.FC<CalendarItemProps> = ({
  item,
  type,
  onClick,
  onDragStart,
  className,
}) => {
  const handleDragStart = (e: React.DragEvent) => {
    console.log('Drag start event triggered for:', item.id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/json', JSON.stringify({
      id: item.id,
      type: type,
      data: item
    }));
    onDragStart(item.id, type, item);
    
    // Add dragging class
    const target = e.target as HTMLElement;
    target.classList.add('dragging');
  };

  const handleDragEnd = (e: React.DragEvent) => {
    console.log('Drag end event triggered for:', item.id);
    e.dataTransfer.clearData();
    
    // Remove dragging class
    const target = e.target as HTMLElement;
    target.classList.remove('dragging');
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick();
  };

  const getItemStyle = () => {
    if (type === 'event') {
      return {
        backgroundColor: item.color + '20',
        borderColor: item.color,
        color: item.color,
      };
    } else {
      // Task styling
      return {
        backgroundColor: item.status === 'complete' ? '#10b98120' : '#f59e0b20',
        borderColor: item.status === 'complete' ? '#10b981' : '#f59e0b',
        color: item.status === 'complete' ? '#10b981' : '#f59e0b',
      };
    }
  };

  return (
    <div
      draggable={true}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
      className={cn(
        'text-xs p-1.5 rounded border-l-2 cursor-grab active:cursor-grabbing hover:opacity-80 transition-all duration-200 select-none',
        'focus:outline-none focus:ring-0 focus:border-transparent',
        'drag-item',
        type === 'task' && 'border-dashed',
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
      <div className="flex items-center gap-1 mb-1">
        {type === 'task' && (
          item.status === 'complete' ? 
            <CheckCircle className="h-3 w-3 flex-shrink-0" /> :
            <Circle className="h-3 w-3 flex-shrink-0" />
        )}
        <div className="font-medium truncate">{item.title}</div>
      </div>
      
      {type === 'event' && !item.is_all_day && (
        <div className="flex items-center gap-1 text-xs opacity-75">
          <Clock className="h-3 w-3" />
          {format(parseISO(item.start_datetime), 'HH:mm')}
        </div>
      )}
      
      {type === 'task' && item.start_time && (
        <div className="flex items-center gap-1 text-xs opacity-75">
          <Clock className="h-3 w-3" />
          {item.start_time}
        </div>
      )}
      
      {item.location && (
        <div className="flex items-center gap-1 text-xs opacity-75 mt-1">
          <MapPin className="h-3 w-3" />
          <span className="truncate">{item.location}</span>
        </div>
      )}
      
      <style>{`
        .drag-item:focus,
        .drag-item:active,
        .drag-item[draggable="true"]:focus,
        .drag-item[draggable="true"]:active {
          outline: none !important;
          border-color: currentColor !important;
          box-shadow: none !important;
        }
        
        .drag-item::-moz-focus-inner {
          border: 0 !important;
        }
        
        .drag-item {
          -webkit-touch-callout: none;
          -webkit-user-select: none;
          -khtml-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          user-select: none;
        }

        .drag-item.dragging {
          border-color: hsl(var(--primary)) !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
          background: hsl(var(--primary) / 0.1) !important;
          transform: scale(1.02);
          z-index: 1000;
        }

        .drag-item:focus-visible {
          outline: 2px solid hsl(var(--primary)) !important;
          outline-offset: 2px !important;
        }
      `}</style>
    </div>
  );
};
