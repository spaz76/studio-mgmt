"use server";
import { prisma } from "@/lib/prisma";
import { getStudioId } from "@/lib/studio";
import { revalidatePath, revalidateTag } from "next/cache";
import * as customersService from "@/services/customers";
import { redirect } from "next/navigation";

export async function createCustomerAction(formData: FormData) {
  const studioId = await getStudioId();
  const name = formData.get("name") as string;
  if (!name?.trim()) return;

  const customer = await prisma.customer.create({
    data: {
      studioId,
      name: name.trim(),
      email: (formData.get("email") as string) || null,
      phone: (formData.get("phone") as string) || null,
      notes: (formData.get("notes") as string) || null,
      preferredContactMethod: (formData.get("preferredContactMethod") as string) || null,
      tags: ((formData.get("tags") as string) || "").split(",").map((t) => t.trim()).filter(Boolean),
    },
  });
  revalidatePath("/customers");
  redirect(`/customers/${customer.id}`);
}

export async function updateCustomerAction(customerId: string, formData: FormData) {
  const studioId = await getStudioId();
  await customersService.updateCustomer(prisma, studioId, customerId, {
    name: formData.get("name") as string,
    email: (formData.get("email") as string) || null,
    phone: (formData.get("phone") as string) || null,
    notes: (formData.get("notes") as string) || null,
    preferredContactMethod: (formData.get("preferredContactMethod") as string) || null,
    tags: ((formData.get("tags") as string) || "").split(",").map((t) => t.trim()).filter(Boolean),
  });
  revalidatePath(`/customers/${customerId}`);
  revalidatePath("/customers");
}

export async function addCustomerToWorkshopAction(
  customerId: string,
  eventId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const studioId = await getStudioId();

  const existing = await prisma.booking.findFirst({
    where: { customerId, workshopEventId: eventId, studioId, status: { not: "cancelled" } },
  });
  if (existing) return { ok: false, error: "הלקוח כבר רשום לסדנה זו" };

  const event = await prisma.workshopEvent.findFirst({
    where: { id: eventId, studioId },
    include: { bookings: { where: { status: { in: ["confirmed", "pending"] } } } },
  });
  if (!event) return { ok: false, error: "אירוע לא נמצא" };

  const bookedCount = event.bookings.reduce((s, b) => s + b.participantCount, 0);
  if (bookedCount >= event.maxParticipants) {
    return { ok: false, error: "אין מקום פנוי בסדנה זו" };
  }

  const booking = await prisma.booking.create({
    data: { studioId, workshopEventId: eventId, customerId, participantCount: 1, status: "confirmed" },
  });

  if (Number(event.price) > 0) {
    await prisma.payment.create({
      data: { studioId, bookingId: booking.id, amount: event.price, status: "pending" },
    });
  }

  revalidatePath(`/customers/${customerId}`);
  revalidatePath(`/workshops/${eventId}`);
  return { ok: true };
}
