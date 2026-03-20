"use server";

import { prisma } from "@/lib/prisma";
import { getStudioId } from "@/lib/studio";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const TemplateSchema = z.object({
  name: z.string().min(1, "שם הוא שדה חובה"),
  description: z.string().optional(),
  durationMinutes: z.coerce.number().int().min(15).max(480).default(120),
  minParticipants: z.coerce.number().int().min(1).default(1),
  maxParticipants: z.coerce.number().int().min(1).default(12),
  defaultPrice: z.coerce.number().min(0).default(0),
  tags: z.string().optional(), // comma-separated
  isActive: z.boolean().default(true),
});

export type TemplateFormState = {
  errors?: Record<string, string[]>;
  message?: string;
};

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
  };

  const parsed = TemplateSchema.safeParse(raw);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const { tags, ...rest } = parsed.data;
  const tagArray = tags
    ? tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  await prisma.workshopTemplate.create({
    data: { studioId, ...rest, tags: tagArray },
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
  };

  const parsed = TemplateSchema.safeParse(raw);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const { tags, ...rest } = parsed.data;
  const tagArray = tags
    ? tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  await prisma.workshopTemplate.updateMany({
    where: { id, studioId },
    data: { ...rest, tags: tagArray },
  });

  revalidatePath("/workshops/templates");
  redirect("/workshops/templates");
}

export async function deleteTemplate(id: string): Promise<void> {
  const studioId = await getStudioId();
  await prisma.workshopTemplate.deleteMany({ where: { id, studioId } });
  revalidatePath("/workshops/templates");
}
