/**
 * Workshop template service — pure business logic, no Next.js dependencies.
 * Accepts a PrismaClient so it can be called from server actions, API routes,
 * and integration tests with an injected client.
 */

import type { PrismaClient, WorkshopType, RecurrenceFrequency } from "@/generated/prisma";

export interface CreateTemplateInput {
  name: string;
  description?: string;
  durationMinutes?: number;
  minParticipants?: number;
  maxParticipants?: number;
  defaultPrice?: number;
  tags?: string[];
  isActive?: boolean;
  // Advanced
  workshopType?: WorkshopType;
  recurrenceFrequency?: RecurrenceFrequency | null;
  recurrenceDayOfWeek?: number | null;
  seasonStartMonth?: number | null;
  seasonEndMonth?: number | null;
  seasonReminderDays?: number[];
  seasonPublishLeadDays?: number | null;
  seasonPrepLeadDays?: number | null;
  seasonOpenRegistrationDays?: number | null;
  seasonCloseRegistrationDays?: number | null;
  eventContactName?: string | null;
  eventContactPhone?: string | null;
  eventSpecialRequests?: string | null;
  ageRangeMin?: number | null;
  ageRangeMax?: number | null;
  requiresAdultSupervision?: boolean;
}

export type UpdateTemplateInput = Partial<CreateTemplateInput>;

export async function listTemplates(prisma: PrismaClient, studioId: string) {
  return prisma.workshopTemplate.findMany({
    where: { studioId },
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { workshopEvents: true } } },
  });
}

export async function getTemplate(
  prisma: PrismaClient,
  id: string,
  studioId: string
) {
  return prisma.workshopTemplate.findFirst({ where: { id, studioId } });
}

export async function createTemplate(
  prisma: PrismaClient,
  studioId: string,
  input: CreateTemplateInput
) {
  return prisma.workshopTemplate.create({
    data: {
      studioId,
      name: input.name,
      description: input.description,
      durationMinutes: input.durationMinutes ?? 120,
      minParticipants: input.minParticipants ?? 1,
      maxParticipants: input.maxParticipants ?? 12,
      defaultPrice: input.defaultPrice ?? 0,
      tags: input.tags ?? [],
      isActive: input.isActive ?? true,
      workshopType: input.workshopType ?? "REGULAR",
      recurrenceFrequency: input.recurrenceFrequency ?? null,
      recurrenceDayOfWeek: input.recurrenceDayOfWeek ?? null,
      seasonStartMonth: input.seasonStartMonth ?? null,
      seasonEndMonth: input.seasonEndMonth ?? null,
      seasonReminderDays: input.seasonReminderDays ?? [],
      seasonPublishLeadDays: input.seasonPublishLeadDays ?? null,
      seasonPrepLeadDays: input.seasonPrepLeadDays ?? null,
      seasonOpenRegistrationDays: input.seasonOpenRegistrationDays ?? null,
      seasonCloseRegistrationDays: input.seasonCloseRegistrationDays ?? null,
      eventContactName: input.eventContactName ?? null,
      eventContactPhone: input.eventContactPhone ?? null,
      eventSpecialRequests: input.eventSpecialRequests ?? null,
      ageRangeMin: input.ageRangeMin ?? null,
      ageRangeMax: input.ageRangeMax ?? null,
      requiresAdultSupervision: input.requiresAdultSupervision ?? true,
    },
  });
}

export async function updateTemplate(
  prisma: PrismaClient,
  id: string,
  studioId: string,
  input: UpdateTemplateInput
) {
  return prisma.workshopTemplate.updateMany({
    where: { id, studioId },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.durationMinutes !== undefined && { durationMinutes: input.durationMinutes }),
      ...(input.minParticipants !== undefined && { minParticipants: input.minParticipants }),
      ...(input.maxParticipants !== undefined && { maxParticipants: input.maxParticipants }),
      ...(input.defaultPrice !== undefined && { defaultPrice: input.defaultPrice }),
      ...(input.tags !== undefined && { tags: input.tags }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
      ...(input.workshopType !== undefined && { workshopType: input.workshopType }),
      ...(input.recurrenceFrequency !== undefined && { recurrenceFrequency: input.recurrenceFrequency }),
      ...(input.recurrenceDayOfWeek !== undefined && { recurrenceDayOfWeek: input.recurrenceDayOfWeek }),
      ...(input.seasonStartMonth !== undefined && { seasonStartMonth: input.seasonStartMonth }),
      ...(input.seasonEndMonth !== undefined && { seasonEndMonth: input.seasonEndMonth }),
      ...(input.seasonReminderDays !== undefined && { seasonReminderDays: input.seasonReminderDays }),
      ...(input.seasonPublishLeadDays !== undefined && { seasonPublishLeadDays: input.seasonPublishLeadDays }),
      ...(input.seasonPrepLeadDays !== undefined && { seasonPrepLeadDays: input.seasonPrepLeadDays }),
      ...(input.seasonOpenRegistrationDays !== undefined && { seasonOpenRegistrationDays: input.seasonOpenRegistrationDays }),
      ...(input.seasonCloseRegistrationDays !== undefined && { seasonCloseRegistrationDays: input.seasonCloseRegistrationDays }),
      ...(input.eventContactName !== undefined && { eventContactName: input.eventContactName }),
      ...(input.eventContactPhone !== undefined && { eventContactPhone: input.eventContactPhone }),
      ...(input.eventSpecialRequests !== undefined && { eventSpecialRequests: input.eventSpecialRequests }),
      ...(input.ageRangeMin !== undefined && { ageRangeMin: input.ageRangeMin }),
      ...(input.ageRangeMax !== undefined && { ageRangeMax: input.ageRangeMax }),
      ...(input.requiresAdultSupervision !== undefined && { requiresAdultSupervision: input.requiresAdultSupervision }),
    },
  });
}

export async function deleteTemplate(
  prisma: PrismaClient,
  id: string,
  studioId: string
) {
  return prisma.workshopTemplate.deleteMany({ where: { id, studioId } });
}
