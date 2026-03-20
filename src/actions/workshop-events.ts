"use server";

import { prisma } from "@/lib/prisma";
import { getStudioIdAndUser } from "@/lib/studio";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { WorkshopStatus } from "@/generated/prisma";

const EventSchema = z.object({
  title: z.string().min(1, "כותרת היא שדה חובה"),
  description: z.string().optional(),
  startsAt: z.string().min(1, "תאריך התחלה הוא שדה חובה"),
  endsAt: z.string().min(1, "תאריך סיום הוא שדה חובה"),
  minParticipants: z.coerce.number().int().min(1).default(1),
  maxParticipants: z.coerce.number().int().min(1).default(12),
  price: z.coerce.number().min(0).default(0),
  location: z.string().optional(),
  notes: z.string().optional(),
  templateId: z.string().optional(),
});

export type EventFormState = {
  errors?: Record<string, string[]>;
  message?: string;
};

/**
 * Compute auto status based on booking count vs capacity
 */
export async function recomputeEventStatus(eventId: string): Promise<void> {
  const event = await prisma.workshopEvent.findUnique({
    where: { id: eventId },
    include: {
      bookings: {
        where: { status: { in: ["confirmed", "pending"] } },
      },
    },
  });

  if (!event) return;
  // Don't auto-transition terminal/manual states
  if (
    event.status === "cancelled" ||
    event.status === "postponed" ||
    event.status === "completed" ||
    event.status === "draft"
  )
    return;

  const count = event.bookings.reduce((s, b) => s + b.participantCount, 0);

  let newStatus: WorkshopStatus = event.status;

  if (count >= event.maxParticipants) {
    newStatus = "full";
  } else if (count >= event.minParticipants) {
    newStatus = "confirmed";
  } else if (count > 0) {
    newStatus = "pending_minimum";
  } else {
    newStatus = "open";
  }

  if (newStatus !== event.status) {
    await prisma.workshopEvent.update({
      where: { id: eventId },
      data: { status: newStatus },
    });
  }
}

export async function createEvent(
  _prev: EventFormState,
  formData: FormData
): Promise<EventFormState> {
  const { studioId, userId } = await getStudioIdAndUser();

  const raw = {
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    startsAt: formData.get("startsAt"),
    endsAt: formData.get("endsAt"),
    minParticipants: formData.get("minParticipants"),
    maxParticipants: formData.get("maxParticipants"),
    price: formData.get("price"),
    location: formData.get("location") || undefined,
    notes: formData.get("notes") || undefined,
    templateId: formData.get("templateId") || undefined,
  };

  const parsed = EventSchema.safeParse(raw);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const event = await prisma.workshopEvent.create({
    data: {
      studioId,
      createdById: userId,
      ...parsed.data,
      startsAt: new Date(parsed.data.startsAt),
      endsAt: new Date(parsed.data.endsAt),
      status: "draft",
    },
  });

  revalidatePath("/workshops");
  redirect(`/workshops/${event.id}`);
}

export async function updateEvent(
  id: string,
  _prev: EventFormState,
  formData: FormData
): Promise<EventFormState> {
  const { studioId } = await getStudioIdAndUser();

  const raw = {
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    startsAt: formData.get("startsAt"),
    endsAt: formData.get("endsAt"),
    minParticipants: formData.get("minParticipants"),
    maxParticipants: formData.get("maxParticipants"),
    price: formData.get("price"),
    location: formData.get("location") || undefined,
    notes: formData.get("notes") || undefined,
  };

  const parsed = EventSchema.omit({ templateId: true }).safeParse(raw);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  await prisma.workshopEvent.updateMany({
    where: { id, studioId },
    data: {
      ...parsed.data,
      startsAt: new Date(parsed.data.startsAt),
      endsAt: new Date(parsed.data.endsAt),
    },
  });

  // Re-check status after update
  await recomputeEventStatus(id);

  revalidatePath(`/workshops/${id}`);
  redirect(`/workshops/${id}`);
}

export async function updateEventStatus(
  id: string,
  status: WorkshopStatus
): Promise<void> {
  const { studioId } = await getStudioIdAndUser();
  await prisma.workshopEvent.updateMany({
    where: { id, studioId },
    data: { status },
  });
  revalidatePath(`/workshops/${id}`);
  revalidatePath("/workshops");
}

export async function deleteEvent(id: string): Promise<void> {
  const { studioId } = await getStudioIdAndUser();
  await prisma.workshopEvent.deleteMany({ where: { id, studioId } });
  revalidatePath("/workshops");
  redirect("/workshops");
}
