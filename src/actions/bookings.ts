"use server";

import { prisma } from "@/lib/prisma";
import { getStudioId } from "@/lib/studio";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { recomputeEventStatus } from "./workshop-events";
import type { BookingStatus, PaymentStatus } from "@/generated/prisma";

const BookingSchema = z.object({
  customerId: z.string().min(1, "לקוח הוא שדה חובה"),
  participantCount: z.coerce.number().int().min(1).default(1),
  notes: z.string().optional(),
});

export type BookingFormState = {
  errors?: Record<string, string[]>;
  message?: string;
};

export async function createBooking(
  eventId: string,
  _prev: BookingFormState,
  formData: FormData
): Promise<BookingFormState> {
  const studioId = await getStudioId();

  // Check capacity
  const event = await prisma.workshopEvent.findFirst({
    where: { id: eventId, studioId },
    include: {
      bookings: { where: { status: { in: ["confirmed", "pending"] } } },
    },
  });

  if (!event) return { message: "אירוע לא נמצא" };

  const currentCount = event.bookings.reduce(
    (s, b) => s + b.participantCount,
    0
  );

  const raw = {
    customerId: formData.get("customerId"),
    participantCount: formData.get("participantCount"),
    notes: formData.get("notes") || undefined,
  };

  const parsed = BookingSchema.safeParse(raw);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const newTotal = currentCount + parsed.data.participantCount;
  if (newTotal > event.maxParticipants) {
    return {
      message: `אין מספיק מקומות. נותרו ${event.maxParticipants - currentCount} מקומות`,
    };
  }

  const booking = await prisma.booking.create({
    data: {
      studioId,
      workshopEventId: eventId,
      ...parsed.data,
      status: "confirmed",
    },
  });

  // Create initial pending payment record
  await prisma.payment.create({
    data: {
      studioId,
      bookingId: booking.id,
      amount: Number(event.price) * parsed.data.participantCount,
      status: "pending",
    },
  });

  await recomputeEventStatus(eventId);

  revalidatePath(`/workshops/${eventId}`);
  redirect(`/workshops/${eventId}`);
}

export async function updateBookingStatus(
  bookingId: string,
  status: BookingStatus,
  eventId: string
): Promise<void> {
  const studioId = await getStudioId();
  await prisma.booking.updateMany({
    where: { id: bookingId, studioId },
    data: { status },
  });
  await recomputeEventStatus(eventId);
  revalidatePath(`/workshops/${eventId}`);
}

export async function deleteBooking(
  bookingId: string,
  eventId: string
): Promise<void> {
  const studioId = await getStudioId();
  await prisma.booking.deleteMany({ where: { id: bookingId, studioId } });
  await recomputeEventStatus(eventId);
  revalidatePath(`/workshops/${eventId}`);
  redirect(`/workshops/${eventId}`);
}

export async function updatePaymentStatus(
  paymentId: string,
  status: PaymentStatus,
  eventId: string
): Promise<void> {
  const studioId = await getStudioId();
  await prisma.payment.updateMany({
    where: { id: paymentId, studioId },
    data: {
      status,
      paidAt: status === "paid" ? new Date() : null,
    },
  });
  revalidatePath(`/workshops/${eventId}`);
}

export async function createCustomer(
  studioId: string,
  name: string,
  email?: string,
  phone?: string
) {
  return prisma.customer.create({
    data: { studioId, name, email, phone },
  });
}
