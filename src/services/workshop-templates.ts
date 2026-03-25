/**
 * Workshop template service — pure business logic, no Next.js dependencies.
 * Accepts a PrismaClient so it can be called from server actions, API routes,
 * and integration tests with an injected client.
 */

import type { PrismaClient, WorkshopType, RecurrenceFrequency, EventPricingModel } from "@/generated/prisma";

export interface PackageLineItemInput {
  description: string;
  amount: number;
}

export interface TemplateImageInput {
  url: string;
  alt?: string;
  isPrimary?: boolean;
  sortOrder?: number;
}

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
  recurrenceStartTime?: string | null;
  recurrenceEndTime?: string | null;
  totalSessions?: number | null;
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
  eventPricingModel?: EventPricingModel | null;
  ageRangeMin?: number | null;
  ageRangeMax?: number | null;
  requiresAdultSupervision?: boolean;
  packageLineItems?: PackageLineItemInput[];
  // Phase B
  marketingText?: string | null;
  internalNotes?: string | null;
  registrationUrl?: string | null;
  images?: TemplateImageInput[];
}

export type UpdateTemplateInput = Partial<CreateTemplateInput>;

export async function listTemplates(prisma: PrismaClient, studioId: string) {
  return prisma.workshopTemplate.findMany({
    where: { studioId, isArchived: false },
    orderBy: [{ usageCount: "desc" }, { name: "asc" }],
    include: {
      _count: { select: { workshopEvents: true } },
      images: { where: { isPrimary: true }, take: 1 },
    },
  });
}

export async function getTemplate(
  prisma: PrismaClient,
  id: string,
  studioId: string
) {
  return prisma.workshopTemplate.findFirst({
    where: { id, studioId, isArchived: false },
    include: {
      packageLineItems: { orderBy: { sortOrder: "asc" } },
      images: { orderBy: { sortOrder: "asc" } },
    },
  });
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
      recurrenceStartTime: input.recurrenceStartTime ?? null,
      recurrenceEndTime: input.recurrenceEndTime ?? null,
      totalSessions: input.totalSessions ?? null,
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
      eventPricingModel: input.eventPricingModel ?? null,
      ageRangeMin: input.ageRangeMin ?? null,
      ageRangeMax: input.ageRangeMax ?? null,
      requiresAdultSupervision: input.requiresAdultSupervision ?? true,
      marketingText: input.marketingText ?? null,
      internalNotes: input.internalNotes ?? null,
      registrationUrl: input.registrationUrl ?? null,
      ...(input.packageLineItems && input.packageLineItems.length > 0 && {
        packageLineItems: {
          create: input.packageLineItems.map((item, idx) => ({
            description: item.description,
            amount: item.amount,
            sortOrder: idx,
          })),
        },
      }),
      ...(input.images && input.images.length > 0 && {
        images: {
          create: input.images.map((img, idx) => ({
            url: img.url,
            alt: img.alt,
            isPrimary: img.isPrimary ?? idx === 0,
            sortOrder: img.sortOrder ?? idx,
          })),
        },
      }),
    },
  });
}

export async function updateTemplate(
  prisma: PrismaClient,
  id: string,
  studioId: string,
  input: UpdateTemplateInput
) {
  return prisma.$transaction(async (tx) => {
    const count = await tx.workshopTemplate.updateMany({
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
        ...(input.recurrenceStartTime !== undefined && { recurrenceStartTime: input.recurrenceStartTime }),
        ...(input.recurrenceEndTime !== undefined && { recurrenceEndTime: input.recurrenceEndTime }),
        ...(input.totalSessions !== undefined && { totalSessions: input.totalSessions }),
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
        ...(input.eventPricingModel !== undefined && { eventPricingModel: input.eventPricingModel }),
        ...(input.ageRangeMin !== undefined && { ageRangeMin: input.ageRangeMin }),
        ...(input.ageRangeMax !== undefined && { ageRangeMax: input.ageRangeMax }),
        ...(input.requiresAdultSupervision !== undefined && { requiresAdultSupervision: input.requiresAdultSupervision }),
        ...(input.marketingText !== undefined && { marketingText: input.marketingText }),
        ...(input.internalNotes !== undefined && { internalNotes: input.internalNotes }),
        ...(input.registrationUrl !== undefined && { registrationUrl: input.registrationUrl }),
      },
    });

    // Replace package line items if provided
    if (input.packageLineItems !== undefined) {
      await tx.packageLineItem.deleteMany({ where: { templateId: id } });
      if (input.packageLineItems.length > 0) {
        await tx.packageLineItem.createMany({
          data: input.packageLineItems.map((item, idx) => ({
            templateId: id,
            description: item.description,
            amount: item.amount,
            sortOrder: idx,
          })),
        });
      }
    }

    // Replace images if provided
    if (input.images !== undefined) {
      await tx.templateImage.deleteMany({ where: { templateId: id } });
      if (input.images.length > 0) {
        await tx.templateImage.createMany({
          data: input.images.map((img, idx) => ({
            templateId: id,
            url: img.url,
            alt: img.alt ?? null,
            isPrimary: img.isPrimary ?? idx === 0,
            sortOrder: img.sortOrder ?? idx,
          })),
        });
      }
    }

    return count;
  });
}

/** Soft delete — sets isArchived=true. Returns the count of matched rows. */
export async function deleteTemplate(
  prisma: PrismaClient,
  id: string,
  studioId: string
) {
  return prisma.workshopTemplate.updateMany({
    where: { id, studioId },
    data: { isArchived: true },
  });
}

/** Returns the number of events linked to this template (for delete confirmation). */
export async function getTemplateEventCount(
  prisma: PrismaClient,
  id: string,
  studioId: string
): Promise<number> {
  const result = await prisma.workshopEvent.count({
    where: { templateId: id, studioId },
  });
  return result;
}

/** Increment usageCount — call when creating an event from a template. */
export async function incrementTemplateUsage(
  prisma: PrismaClient,
  id: string,
  studioId: string
) {
  return prisma.workshopTemplate.updateMany({
    where: { id, studioId },
    data: { usageCount: { increment: 1 } },
  });
}
