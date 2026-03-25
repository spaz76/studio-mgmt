"use client";

import { useState, useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Trash2 } from "lucide-react";
import { createFiringTypeAction } from "@/actions/kilns";

type Stage = {
  targetTemp: string;
  durationHours: string;
  durationMinutes: string;
};

type FormState = { error?: string; success?: boolean } | null;

interface FiringTypeDialogProps {
  kilnId: string;
}

export function FiringTypeDialog({ kilnId }: FiringTypeDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [stages, setStages] = useState<Stage[]>([
    { targetTemp: "", durationHours: "1", durationMinutes: "0" },
  ]);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function addStage() {
    setStages((s) => [
      ...s,
      { targetTemp: "", durationHours: "0", durationMinutes: "30" },
    ]);
  }

  function removeStage(index: number) {
    setStages((s) => s.filter((_, i) => i !== index));
  }

  function updateStage(index: number, field: keyof Stage, value: string) {
    setStages((s) =>
      s.map((stage, i) => (i === index ? { ...stage, [field]: value } : stage))
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!name.trim()) {
      setError("נא להזין שם לתוכנית");
      return;
    }
    if (stages.length === 0) {
      setError("נא להוסיף לפחות שלב אחד");
      return;
    }

    const parsedStages = stages.map((s, i) => {
      const hours = parseInt(s.durationHours || "0", 10) || 0;
      const mins = parseInt(s.durationMinutes || "0", 10) || 0;
      return {
        targetTemp: parseInt(s.targetTemp || "0", 10) || 0,
        durationMinutes: hours * 60 + mins,
        sortOrder: i,
      };
    });

    const formData = new FormData();
    formData.set("kilnId", kilnId);
    formData.set("name", name.trim());
    formData.set("stages", JSON.stringify(parsedStages));

    setIsPending(true);
    try {
      await createFiringTypeAction(formData);
      setSuccess(true);
      setName("");
      setStages([{ targetTemp: "", durationHours: "1", durationMinutes: "0" }]);
      setTimeout(() => setOpen(false), 800);
    } catch {
      setError("שגיאה בשמירת התוכנית");
    } finally {
      setIsPending(false);
    }
  }

  function totalMinutes() {
    return stages.reduce((sum, s) => {
      const h = parseInt(s.durationHours || "0", 10) || 0;
      const m = parseInt(s.durationMinutes || "0", 10) || 0;
      return sum + h * 60 + m;
    }, 0);
  }

  const total = totalMinutes();
  const totalDisplay =
    total > 0
      ? `${Math.floor(total / 60)} שעות ${total % 60 > 0 ? `${total % 60} דקות` : ""}`
      : "";

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4 ml-1" />
        תכנת שריפה
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>תוכנית שריפה חדשה</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="rounded-md bg-destructive/10 text-destructive text-sm px-3 py-2">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-md bg-green-50 text-green-700 text-sm px-3 py-2">
              התוכנית נשמרה בהצלחה
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="ft-name">שם התוכנית *</Label>
            <Input
              id="ft-name"
              placeholder='למשל: "ביסקוויט 1020°"'
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              dir="rtl"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>שלבי השריפה</Label>
              {total > 0 && (
                <span className="text-xs text-muted-foreground">
                  סה״כ: {totalDisplay}
                </span>
              )}
            </div>

            {stages.map((stage, i) => (
              <div
                key={i}
                className="flex items-end gap-2 p-3 rounded-lg border bg-muted/20"
              >
                <span className="text-xs text-muted-foreground w-5 text-center shrink-0 pb-1">
                  {i + 1}
                </span>
                <div className="flex-1 space-y-1.5">
                  <Label className="text-xs">טמפרטורה יעד (°C)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={2000}
                    placeholder="1020"
                    value={stage.targetTemp}
                    onChange={(e) => updateStage(i, "targetTemp", e.target.value)}
                    className="h-8 text-sm"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">שעות</Label>
                  <Input
                    type="number"
                    min={0}
                    max={99}
                    placeholder="1"
                    value={stage.durationHours}
                    onChange={(e) => updateStage(i, "durationHours", e.target.value)}
                    className="h-8 text-sm w-16"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">דקות</Label>
                  <Input
                    type="number"
                    min={0}
                    max={59}
                    placeholder="0"
                    value={stage.durationMinutes}
                    onChange={(e) =>
                      updateStage(i, "durationMinutes", e.target.value)
                    }
                    className="h-8 text-sm w-16"
                    dir="ltr"
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => removeStage(i)}
                  disabled={stages.length <= 1}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full"
              onClick={addStage}
            >
              <Plus className="h-3.5 w-3.5 ml-1" />
              הוסף שלב
            </Button>
          </div>

          <div className="flex gap-2 pt-1">
            <Button type="submit" disabled={isPending} className="flex-1">
              {isPending ? "שומר..." : "שמור תוכנית"}
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
