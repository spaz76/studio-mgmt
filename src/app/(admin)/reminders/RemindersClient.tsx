"use client";

import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createReminderAction, updateReminderStatusAction } from "@/actions/reminders";
import type { ReminderStatus, ReminderType } from "@/generated/prisma";
import Link from "next/link";
import { Plus } from "lucide-react";

type ReminderItem = {
  id: string;
  title: string;
  body: string | null;
  status: ReminderStatus;
  type: ReminderType;
  dueAt: Date | null;
  createdAt: Date;
  relatedWorkshopEvent: { id: string; title: string; startsAt: Date } | null;
  relatedMaterial: { id: string; name: string } | null;
};

const STATUS_LABELS: Record<ReminderStatus, string> = {
  open: "פתוח",
  in_progress: "בטיפול",
  done: "בוצע",
};

const TYPE_LABELS: Record<ReminderType, string> = {
  workshop: "סדנה",
  seasonal: "עונתי",
  material: "חומרים",
  manual: "ידני",
};

// payment type label (it's a string field, not an enum value, but we handle it)
const EXTRA_TYPE_LABELS: Record<string, string> = {
  payment: "תשלום",
};

function getTypeLabel(type: string): string {
  return TYPE_LABELS[type as ReminderType] ?? EXTRA_TYPE_LABELS[type] ?? type;
}

function statusClass(status: ReminderStatus) {
  switch (status) {
    case "open":
      return "border-blue-300 text-blue-700 bg-blue-50";
    case "in_progress":
      return "border-orange-300 text-orange-700 bg-orange-50";
    case "done":
      return "border-green-300 text-green-700 bg-green-50";
  }
}

function formatDate(d: Date) {
  return new Intl.DateTimeFormat("he-IL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(d));
}

const STATUS_FILTERS = [
  { value: "all", label: "הכל" },
  { value: "open", label: "פתוח" },
  { value: "in_progress", label: "בטיפול" },
  { value: "done", label: "בוצע" },
];

const TYPE_FILTERS = [
  { value: "all", label: "כל הסוגים" },
  { value: "workshop", label: "סדנה" },
  { value: "seasonal", label: "עונתי" },
  { value: "material", label: "חומרים" },
  { value: "manual", label: "ידני" },
  { value: "payment", label: "תשלום" },
];

function AddReminderDialog({ onClose }: { onClose: () => void }) {
  const [isPending, startTransition] = useTransition();
  const [type, setType] = useState("manual");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("type", type);
    startTransition(async () => {
      await createReminderAction(formData);
      onClose();
    });
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent dir="rtl">
        <DialogHeader>
          <DialogTitle>הוסף תזכורת</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="r-title">כותרת *</Label>
            <Input id="r-title" name="title" required placeholder="כותרת התזכורת..." />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="r-body">פרטים</Label>
            <Textarea id="r-body" name="body" rows={3} placeholder="פרטים נוספים..." />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="r-dueAt">תאריך יעד</Label>
              <Input id="r-dueAt" name="dueAt" type="date" />
            </div>
            <div className="space-y-1.5">
              <Label>סוג</Label>
              <Select value={type} onValueChange={(v) => { if (v) setType(v); }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">ידני</SelectItem>
                  <SelectItem value="workshop">סדנה</SelectItem>
                  <SelectItem value="seasonal">עונתי</SelectItem>
                  <SelectItem value="material">חומרים</SelectItem>
                  <SelectItem value="payment">תשלום</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              ביטול
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "שומר..." : "הוסף"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function RemindersClient({
  reminders,
  openCount,
}: {
  reminders: ReminderItem[];
  openCount: number;
}) {
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [isPending, startTransition] = useTransition();

  const filtered = reminders.filter((r) => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (typeFilter !== "all" && r.type !== typeFilter) return false;
    if (search && !r.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  function handleStatusChange(id: string, status: string) {
    startTransition(() => updateReminderStatusAction(id, status));
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">תזכורות</h1>
          {openCount > 0 && (
            <Badge className="bg-blue-100 text-blue-800 border-blue-200 border" variant="outline">
              {openCount} פתוחות
            </Badge>
          )}
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 ml-1" />
          הוסף תזכורת
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="חיפוש לפי כותרת..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pr-9"
        />
      </div>

      {/* Filters */}
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                statusFilter === f.value
                  ? "bg-foreground text-background border-foreground"
                  : "bg-background border-input hover:bg-muted"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {TYPE_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setTypeFilter(f.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                typeFilter === f.value
                  ? "bg-foreground text-background border-foreground"
                  : "bg-background border-input hover:bg-muted"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">אין תזכורות להצגה</p>
      ) : (
        <div className="rounded-md border divide-y">
          {filtered.map((r) => (
            <div key={r.id} className="px-4 py-3 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{r.title}</span>
                    <Badge
                      className={`text-xs border ${statusClass(r.status)}`}
                      variant="outline"
                    >
                      {STATUS_LABELS[r.status]}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {getTypeLabel(r.type)}
                    </Badge>
                  </div>
                  {r.body && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {r.body}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    {r.dueAt && <span>יעד: {formatDate(r.dueAt)}</span>}
                    {r.relatedWorkshopEvent && (
                      <Link
                        href={`/workshops/${r.relatedWorkshopEvent.id}`}
                        className="text-blue-600 hover:underline"
                      >
                        {r.relatedWorkshopEvent.title}
                      </Link>
                    )}
                    {r.relatedMaterial && (
                      <span>חומר: {r.relatedMaterial.name}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Status actions */}
              <div className="flex flex-wrap gap-2">
                {r.status !== "done" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-green-700 border-green-300 hover:bg-green-50 text-xs"
                    onClick={() => handleStatusChange(r.id, "done")}
                    disabled={isPending}
                  >
                    סמן כבוצע
                  </Button>
                )}
                {r.status === "open" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-orange-700 border-orange-300 hover:bg-orange-50 text-xs"
                    onClick={() => handleStatusChange(r.id, "in_progress")}
                    disabled={isPending}
                  >
                    בטיפול
                  </Button>
                )}
                {r.status === "done" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-blue-700 border-blue-300 hover:bg-blue-50 text-xs"
                    onClick={() => handleStatusChange(r.id, "open")}
                    disabled={isPending}
                  >
                    פתח מחדש
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddDialog && <AddReminderDialog onClose={() => setShowAddDialog(false)} />}
    </div>
  );
}
