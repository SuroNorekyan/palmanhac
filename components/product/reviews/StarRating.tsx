import { Star } from "lucide-react";
import { cn } from "@/lib/utils/format";

type StarRatingProps = {
  value: number;
  onChange?: (value: number) => void;
  readOnly?: boolean;
  size?: "sm" | "md";
};

export function StarRating({
  value,
  onChange,
  readOnly = false,
  size = "md",
}: StarRatingProps) {
  const stars = Array.from({ length: 5 }, (_, index) => index + 1);
  const starClass = size === "sm" ? "h-4 w-4" : "h-5 w-5";

  return (
    <div className="flex items-center gap-1">
      {stars.map((star) => {
        const filled = star <= value;
        return (
          <button
            key={star}
            type="button"
            className={cn(
              "rounded-full p-1",
              readOnly ? "cursor-default" : "cursor-pointer hover:text-amber-500",
            )}
            onClick={() => {
              if (!readOnly && onChange) {
                onChange(star);
              }
            }}
            aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
            disabled={readOnly}
          >
            <Star
              className={cn(
                starClass,
                filled ? "fill-amber-400 text-amber-500" : "text-neutral-300",
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
