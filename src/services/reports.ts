import type { PrismaClient } from "@/generated/prisma";

// ─── Workshop Status Report ────────────────────────────────────────────────

export async function getWorkshopStatusReport(
  prisma: PrismaClient,
  studioId: string
) {
  const events = await prisma.workshopEvent.findMany({
    where: { studioId },
    select: {
      status: true,
      maxParticipants: true,
      bookings: {
        where: { status: { in: ["confirmed", "pending"] } },
        select: { participantCount: true },
      },
    },
  });

  const byStatus: Record<string, number> = {};
  let totalOccupancy = 0;
  let occupancyCount = 0;
  let cancelledCount = 0;
  const totalEvents = events.length;

  for (const ev of events) {
    byStatus[ev.status] = (byStatus[ev.status] ?? 0) + 1;

    if (ev.status === "cancelled") {
      cancelledCount++;
    }

    if (ev.maxParticipants > 0) {
      const booked = ev.bookings.reduce((s, b) => s + b.participantCount, 0);
      totalOccupancy += booked / ev.maxParticipants;
      occupancyCount++;
    }
  }

  const avgOccupancy =
    occupancyCount > 0
      ? Math.round((totalOccupancy / occupancyCount) * 100)
      : 0;

  const cancellationRate =
    totalEvents > 0 ? Math.round((cancelledCount / totalEvents) * 100) : 0;

  return { byStatus, avgOccupancy, cancellationRate };
}

// ─── Revenue Report ────────────────────────────────────────────────────────

const HEBREW_MONTHS = [
  "ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני",
  "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר",
];

export async function getRevenueReport(
  prisma: PrismaClient,
  studioId: string
) {
  const payments = await prisma.payment.findMany({
    where: {
      studioId,
      status: "paid",
      paidAt: { not: null },
    },
    select: {
      amount: true,
      paidAt: true,
      booking: {
        select: {
          workshopEvent: {
            select: { title: true },
          },
        },
      },
    },
    orderBy: { paidAt: "asc" },
  });

  // Build monthly buckets for last 12 months
  const now = new Date();
  const monthlyMap: Record<string, number> = {};

  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthlyMap[key] = 0;
  }

  const byWorkshopType: Record<string, number> = {};
  let total = 0;

  for (const p of payments) {
    if (!p.paidAt) continue;
    const d = new Date(p.paidAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const amount = Number(p.amount);

    if (key in monthlyMap) {
      monthlyMap[key] += amount;
    }

    total += amount;

    const workshopTitle = p.booking?.workshopEvent?.title ?? "אחר";
    byWorkshopType[workshopTitle] = (byWorkshopType[workshopTitle] ?? 0) + amount;
  }

  const monthly = Object.entries(monthlyMap).map(([key, amount]) => {
    const [year, monthStr] = key.split("-");
    const monthIndex = parseInt(monthStr, 10) - 1;
    return {
      month: HEBREW_MONTHS[monthIndex],
      year: parseInt(year, 10),
      amount: Math.round(amount),
    };
  });

  return { monthly, byWorkshopType, total: Math.round(total) };
}

// ─── Low Stock Report ──────────────────────────────────────────────────────

export async function getLowStockReport(
  prisma: PrismaClient,
  studioId: string
) {
  const [materials, productVariants] = await Promise.all([
    prisma.material.findMany({
      where: { studioId },
      orderBy: { name: "asc" },
    }),
    prisma.productVariant.findMany({
      where: { studioId, isActive: true },
      include: {
        product: { select: { id: true, name: true, category: true } },
      },
      orderBy: { stockQuantity: "asc" },
    }),
  ]);

  const lowMaterials = materials.filter(
    (m) => Number(m.stockQuantity) < Number(m.lowStockThreshold)
  );

  const lowVariants = productVariants.filter(
    (v) => v.stockQuantity <= v.lowStockThreshold
  );

  return { materials: lowMaterials, products: lowVariants };
}

// ─── Customers Report ──────────────────────────────────────────────────────

export async function getCustomersReport(
  prisma: PrismaClient,
  studioId: string
) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const customers = await prisma.customer.findMany({
    where: { studioId },
    select: {
      id: true,
      name: true,
      createdAt: true,
      bookings: {
        where: { status: { not: "cancelled" } },
        select: {
          id: true,
          participantCount: true,
          payments: {
            where: { status: "paid" },
            select: { amount: true },
          },
        },
      },
    },
  });

  let returning = 0;
  let oneTime = 0;
  let newThisMonth = 0;

  const top10Candidates: Array<{
    name: string;
    bookingCount: number;
    totalPaid: number;
  }> = [];

  for (const c of customers) {
    const bookingCount = c.bookings.length;
    const totalPaid = c.bookings
      .flatMap((b) => b.payments)
      .reduce((s, p) => s + Number(p.amount), 0);

    if (bookingCount > 1) {
      returning++;
    } else if (bookingCount === 1) {
      oneTime++;
    }

    if (new Date(c.createdAt) >= monthStart) {
      newThisMonth++;
    }

    if (bookingCount > 0) {
      top10Candidates.push({
        name: c.name,
        bookingCount,
        totalPaid: Math.round(totalPaid),
      });
    }
  }

  top10Candidates.sort((a, b) => b.bookingCount - a.bookingCount);
  const top10 = top10Candidates.slice(0, 10);

  return { returning, oneTime, newThisMonth, top10 };
}

// ─── Type exports ──────────────────────────────────────────────────────────

export type WorkshopStatusReport = Awaited<
  ReturnType<typeof getWorkshopStatusReport>
>;
export type RevenueReport = Awaited<ReturnType<typeof getRevenueReport>>;
export type LowStockReport = Awaited<ReturnType<typeof getLowStockReport>>;
export type CustomersReport = Awaited<ReturnType<typeof getCustomersReport>>;
