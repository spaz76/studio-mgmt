"use client";

import { useState, useMemo, useRef, useEffect, startTransition } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Plus, ChevronLeft } from "lucide-react";
import type { TemplateFormState } from "@/actions/workshop-templates";
import { applyTemplateToFutureEvents } from "@/actions/workshop-templates";
import type { WorkshopTemplate, PackageLineItem, TemplateImage } from "@/generated/prisma";
import { compressImage } from "@/lib/compress-image";

type TemplateWithLineItems = WorkshopTemplate & {
  packageLineItems?: Pick<PackageLineItem, "id" | "description" | "amount" | "sortOrder">[];
  images?: Pick<TemplateImage, "id" | "url" | "alt" | "isPrimary" | "sortOrder">[];
};

interface ImageEntry {
  url: string;
  alt: string;
  isPrimary: boolean;
}

interface TemplateFormProps {
  action: (
    prev: TemplateFormState,
    formData: FormData
  ) => Promise<TemplateFormState>;
  initialData?: TemplateWithLineItems;
  submitLabel?: string;
  isUpdate?: boolean;
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

function timeInputClass() {
  return "w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";
}

/** Parse HH:mm string → total minutes, or null. */
function timeToMinutes(t: string): number | null {
  const parts = t.split(":");
  if (parts.length !== 2) return null;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (isNaN(h) || isNaN(m)) return null;
  return h * 60 + m;
}

function formatDuration(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m} דקות`;
  if (m === 0) return `${h} שעות`;
  return `${h} שעות ${m} דקות`;
}

export function TemplateForm({
  action,
  initialData,
  submitLabel = "שמור תבנית",
  isUpdate = false,
}: TemplateFormProps) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(action, {});

  const [showSuccess, setShowSuccess] = useState(false);
  const [showApplyFuture, setShowApplyFuture] = useState(false);
  const [savedTemplateId, setSavedTemplateId] = useState<string | null>(null);
  const [applyingFuture, setApplyingFuture] = useState(false);

  // Track success from server action
  useEffect(() => {
    if (state.success && state.templateId) {
      startTransition(() => {
        setSavedTemplateId(state.templateId!);
        if (isUpdate) {
          setShowApplyFuture(true);
        } else {
          setShowSuccess(true);
        }
      });
    }
  }, [state, isUpdate]);

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

  // Duration: hours + minutes
  const [durationHours, setDurationHours] = useState<number>(
    Math.floor((initialData?.durationMinutes ?? 120) / 60)
  );
  const [durationMins, setDurationMins] = useState<number>(
    (initialData?.durationMinutes ?? 120) % 60
  );

  // RECURRING: start/end time
  const [recurrenceStartTime, setRecurrenceStartTime] = useState<string>(
    (initialData as TemplateWithLineItems & { recurrenceStartTime?: string | null })?.recurrenceStartTime ?? ""
  );
  const [recurrenceEndTime, setRecurrenceEndTime] = useState<string>(
    (initialData as TemplateWithLineItems & { recurrenceEndTime?: string | null })?.recurrenceEndTime ?? ""
  );

  // SEASONAL: reminder weeks (converted from stored days)
  const [reminderWeeks, setReminderWeeks] = useState<string[]>(() => {
    const days = initialData?.seasonReminderDays ?? [];
    return days.length > 0 ? days.map((d) => String(Math.round(d / 7))) : [];
  });

  // Reminder warning dialog (before save when reminders are empty)
  const [showReminderWarning, setShowReminderWarning] = useState(false);
  const bypassReminderCheck = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  // ── Controlled field state ────────────────────────────────────────────────
  const [name, setName] = useState(initialData?.name ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [defaultPrice, setDefaultPrice] = useState<number | string>(
    initialData ? Number(initialData.defaultPrice) : 0
  );
  const [minParticipants, setMinParticipants] = useState<number | string>(
    initialData?.minParticipants ?? 1
  );
  const [maxParticipants, setMaxParticipants] = useState<number | string>(
    initialData?.maxParticipants ?? 12
  );
  const [tags, setTags] = useState(initialData?.tags?.join(", ") ?? "");
  const [marketingText, setMarketingText] = useState(
    (initialData as TemplateWithLineItems & { marketingText?: string | null })?.marketingText ?? ""
  );
  const [internalNotes, setInternalNotes] = useState(
    (initialData as TemplateWithLineItems & { internalNotes?: string | null })?.internalNotes ?? ""
  );
  const [registrationUrl, setRegistrationUrl] = useState(
    (initialData as TemplateWithLineItems & { registrationUrl?: string | null })?.registrationUrl ?? ""
  );
  const [totalSessions, setTotalSessions] = useState<number | string>(
    initialData?.totalSessions ?? ""
  );
  // SEASONAL
  const [seasonStartMonth, setSeasonStartMonth] = useState(
    initialData?.seasonStartMonth != null ? String(initialData.seasonStartMonth) : ""
  );
  const [seasonEndMonth, setSeasonEndMonth] = useState(
    initialData?.seasonEndMonth != null ? String(initialData.seasonEndMonth) : ""
  );
  const [seasonPublishLeadWeeks, setSeasonPublishLeadWeeks] = useState<number | string>(
    initialData?.seasonPublishLeadDays != null ? Math.round(initialData.seasonPublishLeadDays / 7) : ""
  );
  const [seasonPrepLeadWeeks, setSeasonPrepLeadWeeks] = useState<number | string>(
    initialData?.seasonPrepLeadDays != null ? Math.round(initialData.seasonPrepLeadDays / 7) : ""
  );
  const [seasonOpenRegistrationWeeks, setSeasonOpenRegistrationWeeks] = useState<number | string>(
    initialData?.seasonOpenRegistrationDays != null ? Math.round(initialData.seasonOpenRegistrationDays / 7) : ""
  );
  const [seasonCloseRegistrationWeeks, setSeasonCloseRegistrationWeeks] = useState<number | string>(
    initialData?.seasonCloseRegistrationDays != null ? Math.round(initialData.seasonCloseRegistrationDays / 7) : ""
  );
  // RECURRING / CLASS
  const [recurrenceFrequency, setRecurrenceFrequency] = useState(
    initialData?.recurrenceFrequency ?? ""
  );
  const [recurrenceDayOfWeek, setRecurrenceDayOfWeek] = useState(
    initialData?.recurrenceDayOfWeek != null ? String(initialData.recurrenceDayOfWeek) : ""
  );
  // EVENT
  const [eventContactName, setEventContactName] = useState(
    initialData?.eventContactName ?? ""
  );
  const [eventContactPhone, setEventContactPhone] = useState(
    initialData?.eventContactPhone ?? ""
  );
  const [eventSpecialRequests, setEventSpecialRequests] = useState(
    initialData?.eventSpecialRequests ?? ""
  );
  // PARENT_CHILD
  const [ageRangeMin, setAgeRangeMin] = useState<number | string>(
    initialData?.ageRangeMin ?? ""
  );
  const [ageRangeMax, setAgeRangeMax] = useState<number | string>(
    initialData?.ageRangeMax ?? ""
  );
  const [requiresAdultSupervision, setRequiresAdultSupervision] = useState(
    initialData?.requiresAdultSupervision !== false
  );
  const [isActive, setIsActive] = useState(initialData?.isActive !== false);

  async function handleImageFiles(files: File[]) {
    if (!files.length) return;
    setUploading(true);
    for (const file of files) {
      try {
        const compressed = await compressImage(file);
        const formData = new FormData();
        formData.append("file", compressed);
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        if (res.ok) {
          const { url } = await res.json();
          setImages((prev) => [...prev, { url, alt: "", isPrimary: prev.length === 0 }]);
        }
      } catch {}
    }
    setUploading(false);
  }

  // Phase B: images
  const [images, setImages] = useState<ImageEntry[]>(() => {
    const imgs = initialData?.images ?? [];
    const sorted = [...imgs].sort((a, b) => a.sortOrder - b.sortOrder);
    return sorted.map((img) => ({
      url: img.url,
      alt: img.alt ?? "",
      isPrimary: img.isPrimary,
    }));
  });
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const dragSrcIdx = useRef<number | null>(null);

  const addImage = () => setImages((prev) => [...prev, { url: "", alt: "", isPrimary: prev.length === 0 }]);
  const removeImage = (idx: number) =>
    setImages((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      if (next.length > 0 && !next.some((img) => img.isPrimary)) {
        next[0].isPrimary = true;
      }
      return next;
    });
  const updateImage = (idx: number, field: keyof ImageEntry, value: string | boolean) =>
    setImages((prev) =>
      prev.map((img, i) => {
        if (i !== idx) return field === "isPrimary" && value ? { ...img, isPrimary: false } : img;
        return { ...img, [field]: value };
      })
    );
  const setPrimary = (idx: number) =>
    setImages((prev) => prev.map((img, i) => ({ ...img, isPrimary: i === idx })));

  const handleDragStart = (idx: number) => { dragSrcIdx.current = idx; };
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    setDragOverIdx(idx);
  };
  const handleDrop = (idx: number) => {
    const src = dragSrcIdx.current;
    if (src === null || src === idx) { setDragOverIdx(null); return; }
    setImages((prev) => {
      const next = [...prev];
      const [moved] = next.splice(src, 1);
      next.splice(idx, 0, moved);
      return next;
    });
    dragSrcIdx.current = null;
    setDragOverIdx(null);
  };
  const handleDragEnd = () => { dragSrcIdx.current = null; setDragOverIdx(null); };

  // primaryIndex for hidden field
  const primaryIndex = images.findIndex((img) => img.isPrimary);

  // For new templates show type selection first; for editing go straight to form
  const [typeSelected, setTypeSelected] = useState<boolean>(!!initialData);

  // ── Computed duration from start/end times (RECURRING) ─────────────────
  const computedDuration = useMemo(() => {
    if (!recurrenceStartTime || !recurrenceEndTime) return null;
    const start = timeToMinutes(recurrenceStartTime);
    const end = timeToMinutes(recurrenceEndTime);
    if (start === null || end === null || end <= start) return null;
    return end - start;
  }, [recurrenceStartTime, recurrenceEndTime]);

  // When RECURRING times are set, use computed duration; otherwise hours+mins
  const effectiveDurationMinutes =
    workshopType === "RECURRING" && computedDuration !== null
      ? computedDuration
      : durationHours * 60 + durationMins;

  // ── Line item helpers ────────────────────────────────────────────────────
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

  // ── Submit handler: intercepts to show reminder warning ──────────────────
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (workshopType === "SEASONAL" && !bypassReminderCheck.current) {
      const hasReminders = reminderWeeks.some((w) => w.trim() !== "");
      if (!hasReminders) {
        e.preventDefault();
        setShowReminderWarning(true);
        return;
      }
    }
    bypassReminderCheck.current = false;
  };

  // ── STEP 1: Type selection ───────────────────────────────────────────────
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

  // ── STEP 2: Full form ────────────────────────────────────────────────────
  const showParticipants = workshopType !== "CLASS";
  const showDefaultPrice = workshopType !== "EVENT" && workshopType !== "CLASS";
  const showRecurrence = workshopType === "RECURRING" || workshopType === "CLASS";

  return (
    <>
      {/* ── Reminder warning dialog ──────────────────────────────────────── */}
      {showReminderWarning && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-xl border border-border p-6 max-w-sm w-full space-y-4 shadow-lg">
            <h2 className="text-base font-semibold">שים לב לתזכורות</h2>
            <p className="text-sm text-muted-foreground">
              אנחנו ממליצים לעדכן את התזכורות כדי לא לפספס דדליינים. להמשיך בכל זאת?
            </p>
            <div className="flex gap-3">
              <Button
                type="button"
                onClick={() => {
                  setShowReminderWarning(false);
                  bypassReminderCheck.current = true;
                  formRef.current?.requestSubmit();
                }}
                className="flex-1"
              >
                כן, שמור
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowReminderWarning(false)}
                className="flex-1"
              >
                חזור לעריכה
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Post-save success dialog (create) ───────────────────────────── */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-xl border border-border p-6 max-w-sm w-full space-y-4 shadow-lg">
            <h2 className="text-base font-semibold">✅ התבנית נשמרה בהצלחה!</h2>
            <p className="text-sm text-muted-foreground">מה תרצי לעשות עכשיו?</p>
            <div className="flex flex-col gap-3">
              <Button
                type="button"
                onClick={() => router.push(`/workshops/new?templateId=${savedTemplateId}`)}
              >
                צור אירוע מהתבנית
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/workshops/templates")}
              >
                חזור למסך הקודם
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Apply-to-future dialog (update) ─────────────────────────────── */}
      {showApplyFuture && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-xl border border-border p-6 max-w-sm w-full space-y-4 shadow-lg">
            <h2 className="text-base font-semibold">✅ התבנית עודכנה בהצלחה!</h2>
            <p className="text-sm text-muted-foreground">
              להחיל את השינויים גם על אירועים עתידיים שנוצרו מתבנית זו?
            </p>
            <div className="flex gap-3">
              <Button
                type="button"
                disabled={applyingFuture}
                onClick={async () => {
                  if (!savedTemplateId) return;
                  setApplyingFuture(true);
                  await applyTemplateToFutureEvents(savedTemplateId);
                  setApplyingFuture(false);
                  setShowApplyFuture(false);
                  router.push("/workshops/templates");
                }}
                className="flex-1"
              >
                {applyingFuture ? "מעדכן..." : "כן, עדכן"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowApplyFuture(false);
                  router.push("/workshops/templates");
                }}
                className="flex-1"
              >
                לא
              </Button>
            </div>
          </div>
        </div>
      )}

      <form ref={formRef} action={formAction} onSubmit={handleSubmit} className="space-y-5">
        {state.message && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {state.message}
          </div>
        )}
        {/* Show ALL validation errors */}
        {state.errors && Object.keys(state.errors).length > 0 && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive space-y-1">
            <p className="font-medium">שגיאות:</p>
            {Object.entries(state.errors).map(([field, msgs]) => (
              <p key={field}>{field}: {(msgs as string[])?.join(", ")}</p>
            ))}
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
          {/* Fallback hidden inputs for fields not shown in certain types */}
          {!showParticipants && (
            <>
              <input type="hidden" name="minParticipants" value={minParticipants} />
              <input type="hidden" name="maxParticipants" value={maxParticipants} />
            </>
          )}
          {/* defaultPrice hidden fallback for EVENT type (no price input shown there) */}
          {workshopType === "EVENT" && (
            <input type="hidden" name="defaultPrice" value={defaultPrice} />
          )}
        </div>

        {/* ── Common: name + description ── */}
        <div className="space-y-1.5">
          <Label htmlFor="name">שם התבנית *</Label>
          <Input
            id="name"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
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
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="תאר את הסדנה..."
            rows={3}
          />
        </div>

        {/* ── Duration: hours + minutes ── */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>משך הסדנה</Label>
            <div className="flex items-center gap-2">
              <NumberInput
                value={durationHours}
                onChange={(e) => setDurationHours(Math.max(0, Math.min(8, Number(e.target.value))))}
                min={0}
                max={8}
                className="w-20"
                aria-label="שעות"
              />
              <span className="text-sm text-muted-foreground shrink-0">שע׳</span>
              <NumberInput
                value={durationMins}
                onChange={(e) => setDurationMins(Math.max(0, Math.min(55, Math.round(Number(e.target.value) / 5) * 5)))}
                min={0}
                max={55}
                step={5}
                className="w-20"
                aria-label="דקות"
              />
              <span className="text-sm text-muted-foreground shrink-0">דק׳</span>
            </div>
            {/* Hidden field — actual value in minutes */}
            <input type="hidden" name="durationMinutes" value={effectiveDurationMinutes} />
            {workshopType === "RECURRING" && computedDuration !== null && (
              <p className="text-xs text-primary">
                משך מחושב מהזמנים: {formatDuration(computedDuration)}
              </p>
            )}
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
                value={defaultPrice}
                onChange={(e) => setDefaultPrice(e.target.value)}
              />
            </div>
          )}

          {/* CLASS — price per month */}
          {workshopType === "CLASS" && (
            <div className="space-y-1.5">
              <Label htmlFor="defaultPrice">מחיר למשתתף/ת לחודש (₪)</Label>
              <NumberInput
                id="defaultPrice"
                name="defaultPrice"
                min={0}
                step={0.01}
                value={defaultPrice}
                onChange={(e) => setDefaultPrice(e.target.value)}
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
                value={minParticipants}
                onChange={(e) => setMinParticipants(e.target.value)}
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
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(e.target.value)}
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
                  value={recurrenceFrequency}
                  onChange={(e) => setRecurrenceFrequency(e.target.value)}
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
                  value={recurrenceDayOfWeek}
                  onChange={(e) => setRecurrenceDayOfWeek(e.target.value)}
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

            {/* RECURRING: start + end time */}
            {workshopType === "RECURRING" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="recurrenceStartTime">שעת התחלה</Label>
                  <input
                    type="time"
                    id="recurrenceStartTime"
                    name="recurrenceStartTime"
                    value={recurrenceStartTime}
                    onChange={(e) => setRecurrenceStartTime(e.target.value)}
                    className={timeInputClass()}
                    dir="ltr"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="recurrenceEndTime">שעת סיום</Label>
                  <input
                    type="time"
                    id="recurrenceEndTime"
                    name="recurrenceEndTime"
                    value={recurrenceEndTime}
                    onChange={(e) => setRecurrenceEndTime(e.target.value)}
                    className={timeInputClass()}
                    dir="ltr"
                  />
                </div>
              </div>
            )}
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
              value={totalSessions}
              onChange={(e) => setTotalSessions(e.target.value)}
              placeholder="לדוגמה: 12"
            />
          </div>
        )}

        {/* ── SEASONAL: season months + lead times in weeks + reminders ── */}
        {workshopType === "SEASONAL" && (
          <div className="space-y-4 rounded-lg border border-border bg-muted/20 p-4">
            <p className="text-sm font-medium text-muted-foreground">הגדרות עונה</p>
            <p className="text-xs text-muted-foreground">
              תאריך האירוע ייקבע בעת התיאום — לא נדרש כאן
            </p>

            {/* Season months */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="seasonStartMonth">תחילת עונה</Label>
                <select
                  id="seasonStartMonth"
                  name="seasonStartMonth"
                  value={seasonStartMonth}
                  onChange={(e) => setSeasonStartMonth(e.target.value)}
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
                  value={seasonEndMonth}
                  onChange={(e) => setSeasonEndMonth(e.target.value)}
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

            {/* Lead times in weeks (all optional) */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="seasonPublishLeadWeeks">שבועות לפרסום שיווק</Label>
                <NumberInput
                  id="seasonPublishLeadWeeks"
                  name="seasonPublishLeadWeeks"
                  min={0}
                  value={seasonPublishLeadWeeks}
                  onChange={(e) => setSeasonPublishLeadWeeks(e.target.value)}
                  placeholder="לא חובה"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="seasonPrepLeadWeeks">שבועות להכנת חומרים</Label>
                <NumberInput
                  id="seasonPrepLeadWeeks"
                  name="seasonPrepLeadWeeks"
                  min={0}
                  value={seasonPrepLeadWeeks}
                  onChange={(e) => setSeasonPrepLeadWeeks(e.target.value)}
                  placeholder="לא חובה"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="seasonOpenRegistrationWeeks">שבועות לפתיחת הרשמה</Label>
                <NumberInput
                  id="seasonOpenRegistrationWeeks"
                  name="seasonOpenRegistrationWeeks"
                  min={0}
                  value={seasonOpenRegistrationWeeks}
                  onChange={(e) => setSeasonOpenRegistrationWeeks(e.target.value)}
                  placeholder="לא חובה"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="seasonCloseRegistrationWeeks">שבועות לסגירת הרשמה</Label>
                <NumberInput
                  id="seasonCloseRegistrationWeeks"
                  name="seasonCloseRegistrationWeeks"
                  min={0}
                  value={seasonCloseRegistrationWeeks}
                  onChange={(e) => setSeasonCloseRegistrationWeeks(e.target.value)}
                  placeholder="לא חובה"
                />
              </div>
            </div>

            {/* Reminder weeks — dynamic list, optional */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>תזכורות שבועות לפני העונה</Label>
                <button
                  type="button"
                  onClick={() => setReminderWeeks((prev) => [...prev, ""])}
                  className="flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <Plus className="h-3.5 w-3.5" />
                  הוסף תזכורת
                </button>
              </div>
              {reminderWeeks.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  לא הוגדרו תזכורות (רשות) — לחץ &quot;הוסף תזכורת&quot; להוספה
                </p>
              )}
              <div className="space-y-2">
                {reminderWeeks.map((w, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <NumberInput
                      name="seasonReminderWeek"
                      value={w}
                      onChange={(e) => {
                        const next = [...reminderWeeks];
                        next[idx] = e.target.value;
                        setReminderWeeks(next);
                      }}
                      min={1}
                      className="w-24"
                      placeholder="שבועות"
                    />
                    <span className="text-sm text-muted-foreground shrink-0">שבועות לפני תחילת העונה</span>
                    <button
                      type="button"
                      onClick={() => setReminderWeeks((prev) => prev.filter((_, i) => i !== idx))}
                      className="mr-auto text-muted-foreground hover:text-destructive transition-colors p-1"
                      aria-label="הסר תזכורת"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
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
                  value={eventContactName}
                  onChange={(e) => setEventContactName(e.target.value)}
                  placeholder="שם המזמין"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="eventContactPhone">טלפון</Label>
                <Input
                  id="eventContactPhone"
                  name="eventContactPhone"
                  value={eventContactPhone}
                  onChange={(e) => setEventContactPhone(e.target.value)}
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
                value={eventSpecialRequests}
                onChange={(e) => setEventSpecialRequests(e.target.value)}
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
                  value={defaultPrice}
                  onChange={(e) => setDefaultPrice(e.target.value)}
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
                  value={ageRangeMin}
                  onChange={(e) => setAgeRangeMin(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ageRangeMax">גיל מקסימום</Label>
                <NumberInput
                  id="ageRangeMax"
                  name="ageRangeMax"
                  min={0}
                  max={18}
                  value={ageRangeMax}
                  onChange={(e) => setAgeRangeMax(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="requiresAdultSupervision"
                name="requiresAdultSupervision"
                value="true"
                checked={requiresAdultSupervision}
                onChange={(e) => setRequiresAdultSupervision(e.target.checked)}
                className="h-4 w-4"
              />
              <Label htmlFor="requiresAdultSupervision">נדרש ליווי מבוגר</Label>
              <input type="hidden" name="requiresAdultSupervision" value="false" />
            </div>
          </div>
        )}

        {/* ── Images ── */}
        <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-4">
          {/* Hidden file input with ref */}
          <input
            ref={imageInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            multiple
            className="hidden"
            onChange={(e) => {
              const files = Array.from(e.target.files ?? []);
              handleImageFiles(files);
              e.target.value = "";
            }}
          />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">תמונות {uploading && <span className="text-xs animate-pulse">(מעלה...)</span>}</p>
              <p className="text-xs text-muted-foreground mt-0.5">מומלץ: תמונות לרוחב (landscape), עד 2MB לתמונה, עד 5 תמונות</p>
            </div>
            {images.length < 5 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => imageInputRef.current?.click()}
                className="text-xs gap-1 h-7"
              >
                <Plus className="h-3.5 w-3.5" />
                העלה תמונות
              </Button>
            )}
          </div>
          {images.length === 0 && (
            <div
              onClick={() => imageInputRef.current?.click()}
              className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border p-6 text-center hover:border-primary hover:bg-primary/5 transition-colors"
            >
              <Plus className="h-6 w-6 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">לחצו לבחירת תמונות</p>
              <p className="text-xs text-muted-foreground">ניתן לבחור כמה תמונות בבת אחת</p>
            </div>
          )}
          {/* Hidden primary index */}
          <input type="hidden" name="imagePrimaryIndex" value={primaryIndex >= 0 ? primaryIndex : 0} />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {images.map((img, idx) => (
              <div
                key={idx}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDrop={() => handleDrop(idx)}
                onDragEnd={handleDragEnd}
                className={`relative rounded-lg border overflow-hidden bg-background transition-colors ${
                  dragOverIdx === idx ? "border-primary ring-2 ring-primary/20" : "border-border"
                }`}
              >
                <div className="w-full h-24 bg-muted/20 flex items-center justify-center overflow-hidden">
                  <img src={img.url} alt={img.alt || "תמונה"} className="max-w-full max-h-full object-contain" />
                </div>
                <div className="p-2 space-y-1">
                  <Input
                    name="imageAlt"
                    value={img.alt}
                    onChange={(e) => updateImage(idx, "alt", e.target.value)}
                    placeholder="תיאור (לא חובה)"
                    className="text-xs h-7"
                  />
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setPrimary(idx)}
                      className={`text-xs px-2 py-0.5 rounded transition-colors ${
                        img.isPrimary
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-primary"
                      }`}
                    >
                      {img.isPrimary ? "⭐ ראשית" : "סמן ראשית"}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="text-muted-foreground hover:text-destructive transition-colors p-0.5"
                      aria-label="הסר תמונה"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <input type="hidden" name="imageUrl" value={img.url} />
                <input type="hidden" name="imageAlt" value={img.alt} />
              </div>
            ))}
          </div>
        </div>

        {/* ── Marketing text + Internal notes ── */}
        <div className="space-y-1.5">
          <Label htmlFor="marketingText">טקסט שיווקי</Label>
          <Textarea
            id="marketingText"
            name="marketingText"
            value={marketingText}
            onChange={(e) => setMarketingText(e.target.value)}
            placeholder="הטקסט שיופיע בפרסומים ובשיתופים..."
            rows={3}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="internalNotes">הערות פנימיות</Label>
          <Textarea
            id="internalNotes"
            name="internalNotes"
            value={internalNotes}
            onChange={(e) => setInternalNotes(e.target.value)}
            placeholder="חומרים, טיפים, דגשים..."
            rows={3}
          />
        </div>

        {/* ── Registration URL ── */}
        <div className="space-y-1.5">
          <Label htmlFor="registrationUrl">קישור להרשמה</Label>
          <Input
            id="registrationUrl"
            name="registrationUrl"
            value={registrationUrl}
            onChange={(e) => setRegistrationUrl(e.target.value)}
            placeholder="https://..."
            type="url"
            dir="ltr"
            aria-invalid={!!state.errors?.registrationUrl}
          />
          {state.errors?.registrationUrl && (
            <p className="text-xs text-destructive">{state.errors.registrationUrl[0]}</p>
          )}
        </div>

        {/* ── Common: tags + isActive ── */}
        <div className="space-y-1.5">
          <Label htmlFor="tags">תגיות (מופרדות בפסיק)</Label>
          <Input
            id="tags"
            name="tags"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="למתחילים, כלי שתייה, קצר"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isActive"
            name="isActive"
            value="true"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
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
    </>
  );
}
