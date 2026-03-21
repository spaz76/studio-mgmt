"use server";

import { prisma } from "@/lib/prisma";
import { getStudioId } from "@/lib/studio";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { BookingStatus, PaymentStatus } from "@/generated/prisma";
import * as bookingService from "@/services/bookings";

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

  const raw = {
    customerId: formData.get("customerId"),
    participantCount: formData.get("participantCount"),
    notes: formData.get("notes") || undefined,
  };

  const parsed = BookingSchema.safeParse(raw);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const result = await bookingService.createBooking(
    prisma,
    studioId,
    eventId,
    parsed.data
  );

  if (!result.ok) {
    return { message: result.message };
  }

  revalidatePath(`/workshops/${eventId}`);
  redirect(`/workshops/${eventId}`);
}

export async function updateBookingStatus(
  bookingId: string,
  status: BookingStatus,
  eventId: string
): Promise<void> {
  const studioId = await getStudioId();
  await bookingService.updateBookingStatus(
    prisma,
    bookingId,
    studioId,
    status,
    eventId
  );
  revalidatePath(`/workshops/${eventId}`);
}

export async function deleteBooking(
  bookingId: string,
  eventId: string
): Promise<void> {
  const studioId = await getStudioId();
  await bookingService.deleteBooking(prisma, bookingId, studioId, eventId);
  revalidatePath(`/workshops/${eventId}`);
  redirect(`/workshops/${eventId}`);
}

export async function updatePaymentStatus(
  paymentId: string,
  status: PaymentStatus,
  eventId: string
): Promise<void> {
  const studioId = await getStudioId();
  await bookingService.updatePaymentStatus(prisma, paymentId, studioId, status);
  revalidatePath(`/workshops/${eventId}`);
}

export async function createCustomer(
  studioId: string,
  name: string,
  email?: string,
  phone?: string
) {
  return bookingService.createCustomer(prisma, studioId, name, email, phone);
}
