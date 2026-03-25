"use server";

import { prisma } from "@/lib/prisma";
import { getStudioId } from "@/lib/studio";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import * as svc from "@/services/message-templates";

const Schema = z.object({
  id: z.string().optional().nullable(),
  type: z.enum(["confirmation", "reminder", "thankyou", "payment_reminder", "feedback"]),
  channel: z.enum(["whatsapp", "sms", "email"]),
  subject: z.string().optional().nullable(),
  body: z.string().min(1, "גוף ההודעה הוא שדה חובה"),
  isActive: z.boolean().default(true),
  level: z.string().default("studio"),
  templateId: z.string().optional().nullable(),
  eventId: z.string().optional().nullable(),
});

export type MsgTemplateState = {
  errors?: Record<string, string[]>;
  message?: string;
  success?: boolean;
};

export async function upsertMessageTemplate(
  _prev: MsgTemplateState,
  formData: FormData
): Promise<MsgTemplateState> {
  const studioId = await getStudioId();
  const raw = {
    id: (formData.get("id") as string) || null,
    type: formData.get("type") as string,
    channel: formData.get("channel") as string,
    subject: (formData.get("subject") as string) || null,
    body: formData.get("body") as string,
    isActive: formData.get("isActive") !== "false",
    level: (formData.get("level") as string) || "studio",
    templateId: (formData.get("templateId") as string) || null,
    eventId: (formData.get("eventId") as string) || null,
  };
  const parsed = Schema.safeParse(raw);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }
  const { id, ...input } = parsed.data;
  await svc.upsertMessageTemplate(prisma, studioId, id ?? null, input);
  revalidatePath("/settings/messages");
  return { success: true, message: "התבנית נשמרה בהצלחה" };
}

export async function deleteMessageTemplate(id: string) {
  const studioId = await getStudioId();
  await svc.deleteMessageTemplate(prisma, studioId, id);
  revalidatePath("/settings/messages");
}

export async function seedDefaultTemplatesAction() {
  const studioId = await getStudioId();
  await svc.seedDefaultTemplates(prisma, studioId);
  revalidatePath("/settings/messages");
}
