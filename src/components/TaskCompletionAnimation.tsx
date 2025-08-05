
import React, { useEffect, useState } from 'react';
import { CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TaskCompletionAnimationProps {
  isCompleted: boolean;
  onAnimationComplete?: () => void;
  showConfetti?: boolean;
  className?: string;
}

export const TaskCompletionAnimation = ({ 
  isCompleted, 
  onAnimationComplete,
  showConfetti = true,
  className 
}: TaskCompletionAnimationProps) => {
  const [showAnimation, setShowAnimation] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [prevCompleted, setPrevCompleted] = useState(isCompleted);

  useEffect(() => {
    // Detect changes in completion status
    if (isCompleted !== prevCompleted) {
      setPrevCompleted(isCompleted);
      
      if (isCompleted) {
        // Task was just completed
        setShowAnimation(true);
        
        // Trigger celebration after checkmark animation
        const celebrationTimer = setTimeout(() => {
          if (showConfetti) {
            setShowCelebration(true);
          }
          onAnimationComplete?.();
        }, 300);

        // Hide celebration
        const hideTimer = setTimeout(() => {
          setShowCelebration(false);
        }, 1200);

        return () => {
          clearTimeout(celebrationTimer);
          clearTimeout(hideTimer);
        };
      } else {
        // Task was unchecked
        setShowAnimation(false);
        setShowCelebration(false);
      }
    }
  }, [isCompleted, prevCompleted, onAnimationComplete, showConfetti]);

  return (
    <div className={cn("relative inline-block", className)}>
      <div className={cn(
        "relative transition-all duration-300",
        showAnimation && isCompleted && "animate-checkmark"
      )}>
        <CheckCircle 
          className={cn(
            "h-5 w-5 transition-all duration-300",
            isCompleted 
              ? "text-green-600 dark:text-green-400" 
              : "text-muted-foreground"
          )} 
        />
      </div>
      
      {/* Confetti celebration - only show if task is completed and animation is active */}
      {showCelebration && isCompleted && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {/* Multiple confetti particles */}
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className={cn(
                "absolute w-2 h-2 rounded-full animate-confetti",
                i % 3 === 0 && "bg-yellow-400",
                i % 3 === 1 && "bg-green-400", 
                i % 3 === 2 && "bg-blue-400"
              )}
              style={{
                left: `${20 + i * 10}%`,
                animationDelay: `${i * 0.1}s`,
                animationDuration: `${0.8 + i * 0.2}s`
              }}
            />
          ))}
        </div>
      )}
      
      {/* Celebration emoji - only show if task is completed and animation is active */}
      {showCelebration && isCompleted && (
        <div className="task-complete-celebration absolute inset-0" />
      )}
    </div>
  );
};
