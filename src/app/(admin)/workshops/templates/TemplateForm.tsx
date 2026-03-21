"use client";

import { useState, useMemo } from "react";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Plus, ChevronLeft } from "lucide-react";
import type { TemplateFormState } from "@/actions/workshop-templates";
import type { WorkshopTemplate, PackageLineItem } from "@/generated/prisma";

type TemplateWithLineItems = WorkshopTemplate & {
  packageLineItems?: Pick<PackageLineItem, "id" | "description" | "amount" | "sortOrder">[];
};

interface TemplateFormProps {
  action: (
    prev: TemplateFormState,
    formData: FormData
  ) => Promise<TemplateFormState>;
  initialData?: TemplateWithLineItems;
  submitLabel?: string;
}

interface LineItem {
  description: string;
  amount: string;
}

const WORKSHOP_TYPE_OPTIONS = [
  { value: "REGULAR",      label: "רגילה",      icon: "🏺", desc: "סדנה חד-פעמית עם הרשמה פתוחה" },
  { value: "RECURRING",    label: "מחזורית",    icon: "🔄", desc: "חוזרת על פי לוח זמנים קבוע" },
  { value: "CLASS",        label: "חוג",         icon: "📋", desc: "מפגשים קבועים עם קבוצה קבועה" },
  { value: "SEASONAL",     label: "עונתית",     icon: "🌸", desc: "קשורה לחג או עונה (חנוכה, קיץ...)" },
  { value: "EVENT",        label: "אירוע",       icon: "🎉", desc: "יום הולדת, מסיבת רווקות, גיבוש" },
  { value: "PARENT_CHILD", label: "הורה-ילד",  icon: "👶", desc: "הגבלות גיל, ליווי מבוגר" },
] as const;

const RECURRENCE_FREQUENCY_OPTIONS = [
  { value: "DAILY",     label: "יומי" },
  { value: "WEEKLY",    label: "שבועי" },
  { value: "BIWEEKLY",  label: "דו-שבועי" },
  { value: "MONTHLY",   label: "חודשי" },
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
  { value: 1,  label: "ינואר" },
  { value: 2,  label: "פברואר" },
  { value: 3,  label: "מרץ" },
  { value: 4,  label: "אפריל" },
  { value: 5,  label: "מאי" },
  { value: 6,  label: "יוני" },
  { value: 7,  label: "יולי" },
  { value: 8,  label: "אוגוסט" },
  { value: 9,  label: "ספטמבר" },
  { value: 10, label: "אוקטובר" },
  { value: 11, label: "נובמבר" },
  { value: 12, label: "דצמבר" },
] as const;

const EVENT_PRICING_OPTIONS = [
  { value: "FLAT",            label: "מחיר קבוע לאירוע",      desc: "סכום אחד כולל" },
  { value: "PER_PARTICIPANT", label: "מחיר למשתתף",           desc: "× מספר המשתתפים" },
  { value: "PACKAGE",         label: "חבילה (סעיפים)",        desc: "פירוט מחיר לפי שירותים" },
] as const;

const VAT_RATE = 18; // Israel default — wired from studio settings in Phase B

function selectClass(base: string) {
  return `${base} w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring`;
}

export function TemplateForm({
  action,
  initialData,
  submitLabel = "שמור תבנית",
}: TemplateFormProps) {
  const [state, formAction, isPending] = useActionState(action, {});

  const [workshopType, setWorkshopType] = useState<string>(
    initialData?.workshopType ?? "REGULAR"
  );
  const [pricingModel, setPricingModel] = useState<string>(
    initialData?.eventPricingModel ?? "FLAT"
  );
  const [lineItems, setLineItems] = useState<LineItem[]>(
    (initialData?.packageLineItems ?? []).length > 0
      ? initialData!.packageLineItems!.map((item) => ({
          description: item.description,
          amount: String(item.amount),
        }))
      : [{ description: "", amount: "" }]
  );
  // For new templates show type selection first; for editing go straight to form
  const [typeSelected, setTypeSelected] = useState<boolean>(!!initialData);

  // — Line item helpers —
  const addLineItem = () =>
    setLineItems((prev) => [...prev, { description: "", amount: "" }]);

  const removeLineItem = (idx: number) =>
    setLineItems((prev) => prev.filter((_, i) => i !== idx));

  const updateLineItem = (idx: number, field: keyof LineItem, value: string) =>
    setLineItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item))
    );

  const lineItemsTotal = useMemo(
    () =>
      lineItems.reduce((sum, item) => {
        const n = parseFloat(item.amount);
        return sum + (isNaN(n) ? 0 : n);
      }, 0),
    [lineItems]
  );
  const vatAmount = (lineItemsTotal * VAT_RATE) / 100;
  const grandTotal = lineItemsTotal + vatAmount;

  const selectedTypeOption = WORKSHOP_TYPE_OPTIONS.find((o) => o.value === workshopType);

  // ── STEP 1: Type selection ──────────────────────────────────────────────
  if (!typeSelected) {
    return (
      <div className="space-y-5">
        <div>
          <h2 className="text-lg font-semibold mb-1">מה סוג הסדנה?</h2>
          <p className="text-sm text-muted-foreground">הסוג קובע את השדות שיופיעו בטופס</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {WORKSHOP_TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                setWorkshopType(opt.value);
                setTypeSelected(true);
              }}
              className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition-colors hover:border-primary hover:bg-primary/5 ${
                workshopType === opt.value
                  ? "border-primary bg-primary/5"
                  : "border-border bg-background"
              }`}
            >
              <span className="text-3xl">{opt.icon}</span>
              <span className="text-sm font-semibold">{opt.label}</span>
              <span className="text-xs text-muted-foreground leading-tight">{opt.desc}</span>
            </button>
          ))}
        </div>
        <div className="flex gap-3">
          <Button
            type="button"
            onClick={() => setTypeSelected(true)}
            className="flex-1 sm:flex-none"
          >
            המשך →
          </Button>
          <Button type="button" variant="outline" onClick={() => history.back()}>
            ביטול
          </Button>
        </div>
      </div>
    );
  }

  // ── STEP 2: Full form ───────────────────────────────────────────────────
  const showParticipants = workshopType !== "CLASS";
  const showDefaultPrice = workshopType !== "EVENT" && workshopType !== "CLASS";
  const showRecurrence = workshopType === "RECURRING" || workshopType === "CLASS";

  return (
    <form action={formAction} className="space-y-5">
      {state.message && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {state.message}
        </div>
      )}

      {/* Type indicator — click to change */}
      <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2">
        <span className="text-xl">{selectedTypeOption?.icon}</span>
        <span className="text-sm font-medium">{selectedTypeOption?.label}</span>
        {!initialData && (
          <button
            type="button"
            onClick={() => setTypeSelected(false)}
            className="mr-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-3 w-3" />
            שנה סוג
          </button>
        )}
        <input type="hidden" name="workshopType" value={workshopType} />
      </div>

      {/* ── Common: name + description ── */}
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

      {/* ── Duration ── */}
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

        {/* Default price — shown for non-EVENT, non-CLASS types */}
        {showDefaultPrice && (
          <div className="space-y-1.5">
            <Label htmlFor="defaultPrice">מחיר למשתתף (₪)</Label>
            <NumberInput
              id="defaultPrice"
              name="defaultPrice"
              min={0}
              step={0.01}
              defaultValue={initialData ? Number(initialData.defaultPrice) : 0}
            />
          </div>
        )}

        {/* CLASS — price per session */}
        {workshopType === "CLASS" && (
          <div className="space-y-1.5">
            <Label htmlFor="defaultPrice">מחיר לחוגניק לחודש (₪)</Label>
            <NumberInput
              id="defaultPrice"
              name="defaultPrice"
              min={0}
              step={0.01}
              defaultValue={initialData ? Number(initialData.defaultPrice) : 0}
            />
          </div>
        )}
      </div>

      {/* ── Participants (not for CLASS) ── */}
      {showParticipants && (
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
            <Label htmlFor="maxParticipants">
              {workshopType === "EVENT" ? "קיבולת מקסימלית" : "מקסימום משתתפים"}
            </Label>
            <NumberInput
              id="maxParticipants"
              name="maxParticipants"
              min={1}
              defaultValue={initialData?.maxParticipants ?? 12}
            />
          </div>
        </div>
      )}

      {/* ── RECURRING + CLASS: recurrence fields ── */}
      {showRecurrence && (
        <div className="space-y-4 rounded-lg border border-border bg-muted/20 p-4">
          <p className="text-sm font-medium text-muted-foreground">הגדרות חזרה</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="recurrenceFrequency">תדירות</Label>
              <select
                id="recurrenceFrequency"
                name="recurrenceFrequency"
                defaultValue={initialData?.recurrenceFrequency ?? ""}
                className={selectClass("")}
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
                className={selectClass("")}
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
        </div>
      )}

      {/* ── CLASS: totalSessions ── */}
      {workshopType === "CLASS" && (
        <div className="space-y-1.5">
          <Label htmlFor="totalSessions">מספר מפגשים בקורס</Label>
          <NumberInput
            id="totalSessions"
            name="totalSessions"
            min={1}
            defaultValue={initialData?.totalSessions ?? undefined}
            placeholder="לדוגמה: 12"
          />
        </div>
      )}

      {/* ── SEASONAL: season months + lead times ── */}
      {workshopType === "SEASONAL" && (
        <div className="space-y-4 rounded-lg border border-border bg-muted/20 p-4">
          <p className="text-sm font-medium text-muted-foreground">הגדרות עונה</p>
          <p className="text-xs text-muted-foreground">
            תאריך האירוע ייקבע בעת התיאום — לא נדרש כאן
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="seasonStartMonth">תחילת עונה</Label>
              <select
                id="seasonStartMonth"
                name="seasonStartMonth"
                defaultValue={initialData?.seasonStartMonth ?? ""}
                className={selectClass("")}
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
                className={selectClass("")}
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
            <Label htmlFor="seasonReminderDays">ימי תזכורת לפני העונה (מופרדים בפסיק)</Label>
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

      {/* ── EVENT: contact + pricing ── */}
      {workshopType === "EVENT" && (
        <div className="space-y-4 rounded-lg border border-border bg-muted/20 p-4">
          <p className="text-sm font-medium text-muted-foreground">פרטי אירוע</p>

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
              <Label htmlFor="eventContactPhone">טלפון</Label>
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
              rows={2}
            />
          </div>

          {/* Pricing model */}
          <div className="space-y-2">
            <Label>מודל תמחור</Label>
            <input type="hidden" name="eventPricingModel" value={pricingModel} />
            <div className="grid grid-cols-3 gap-2">
              {EVENT_PRICING_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setPricingModel(opt.value)}
                  className={`rounded-lg border-2 p-3 text-center text-xs transition-colors ${
                    pricingModel === opt.value
                      ? "border-primary bg-primary/5"
                      : "border-border bg-background hover:border-primary/50"
                  }`}
                >
                  <div className="font-medium mb-0.5">{opt.label}</div>
                  <div className="text-muted-foreground">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* FLAT / PER_PARTICIPANT: single price field */}
          {pricingModel !== "PACKAGE" && (
            <div className="space-y-1.5">
              <Label htmlFor="defaultPrice">
                {pricingModel === "FLAT" ? "מחיר כולל לאירוע (₪)" : "מחיר למשתתף (₪)"}
              </Label>
              <NumberInput
                id="defaultPrice"
                name="defaultPrice"
                min={0}
                step={0.01}
                defaultValue={initialData ? Number(initialData.defaultPrice) : 0}
              />
            </div>
          )}

          {/* PACKAGE: line items editor */}
          {pricingModel === "PACKAGE" && (
            <div className="space-y-3">
              <Label>סעיפי מחיר</Label>
              <div className="space-y-2">
                {lineItems.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Input
                      name="lineItemDescription"
                      value={item.description}
                      onChange={(e) => updateLineItem(idx, "description", e.target.value)}
                      placeholder="לדוגמה: הנחיית סדנה"
                      className="flex-1"
                    />
                    <NumberInput
                      name="lineItemAmount"
                      value={item.amount}
                      onChange={(e) => updateLineItem(idx, "amount", e.target.value)}
                      placeholder="סכום"
                      min={0}
                      step={0.01}
                      className="w-28"
                    />
                    <button
                      type="button"
                      onClick={() => removeLineItem(idx)}
                      className="text-muted-foreground hover:text-destructive transition-colors p-1"
                      aria-label="הסר סעיף"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={addLineItem}
                className="flex items-center gap-1.5 text-sm text-primary hover:underline"
              >
                <Plus className="h-4 w-4" />
                הוסף סעיף
              </button>

              {/* Totals */}
              {lineItemsTotal > 0 && (
                <div className="rounded-md border border-border bg-background p-3 space-y-1 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>סה&quot;כ לפני מע&quot;מ</span>
                    <span dir="ltr">₪{lineItemsTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>מע&quot;מ ({VAT_RATE}%)</span>
                    <span dir="ltr">₪{vatAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-semibold border-t border-border pt-1 mt-1">
                    <span>סה&quot;כ כולל מע&quot;מ</span>
                    <span dir="ltr">₪{grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              )}

              {/* Hidden defaultPrice to keep schema happy (package total) */}
              <input
                type="hidden"
                name="defaultPrice"
                value={grandTotal.toFixed(2)}
              />
            </div>
          )}
        </div>
      )}

      {/* ── PARENT_CHILD: age range + supervision ── */}
      {workshopType === "PARENT_CHILD" && (
        <div className="space-y-4 rounded-lg border border-border bg-muted/20 p-4">
          <p className="text-sm font-medium text-muted-foreground">הגדרות הורה-ילד</p>
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
              defaultChecked={initialData?.requiresAdultSupervision !== false}
              className="h-4 w-4"
            />
            <Label htmlFor="requiresAdultSupervision">נדרש ליווי מבוגר</Label>
            <input type="hidden" name="requiresAdultSupervision" value="false" />
          </div>
        </div>
      )}

      {/* ── Common: tags + isActive ── */}
      <div className="space-y-1.5">
        <Label htmlFor="tags">תגיות (מופרדות בפסיק)</Label>
        <Input
          id="tags"
          name="tags"
          defaultValue={initialData?.tags?.join(", ")}
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
