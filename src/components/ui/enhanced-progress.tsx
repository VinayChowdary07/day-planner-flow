
import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";

interface EnhancedProgressProps extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  value?: number;
  type?: 'linear' | 'radial' | 'segmented';
  showAnimation?: boolean;
  showShimmer?: boolean;
  segments?: number;
  size?: 'sm' | 'md' | 'lg';
}

const EnhancedProgress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  EnhancedProgressProps
>(({ 
  className, 
  value = 0, 
  type = 'linear',
  showAnimation = true,
  showShimmer = false,
  segments = 5,
  size = 'md',
  ...props 
}, ref) => {
  const [displayValue, setDisplayValue] = React.useState(0);

  React.useEffect(() => {
    if (showAnimation) {
      const timer = setTimeout(() => {
        setDisplayValue(value);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setDisplayValue(value);
    }
  }, [value, showAnimation]);

  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  };

  if (type === 'radial') {
    const radius = 45;
    const circumference = 2 * Math.PI * radius;
    const strokeDasharray = `${(displayValue / 100) * circumference} ${circumference}`;

    return (
      <div className="radial-progress flex items-center justify-center">
        <svg width="120" height="120" className="transform -rotate-90">
          <circle
            cx="60"
            cy="60"
            r={radius}
            className="progress-ring"
          />
          <circle
            cx="60"
            cy="60"
            r={radius}
            className="progress-fill animate-radial-progress"
            style={{
              strokeDasharray,
              '--progress-dash': (displayValue / 100) * circumference
            } as React.CSSProperties}
          />
        </svg>
        <div className="absolute text-lg font-bold text-foreground">
          {Math.round(displayValue)}%
        </div>
      </div>
    );
  }

  if (type === 'segmented') {
    const segmentWidth = 100 / segments;
    const filledSegments = Math.floor((displayValue / 100) * segments);
    const partialFill = ((displayValue / 100) * segments) % 1;

    return (
      <div className={cn("flex gap-1", className)}>
        {Array.from({ length: segments }).map((_, index) => {
          let fillPercentage = 0;
          if (index < filledSegments) {
            fillPercentage = 100;
          } else if (index === filledSegments) {
            fillPercentage = partialFill * 100;
          }

          return (
            <div
              key={index}
              className={cn(
                "flex-1 bg-secondary rounded-sm overflow-hidden",
                sizeClasses[size]
              )}
            >
              <div
                className={cn(
                  "h-full bg-primary transition-all duration-700 ease-out",
                  showAnimation && "animate-progress-fill"
                )}
                style={{ 
                  width: `${fillPercentage}%`,
                  '--progress-width': `${fillPercentage}%`
                } as React.CSSProperties}
              />
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn(
        "relative w-full overflow-hidden rounded-full bg-secondary",
        sizeClasses[size],
        showShimmer && "progress-enhanced",
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn(
          "h-full w-full flex-1 bg-primary transition-all duration-700 ease-out",
          showAnimation && "animate-progress-fill"
        )}
        style={{ 
          transform: `translateX(-${100 - displayValue}%)`,
          '--progress-width': `${displayValue}%`
        } as React.CSSProperties}
      />
    </ProgressPrimitive.Root>
  );
});

EnhancedProgress.displayName = "EnhancedProgress";

export { EnhancedProgress };
