
import { useState, useCallback } from 'react';
import { TimedItem } from '@/types/task';
import { format } from 'date-fns';

interface ResizeState {
  isResizing: boolean;
  itemId: string | null;
  handle: 'top' | 'bottom' | null;
  startY: number;
  originalHeight: number;
  originalTop: number;
}

export const useCalendarResize = (
  onUpdateItem: (id: string, updates: { start_time?: string; end_time?: string }) => Promise<void>
) => {
  const [resizeState, setResizeState] = useState<ResizeState>({
    isResizing: false,
    itemId: null,
    handle: null,
    startY: 0,
    originalHeight: 0,
    originalTop: 0,
  });

  const startResize = useCallback((
    itemId: string,
    handle: 'top' | 'bottom',
    event: React.MouseEvent,
    element: HTMLElement
  ) => {
    event.preventDefault();
    event.stopPropagation();
    
    const rect = element.getBoundingClientRect();
    
    setResizeState({
      isResizing: true,
      itemId,
      handle,
      startY: event.clientY,
      originalHeight: rect.height,
      originalTop: rect.top,
    });

    document.body.style.cursor = 'ns-resize';
    document.body.style.userSelect = 'none';
  }, []);

  const handleResize = useCallback((event: MouseEvent) => {
    if (!resizeState.isResizing || !resizeState.itemId) return;

    const deltaY = event.clientY - resizeState.startY;
    const element = document.querySelector(`[data-item-id="${resizeState.itemId}"]`) as HTMLElement;
    
    if (!element) return;

    if (resizeState.handle === 'bottom') {
      const newHeight = Math.max(30, resizeState.originalHeight + deltaY);
      element.style.height = `${newHeight}px`;
    } else if (resizeState.handle === 'top') {
      const newHeight = Math.max(30, resizeState.originalHeight - deltaY);
      const newTop = resizeState.originalTop + deltaY;
      element.style.height = `${newHeight}px`;
      element.style.transform = `translateY(${newTop - resizeState.originalTop}px)`;
    }
  }, [resizeState]);

  const finishResize = useCallback(async (item: TimedItem) => {
    if (!resizeState.isResizing || !resizeState.itemId) return;

    const element = document.querySelector(`[data-item-id="${resizeState.itemId}"]`) as HTMLElement;
    if (!element) return;

    const rect = element.getBoundingClientRect();
    const parentRect = element.parentElement?.getBoundingClientRect();
    
    if (!parentRect) return;

    // Calculate new times based on position (assuming 24-hour day view)
    const minutesPerPixel = (24 * 60) / parentRect.height;
    const startMinutes = (rect.top - parentRect.top) * minutesPerPixel;
    const endMinutes = (rect.bottom - parentRect.top) * minutesPerPixel;

    const startHour = Math.floor(startMinutes / 60);
    const startMin = Math.floor(startMinutes % 60);
    const endHour = Math.floor(endMinutes / 60);
    const endMin = Math.floor(endMinutes % 60);

    const startTime = `${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}`;
    const endTime = `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`;

    try {
      await onUpdateItem(resizeState.itemId, {
        start_time: startTime,
        end_time: endTime,
      });
    } catch (error) {
      console.error('Failed to update item duration:', error);
      // Reset element styles on error
      element.style.height = `${resizeState.originalHeight}px`;
      element.style.transform = '';
    }

    // Clean up
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    element.style.transform = '';
    
    setResizeState({
      isResizing: false,
      itemId: null,
      handle: null,
      startY: 0,
      originalHeight: 0,
      originalTop: 0,
    });
  }, [resizeState, onUpdateItem]);

  return {
    resizeState,
    startResize,
    handleResize,
    finishResize,
  };
};
