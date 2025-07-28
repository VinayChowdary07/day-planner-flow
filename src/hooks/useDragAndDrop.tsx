
import { useState, useCallback } from 'react';
import { format, parseISO, startOfDay } from 'date-fns';

interface DragItem {
  id: string;
  type: 'event' | 'task';
  originalDate: string;
  data: any;
}

export const useDragAndDrop = () => {
  const [draggedItem, setDraggedItem] = useState<DragItem | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const startDrag = useCallback((id: string, type: 'event' | 'task', data: any) => {
    console.log('Starting drag:', { id, type, data });
    const originalDate = type === 'event' ? data.start_datetime : data.task_date;
    const dragItem = { id, type, originalDate, data };
    setDraggedItem(dragItem);
    setIsDragging(true);
  }, []);

  const endDrag = useCallback(() => {
    console.log('Ending drag');
    setDraggedItem(null);
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (
    targetDate: Date,
    updateEvent: (id: string, updates: any) => Promise<any>,
    updateTask: (id: string, updates: any) => Promise<any>
  ) => {
    if (!draggedItem) {
      console.log('No dragged item found');
      return;
    }

    console.log('Handling drop:', { draggedItem, targetDate });

    try {
      // Ensure the target date is properly normalized to start of day
      const normalizedTargetDate = startOfDay(targetDate);
      
      if (draggedItem.type === 'event') {
        // For events, update the start_datetime and end_datetime
        const originalStart = parseISO(draggedItem.data.start_datetime);
        const originalEnd = parseISO(draggedItem.data.end_datetime);
        const duration = originalEnd.getTime() - originalStart.getTime();
        
        const newStart = new Date(normalizedTargetDate);
        newStart.setHours(originalStart.getHours(), originalStart.getMinutes(), originalStart.getSeconds());
        
        const newEnd = new Date(newStart.getTime() + duration);
        
        console.log('Updating event:', {
          id: draggedItem.id,
          oldStart: draggedItem.data.start_datetime,
          newStart: newStart.toISOString(),
          newEnd: newEnd.toISOString()
        });
        
        await updateEvent(draggedItem.id, {
          start_datetime: newStart.toISOString(),
          end_datetime: newEnd.toISOString(),
        });
      } else {
        // For tasks, update the task_date
        const dateString = format(normalizedTargetDate, 'yyyy-MM-dd');
        
        console.log('Updating task:', {
          id: draggedItem.id,
          oldDate: draggedItem.data.task_date,
          newDate: dateString
        });
        
        await updateTask(draggedItem.id, {
          task_date: dateString,
        });
      }
    } catch (error) {
      console.error('Error updating item after drag:', error);
      throw error;
    } finally {
      endDrag();
    }
  }, [draggedItem, endDrag]);

  return {
    draggedItem,
    isDragging,
    startDrag,
    endDrag,
    handleDrop,
  };
};
