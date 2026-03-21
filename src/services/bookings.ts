/**
 * Booking + payment service — pure business logic, no Next.js dependencies.
 */

import type { BookingStatus, PaymentStatus, PrismaClient } from "@/generated/prisma";
import { recomputeEventStatus } from "./workshop-events";

export interface CreateBookingInput {
  customerId: string;
  participantCount?: number;
  notes?: string;
}

export interface CreateBookingResult {
  ok: true;
  bookingId: string;
  paymentId: string;
}

export interface CreateBookingError {
  ok: false;
  message: string;
}

export async function createBooking(
  prisma: PrismaClient,
  studioId: string,
  eventId: string,
  input: CreateBookingInput
): Promise<CreateBookingResult | CreateBookingError> {
  const event = await prisma.workshopEvent.findFirst({
    where: { id: eventId, studioId },
    include: {
      bookings: { where: { status: { in: ["confirmed", "pending"] } } },
    },
  });

  if (!event) return { ok: false, message: "Event not found" };

  const currentCount = event.bookings.reduce(
    (s, b) => s + b.participantCount,
    0
  );
  const participantCount = input.participantCount ?? 1;
  const newTotal = currentCount + participantCount;

  if (newTotal > event.maxParticipants) {
    return {
      ok: false,
      message: `Not enough capacity. ${event.maxParticipants - currentCount} spots remaining`,
    };
  }

  const booking = await prisma.booking.create({
    data: {
      studioId,
      workshopEventId: eventId,
      customerId: input.customerId,
      participantCount,
      notes: input.notes,
      status: "confirmed",
    },
  });

  const payment = await prisma.payment.create({
    data: {
      studioId,
      bookingId: booking.id,
      amount: Number(event.price) * participantCount,
      status: "pending",
    },
  });

  await recomputeEventStatus(prisma, eventId);

  return { ok: true, bookingId: booking.id, paymentId: payment.id };
}

export async function updateBookingStatus(
  prisma: PrismaClient,
  bookingId: string,
  studioId: string,
  status: BookingStatus,
  eventId: string
) {
  await prisma.booking.updateMany({
    where: { id: bookingId, studioId },
    data: { status },
  });
  await recomputeEventStatus(prisma, eventId);
}

export async function deleteBooking(
  prisma: PrismaClient,
  bookingId: string,
  studioId: string,
  eventId: string
) {
  await prisma.booking.deleteMany({ where: { id: bookingId, studioId } });
  await recomputeEventStatus(prisma, eventId);
}

export async function updatePaymentStatus(
  prisma: PrismaClient,
  paymentId: string,
  studioId: string,
  status: PaymentStatus
) {
  return prisma.payment.updateMany({
    where: { id: paymentId, studioId },
    data: {
      status,
      paidAt: status === "paid" ? new Date() : null,
    },
  });
}

export async function createCustomer(
  prisma: PrismaClient,
  studioId: string,
  name: string,
  email?: string,
  phone?: string
) {
  return prisma.customer.create({
    data: { studioId, name, email, phone },
  });
}
