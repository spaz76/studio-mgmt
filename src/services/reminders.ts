import type { PrismaClient } from "@/generated/prisma";

export async function getReminders(
  prisma: PrismaClient,
  studioId: string,
  filters?: { status?: string; type?: string }
) {
  return prisma.reminder.findMany({
    where: {
      studioId,
      ...(filters?.status ? { status: filters.status as never } : {}),
      ...(filters?.type ? { type: filters.type as never } : {}),
    },
    include: {
      relatedWorkshopEvent: { select: { id: true, title: true, startsAt: true } },
      relatedMaterial: { select: { id: true, name: true } },
    },
    orderBy: [{ status: "asc" }, { dueAt: "asc" }, { createdAt: "desc" }],
  });
}

export async function createReminder(
  prisma: PrismaClient,
  studioId: string,
  userId: string | null | undefined,
  data: { title: string; body?: string; dueAt?: Date | null; type?: string }
) {
  return prisma.reminder.create({
    data: {
      studioId,
      title: data.title,
      body: data.body || null,
      dueAt: data.dueAt || null,
      type: (data.type as never) || "manual",
      createdById: userId || null,
    },
  });
}

export async function updateReminderStatus(
  prisma: PrismaClient,
  studioId: string,
  reminderId: string,
  status: string
) {
  return prisma.reminder.update({
    where: { id: reminderId, studioId },
    data: { status: status as never },
  });
}

export async function getOpenRemindersCount(prisma: PrismaClient, studioId: string) {
  return prisma.reminder.count({ where: { studioId, status: { not: "done" } } });
}
