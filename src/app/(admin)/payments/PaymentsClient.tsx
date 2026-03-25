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
import { updatePaymentAction } from "@/actions/payments";
import type { PaymentStatus } from "@/generated/prisma";

type PaymentItem = {
  id: string;
  amount: { toString(): string } | string | number;
  status: PaymentStatus;
  notes: string | null;
  paidAt: Date | null;
  createdAt: Date;
  booking: {
    customer: { id: string; name: string; email: string | null; phone: string | null };
    workshopEvent: { id: string; title: string; startsAt: Date };
  };
};

const STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: "ממתין",
  paid: "שולם",
  partial: "חלקי",
  refunded: "הוחזר",
  cancelled: "מבוטל",
};

function statusClass(status: PaymentStatus) {
  switch (status) {
    case "paid":
      return "bg-green-100 text-green-800 border-green-200";
    case "partial":
      return "bg-orange-100 text-orange-800 border-orange-200";
    case "pending":
      return "bg-red-100 text-red-800 border-red-200";
    case "refunded":
    case "cancelled":
      return "bg-gray-100 text-gray-600 border-gray-200";
  }
}

function formatDate(d: Date) {
  return new Intl.DateTimeFormat("he-IL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(d));
}

function UpdatePaymentDialog({
  payment,
  onClose,
}: {
  payment: PaymentItem;
  onClose: () => void;
}) {
  const [status, setStatus] = useState<string>(payment.status);
  const [amount, setAmount] = useState(Number(payment.amount).toFixed(0));
  const [notes, setNotes] = useState(payment.notes ?? "");
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    startTransition(async () => {
      await updatePaymentAction(payment.id, {
        status,
        amount: Number(amount),
        notes: notes || null,
      });
      onClose();
    });
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent dir="rtl">
        <DialogHeader>
          <DialogTitle>עדכן תשלום</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="text-sm text-muted-foreground">
            {payment.booking.customer.name} ·{" "}
            {payment.booking.workshopEvent.title}
          </div>

          <div className="space-y-1.5">
            <Label>סטטוס</Label>
            <Select value={status} onValueChange={(v) => { if (v) setStatus(v); }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">ממתין</SelectItem>
                <SelectItem value="paid">שולם</SelectItem>
                <SelectItem value="partial">חלקי</SelectItem>
                <SelectItem value="refunded">הוחזר</SelectItem>
                <SelectItem value="cancelled">מבוטל</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>סכום (₪)</Label>
            <Input
              type="number"
              min="0"
              step="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              dir="ltr"
            />
          </div>

          <div className="space-y-1.5">
            <Label>הערות</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="הערות אופציונליות..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            ביטול
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? "שומר..." : "שמור"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "הכל" },
  { value: "pending", label: "ממתין" },
  { value: "paid", label: "שולם" },
  { value: "partial", label: "חלקי" },
  { value: "refunded", label: "הוחזר" },
  { value: "cancelled", label: "מבוטל" },
];

export function PaymentsClient({
  payments,
  totalDebt,
}: {
  payments: PaymentItem[];
  totalDebt: number;
}) {
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [editingPayment, setEditingPayment] = useState<PaymentItem | null>(null);

  const filtered = payments
    .filter((p) => statusFilter === "all" || p.status === statusFilter)
    .filter((p) =>
      !search ||
      p.booking.customer.name.toLowerCase().includes(search.toLowerCase()) ||
      p.booking.workshopEvent.title.toLowerCase().includes(search.toLowerCase())
    );

  return (
    <div className="space-y-4">
      {/* Total debt badge */}
      {totalDebt > 0 && (
        <div className="inline-flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-2">
          <span className="text-sm text-red-700">סה&quot;כ חוב פתוח:</span>
          <span className="text-lg font-bold text-red-600">₪{totalDebt.toFixed(0)}</span>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="חיפוש לפי שם לקוח..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pr-9"
        />
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setStatusFilter(opt.value)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              statusFilter === opt.value
                ? "bg-foreground text-background border-foreground"
                : "bg-background border-input hover:bg-muted"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Payments list */}
      {filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">אין תשלומים להצגה</p>
      ) : (
        <div className="rounded-md border divide-y">
          {filtered.map((payment) => (
            <div
              key={payment.id}
              className="flex items-center justify-between gap-3 px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <div className="font-medium text-sm break-words">
                  {payment.booking.customer.name}
                </div>
                <div className="text-xs text-muted-foreground break-words">
                  {payment.booking.workshopEvent.title} ·{" "}
                  {formatDate(payment.booking.workshopEvent.startsAt)}
                </div>
                {payment.paidAt && (
                  <div className="text-xs text-green-600">
                    שולם ב-{formatDate(payment.paidAt)}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="font-semibold text-sm">
                  ₪{Number(payment.amount).toFixed(0)}
                </span>
                <Badge
                  className={`text-xs border ${statusClass(payment.status)}`}
                  variant="outline"
                >
                  {STATUS_LABELS[payment.status]}
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditingPayment(payment)}
                >
                  עדכן תשלום
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editingPayment && (
        <UpdatePaymentDialog
          payment={editingPayment}
          onClose={() => setEditingPayment(null)}
        />
      )}
    </div>
  );
}
