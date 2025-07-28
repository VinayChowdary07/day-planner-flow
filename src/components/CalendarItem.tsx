
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
    e.dataTransfer.effectAllowed = 'move';
    onDragStart(item.id, type, item);
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
      draggable
      onDragStart={handleDragStart}
      onClick={onClick}
      className={cn(
        'text-xs p-2 rounded border-l-2 cursor-move hover:opacity-80 transition-opacity',
        type === 'task' && 'border-dashed',
        className
      )}
      style={getItemStyle()}
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
    </div>
  );
};
