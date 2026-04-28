import { Badge } from "@/components/ui/badge";
import { STATUS_LABELS, STATUS_COLORS, type Status } from "@/lib/validations";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const label = STATUS_LABELS[status as Status] || status;
  const color = STATUS_COLORS[status as Status] || "bg-gray-100 text-gray-800";

  return (
    <Badge variant="outline" className={cn("font-medium border-0", color)}>
      {label}
    </Badge>
  );
}
