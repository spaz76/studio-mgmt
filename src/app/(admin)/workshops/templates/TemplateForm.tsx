"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { TemplateFormState } from "@/actions/workshop-templates";
import type { WorkshopTemplate } from "@/generated/prisma";

interface TemplateFormProps {
  action: (
    prev: TemplateFormState,
    formData: FormData
  ) => Promise<TemplateFormState>;
  initialData?: WorkshopTemplate;
  submitLabel?: string;
}

export function TemplateForm({
  action,
  initialData,
  submitLabel = "שמור תבנית",
}: TemplateFormProps) {
  const [state, formAction, isPending] = useActionState(action, {});

  return (
    <form action={formAction} className="space-y-5">
      {state.message && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {state.message}
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="name">שם התבנית *</Label>
        <Input
          id="name"
          name="name"
          defaultValue={initialData?.name}
          placeholder="לדוגמה: סדנת קנקנים למתחילים"
          aria-invalid={!!state.errors?.name}
        />
        {state.errors?.name && (
          <p className="text-xs text-destructive">{state.errors.name[0]}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">תיאור</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={initialData?.description ?? ""}
          placeholder="תאר את הסדנה..."
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="durationMinutes">משך (דקות)</Label>
          <Input
            id="durationMinutes"
            name="durationMinutes"
            type="number"
            min={15}
            max={480}
            defaultValue={initialData?.durationMinutes ?? 120}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="defaultPrice">מחיר ברירת מחדל (₪)</Label>
          <Input
            id="defaultPrice"
            name="defaultPrice"
            type="number"
            min={0}
            step={0.01}
            defaultValue={
              initialData ? Number(initialData.defaultPrice) : 0
            }
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="minParticipants">מינימום משתתפים</Label>
          <Input
            id="minParticipants"
            name="minParticipants"
            type="number"
            min={1}
            defaultValue={initialData?.minParticipants ?? 1}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="maxParticipants">מקסימום משתתפים</Label>
          <Input
            id="maxParticipants"
            name="maxParticipants"
            type="number"
            min={1}
            defaultValue={initialData?.maxParticipants ?? 12}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="tags">תגיות (מופרדות בפסיק)</Label>
        <Input
          id="tags"
          name="tags"
          defaultValue={initialData?.tags.join(", ")}
          placeholder="למתחילים, כלי שתייה, קצר"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isActive"
          name="isActive"
          value="true"
          defaultChecked={initialData?.isActive !== false}
          className="h-4 w-4"
        />
        <Label htmlFor="isActive">תבנית פעילה</Label>
        <input type="hidden" name="isActive" value="false" />
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={isPending} className="flex-1 sm:flex-none">
          {isPending ? "שומר..." : submitLabel}
        </Button>
        <Button type="button" variant="outline" onClick={() => history.back()}>
          ביטול
        </Button>
      </div>
    </form>
  );
}
