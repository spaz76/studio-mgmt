"use server";

import { prisma } from "@/lib/prisma";
import { getStudioIdAndUser } from "@/lib/studio";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { WorkshopStatus } from "@/generated/prisma";
import * as eventService from "@/services/workshop-events";

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

// Note: import recomputeEventStatus directly from "@/services/workshop-events"
// Server action files ("use server") cannot re-export non-action functions.

/** Thin wrapper that calls service with the app's prisma singleton */
async function _recomputeEventStatus(eventId: string): Promise<void> {
  return eventService.recomputeEventStatus(prisma, eventId);
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

  const event = await eventService.createEvent(prisma, studioId, userId, {
    ...parsed.data,
    startsAt: new Date(parsed.data.startsAt),
    endsAt: new Date(parsed.data.endsAt),
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

  await eventService.updateEvent(prisma, id, studioId, {
    ...parsed.data,
    startsAt: new Date(parsed.data.startsAt),
    endsAt: new Date(parsed.data.endsAt),
  });

  await _recomputeEventStatus(id);

  revalidatePath(`/workshops/${id}`);
  redirect(`/workshops/${id}`);
}

export async function updateEventStatus(
  id: string,
  status: WorkshopStatus
): Promise<void> {
  const { studioId } = await getStudioIdAndUser();
  await eventService.updateEventStatus(prisma, id, studioId, status);
  revalidatePath(`/workshops/${id}`);
  revalidatePath("/workshops");
}

export async function deleteEvent(id: string): Promise<void> {
  const { studioId } = await getStudioIdAndUser();
  await eventService.deleteEvent(prisma, id, studioId);
  revalidatePath("/workshops");
  redirect("/workshops");
}
