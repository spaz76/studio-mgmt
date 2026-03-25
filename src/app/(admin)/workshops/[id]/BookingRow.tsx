"use client";

import { useTransition, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  updateBookingStatus,
  deleteBooking,
  updatePaymentStatus,
} from "@/actions/bookings";
import { markAttendanceAction } from "@/actions/attendance";
import type { BookingStatus, PaymentStatus } from "@/generated/prisma";
import { ChevronDown, ChevronUp, Trash2, User, CheckSquare, Square, RefreshCw } from "lucide-react";
import { CustomerActions } from "@/components/CustomerActions";
import { formatEventDate } from "@/lib/format-date";

const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  pending: "ממתין",
  confirmed: "מאושר",
  cancelled: "מבוטל",
  waitlist: "רשימת המתנה",
};

const BOOKING_STATUS_VARIANTS: Record<
  BookingStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  pending: "outline",
  confirmed: "default",
  cancelled: "destructive",
  waitlist: "secondary",
};

const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: "ממתין לתשלום",
  paid: "שולם",
  partial: "חלקי",
  refunded: "הוחזר",
  cancelled: "מבוטל",
};

const PAYMENT_STATUS_VARIANTS: Record<
  PaymentStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  pending: "outline",
  paid: "default",
  partial: "secondary",
  refunded: "outline",
  cancelled: "destructive",
};

const PAYMENT_STATUS_CLASSES: Record<PaymentStatus, string> = {
  paid: "bg-green-100 text-green-800 border-green-200",
  partial: "bg-orange-100 text-orange-800 border-orange-200",
  pending: "bg-red-100 text-red-800 border-red-200",
  refunded: "bg-gray-100 text-gray-600 border-gray-200",
  cancelled: "bg-gray-100 text-gray-600 border-gray-200",
};

type BookingWithRelations = {
  id: string;
  customerId: string;
  participantCount: number;
  status: BookingStatus;
  notes: string | null;
  customer: { name: string; email: string | null; phone: string | null };
  payments: Array<{
    id: string;
    amount: { toString(): string } | string | number;
    status: PaymentStatus;
    paidAt: Date | null;
  }>;
  attendance: { attended: boolean; punchCardId: string | null } | null;
};

export function BookingRow({
  booking,
  eventId,
  price,
  paymentUrl,
  studioSlug,
  studioName,
  eventTitle,
  startsAt,
}: {
  booking: BookingWithRelations;
  eventId: string;
  price: number;
  paymentUrl?: string;
  studioSlug: string;
  studioName: string;
  eventTitle: string;
  startsAt: Date;
}) {
  const [expanded, setExpanded] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [attended, setAttended] = useState(booking.attendance?.attended ?? false);
  const [isAttendancePending, startAttendanceTransition] = useTransition();

  function handleAttendance() {
    const next = !attended;
    setAttended(next);
    startAttendanceTransition(() => markAttendanceAction(booking.id, next, eventId));
  }

  const payment = booking.payments[0];

  function handleBookingStatus(status: BookingStatus) {
    if (status === "cancelled" && !confirm("לבטל הזמנה זו?")) return;
    startTransition(() => updateBookingStatus(booking.id, status, eventId));
  }

  function handlePaymentStatus(paymentId: string, status: PaymentStatus) {
    startTransition(() => updatePaymentStatus(paymentId, status, eventId));
  }

  function handleDelete() {
    if (!confirm(`למחוק את ההזמנה של ${booking.customer.name}?`)) return;
    startTransition(() => deleteBooking(booking.id, eventId));
  }

  const { date: eventDate, time: eventTime } = formatEventDate(startsAt);
  const publicUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/s/${studioSlug}/event/${eventId}`;

  function getBookAgainUrl() {
    if (!booking.customer.phone) return null;
    const raw = booking.customer.phone.replace(/\D/g, "");
    const intlPhone = raw.startsWith("0") ? `972${raw.slice(1)}` : raw;
    const message = encodeURIComponent(
      `שלום ${booking.customer.name}, תזכורת לגבי ${eventTitle} ב${eventDate}.\n` +
      `לפרטים והרשמה: ${publicUrl}`
    );
    return `https://wa.me/${intlPhone}?text=${message}`;
  }

  const emailSubject = `הזמנה ל${eventTitle} - ${studioName}`;
  const emailBody =
    `שלום ${booking.customer.name},\n\n` +
    `הזמנה ל${eventTitle}\n` +
    `תאריך: ${eventDate}\n` +
    `שעה: ${eventTime}\n\n` +
    `לאישור הרשמה:\n${publicUrl}\n\n` +
    `בברכה,\n${studioName}`;

  return (
    <div
      className={`px-4 py-3 ${booking.status === "cancelled" ? "opacity-50" : ""}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
            <User className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <div className="font-medium text-sm break-words">
              {booking.customer.name}
            </div>
            <div className="text-xs text-muted-foreground">
              {booking.participantCount} משתתף
              {booking.participantCount > 1 ? "ים" : ""}
              {price > 0 && (
                <span className="mr-1">
                  · ₪{(price * booking.participantCount).toFixed(0)}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* Attendance toggle */}
          {booking.status !== "cancelled" && (
            <button
              onClick={handleAttendance}
              disabled={isAttendancePending}
              title={attended ? "סמן כנעדר" : "סמן כנוכח"}
              className={`flex items-center gap-1 text-xs px-2 py-1 rounded-md border transition-colors ${
                attended
                  ? "bg-green-50 border-green-300 text-green-700 hover:bg-green-100"
                  : "bg-muted/30 border-input text-muted-foreground hover:bg-muted"
              }`}
            >
              {attended ? (
                <CheckSquare className="h-3.5 w-3.5" />
              ) : (
                <Square className="h-3.5 w-3.5" />
              )}
              <span className="hidden sm:inline">{attended ? "נוכח" : "נוכחות"}</span>
            </button>
          )}
          <Badge
            variant={BOOKING_STATUS_VARIANTS[booking.status]}
            className="text-xs hidden sm:inline-flex"
          >
            {BOOKING_STATUS_LABELS[booking.status]}
          </Badge>
          {payment && (
            <Badge
              variant="outline"
              className={`text-xs border ${PAYMENT_STATUS_CLASSES[payment.status]}`}
            >
              {PAYMENT_STATUS_LABELS[payment.status]}
            </Badge>
          )}
          <button
            onClick={() => setExpanded((v) => !v)}
            className="p-1 rounded hover:bg-muted"
            aria-label="פרטים"
          >
            {expanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t space-y-3 text-sm">
          {/* Customer Details */}
          <div className="space-y-1 text-muted-foreground">
            {booking.customer.email && (
              <div>דוא&quot;ל: {booking.customer.email}</div>
            )}
            {booking.customer.phone && (
              <div>טלפון: {booking.customer.phone}</div>
            )}
            {booking.notes && <div>הערות: {booking.notes}</div>}
            {attended && booking.attendance?.punchCardId && (
              <div className="text-green-700 text-xs flex items-center gap-1">
                <CheckSquare className="h-3 w-3" />
                נוכחות נרשמה מכרטיסייה
              </div>
            )}
            <CustomerActions
              name={booking.customer.name}
              phone={booking.customer.phone}
              email={booking.customer.email}
              emailSubject={booking.customer.email ? emailSubject : undefined}
              emailBody={booking.customer.email ? emailBody : undefined}
              className="mt-1"
            />
            {booking.status !== "cancelled" && booking.customer.phone && (
              <a
                href={getBookAgainUrl() ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md border border-green-200 text-green-700 hover:bg-green-50 transition-colors mt-1"
              >
                <RefreshCw className="h-3 w-3" />
                הזמן שוב בוואטסאפ
              </a>
            )}
          </div>

          {/* Booking Status Controls */}
          {booking.status !== "cancelled" && (
            <div className="space-y-2">
              <div className="text-xs font-medium text-muted-foreground">
                סטטוס הזמנה
              </div>
              <div className="flex flex-wrap gap-2">
                {booking.status !== "confirmed" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBookingStatus("confirmed")}
                    disabled={isPending}
                  >
                    אשר
                  </Button>
                )}
                {booking.status !== "waitlist" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBookingStatus("waitlist")}
                    disabled={isPending}
                  >
                    רשימת המתנה
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="text-destructive"
                  onClick={() => handleBookingStatus("cancelled")}
                  disabled={isPending}
                >
                  בטל הזמנה
                </Button>
              </div>
            </div>
          )}

          {/* Payment Controls */}
          {payment && (
            <div className="space-y-2">
              <div className="text-xs font-medium text-muted-foreground">
                תשלום — ₪{Number(payment.amount).toFixed(0)}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {paymentUrl && payment.status !== "paid" && (
                  <a
                    href={paymentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button size="sm" variant="outline" className="text-blue-600 border-blue-300 hover:bg-blue-50">
                      שלח לתשלום
                    </Button>
                  </a>
                )}
                <select
                  value={payment.status}
                  onChange={(e) => handlePaymentStatus(payment.id, e.target.value as PaymentStatus)}
                  disabled={isPending}
                  className="flex h-8 rounded-md border border-input bg-background px-2 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
                >
                  <option value="paid">שולם</option>
                  <option value="partial">שולם חלקית</option>
                  <option value="pending">לא שולם</option>
                  <option value="refunded">הוחזר</option>
                  <option value="cancelled">מבוטל</option>
                </select>
              </div>
            </div>
          )}

          {/* Delete */}
          <div>
            <Button
              size="sm"
              variant="outline"
              className="text-destructive hover:text-destructive"
              onClick={handleDelete}
              disabled={isPending}
            >
              <Trash2 className="h-3.5 w-3.5 ml-1" />
              מחק הזמנה
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
