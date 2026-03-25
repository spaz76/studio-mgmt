"use client";

import { useState, useTransition } from "react";
import { CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { updateFiringTimesAction } from "@/actions/kilns";

interface EditFiringTimesDialogProps {
  firingId: string;
  startedAt?: string | null;
  completedAt?: string | null;
  estimatedEndAt?: string | null;
}

function toInputValue(value?: string | Date | null) {
  if (!value) return "";
  const date = typeof value === "string" ? new Date(value) : value;
  if (isNaN(date.getTime())) return "";
  const pad = (num: number) => String(num).padStart(2, "0");
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}

export function EditFiringTimesDialog({
  firingId,
  startedAt,
  completedAt,
  estimatedEndAt,
}: EditFiringTimesDialogProps) {
  const [open, setOpen] = useState(false);
  const [startValue, setStartValue] = useState(() => toInputValue(startedAt));
  const [endValue, setEndValue] = useState(() => toInputValue(completedAt));
  const [estimatedValue, setEstimatedValue] = useState(() => toInputValue(estimatedEndAt));
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function resetState() {
    setStartValue(toInputValue(startedAt));
    setEndValue(toInputValue(completedAt));
    setEstimatedValue(toInputValue(estimatedEndAt));
    setError(null);
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      resetState();
    }
    setOpen(next);
  }

  function isoOrNull(value: string) {
    if (!value) return null;
    const date = new Date(value);
    if (isNaN(date.getTime())) return null;
    return date.toISOString();
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        await updateFiringTimesAction(firingId, {
          startedAt: isoOrNull(startValue),
          completedAt: isoOrNull(endValue),
          estimatedEndAt: isoOrNull(estimatedValue),
        });
        setOpen(false);
      } catch (err) {
        console.error(err);
        setError("לא הצלחתי לעדכן את הזמנים. נסי שוב.");
      }
    });
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => handleOpenChange(true)}
        className="h-8 px-2 text-xs"
      >
        <CalendarClock className="h-3.5 w-3.5 ml-1" />
        עריכת זמנים
      </Button>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>עריכת זמני שריפה</DialogTitle>
            <DialogDescription>
              אפשר להזין תאריך ושעה ידניים, גם אם השריפה נמשכה יותר מיום.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 text-destructive text-sm px-3 py-2">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor={`start-${firingId}`}>שעת התחלה</Label>
              <Input
                id={`start-${firingId}`}
                type="datetime-local"
                dir="ltr"
                value={startValue}
                onChange={(e) => setStartValue(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor={`estimate-${firingId}`}>סיום משוער</Label>
              <Input
                id={`estimate-${firingId}`}
                type="datetime-local"
                dir="ltr"
                value={estimatedValue}
                onChange={(e) => setEstimatedValue(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor={`end-${firingId}`}>שעת סיום בפועל</Label>
              <Input
                id={`end-${firingId}`}
                type="datetime-local"
                dir="ltr"
                value={endValue}
                onChange={(e) => setEndValue(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                השאירי ריק אם עדיין לא סיימת את השריפה.
              </p>
            </div>

            <div className="flex gap-2 pt-1">
              <Button type="submit" className="flex-1" disabled={isPending}>
                {isPending ? "שומרת..." : "שמור"}
              </Button>
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isPending}>
                ביטול
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
