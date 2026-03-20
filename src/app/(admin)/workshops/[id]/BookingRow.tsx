"use client";

import { useTransition, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  updateBookingStatus,
  deleteBooking,
  updatePaymentStatus,
} from "@/actions/bookings";
import type { BookingStatus, PaymentStatus } from "@/generated/prisma";
import { ChevronDown, ChevronUp, Trash2, User } from "lucide-react";

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
};

export function BookingRow({
  booking,
  eventId,
  price,
}: {
  booking: BookingWithRelations;
  eventId: string;
  price: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const [isPending, startTransition] = useTransition();

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
            <div className="font-medium text-sm truncate">
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
          <Badge
            variant={BOOKING_STATUS_VARIANTS[booking.status]}
            className="text-xs hidden sm:inline-flex"
          >
            {BOOKING_STATUS_LABELS[booking.status]}
          </Badge>
          {payment && (
            <Badge
              variant={PAYMENT_STATUS_VARIANTS[payment.status]}
              className="text-xs"
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
              <div className="flex flex-wrap gap-2">
                {payment.status !== "paid" && (
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => handlePaymentStatus(payment.id, "paid")}
                    disabled={isPending}
                  >
                    סמן כשולם
                  </Button>
                )}
                {payment.status !== "partial" && payment.status !== "paid" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handlePaymentStatus(payment.id, "partial")}
                    disabled={isPending}
                  >
                    שולם חלקית
                  </Button>
                )}
                {payment.status !== "pending" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handlePaymentStatus(payment.id, "pending")}
                    disabled={isPending}
                  >
                    ממתין לתשלום
                  </Button>
                )}
                {payment.status === "paid" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handlePaymentStatus(payment.id, "refunded")}
                    disabled={isPending}
                  >
                    בצע החזר
                  </Button>
                )}
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
