
import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";

const AnimatedProgress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & {
    animated?: boolean;
  }
>(({ className, value, animated = true, ...props }, ref) => {
  const [displayValue, setDisplayValue] = React.useState(0);

  React.useEffect(() => {
    if (animated && value !== undefined) {
      const timer = setTimeout(() => {
        setDisplayValue(value);
      }, 100);
      return () => clearTimeout(timer);
    } else if (value !== undefined) {
      setDisplayValue(value);
    }
  }, [value, animated]);

  return (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn(
        "relative h-3 w-full overflow-hidden rounded-full bg-secondary",
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn(
          "h-full w-full flex-1 bg-primary transition-all duration-700 ease-out",
          animated && "animate-progress"
        )}
        style={{ transform: `translateX(-${100 - (displayValue || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  );
});

AnimatedProgress.displayName = "AnimatedProgress";

export { AnimatedProgress };
