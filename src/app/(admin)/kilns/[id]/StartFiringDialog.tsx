"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Flame } from "lucide-react";
import { createFiringAction } from "@/actions/kilns";

type FiringStage = {
  id: string;
  targetTemp: number;
  durationMinutes: number;
  sortOrder: number;
};

type FiringType = {
  id: string;
  name: string;
  stages: FiringStage[];
};

interface StartFiringDialogProps {
  kilnId: string;
  firingTypes: FiringType[];
}

const LOAD_LEVEL_OPTIONS = [
  { value: "quarter", label: "¼ — רבע תנור" },
  { value: "half", label: "½ — חצי תנור" },
  { value: "three_quarter", label: "¾ — שלושה רבעים" },
  { value: "full", label: "מלא — תנור מלא" },
];

function formatDateTime(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}

function calcTotalMinutes(stages: FiringStage[]) {
  return stages.reduce((sum, s) => sum + s.durationMinutes, 0);
}

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0
    ? `${h} שע'${m > 0 ? ` ${m} דק'` : ""}`
    : `${m} דק'`;
}

function addMinutes(isoDatetime: string, minutes: number): Date | null {
  if (!isoDatetime) return null;
  const d = new Date(isoDatetime);
  if (isNaN(d.getTime())) return null;
  return new Date(d.getTime() + minutes * 60 * 1000);
}

function formatDateTimeHe(date: Date) {
  return new Intl.DateTimeFormat("he-IL", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function StartFiringDialog({ kilnId, firingTypes }: StartFiringDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedTypeId, setSelectedTypeId] = useState<string>("");
  const [loadLevel, setLoadLevel] = useState<string>("");
  const [startDatetime, setStartDatetime] = useState<string>("");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedType = firingTypes.find((t) => t.id === selectedTypeId) ?? null;
  const totalMinutes = selectedType ? calcTotalMinutes(selectedType.stages) : 0;
  const estimatedEnd =
    selectedType && startDatetime ? addMinutes(startDatetime, totalMinutes) : null;

  function handleNow() {
    setStartDatetime(formatDateTime(new Date()));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!selectedTypeId) {
      setError("נא לבחור תוכנית שריפה");
      return;
    }
    if (!startDatetime) {
      setError("נא לבחור שעת התחלה");
      return;
    }

    const formData = new FormData();
    formData.set("kilnId", kilnId);
    formData.set("firingType", selectedType?.name ?? "custom");
    formData.set("firingTypeId", selectedTypeId);
    formData.set("loadLevel", loadLevel);
    formData.set("startedAt", new Date(startDatetime).toISOString());
    formData.set("status", "firing");
    if (estimatedEnd) {
      formData.set("estimatedEndAt", estimatedEnd.toISOString());
    }

    setIsPending(true);
    try {
      await createFiringAction(formData);
      setOpen(false);
      setSelectedTypeId("");
      setLoadLevel("");
      setStartDatetime("");
    } catch {
      setError("שגיאה בהתחלת השריפה");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <>
      <Button size="sm" variant="default" onClick={() => setOpen(true)}>
        <Flame className="h-4 w-4 ml-1" />
        התחל שריפה
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>התחלת שריפה</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 text-destructive text-sm px-3 py-2">
              {error}
            </div>
          )}

          {/* Firing type selection */}
          <div className="space-y-1.5">
            <Label>תוכנית שריפה *</Label>
            {firingTypes.length === 0 ? (
              <p className="text-sm text-muted-foreground border rounded-lg px-3 py-2 bg-muted/30">
                אין תוכניות שריפה לתנור זה — צור תוכנית תחילה
              </p>
            ) : (
              <Select value={selectedTypeId} onValueChange={(v) => setSelectedTypeId(v ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="בחר תוכנית" />
                </SelectTrigger>
                <SelectContent>
                  {firingTypes.map((ft) => {
                    const mins = calcTotalMinutes(ft.stages);
                    return (
                      <SelectItem key={ft.id} value={ft.id}>
                        {ft.name}
                        {mins > 0 && (
                          <span className="text-muted-foreground mr-1 text-xs">
                            ({formatDuration(mins)})
                          </span>
                        )}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Show stages summary if selected */}
          {selectedType && selectedType.stages.length > 0 && (
            <div className="rounded-lg border bg-muted/20 px-3 py-2 space-y-1">
              <p className="text-xs font-medium text-muted-foreground">שלבי התוכנית</p>
              {selectedType.stages.map((stage, i) => (
                <div key={stage.id} className="flex justify-between text-xs">
                  <span className="text-muted-foreground">שלב {i + 1} — {stage.targetTemp}°C</span>
                  <span>{formatDuration(stage.durationMinutes)}</span>
                </div>
              ))}
              <div className="border-t pt-1 flex justify-between text-xs font-medium">
                <span>סה״כ</span>
                <span>{formatDuration(totalMinutes)}</span>
              </div>
            </div>
          )}

          {/* Load level */}
          <div className="space-y-1.5">
            <Label>כמות טעינה</Label>
            <Select value={loadLevel} onValueChange={(v) => setLoadLevel(v ?? "")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="בחר כמות (אופציונלי)" />
              </SelectTrigger>
              <SelectContent>
                {LOAD_LEVEL_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Start time */}
          <div className="space-y-1.5">
            <Label>שעת התחלה *</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleNow}
                className="shrink-0"
              >
                עכשיו
              </Button>
              <Input
                type="datetime-local"
                value={startDatetime}
                onChange={(e) => setStartDatetime(e.target.value)}
                className="flex-1"
                dir="ltr"
              />
            </div>
          </div>

          {/* Estimated end */}
          {estimatedEnd && (
            <div className="rounded-lg border bg-orange-50 border-orange-200 px-3 py-2">
              <p className="text-xs text-orange-700 font-medium">
                שעת סיום משוערת
              </p>
              <p className="text-sm font-semibold text-orange-800 mt-0.5">
                {formatDateTimeHe(estimatedEnd)}
              </p>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <Button
              type="submit"
              disabled={isPending || firingTypes.length === 0}
              className="flex-1"
            >
              {isPending ? "מתחיל..." : "התחל שריפה"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              ביטול
            </Button>
          </div>
        </form>
      </DialogContent>
      </Dialog>
    </>
  );
}
