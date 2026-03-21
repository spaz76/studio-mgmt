/**
 * Workshop event service — pure business logic, no Next.js dependencies.
 */

import type { PrismaClient, WorkshopStatus } from "@/generated/prisma";

export interface CreateEventInput {
  title: string;
  description?: string;
  startsAt: Date;
  endsAt: Date;
  minParticipants?: number;
  maxParticipants?: number;
  price?: number;
  location?: string;
  notes?: string;
  templateId?: string;
  status?: WorkshopStatus;
}

export type UpdateEventInput = Omit<Partial<CreateEventInput>, "templateId">;

/**
 * Recompute auto status based on confirmed+pending booking count vs capacity.
 * Does not transition out of terminal/manual states (cancelled, postponed,
 * completed, draft).
 */
export async function recomputeEventStatus(
  prisma: PrismaClient,
  eventId: string
): Promise<void> {
  const event = await prisma.workshopEvent.findUnique({
    where: { id: eventId },
    include: {
      bookings: {
        where: { status: { in: ["confirmed", "pending"] } },
      },
    },
  });

  if (!event) return;

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
  prisma: PrismaClient,
  studioId: string,
  createdById: string,
  input: CreateEventInput
) {
  return prisma.workshopEvent.create({
    data: {
      studioId,
      createdById,
      title: input.title,
      description: input.description,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      minParticipants: input.minParticipants ?? 1,
      maxParticipants: input.maxParticipants ?? 12,
      price: input.price ?? 0,
      location: input.location,
      notes: input.notes,
      templateId: input.templateId,
      status: input.status ?? "draft",
    },
  });
}

export async function updateEvent(
  prisma: PrismaClient,
  id: string,
  studioId: string,
  input: UpdateEventInput
) {
  return prisma.workshopEvent.updateMany({
    where: { id, studioId },
    data: {
      ...(input.title !== undefined && { title: input.title }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.startsAt !== undefined && { startsAt: input.startsAt }),
      ...(input.endsAt !== undefined && { endsAt: input.endsAt }),
      ...(input.minParticipants !== undefined && {
        minParticipants: input.minParticipants,
      }),
      ...(input.maxParticipants !== undefined && {
        maxParticipants: input.maxParticipants,
      }),
      ...(input.price !== undefined && { price: input.price }),
      ...(input.location !== undefined && { location: input.location }),
      ...(input.notes !== undefined && { notes: input.notes }),
      ...(input.status !== undefined && { status: input.status }),
    },
  });
}

export async function updateEventStatus(
  prisma: PrismaClient,
  id: string,
  studioId: string,
  status: WorkshopStatus
) {
  return prisma.workshopEvent.updateMany({
    where: { id, studioId },
    data: { status },
  });
}

export async function deleteEvent(
  prisma: PrismaClient,
  id: string,
  studioId: string
) {
  return prisma.workshopEvent.deleteMany({ where: { id, studioId } });
}

export async function getEvent(
  prisma: PrismaClient,
  id: string,
  studioId: string
) {
  return prisma.workshopEvent.findFirst({
    where: { id, studioId },
    include: {
      bookings: {
        where: { status: { in: ["confirmed", "pending"] } },
        select: { participantCount: true },
      },
    },
  });
}
