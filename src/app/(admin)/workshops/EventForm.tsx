"use client";

import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { EventFormState } from "@/actions/workshop-events";
import type { WorkshopEvent, WorkshopTemplate } from "@/generated/prisma";

interface EventFormProps {
  action: (prev: EventFormState, formData: FormData) => Promise<EventFormState>;
  initialData?: WorkshopEvent;
  template?: WorkshopTemplate | null;
  submitLabel?: string;
}

function toDatetimeLocal(date: Date): string {
  const d = new Date(date);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function addHours(datetime: string, hours: number): string {
  if (!datetime) return "";
  const d = new Date(datetime);
  d.setHours(d.getHours() + hours);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function EventForm({
  action,
  initialData,
  template,
  submitLabel = "שמור אירוע",
}: EventFormProps) {
  const [state, formAction, isPending] = useActionState(action, {});

  const defaultDuration = template?.durationMinutes ?? 120;
  const durationHours = defaultDuration / 60;

  const [startsAt, setStartsAt] = useState(
    initialData ? toDatetimeLocal(initialData.startsAt) : ""
  );
  const [endsAt, setEndsAt] = useState(
    initialData ? toDatetimeLocal(initialData.endsAt) : ""
  );

  // Auto-compute end time when start time changes
  useEffect(() => {
    if (startsAt && !initialData) {
      setEndsAt(addHours(startsAt, durationHours));
    }
  }, [startsAt, durationHours, initialData]);

  return (
    <form action={formAction} className="space-y-5">
      {state.message && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {state.message}
        </div>
      )}

      {template && (
        <input type="hidden" name="templateId" value={template.id} />
      )}

      <div className="space-y-1.5">
        <Label htmlFor="title">כותרת האירוע *</Label>
        <Input
          id="title"
          name="title"
          defaultValue={initialData?.title ?? template?.name}
          placeholder="לדוגמה: סדנת קנקנים — מרץ 2026"
          aria-invalid={!!state.errors?.title}
        />
        {state.errors?.title && (
          <p className="text-xs text-destructive">{state.errors.title[0]}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">תיאור</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={
            initialData?.description ?? template?.description ?? ""
          }
          placeholder="פרטים נוספים על הסדנה..."
          rows={3}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="startsAt">תאריך ושעת התחלה *</Label>
          <Input
            id="startsAt"
            name="startsAt"
            type="datetime-local"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
            aria-invalid={!!state.errors?.startsAt}
          />
          {state.errors?.startsAt && (
            <p className="text-xs text-destructive">
              {state.errors.startsAt[0]}
            </p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="endsAt">תאריך ושעת סיום *</Label>
          <Input
            id="endsAt"
            name="endsAt"
            type="datetime-local"
            value={endsAt}
            onChange={(e) => setEndsAt(e.target.value)}
            aria-invalid={!!state.errors?.endsAt}
          />
          {state.errors?.endsAt && (
            <p className="text-xs text-destructive">
              {state.errors.endsAt[0]}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="minParticipants">מינימום משתתפים</Label>
          <NumberInput
            id="minParticipants"
            name="minParticipants"
            min={1}
            defaultValue={
              initialData?.minParticipants ?? template?.minParticipants ?? 1
            }
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="maxParticipants">מקסימום משתתפים</Label>
          <NumberInput
            id="maxParticipants"
            name="maxParticipants"
            min={1}
            defaultValue={
              initialData?.maxParticipants ?? template?.maxParticipants ?? 12
            }
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="price">מחיר למשתתף (₪)</Label>
          <NumberInput
            id="price"
            name="price"
            min={0}
            step={0.01}
            defaultValue={
              initialData
                ? Number(initialData.price)
                : template
                ? Number(template.defaultPrice)
                : 0
            }
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="location">מיקום</Label>
          <Input
            id="location"
            name="location"
            defaultValue={initialData?.location ?? ""}
            placeholder="לדוגמה: חדר הקרמיקה"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">הערות פנימיות</Label>
        <Textarea
          id="notes"
          name="notes"
          defaultValue={initialData?.notes ?? ""}
          placeholder="הערות לשימוש פנימי בלבד..."
          rows={2}
        />
      </div>

      <div className="flex gap-3 pt-2">
        <Button
          type="submit"
          disabled={isPending}
          className="flex-1 sm:flex-none"
        >
          {isPending ? "שומר..." : submitLabel}
        </Button>
        <Button type="button" variant="outline" onClick={() => history.back()}>
          ביטול
        </Button>
      </div>
    </form>
  );
}
