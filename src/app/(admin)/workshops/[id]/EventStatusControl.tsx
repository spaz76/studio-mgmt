"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { updateEventStatus } from "@/actions/workshop-events";
import { STATUS_LABELS } from "@/lib/workshop-status";
import type { WorkshopStatus } from "@/generated/prisma";

const TRANSITIONS: Record<WorkshopStatus, WorkshopStatus[]> = {
  draft: ["open", "cancelled"],
  open: ["confirmed", "cancelled", "postponed"],
  pending_minimum: ["confirmed", "cancelled", "postponed"],
  confirmed: ["full", "cancelled", "postponed", "completed"],
  full: ["confirmed", "cancelled", "completed"],
  cancelled: [],
  postponed: ["draft", "open"],
  completed: [],
};

const TRANSITION_LABELS: Partial<Record<WorkshopStatus, string>> = {
  open: "פתח לרישום",
  confirmed: "אשר",
  cancelled: "בטל",
  postponed: "דחה",
  completed: "סמן כהסתיים",
  draft: "החזר לטיוטה",
};

const TRANSITION_VARIANTS: Partial<
  Record<WorkshopStatus, "default" | "outline" | "destructive">
> = {
  open: "default",
  confirmed: "default",
  cancelled: "destructive",
  postponed: "outline",
  completed: "outline",
  draft: "outline",
};

export function EventStatusControl({
  eventId,
  currentStatus,
}: {
  eventId: string;
  currentStatus: WorkshopStatus;
}) {
  const [isPending, startTransition] = useTransition();
  const next = TRANSITIONS[currentStatus];

  if (next.length === 0) return null;

  function handleTransition(status: WorkshopStatus) {
    if (status === "cancelled" && !confirm("לבטל את הסדנה?")) return;
    startTransition(() => updateEventStatus(eventId, status));
  }

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <span className="text-sm text-muted-foreground">פעולות:</span>
      {next.map((status) => (
        <Button
          key={status}
          size="sm"
          variant={TRANSITION_VARIANTS[status] ?? "outline"}
          onClick={() => handleTransition(status)}
          disabled={isPending}
        >
          {isPending ? "..." : (TRANSITION_LABELS[status] ?? STATUS_LABELS[status])}
        </Button>
      ))}
    </div>
  );
}
