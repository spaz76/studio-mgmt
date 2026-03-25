"use server";
import { prisma } from "@/lib/prisma";
import { getStudioId } from "@/lib/studio";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import * as remindersService from "@/services/reminders";

export async function createReminderAction(formData: FormData) {
  const studioId = await getStudioId();
  const session = await auth();
  const userId = session?.user?.id;

  const title = formData.get("title") as string;
  if (!title?.trim()) return { error: "כותרת נדרשת" };

  const dueDateStr = formData.get("dueAt") as string;
  const dueAt = dueDateStr ? new Date(dueDateStr) : null;

  await remindersService.createReminder(prisma, studioId, userId, {
    title: title.trim(),
    body: (formData.get("body") as string) || undefined,
    dueAt,
    type: (formData.get("type") as string) || "manual",
  });

  revalidatePath("/reminders");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateReminderStatusAction(reminderId: string, status: string) {
  const studioId = await getStudioId();
  await remindersService.updateReminderStatus(prisma, studioId, reminderId, status);
  revalidatePath("/reminders");
  revalidatePath("/dashboard");
}
