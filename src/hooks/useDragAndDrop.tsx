
import { useState, useCallback } from 'react';
import { format, parseISO } from 'date-fns';

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
    const originalDate = type === 'event' ? data.start_datetime : data.task_date;
    setDraggedItem({ id, type, originalDate, data });
    setIsDragging(true);
  }, []);

  const endDrag = useCallback(() => {
    setDraggedItem(null);
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (
    targetDate: Date,
    updateEvent: (id: string, updates: any) => Promise<any>,
    updateTask: (id: string, updates: any) => Promise<any>
  ) => {
    if (!draggedItem) return;

    try {
      const dateString = format(targetDate, 'yyyy-MM-dd');
      
      if (draggedItem.type === 'event') {
        // For events, update the start_datetime and end_datetime
        const originalStart = parseISO(draggedItem.data.start_datetime);
        const originalEnd = parseISO(draggedItem.data.end_datetime);
        const duration = originalEnd.getTime() - originalStart.getTime();
        
        const newStart = new Date(targetDate);
        newStart.setHours(originalStart.getHours(), originalStart.getMinutes());
        
        const newEnd = new Date(newStart.getTime() + duration);
        
        await updateEvent(draggedItem.id, {
          start_datetime: newStart.toISOString(),
          end_datetime: newEnd.toISOString(),
        });
      } else {
        // For tasks, update the task_date
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
