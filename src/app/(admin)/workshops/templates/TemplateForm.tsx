"use client";

import { useState } from "react";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ChevronDown, ChevronUp } from "lucide-react";
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

const WORKSHOP_TYPE_OPTIONS = [
  { value: "REGULAR", label: "רגילה" },
  { value: "RECURRING", label: "מחזורית" },
  { value: "SEASONAL", label: "עונתית" },
  { value: "EVENT", label: "אירוע" },
  { value: "PARENT_CHILD", label: "הורה-ילד" },
] as const;

const RECURRENCE_FREQUENCY_OPTIONS = [
  { value: "DAILY", label: "יומי" },
  { value: "WEEKLY", label: "שבועי" },
  { value: "BIWEEKLY", label: "דו-שבועי" },
  { value: "MONTHLY", label: "חודשי" },
] as const;

const DAY_OF_WEEK_OPTIONS = [
  { value: 0, label: "ראשון" },
  { value: 1, label: "שני" },
  { value: 2, label: "שלישי" },
  { value: 3, label: "רביעי" },
  { value: 4, label: "חמישי" },
  { value: 5, label: "שישי" },
  { value: 6, label: "שבת" },
] as const;

const MONTH_OPTIONS = [
  { value: 1, label: "ינואר" },
  { value: 2, label: "פברואר" },
  { value: 3, label: "מרץ" },
  { value: 4, label: "אפריל" },
  { value: 5, label: "מאי" },
  { value: 6, label: "יוני" },
  { value: 7, label: "יולי" },
  { value: 8, label: "אוגוסט" },
  { value: 9, label: "ספטמבר" },
  { value: 10, label: "אוקטובר" },
  { value: 11, label: "נובמבר" },
  { value: 12, label: "דצמבר" },
] as const;

export function TemplateForm({
  action,
  initialData,
  submitLabel = "שמור תבנית",
}: TemplateFormProps) {
  const [state, formAction, isPending] = useActionState(action, {});
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [workshopType, setWorkshopType] = useState<string>(
    initialData?.workshopType ?? "REGULAR"
  );

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
          <NumberInput
            id="durationMinutes"
            name="durationMinutes"
            min={15}
            max={480}
            defaultValue={initialData?.durationMinutes ?? 120}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="defaultPrice">מחיר ברירת מחדל (₪)</Label>
          <NumberInput
            id="defaultPrice"
            name="defaultPrice"
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
          <NumberInput
            id="minParticipants"
            name="minParticipants"
            min={1}
            defaultValue={initialData?.minParticipants ?? 1}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="maxParticipants">מקסימום משתתפים</Label>
          <NumberInput
            id="maxParticipants"
            name="maxParticipants"
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

      {/* Advanced Properties Section */}
      <div className="rounded-lg border border-border">
        <button
          type="button"
          onClick={() => setIsAdvancedOpen((o) => !o)}
          className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors rounded-lg"
        >
          <span>מאפיינים מתקדמים</span>
          {isAdvancedOpen ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        {isAdvancedOpen && (
          <div className="border-t border-border px-4 pb-4 pt-4 space-y-5">

            {/* Workshop Type */}
            <div className="space-y-2">
              <Label>סוג סדנה</Label>
              <input type="hidden" name="workshopType" value={workshopType} />
              <div className="flex flex-wrap gap-2">
                {WORKSHOP_TYPE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setWorkshopType(opt.value)}
                    className={`rounded-full px-3 py-1.5 text-sm border transition-colors ${
                      workshopType === opt.value
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border bg-background hover:bg-muted/50"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* RECURRING fields */}
            {workshopType === "RECURRING" && (
              <div className="space-y-4 rounded-md bg-muted/30 p-3">
                <div className="space-y-1.5">
                  <Label htmlFor="recurrenceFrequency">תדירות חזרה</Label>
                  <select
                    id="recurrenceFrequency"
                    name="recurrenceFrequency"
                    defaultValue={initialData?.recurrenceFrequency ?? ""}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">בחר תדירות...</option>
                    {RECURRENCE_FREQUENCY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="recurrenceDayOfWeek">יום בשבוע</Label>
                  <select
                    id="recurrenceDayOfWeek"
                    name="recurrenceDayOfWeek"
                    defaultValue={initialData?.recurrenceDayOfWeek ?? ""}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">בחר יום...</option>
                    {DAY_OF_WEEK_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* SEASONAL fields */}
            {workshopType === "SEASONAL" && (
              <div className="space-y-4 rounded-md bg-muted/30 p-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="seasonStartMonth">תחילת עונה</Label>
                    <select
                      id="seasonStartMonth"
                      name="seasonStartMonth"
                      defaultValue={initialData?.seasonStartMonth ?? ""}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="">בחר חודש...</option>
                      {MONTH_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="seasonEndMonth">סיום עונה</Label>
                    <select
                      id="seasonEndMonth"
                      name="seasonEndMonth"
                      defaultValue={initialData?.seasonEndMonth ?? ""}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="">בחר חודש...</option>
                      {MONTH_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="seasonReminderDays">
                    ימים לתזכורות לפני תחילת עונה (מופרדים בפסיק)
                  </Label>
                  <Input
                    id="seasonReminderDays"
                    name="seasonReminderDays"
                    defaultValue={initialData?.seasonReminderDays?.join(", ") ?? ""}
                    placeholder="לדוגמה: 90, 60, 30"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="seasonPublishLeadDays">ימים לפרסום שיווק</Label>
                    <NumberInput
                      id="seasonPublishLeadDays"
                      name="seasonPublishLeadDays"
                      min={0}
                      defaultValue={initialData?.seasonPublishLeadDays ?? undefined}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="seasonPrepLeadDays">ימים להכנת חומרים</Label>
                    <NumberInput
                      id="seasonPrepLeadDays"
                      name="seasonPrepLeadDays"
                      min={0}
                      defaultValue={initialData?.seasonPrepLeadDays ?? undefined}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="seasonOpenRegistrationDays">ימים לפתיחת הרשמה</Label>
                    <NumberInput
                      id="seasonOpenRegistrationDays"
                      name="seasonOpenRegistrationDays"
                      min={0}
                      defaultValue={initialData?.seasonOpenRegistrationDays ?? undefined}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="seasonCloseRegistrationDays">ימים לסגירת הרשמה</Label>
                    <NumberInput
                      id="seasonCloseRegistrationDays"
                      name="seasonCloseRegistrationDays"
                      min={0}
                      defaultValue={initialData?.seasonCloseRegistrationDays ?? undefined}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* EVENT fields */}
            {workshopType === "EVENT" && (
              <div className="space-y-4 rounded-md bg-muted/30 p-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="eventContactName">שם איש קשר</Label>
                    <Input
                      id="eventContactName"
                      name="eventContactName"
                      defaultValue={initialData?.eventContactName ?? ""}
                      placeholder="שם המזמין"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="eventContactPhone">טלפון איש קשר</Label>
                    <Input
                      id="eventContactPhone"
                      name="eventContactPhone"
                      defaultValue={initialData?.eventContactPhone ?? ""}
                      placeholder="050-0000000"
                      type="tel"
                      dir="ltr"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="eventSpecialRequests">דרישות מיוחדות</Label>
                  <Textarea
                    id="eventSpecialRequests"
                    name="eventSpecialRequests"
                    defaultValue={initialData?.eventSpecialRequests ?? ""}
                    placeholder="פרט דרישות מיוחדות לאירוע..."
                    rows={3}
                  />
                </div>
              </div>
            )}

            {/* PARENT_CHILD fields */}
            {workshopType === "PARENT_CHILD" && (
              <div className="space-y-4 rounded-md bg-muted/30 p-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="ageRangeMin">גיל מינימום</Label>
                    <NumberInput
                      id="ageRangeMin"
                      name="ageRangeMin"
                      min={0}
                      max={18}
                      defaultValue={initialData?.ageRangeMin ?? undefined}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="ageRangeMax">גיל מקסימום</Label>
                    <NumberInput
                      id="ageRangeMax"
                      name="ageRangeMax"
                      min={0}
                      max={18}
                      defaultValue={initialData?.ageRangeMax ?? undefined}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="requiresAdultSupervision"
                    name="requiresAdultSupervision"
                    value="true"
                    defaultChecked={
                      initialData?.requiresAdultSupervision !== false
                    }
                    className="h-4 w-4"
                  />
                  <Label htmlFor="requiresAdultSupervision">
                    נדרש ליווי מבוגר
                  </Label>
                  <input
                    type="hidden"
                    name="requiresAdultSupervision"
                    value="false"
                  />
                </div>
              </div>
            )}

          </div>
        )}
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
