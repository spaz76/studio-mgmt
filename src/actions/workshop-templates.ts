"use server";

import { prisma } from "@/lib/prisma";
import { getStudioId } from "@/lib/studio";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import * as templateService from "@/services/workshop-templates";

const WorkshopTypeValues = ["REGULAR", "RECURRING", "CLASS", "SEASONAL", "EVENT", "PARENT_CHILD"] as const;
const RecurrenceFrequencyValues = ["DAILY", "WEEKLY", "BIWEEKLY", "MONTHLY"] as const;
const EventPricingModelValues = ["FLAT", "PER_PARTICIPANT", "PACKAGE"] as const;

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
  recurrenceStartTime: z.string().optional().nullable(),
  recurrenceEndTime: z.string().optional().nullable(),
  totalSessions: z.coerce.number().int().min(1).optional().nullable(),
  seasonStartMonth: z.coerce.number().int().min(1).max(12).optional().nullable(),
  seasonEndMonth: z.coerce.number().int().min(1).max(12).optional().nullable(),
  seasonReminderDays: z.string().optional(), // comma-separated ints (already in days)
  seasonPublishLeadDays: z.coerce.number().int().min(0).optional().nullable(),
  seasonPrepLeadDays: z.coerce.number().int().min(0).optional().nullable(),
  seasonOpenRegistrationDays: z.coerce.number().int().min(0).optional().nullable(),
  seasonCloseRegistrationDays: z.coerce.number().int().min(0).optional().nullable(),
  eventContactName: z.string().optional().nullable(),
  eventContactPhone: z.string().optional().nullable(),
  eventSpecialRequests: z.string().optional().nullable(),
  eventPricingModel: z.enum(EventPricingModelValues).optional().nullable(),
  ageRangeMin: z.coerce.number().int().min(0).optional().nullable(),
  ageRangeMax: z.coerce.number().int().min(0).optional().nullable(),
  requiresAdultSupervision: z.boolean().default(true),
  // Phase B
  marketingText: z.string().optional().nullable(),
  internalNotes: z.string().optional().nullable(),
  registrationUrl: z
    .string()
    .optional()
    .nullable()
    .refine(
      (v) => !v || v.trim() === "" || /^https?:\/\/.+/.test(v.trim()),
      "יש להזין כתובת URL תקינה (https://...)"
    ),
});

export type TemplateFormState = {
  errors?: Record<string, string[]>;
  message?: string;
  success?: boolean;
  templateId?: string;
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

function parseLineItems(formData: FormData) {
  const descriptions = formData.getAll("lineItemDescription") as string[];
  const amounts = formData.getAll("lineItemAmount") as string[];
  const items = descriptions
    .map((desc, i) => ({
      description: desc.trim(),
      amount: parseFloat(amounts[i] ?? "0"),
    }))
    .filter((item) => item.description && !isNaN(item.amount) && item.amount >= 0);
  return items;
}

function parseImages(formData: FormData) {
  const urls = formData.getAll("imageUrl") as string[];
  const alts = formData.getAll("imageAlt") as string[];
  const primaryIdx = parseInt(formData.get("imagePrimaryIndex") as string ?? "0", 10);
  return urls
    .map((url, i) => ({
      url: url.trim(),
      alt: alts[i]?.trim() || undefined,
      isPrimary: i === primaryIdx,
      sortOrder: i,
    }))
    .filter((img) => img.url !== "");
}

/** Convert a weeks form field to integer days (weeks × 7). Returns undefined if blank. */
function weeksToDays(formData: FormData, name: string): string | undefined {
  const val = formData.get(name) as string | null;
  if (!val || val.trim() === "") return undefined;
  const weeks = parseFloat(val);
  if (isNaN(weeks)) return undefined;
  return String(Math.round(weeks * 7));
}

function extractAdvancedFields(formData: FormData) {
  const workshopType = (formData.get("workshopType") as string) || "REGULAR";

  // Reminder weeks → days (multiple inputs named "seasonReminderWeek")
  const reminderWeeks = formData.getAll("seasonReminderWeek") as string[];
  const reminderDaysStr = reminderWeeks
    .map((w) => Math.round(parseInt(w, 10) * 7))
    .filter((n) => !isNaN(n) && n > 0)
    .join(",");

  return {
    workshopType,
    recurrenceFrequency: formData.get("recurrenceFrequency") || undefined,
    recurrenceDayOfWeek: formData.get("recurrenceDayOfWeek") || undefined,
    recurrenceStartTime: formData.get("recurrenceStartTime") || undefined,
    recurrenceEndTime: formData.get("recurrenceEndTime") || undefined,
    totalSessions: formData.get("totalSessions") || undefined,
    seasonStartMonth: formData.get("seasonStartMonth") || undefined,
    seasonEndMonth: formData.get("seasonEndMonth") || undefined,
    seasonReminderDays: reminderDaysStr || undefined,
    // Lead times come from the form in weeks; convert to days for storage
    seasonPublishLeadDays: weeksToDays(formData, "seasonPublishLeadWeeks"),
    seasonPrepLeadDays: weeksToDays(formData, "seasonPrepLeadWeeks"),
    seasonOpenRegistrationDays: weeksToDays(formData, "seasonOpenRegistrationWeeks"),
    seasonCloseRegistrationDays: weeksToDays(formData, "seasonCloseRegistrationWeeks"),
    eventContactName: formData.get("eventContactName") || undefined,
    eventContactPhone: formData.get("eventContactPhone") || undefined,
    eventSpecialRequests: formData.get("eventSpecialRequests") || undefined,
    eventPricingModel: formData.get("eventPricingModel") || undefined,
    ageRangeMin: formData.get("ageRangeMin") || undefined,
    ageRangeMax: formData.get("ageRangeMax") || undefined,
    requiresAdultSupervision: formData.get("requiresAdultSupervision") !== "false",
    // Phase B
    marketingText: (formData.get("marketingText") as string) || undefined,
    internalNotes: (formData.get("internalNotes") as string) || undefined,
    registrationUrl: (formData.get("registrationUrl") as string) || undefined,
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
    durationMinutes: formData.get("durationMinutes") ?? undefined,
    minParticipants: formData.get("minParticipants") ?? undefined,
    maxParticipants: formData.get("maxParticipants") ?? undefined,
    defaultPrice: formData.get("defaultPrice") ?? undefined,
    tags: formData.get("tags") || undefined,
    isActive: formData.get("isActive") !== "false",
    ...extractAdvancedFields(formData),
  };

  const parsed = TemplateSchema.safeParse(raw);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors, message: "יש שגיאות בטופס — בדוק את כל השדות" };
  }

  const { tags, seasonReminderDays, ...rest } = parsed.data;
  const packageLineItems = parseLineItems(formData);
  const images = parseImages(formData);

  const template = await templateService.createTemplate(prisma, studioId, {
    ...rest,
    tags: parseTags(tags),
    seasonReminderDays: parseIntArray(seasonReminderDays ?? undefined),
    packageLineItems,
    images,
  });

  revalidatePath("/workshops/templates");
  return { success: true, templateId: template.id };
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
    durationMinutes: formData.get("durationMinutes") ?? undefined,
    minParticipants: formData.get("minParticipants") ?? undefined,
    maxParticipants: formData.get("maxParticipants") ?? undefined,
    defaultPrice: formData.get("defaultPrice") ?? undefined,
    tags: formData.get("tags") || undefined,
    isActive: formData.get("isActive") !== "false",
    ...extractAdvancedFields(formData),
  };

  const parsed = TemplateSchema.safeParse(raw);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors, message: "יש שגיאות בטופס — בדוק את כל השדות" };
  }

  const { tags, seasonReminderDays, ...rest } = parsed.data;
  const packageLineItems = parseLineItems(formData);
  const images = parseImages(formData);

  await templateService.updateTemplate(prisma, id, studioId, {
    ...rest,
    tags: parseTags(tags),
    seasonReminderDays: parseIntArray(seasonReminderDays ?? undefined),
    packageLineItems,
    images,
  });

  revalidatePath("/workshops/templates");
  return { success: true, templateId: id };
}

export async function applyTemplateToFutureEvents(
  id: string
): Promise<{ updated: number }> {
  const studioId = await getStudioId();
  const now = new Date();

  const template = await prisma.workshopTemplate.findFirst({
    where: { id, studioId },
  });
  if (!template) return { updated: 0 };

  const result = await prisma.workshopEvent.updateMany({
    where: {
      studioId,
      templateId: id,
      startsAt: { gt: now },
    },
    data: {
      title: template.name,
      description: template.description,
      minParticipants: template.minParticipants,
      maxParticipants: template.maxParticipants,
      price: template.defaultPrice,
    },
  });

  revalidatePath("/workshops");
  return { updated: result.count };
}

export async function getTemplateEventCount(id: string): Promise<number> {
  const studioId = await getStudioId();
  return templateService.getTemplateEventCount(prisma, id, studioId);
}

export async function deleteTemplate(id: string): Promise<void> {
  const studioId = await getStudioId();
  await templateService.deleteTemplate(prisma, id, studioId);
  revalidatePath("/workshops/templates");
}
