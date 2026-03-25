"use client";

import { useActionState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createFiringAction } from "@/actions/kilns";

type FiringFormState = { error?: string; success?: boolean } | null;

const FIRING_TYPE_OPTIONS = [
  { value: "bisque", label: "ביסקוויט" },
  { value: "glaze", label: "גלזורה" },
  { value: "raku", label: "ראקו" },
  { value: "pit", label: "בור" },
  { value: "custom", label: "מותאם" },
];

interface FiringFormProps {
  kilnId: string;
  kilnName: string;
  onSuccess?: () => void;
}

export function FiringForm({ kilnId, kilnName, onSuccess }: FiringFormProps) {
  const formRef = useRef<HTMLFormElement>(null);

  const [state, formAction, isPending] = useActionState<FiringFormState, FormData>(
    async (prev, formData) => {
      try {
        await createFiringAction(formData);
        formRef.current?.reset();
        onSuccess?.();
        return { success: true };
      } catch (e) {
        return { error: "שגיאה בתכנון השריפה" };
      }
    },
    null
  );

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <input type="hidden" name="kilnId" value={kilnId} />

      {state?.error && (
        <div className="rounded-md bg-destructive/10 text-destructive text-sm px-3 py-2">
          {state.error}
        </div>
      )}
      {state?.success && (
        <div className="rounded-md bg-green-50 text-green-700 text-sm px-3 py-2">
          השריפה תוכננה בהצלחה
        </div>
      )}

      {/* Kiln (read-only display) */}
      <div className="space-y-1.5">
        <Label>תנור</Label>
        <p className="text-sm text-muted-foreground border rounded-lg px-3 py-2 bg-muted/30">
          {kilnName}
        </p>
      </div>

      {/* Firing type */}
      <div className="space-y-1.5">
        <Label htmlFor="firingType">סוג שריפה *</Label>
        <Select name="firingType" required defaultValue="bisque">
          <SelectTrigger id="firingType" className="w-full">
            <SelectValue placeholder="בחר סוג שריפה" />
          </SelectTrigger>
          <SelectContent>
            {FIRING_TYPE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Target temperature */}
      <div className="space-y-1.5">
        <Label htmlFor="targetTemp">טמפרטורה יעד (°C)</Label>
        <Input
          id="targetTemp"
          name="targetTemp"
          type="number"
          min={0}
          max={2000}
          placeholder="למשל: 1000"
        />
      </div>

      {/* Planned date */}
      <div className="space-y-1.5">
        <Label htmlFor="startedAt">תאריך מתוכנן</Label>
        <Input
          id="startedAt"
          name="startedAt"
          type="date"
        />
      </div>

      {/* Notes */}
      <div className="space-y-1.5">
        <Label htmlFor="notes">הערות</Label>
        <Textarea
          id="notes"
          name="notes"
          rows={3}
          placeholder="הערות לשריפה..."
        />
      </div>

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "שומר..." : "תכנן שריפה"}
      </Button>
    </form>
  );
}
