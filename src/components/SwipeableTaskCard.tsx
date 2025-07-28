
import { useState, useRef, useEffect } from 'react';
import { Task } from '@/types/task';
import { TaskCard } from './TaskCard';
import { Button } from '@/components/ui/button';
import { Check, Trash2, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SwipeableTaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onToggleComplete: (id: string) => void;
  onReschedule?: (id: string) => void;
}

export const SwipeableTaskCard = ({
  task,
  onEdit,
  onDelete,
  onToggleComplete,
  onReschedule,
}: SwipeableTaskCardProps) => {
  const [isSwipeRevealed, setIsSwipeRevealed] = useState(false);
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    
    const currentX = e.touches[0].clientX;
    const diff = startX - currentX;
    
    if (diff > 0 && diff < 150) {
      setCurrentX(diff);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    
    if (currentX > 75) {
      setIsSwipeRevealed(true);
      setCurrentX(150);
    } else {
      setIsSwipeRevealed(false);
      setCurrentX(0);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setStartX(e.clientX);
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const currentX = e.clientX;
    const diff = startX - currentX;
    
    if (diff > 0 && diff < 150) {
      setCurrentX(diff);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    
    if (currentX > 75) {
      setIsSwipeRevealed(true);
      setCurrentX(150);
    } else {
      setIsSwipeRevealed(false);
      setCurrentX(0);
    }
  };

  const handleAction = (action: () => void) => {
    action();
    setIsSwipeRevealed(false);
    setCurrentX(0);
  };

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        handleMouseMove(e as any);
      }
    };

    const handleGlobalMouseUp = () => {
      if (isDragging) {
        handleMouseUp();
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, startX]);

  return (
    <div className="relative overflow-hidden rounded-lg">
      {/* Action buttons background */}
      <div 
        className={cn(
          'absolute right-0 top-0 h-full bg-gradient-to-l from-destructive/20 to-transparent',
          'flex items-center justify-end px-4 gap-2 transition-all duration-200',
          isSwipeRevealed ? 'opacity-100' : 'opacity-0'
        )}
      >
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
          onClick={() => handleAction(() => onToggleComplete(task.id))}
        >
          <Check className="h-4 w-4" />
        </Button>
        {onReschedule && (
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            onClick={() => handleAction(() => onReschedule(task.id))}
          >
            <Calendar className="h-4 w-4" />
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={() => handleAction(() => onDelete(task.id))}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Task card */}
      <div
        ref={cardRef}
        className={cn(
          'relative bg-card transition-transform duration-200 ease-out',
          isDragging ? 'transition-none' : 'transition-transform'
        )}
        style={{
          transform: `translateX(-${currentX}px)`,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
      >
        <TaskCard
          task={task}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggleComplete={onToggleComplete}
        />
      </div>
    </div>
  );
};
