import type { PrismaClient } from "@/generated/prisma";

export async function getPaymentsList(prisma: PrismaClient, studioId: string) {
  const payments = await prisma.payment.findMany({
    where: { studioId },
    include: {
      booking: {
        include: {
          customer: { select: { id: true, name: true, email: true, phone: true } },
          workshopEvent: { select: { id: true, title: true, startsAt: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalDebt = payments
    .filter((p) => p.status === "pending" || p.status === "partial")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  return { payments, totalDebt };
}

export async function updatePayment(
  prisma: PrismaClient,
  studioId: string,
  paymentId: string,
  data: { status: string; amount?: number; notes?: string | null }
) {
  return prisma.payment.update({
    where: { id: paymentId, studioId },
    data: {
      status: data.status as never,
      ...(data.amount !== undefined ? { amount: data.amount } : {}),
      ...(data.notes !== undefined ? { notes: data.notes } : {}),
      ...(data.status === "paid" ? { paidAt: new Date() } : {}),
    },
  });
}
