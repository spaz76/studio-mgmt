"use server";

import { prisma } from "@/lib/prisma";
import { getStudioId } from "@/lib/studio";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const TaskSchema = z.object({
  title: z.string().min(1, "כותרת היא שדה חובה"),
  description: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  reminderDate: z.string().optional().nullable(),
  status: z.enum(["NEW", "IN_PROGRESS", "DONE"]).optional().default("NEW"),
  urgency: z.enum(["HIGH", "NORMAL", "LOW"]).optional().default("NORMAL"),
});

export type TaskFormState = {
  errors?: Record<string, string[]>;
  message?: string;
  success?: boolean;
};

export async function createTask(
  _prev: TaskFormState,
  formData: FormData
): Promise<TaskFormState> {
  const studioId = await getStudioId();
  const raw = {
    title: formData.get("title") as string,
    description: (formData.get("description") as string) || null,
    dueDate: (formData.get("dueDate") as string) || null,
    reminderDate: (formData.get("reminderDate") as string) || null,
    status: (formData.get("status") as string) || "NEW",
    urgency: (formData.get("urgency") as string) || "NORMAL",
  };
  const parsed = TaskSchema.safeParse(raw);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }
  await prisma.task.create({
    data: {
      studioId,
      title: parsed.data.title,
      description: parsed.data.description,
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
      reminderDate: parsed.data.reminderDate ? new Date(parsed.data.reminderDate) : null,
      status: parsed.data.status ?? "NEW",
      urgency: parsed.data.urgency ?? "NORMAL",
      category: "manual",
    },
  });
  revalidatePath("/dashboard");
  return { success: true };
}

export async function toggleTask(id: string, completed: boolean) {
  const studioId = await getStudioId();
  await prisma.task.update({
    where: { id, studioId },
    data: {
      completed,
      status: completed ? "DONE" : "NEW",
    },
  });
  revalidatePath("/dashboard");
}

export async function updateTaskStatus(id: string, status: "NEW" | "IN_PROGRESS" | "DONE") {
  const studioId = await getStudioId();
  await prisma.task.update({
    where: { id, studioId },
    data: {
      status,
      completed: status === "DONE",
    },
  });
  revalidatePath("/dashboard");
}

export async function deleteTask(id: string) {
  const studioId = await getStudioId();
  await prisma.task.delete({ where: { id, studioId } });
  revalidatePath("/dashboard");
}
