"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { updateFiringStatusAction } from "@/actions/kilns";

interface FiringStatusButtonProps {
  firingId: string;
  currentStatus: string;
}

export function FiringStatusButton({ firingId, currentStatus }: FiringStatusButtonProps) {
  const [isPending, startTransition] = useTransition();

  if (currentStatus === "completed") {
    return <span className="text-xs text-muted-foreground">התנור סיים.</span>;
  }

  const handleComplete = () => {
    startTransition(() => updateFiringStatusAction(firingId, "completed"));
  };

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={handleComplete}
      disabled={isPending}
      className="whitespace-nowrap"
    >
      {isPending ? "..." : "לחץ כשהתנור מתקרר"}
    </Button>
  );
}
