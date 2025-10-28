"use client";

import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function QuantitySelector({
  value,
  min = 1,
  max = 8,
  onChange,
}: {
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
}) {
  const decrease = () => {
    const next = Math.max(min, value - 1);
    onChange(next);
  };

  const increase = () => {
    const next = Math.min(max, value + 1);
    onChange(next);
  };

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-[rgb(var(--border))] bg-white px-3 py-1">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={decrease}
        disabled={value <= min}
        className="h-8 w-8 rounded-full"
      >
        <Minus className="h-4 w-4" />
      </Button>
      <span className="min-w-[2rem] text-center text-sm font-semibold">{value}</span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={increase}
        disabled={value >= max}
        className="h-8 w-8 rounded-full"
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}
