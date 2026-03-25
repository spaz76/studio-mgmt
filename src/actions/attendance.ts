"use server";

import { prisma } from "@/lib/prisma";
import { getStudioId } from "@/lib/studio";
import { revalidatePath } from "next/cache";

export async function markAttendanceAction(
  bookingId: string,
  attended: boolean,
  eventId: string
): Promise<void> {
  const studioId = await getStudioId();

  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, studioId },
    include: { workshopEvent: { select: { templateId: true } } },
  });
  if (!booking) return;

  // If un-marking and there was a punch card used, restore the session
  const existing = await prisma.attendance.findUnique({ where: { bookingId } });
  if (!attended && existing?.punchCardId && existing.attended) {
    await prisma.punchCard.updateMany({
      where: { id: existing.punchCardId, studioId, usedSessions: { gt: 0 } },
      data: { usedSessions: { decrement: 1 } },
    });
  }

  let punchCardId: string | null = null;

  if (attended) {
    const templateId = booking.workshopEvent.templateId;

    // Find active punch card: prefer template-linked, then any active
    let punchCard = null;

    if (templateId) {
      const candidate = await prisma.punchCard.findFirst({
        where: { customerId: booking.customerId, studioId, templateId },
        orderBy: { purchasedAt: "asc" },
      });
      if (candidate && candidate.usedSessions < candidate.totalSessions) {
        punchCard = candidate;
      }
    }

    if (!punchCard) {
      const all = await prisma.punchCard.findMany({
        where: { customerId: booking.customerId, studioId },
        orderBy: { purchasedAt: "asc" },
      });
      punchCard = all.find((pc) => pc.usedSessions < pc.totalSessions) ?? null;
    }

    if (punchCard) {
      punchCardId = punchCard.id;
      await prisma.punchCard.update({
        where: { id: punchCard.id },
        data: { usedSessions: { increment: 1 } },
      });
    }
  }

  await prisma.attendance.upsert({
    where: { bookingId },
    create: {
      studioId,
      bookingId,
      attended,
      punchCardId: attended ? punchCardId : null,
      markedAt: attended ? new Date() : null,
    },
    update: {
      attended,
      punchCardId: attended ? punchCardId : null,
      markedAt: attended ? new Date() : null,
    },
  });

  revalidatePath(`/workshops/${eventId}`);
  revalidatePath(`/customers/${booking.customerId}`);
}
