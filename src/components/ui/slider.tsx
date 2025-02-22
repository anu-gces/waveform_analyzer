import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";

import { cn } from "@/lib/utils";

interface SliderProps extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
  trackColor?: string;
  rangeColor?: string;
}

const Slider = React.forwardRef<React.ElementRef<typeof SliderPrimitive.Root>, SliderProps>(
  ({ className, trackColor = "bg-primary/50", rangeColor = "bg-primary", ...props }, ref) => (
    <SliderPrimitive.Root
      ref={ref}
      className={cn("relative flex w-full touch-none select-none items-center", className)}
      {...props}
    >
      <SliderPrimitive.Track className={cn("relative rounded-full w-full h-1.5 overflow-hidden grow", trackColor)}>
        <SliderPrimitive.Range className={cn("absolute h-full", rangeColor)} />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb className="block border-primary/50 bg-background disabled:opacity-50 shadow border rounded-full focus-visible:ring-1 focus-visible:ring-ring w-4 h-4 transition-colors disabled:pointer-events-none focus-visible:outline-none" />
    </SliderPrimitive.Root>
  )
);
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
