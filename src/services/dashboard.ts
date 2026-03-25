import type { PrismaClient } from "@/generated/prisma";

export async function getDashboardData(prisma: PrismaClient, studioId: string) {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  const [
    eventsThisWeek,
    openBookings,
    pendingPayments,
    productVariants,
    lowStockMaterials,
    upcomingEvents,
    unconfirmedEvents,
    eventsWithUnpaidBookings,
    unpaidBookings,
    tasks,
  ] = await Promise.all([
    // Events this week
    prisma.workshopEvent.count({
      where: {
        studioId,
        startsAt: { gte: weekStart, lte: weekEnd },
        status: { notIn: ["cancelled"] },
      },
    }),

    // Open (pending) bookings
    prisma.booking.count({
      where: { studioId, status: "pending" },
    }),

    // Payments pending
    prisma.payment.count({
      where: { studioId, status: "pending" },
    }),

    // Low stock products (fetch all active, filter in JS)
    prisma.productVariant.findMany({
      where: { studioId, isActive: true },
      select: { stockQuantity: true, lowStockThreshold: true },
    }),

    // Low stock materials
    prisma.material.findMany({
      where: { studioId },
      select: {
        id: true,
        name: true,
        stockQuantity: true,
        lowStockThreshold: true,
      },
    }),

    // Upcoming events (next 7 days)
    prisma.workshopEvent.findMany({
      where: {
        studioId,
        startsAt: { gte: now, lte: weekEnd },
        status: { notIn: ["cancelled", "completed"] },
      },
      select: {
        id: true,
        title: true,
        startsAt: true,
        status: true,
        maxParticipants: true,
        _count: { select: { bookings: true } },
      },
      orderBy: { startsAt: "asc" },
      take: 10,
    }),

    // Events not confirmed
    prisma.workshopEvent.findMany({
      where: {
        studioId,
        status: { in: ["draft", "pending_minimum"] },
        startsAt: { gte: now },
      },
      select: { id: true, title: true, startsAt: true, status: true },
      orderBy: { startsAt: "asc" },
      take: 10,
    }),

    // Events with unpaid bookings
    prisma.workshopEvent.findMany({
      where: {
        studioId,
        startsAt: { gte: now },
        status: { notIn: ["cancelled", "completed"] },
        bookings: {
          some: {
            status: { notIn: ["cancelled"] },
            payments: { some: { status: { in: ["pending", "partial"] } } },
          },
        },
      },
      select: {
        id: true,
        title: true,
        startsAt: true,
        bookings: {
          where: {
            status: { notIn: ["cancelled"] },
            payments: { some: { status: { in: ["pending", "partial"] } } },
          },
          select: {
            payments: {
              where: { status: { in: ["pending", "partial"] } },
              select: { amount: true },
            },
          },
        },
      },
      orderBy: { startsAt: "asc" },
      take: 10,
    }),

    // All unpaid bookings (for total debt)
    prisma.payment.findMany({
      where: {
        studioId,
        status: { in: ["pending", "partial"] },
        booking: { status: { notIn: ["cancelled"] } },
      },
      select: { amount: true },
    }),

    // Manual tasks
    prisma.task.findMany({
      where: { studioId, completed: false },
      orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }],
      take: 20,
    }),
  ]);

  const lowStockMats = lowStockMaterials.filter(
    (m) => Number(m.stockQuantity) <= Number(m.lowStockThreshold)
  );

  const lowStockProductCount = productVariants.filter(
    (v) => v.stockQuantity <= v.lowStockThreshold
  ).length;

  const totalDebt = unpaidBookings.reduce(
    (sum, p) => sum + Number(p.amount),
    0
  );

  return {
    summary: {
      eventsThisWeek,
      openBookings,
      pendingPayments,
      lowStockAlerts: lowStockMats.length + lowStockProductCount,
    },
    tasks,
    upcomingEvents,
    unconfirmedEvents,
    eventsWithUnpaidBookings,
    lowStockMaterials: lowStockMats,
    totalDebt,
  };
}
