"use client";

import { useActionState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createKilnAction, updateKilnAction } from "@/actions/kilns";
import type { Kiln } from "@/generated/prisma";

type KilnFormState = { error?: string } | null;

const KILN_TYPE_OPTIONS = [
  { value: "electric", label: "חשמלי" },
  { value: "gas", label: "גז" },
  { value: "wood", label: "עצים" },
  { value: "raku", label: "ראקו" },
];

interface KilnFormProps {
  kiln?: Kiln;
}

export function KilnForm({ kiln }: KilnFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  const action = kiln
    ? (_: KilnFormState, formData: FormData) => updateKilnAction(kiln.id, formData)
    : (_: KilnFormState, formData: FormData) => createKilnAction(formData);

  const [state, formAction, isPending] = useActionState<KilnFormState, FormData>(
    async (prev, formData) => {
      try {
        await action(prev, formData);
        router.push("/kilns");
        return null;
      } catch (e) {
        return { error: "שגיאה בשמירת התנור" };
      }
    },
    null
  );

  return (
    <form ref={formRef} action={formAction} className="space-y-5 max-w-md">
      {state?.error && (
        <div className="rounded-md bg-destructive/10 text-destructive text-sm px-3 py-2">
          {state.error}
        </div>
      )}

      {/* Name */}
      <div className="space-y-1.5">
        <Label htmlFor="name">שם *</Label>
        <Input
          id="name"
          name="name"
          required
          defaultValue={kiln?.name ?? ""}
          placeholder="למשל: תנור 1, תנור גדול..."
        />
      </div>

      {/* Type */}
      <div className="space-y-1.5">
        <Label htmlFor="type">סוג</Label>
        <Select name="type" defaultValue={kiln?.type ?? undefined}>
          <SelectTrigger id="type" className="w-full">
            <SelectValue placeholder="בחר סוג תנור" />
          </SelectTrigger>
          <SelectContent>
            {KILN_TYPE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Max temp */}
      <div className="space-y-1.5">
        <Label htmlFor="maxTemp">טמפרטורה מקסימלית (°C)</Label>
        <Input
          id="maxTemp"
          name="maxTemp"
          type="number"
          min={0}
          max={2000}
          defaultValue={kiln?.maxTemp ?? ""}
          placeholder="למשל: 1280"
        />
      </div>

      {/* Capacity */}
      <div className="space-y-1.5">
        <Label htmlFor="capacity">קיבולת</Label>
        <Input
          id="capacity"
          name="capacity"
          defaultValue={kiln?.capacity ?? ""}
          placeholder="למשל: 60 ליטר, 3 מדפים..."
        />
      </div>

      {/* isActive */}
      <div className="flex items-center gap-2">
        <input
          id="isActive"
          name="isActive"
          type="checkbox"
          defaultChecked={kiln ? kiln.isActive : true}
          className="h-4 w-4 rounded border-input accent-primary"
        />
        <Label htmlFor="isActive" className="cursor-pointer">פעיל</Label>
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "שומר..." : kiln ? "שמור שינויים" : "צור תנור"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isPending}
        >
          ביטול
        </Button>
      </div>
    </form>
  );
}
