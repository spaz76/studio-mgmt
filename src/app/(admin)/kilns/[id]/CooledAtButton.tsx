"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Thermometer } from "lucide-react";
import { setCooledAtAction } from "@/actions/kilns";

interface CooledAtButtonProps {
  firingId: string;
  cooledAt: Date | null | undefined;
}

export function CooledAtButton({ firingId, cooledAt }: CooledAtButtonProps) {
  const [isPending, startTransition] = useTransition();

  if (cooledAt) {
    return (
      <span className="text-xs text-muted-foreground flex items-center gap-1">
        <Thermometer className="h-3.5 w-3.5 text-blue-500" />
        הגיע ל-80°C:{" "}
        {new Intl.DateTimeFormat("he-IL", {
          day: "numeric",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        }).format(new Date(cooledAt))}
      </span>
    );
  }

  return (
    <Button
      size="sm"
      variant="outline"
      className="text-blue-700 border-blue-300 hover:bg-blue-50"
      disabled={isPending}
      onClick={() => startTransition(() => setCooledAtAction(firingId))}
    >
      <Thermometer className="h-3.5 w-3.5 ml-1" />
      {isPending ? "..." : "הגיע ל-80°C"}
    </Button>
  );
}
