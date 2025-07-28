
import { useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AnimatedProgressBarProps {
  value: number;
  label?: string;
  showCompletion?: boolean;
  className?: string;
}

export const AnimatedProgressBar = ({
  value,
  label,
  showCompletion = true,
  className,
}: AnimatedProgressBarProps) => {
  const [displayValue, setDisplayValue] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showCompletionEffect, setShowCompletionEffect] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDisplayValue(value);
      
      if (value === 100 && showCompletion) {
        setTimeout(() => {
          setIsCompleted(true);
          setShowCompletionEffect(true);
          
          // Hide completion effect after animation
          setTimeout(() => {
            setShowCompletionEffect(false);
          }, 1000);
        }, 500);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [value, showCompletion]);

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">{label}</span>
          <span className="text-muted-foreground">{Math.round(displayValue)}%</span>
        </div>
      )}
      
      <div className="relative">
        <Progress
          value={displayValue}
          className={cn(
            'h-2 transition-all duration-700 ease-out',
            isCompleted && 'bg-green-100 dark:bg-green-900/20'
          )}
        />
        
        {/* Completion effect */}
        {showCompletionEffect && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-scale-in">
              <CheckCircle className="h-6 w-6 text-green-600 animate-pulse" />
            </div>
          </div>
        )}
        
        {/* Ripple effect on completion */}
        {showCompletionEffect && (
          <div className="absolute inset-0 rounded-full animate-ping bg-green-400/30" />
        )}
      </div>
    </div>
  );
};
