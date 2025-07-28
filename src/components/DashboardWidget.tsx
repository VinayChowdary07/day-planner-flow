
import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GripVertical, X, Maximize2, Minimize2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardWidgetProps {
  id: string;
  title: string;
  children: React.ReactNode;
  onRemove?: () => void;
  className?: string;
  size?: 'small' | 'medium' | 'large';
}

const sizeClasses = {
  small: 'col-span-1 min-h-[200px]',
  medium: 'col-span-1 sm:col-span-2 min-h-[300px]',
  large: 'col-span-1 sm:col-span-2 lg:col-span-3 min-h-[400px]'
};

export const DashboardWidget = ({ 
  id, 
  title, 
  children, 
  onRemove,
  className,
  size = 'medium'
}: DashboardWidgetProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <>
      <Card
        ref={setNodeRef}
        style={style}
        className={cn(
          sizeClasses[size],
          'relative group transition-all duration-200 flex flex-col',
          isDragging && 'opacity-50 scale-105 shadow-lg z-50',
          !isExpanded && 'hover:shadow-md',
          className
        )}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 py-3 flex-shrink-0">
          <CardTitle className="text-sm font-medium truncate">{title}</CardTitle>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-6 w-6 p-0"
              aria-label={isExpanded ? 'Minimize widget' : 'Expand widget'}
            >
              {isExpanded ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
            </Button>
            {onRemove && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRemove}
                className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                aria-label="Remove widget"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 cursor-grab active:cursor-grabbing"
              aria-label="Drag to reorder"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="h-3 w-3" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden px-4 pb-4">
          <div className="h-full overflow-auto">
            {children}
          </div>
        </CardContent>
      </Card>

      {/* Expanded overlay */}
      {isExpanded && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-6xl max-h-[90vh] flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-6 py-4 flex-shrink-0">
              <CardTitle className="text-lg font-medium">{title}</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(false)}
                className="h-8 w-8 p-0"
                aria-label="Close expanded view"
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden px-6 pb-6">
              <div className="h-full overflow-auto">
                {children}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
};
