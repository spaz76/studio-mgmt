"use server";

import { prisma } from "@/lib/prisma";
import { getStudioId } from "@/lib/studio";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import * as templateService from "@/services/workshop-templates";

const WorkshopTypeValues = ["REGULAR", "RECURRING", "SEASONAL", "EVENT", "PARENT_CHILD"] as const;
const RecurrenceFrequencyValues = ["DAILY", "WEEKLY", "BIWEEKLY", "MONTHLY"] as const;

const TemplateSchema = z.object({
  name: z.string().min(1, "שם הוא שדה חובה"),
  description: z.string().optional(),
  durationMinutes: z.coerce.number().int().min(15).max(480).default(120),
  minParticipants: z.coerce.number().int().min(1).default(1),
  maxParticipants: z.coerce.number().int().min(1).default(12),
  defaultPrice: z.coerce.number().min(0).default(0),
  tags: z.string().optional(), // comma-separated
  isActive: z.boolean().default(true),
  // Advanced
  workshopType: z.enum(WorkshopTypeValues).default("REGULAR"),
  recurrenceFrequency: z.enum(RecurrenceFrequencyValues).optional().nullable(),
  recurrenceDayOfWeek: z.coerce.number().int().min(0).max(6).optional().nullable(),
  seasonStartMonth: z.coerce.number().int().min(1).max(12).optional().nullable(),
  seasonEndMonth: z.coerce.number().int().min(1).max(12).optional().nullable(),
  seasonReminderDays: z.string().optional(), // comma-separated ints
  seasonPublishLeadDays: z.coerce.number().int().min(0).optional().nullable(),
  seasonPrepLeadDays: z.coerce.number().int().min(0).optional().nullable(),
  seasonOpenRegistrationDays: z.coerce.number().int().min(0).optional().nullable(),
  seasonCloseRegistrationDays: z.coerce.number().int().min(0).optional().nullable(),
  eventContactName: z.string().optional().nullable(),
  eventContactPhone: z.string().optional().nullable(),
  eventSpecialRequests: z.string().optional().nullable(),
  ageRangeMin: z.coerce.number().int().min(0).optional().nullable(),
  ageRangeMax: z.coerce.number().int().min(0).optional().nullable(),
  requiresAdultSupervision: z.boolean().default(true),
});

export type TemplateFormState = {
  errors?: Record<string, string[]>;
  message?: string;
};

function parseTags(raw: string | undefined): string[] {
  return raw
    ? raw
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    : [];
}

function parseIntArray(raw: string | undefined): number[] {
  return raw
    ? raw
        .split(",")
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => !isNaN(n))
    : [];
}

function extractAdvancedFields(formData: FormData) {
  const workshopType = formData.get("workshopType") as string || "REGULAR";
  return {
    workshopType,
    recurrenceFrequency: formData.get("recurrenceFrequency") || undefined,
    recurrenceDayOfWeek: formData.get("recurrenceDayOfWeek") || undefined,
    seasonStartMonth: formData.get("seasonStartMonth") || undefined,
    seasonEndMonth: formData.get("seasonEndMonth") || undefined,
    seasonReminderDays: formData.get("seasonReminderDays") as string | undefined,
    seasonPublishLeadDays: formData.get("seasonPublishLeadDays") || undefined,
    seasonPrepLeadDays: formData.get("seasonPrepLeadDays") || undefined,
    seasonOpenRegistrationDays: formData.get("seasonOpenRegistrationDays") || undefined,
    seasonCloseRegistrationDays: formData.get("seasonCloseRegistrationDays") || undefined,
    eventContactName: formData.get("eventContactName") || undefined,
    eventContactPhone: formData.get("eventContactPhone") || undefined,
    eventSpecialRequests: formData.get("eventSpecialRequests") || undefined,
    ageRangeMin: formData.get("ageRangeMin") || undefined,
    ageRangeMax: formData.get("ageRangeMax") || undefined,
    requiresAdultSupervision: formData.get("requiresAdultSupervision") !== "false",
  };
}

export async function createTemplate(
  _prev: TemplateFormState,
  formData: FormData
): Promise<TemplateFormState> {
  const studioId = await getStudioId();

  const raw = {
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    durationMinutes: formData.get("durationMinutes"),
    minParticipants: formData.get("minParticipants"),
    maxParticipants: formData.get("maxParticipants"),
    defaultPrice: formData.get("defaultPrice"),
    tags: formData.get("tags") || undefined,
    isActive: formData.get("isActive") !== "false",
    ...extractAdvancedFields(formData),
  };

  const parsed = TemplateSchema.safeParse(raw);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const { tags, seasonReminderDays, ...rest } = parsed.data;
  await templateService.createTemplate(prisma, studioId, {
    ...rest,
    tags: parseTags(tags),
    seasonReminderDays: parseIntArray(seasonReminderDays ?? undefined),
  });

  revalidatePath("/workshops/templates");
  redirect("/workshops/templates");
}

export async function updateTemplate(
  id: string,
  _prev: TemplateFormState,
  formData: FormData
): Promise<TemplateFormState> {
  const studioId = await getStudioId();

  const raw = {
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    durationMinutes: formData.get("durationMinutes"),
    minParticipants: formData.get("minParticipants"),
    maxParticipants: formData.get("maxParticipants"),
    defaultPrice: formData.get("defaultPrice"),
    tags: formData.get("tags") || undefined,
    isActive: formData.get("isActive") !== "false",
    ...extractAdvancedFields(formData),
  };

  const parsed = TemplateSchema.safeParse(raw);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const { tags, seasonReminderDays, ...rest } = parsed.data;
  await templateService.updateTemplate(prisma, id, studioId, {
    ...rest,
    tags: parseTags(tags),
    seasonReminderDays: parseIntArray(seasonReminderDays ?? undefined),
  });

  revalidatePath("/workshops/templates");
  redirect("/workshops/templates");
}

export async function deleteTemplate(id: string): Promise<void> {
  const studioId = await getStudioId();
  await templateService.deleteTemplate(prisma, id, studioId);
  revalidatePath("/workshops/templates");
}
