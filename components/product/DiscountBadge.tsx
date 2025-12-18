import { Badge } from "@/components/ui/badge";

export function DiscountBadge({ label, percent }: { label: string; percent?: number }) {
  return (
    <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">
      {percent ? `${label} • ${percent}%` : label}
    </Badge>
  );
}
