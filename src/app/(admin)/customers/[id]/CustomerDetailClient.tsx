"use client";

import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CustomerActions } from "@/components/CustomerActions";
import { EditCustomerDialog } from "./EditCustomerDialog";
import Link from "next/link";
import type { BookingStatus, PaymentStatus, WorkshopStatus } from "@/generated/prisma";
import { Pencil, MessageCircle, CalendarPlus, CreditCard, Plus, X } from "lucide-react";
import { addCustomerToWorkshopAction } from "@/actions/customers";
import { createPunchCardAction } from "@/actions/punch-cards";

type PaymentItem = {
  id: string;
  amount: { toString(): string } | string | number;
  status: PaymentStatus;
  paidAt: Date | null;
};

type BookingItem = {
  id: string;
  status: BookingStatus;
  participantCount: number;
  createdAt: Date;
  workshopEvent: {
    id: string;
    title: string;
    startsAt: Date;
    status: WorkshopStatus;
  };
  payments: PaymentItem[];
};

type PunchCardItem = {
  id: string;
  totalSessions: number;
  usedSessions: number;
  paidAmount: { toString(): string } | string | number;
  purchasedAt: Date;
  expiresAt: Date | null;
  template: { name: string } | null;
};

type WorkshopItem = {
  id: string;
  title: string;
  startsAt: Date;
  status: WorkshopStatus;
  maxParticipants: number;
  _count?: { bookings: number };
};

type TemplateItem = {
  id: string;
  name: string;
};

type CustomerData = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  tags: string[];
  preferredContactMethod: string | null;
  bookings: BookingItem[];
  punchCards?: PunchCardItem[];
};

const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  pending: "ממתין",
  confirmed: "מאושר",
  cancelled: "מבוטל",
  waitlist: "רשימת המתנה",
};

const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: "ממתין לתשלום",
  paid: "שולם",
  partial: "חלקי",
  refunded: "הוחזר",
  cancelled: "מבוטל",
};

function paymentBadgeClass(status: PaymentStatus) {
  switch (status) {
    case "paid": return "bg-green-100 text-green-800 border-green-200";
    case "partial": return "bg-orange-100 text-orange-800 border-orange-200";
    case "pending": return "bg-red-100 text-red-800 border-red-200";
    default: return "bg-gray-100 text-gray-600 border-gray-200";
  }
}

const CONTACT_METHOD_LABELS: Record<string, string> = {
  phone: "טלפון",
  whatsapp: "וואטסאפ",
  sms: "SMS",
  email: "מייל",
};

function formatDate(d: Date) {
  return new Intl.DateTimeFormat("he-IL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(d));
}

interface Props {
  customer: CustomerData;
  availableWorkshops?: WorkshopItem[];
  templates?: TemplateItem[];
}

export function CustomerDetailClient({ customer, availableWorkshops = [], templates = [] }: Props) {
  const [showEdit, setShowEdit] = useState(false);
  const [showAddWorkshop, setShowAddWorkshop] = useState(false);
  const [showAddPunchCard, setShowAddPunchCard] = useState(false);
  const [workshopError, setWorkshopError] = useState<string | null>(null);
  const [punchCardError, setPunchCardError] = useState<string | null>(null);
  const [isPendingWorkshop, startWorkshopTransition] = useTransition();
  const [isPendingPunchCard, startPunchCardTransition] = useTransition();

  const totalPaid = customer.bookings
    .flatMap((b) => b.payments)
    .filter((p) => p.status === "paid")
    .reduce((s, p) => s + Number(p.amount), 0);

  const totalPending = customer.bookings
    .flatMap((b) => b.payments)
    .filter((p) => p.status === "pending" || p.status === "partial")
    .reduce((s, p) => s + Number(p.amount), 0);

  const activePunchCards = (customer.punchCards ?? []).filter(
    (pc) => pc.usedSessions < pc.totalSessions && (!pc.expiresAt || new Date(pc.expiresAt) > new Date())
  );

  const debtMessage = totalPending > 0
    ? `שלום ${customer.name}, נשמח לתזכורת שיש לך חוב פתוח בסך ₪${totalPending.toFixed(0)}. תודה!`
    : "";

  function handleAddToWorkshop(eventId: string) {
    setWorkshopError(null);
    startWorkshopTransition(async () => {
      const result = await addCustomerToWorkshopAction(customer.id, eventId);
      if (!result.ok) {
        setWorkshopError(result.error);
      } else {
        setShowAddWorkshop(false);
      }
    });
  }

  function handleAddPunchCard(formData: FormData) {
    setPunchCardError(null);
    startPunchCardTransition(async () => {
      const result = await createPunchCardAction(customer.id, formData);
      if (!result.ok) {
        setPunchCardError(result.error);
      } else {
        setShowAddPunchCard(false);
      }
    });
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Profile card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between flex-wrap gap-2">
            <CardTitle className="text-lg">{customer.name}</CardTitle>
            <div className="flex gap-2 flex-wrap">
              {totalPending > 0 && customer.phone && (
                <a
                  href={`https://wa.me/${customer.phone.replace(/\D/g, "")}?text=${encodeURIComponent(debtMessage)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }), "text-green-700 border-green-200 hover:bg-green-50")}
                >
                  <MessageCircle className="h-4 w-4 ml-1" />
                  תזכורת חוב
                </a>
              )}
              <Button size="sm" variant="outline" onClick={() => setShowAddWorkshop(true)}>
                <CalendarPlus className="h-4 w-4 ml-1" />
                הוסף לסדנה
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowEdit(true)}>
                <Pencil className="h-4 w-4 ml-1" />
                עדכן פרטים
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-muted-foreground">
            {customer.phone && (
              <div>
                <span className="font-medium text-foreground">טלפון: </span>
                {customer.phone}
              </div>
            )}
            {customer.email && (
              <div>
                <span className="font-medium text-foreground">מייל: </span>
                {customer.email}
              </div>
            )}
            {customer.preferredContactMethod && (
              <div>
                <span className="font-medium text-foreground">תקשורת מועדפת: </span>
                {CONTACT_METHOD_LABELS[customer.preferredContactMethod] ??
                  customer.preferredContactMethod}
              </div>
            )}
          </div>

          {customer.tags.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {customer.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {customer.notes && (
            <p className="rounded-md bg-muted p-3 text-muted-foreground">
              {customer.notes}
            </p>
          )}

          <CustomerActions
            name={customer.name}
            phone={customer.phone}
            email={customer.email}
            size="md"
          />
        </CardContent>
      </Card>

      {/* Payment summary */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="py-4">
            <p className="text-xs text-muted-foreground">סה&quot;כ שולם</p>
            <p className="text-xl font-bold text-green-600">₪{totalPaid.toFixed(0)}</p>
          </CardContent>
        </Card>
        <Card className={totalPending > 0 ? "border-red-200" : ""}>
          <CardContent className="py-4">
            <p className="text-xs text-muted-foreground">יתרת חוב</p>
            <p className={`text-xl font-bold ${totalPending > 0 ? "text-red-500" : "text-muted-foreground"}`}>
              ₪{totalPending.toFixed(0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Punch Cards */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              כרטיסיות
            </CardTitle>
            <Button size="sm" variant="outline" onClick={() => setShowAddPunchCard(true)}>
              <Plus className="h-3.5 w-3.5 ml-1" />
              הוסף כרטיסייה
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {activePunchCards.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">אין כרטיסיות פעילות</p>
          ) : (
            <div className="divide-y">
              {activePunchCards.map((pc) => {
                const remaining = pc.totalSessions - pc.usedSessions;
                const isLow = remaining <= 2;
                return (
                  <div key={pc.id} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="text-sm font-medium">{pc.template?.name ?? "כרטיסייה כללית"}</p>
                      <p className="text-xs text-muted-foreground">
                        נרכשה: {formatDate(pc.purchasedAt)}
                        {pc.expiresAt && ` · תפוגה: ${formatDate(pc.expiresAt)}`}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className={`text-lg font-bold ${isLow ? "text-orange-500" : "text-foreground"}`}>
                        {remaining}/{pc.totalSessions}
                      </p>
                      <p className="text-xs text-muted-foreground">מפגשים נותרו</p>
                      {isLow && (
                        <p className="text-xs text-orange-500 font-medium">⚠️ נגמר בקרוב</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bookings history */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">היסטוריית הזמנות</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {customer.bookings.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">אין הזמנות</p>
          ) : (
            <div className="divide-y">
              {customer.bookings.map((booking) => {
                const payment = booking.payments[0];
                return (
                  <div key={booking.id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/workshops/${booking.workshopEvent.id}`}
                        className="font-medium text-sm hover:underline"
                      >
                        {booking.workshopEvent.title}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(booking.workshopEvent.startsAt)} · {booking.participantCount} משתתפים
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="outline" className="text-xs">
                        {BOOKING_STATUS_LABELS[booking.status]}
                      </Badge>
                      {payment && (
                        <Badge
                          className={`text-xs border ${paymentBadgeClass(payment.status)}`}
                          variant="outline"
                        >
                          {PAYMENT_STATUS_LABELS[payment.status]}
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add to Workshop dialog */}
      {showAddWorkshop && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-xl border p-6 max-w-md w-full max-h-[80vh] flex flex-col shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold">הוסף לסדנה</h2>
              <button onClick={() => { setShowAddWorkshop(false); setWorkshopError(null); }}>
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
            {workshopError && (
              <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive mb-3">
                {workshopError}
              </div>
            )}
            {availableWorkshops.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">אין סדנאות פתוחות להרשמה</p>
            ) : (
              <div className="overflow-y-auto flex-1 divide-y border rounded-md">
                {availableWorkshops.map((ws) => (
                  <button
                    key={ws.id}
                    disabled={isPendingWorkshop}
                    onClick={() => handleAddToWorkshop(ws.id)}
                    className="w-full flex items-center justify-between px-3 py-3 hover:bg-muted/50 transition-colors text-right disabled:opacity-50"
                  >
                    <div>
                      <p className="text-sm font-medium">{ws.title}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(ws.startsAt)}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {ws.status === "open" ? "פתוח" : ws.status === "confirmed" ? "מאושר" : ws.status}
                    </Badge>
                  </button>
                ))}
              </div>
            )}
            <Button variant="outline" className="mt-4" onClick={() => { setShowAddWorkshop(false); setWorkshopError(null); }}>
              סגור
            </Button>
          </div>
        </div>
      )}

      {/* Add Punch Card dialog */}
      {showAddPunchCard && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-xl border p-6 max-w-sm w-full shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold">הוסף כרטיסייה</h2>
              <button onClick={() => { setShowAddPunchCard(false); setPunchCardError(null); }}>
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
            {punchCardError && (
              <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive mb-3">
                {punchCardError}
              </div>
            )}
            <form
              action={(formData) => handleAddPunchCard(formData)}
              className="space-y-4"
            >
              {templates.length > 0 && (
                <div className="space-y-1.5">
                  <Label htmlFor="pc-template">סוג סדנה (אופציונלי)</Label>
                  <select
                    id="pc-template"
                    name="templateId"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">כללי</option>
                    {templates.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="pc-sessions">מספר מפגשים *</Label>
                <Input
                  id="pc-sessions"
                  name="totalSessions"
                  type="number"
                  min="1"
                  max="100"
                  required
                  placeholder="10"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pc-amount">סכום ששולם (₪)</Label>
                <Input
                  id="pc-amount"
                  name="paidAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pc-expires">תאריך תפוגה (אופציונלי)</Label>
                <Input
                  id="pc-expires"
                  name="expiresAt"
                  type="date"
                  dir="ltr"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={isPendingPunchCard} className="flex-1">
                  {isPendingPunchCard ? "שומר..." : "הוסף כרטיסייה"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setShowAddPunchCard(false); setPunchCardError(null); }}
                >
                  ביטול
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEdit && (
        <EditCustomerDialog customer={customer} onClose={() => setShowEdit(false)} />
      )}
    </div>
  );
}
