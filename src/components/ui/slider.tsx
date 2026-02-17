"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// Simple slider component using native HTML5 range input
interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "value"> {
  value?: number[];
  onValueChange?: (value: number[]) => void;
  min?: number;
  max?: number;
  step?: number;
}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ className, value = [0], onValueChange, min = 0, max = 100, step = 1, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = [Number(e.target.value)];
      onValueChange?.(newValue);
    };

    return (
      <div className={cn("relative flex w-full items-center", className)}>
        <input
          ref={ref}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value[0] ?? min}
          onChange={handleChange}
          className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-secondary accent-primary"
          {...props}
        />
      </div>
    );
  }
);
Slider.displayName = "Slider";

// Range slider component for price ranges
interface RangeSliderProps {
  value?: [number, number];
  onValueChange?: (value: [number, number]) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}

export function RangeSlider({
  value = [0, 100],
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  className,
}: RangeSliderProps) {
  const [localValue, setLocalValue] = React.useState<[number, number]>(value);

  React.useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMin = Number(e.target.value);
    const newValue: [number, number] = [Math.min(newMin, localValue[1]), localValue[1]];
    setLocalValue(newValue);
    onValueChange?.(newValue);
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMax = Number(e.target.value);
    const newValue: [number, number] = [localValue[0], Math.max(newMax, localValue[0])];
    setLocalValue(newValue);
    onValueChange?.(newValue);
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="relative flex items-center gap-2">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={localValue[0]}
          onChange={handleMinChange}
          className="h-2 flex-1 cursor-pointer appearance-none rounded-lg bg-secondary accent-primary"
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={localValue[1]}
          onChange={handleMaxChange}
          className="h-2 flex-1 cursor-pointer appearance-none rounded-lg bg-secondary accent-primary"
        />
      </div>
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>{localValue[0]}</span>
        <span>{localValue[1]}</span>
      </div>
    </div>
  );
}

export { Slider };


