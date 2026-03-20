import type { WorkshopStatus } from "@/generated/prisma";

export const STATUS_LABELS: Record<WorkshopStatus, string> = {
  draft: "טיוטה",
  open: "פתוח",
  pending_minimum: "ממתין למינימום",
  confirmed: "מאושר",
  full: "מלא",
  cancelled: "מבוטל",
  postponed: "נדחה",
  completed: "הסתיים",
};

export const STATUS_VARIANTS: Record<
  WorkshopStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  draft: "outline",
  open: "secondary",
  pending_minimum: "outline",
  confirmed: "default",
  full: "default",
  cancelled: "destructive",
  postponed: "outline",
  completed: "secondary",
};
