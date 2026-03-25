import type { PrismaClient } from "@/generated/prisma";

export async function getCustomersList(prisma: PrismaClient, studioId: string, search?: string) {
  return prisma.customer.findMany({
    where: {
      studioId,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
              { phone: { contains: search } },
            ],
          }
        : {}),
    },
    include: {
      _count: { select: { bookings: true } },
      bookings: {
        where: { status: { not: "cancelled" } },
        include: {
          payments: { where: { status: { in: ["pending", "partial"] } }, select: { amount: true } },
        },
      },
    },
    orderBy: { name: "asc" },
  });
}

export async function getCustomerById(prisma: PrismaClient, studioId: string, customerId: string) {
  return prisma.customer.findUnique({
    where: { id: customerId, studioId },
    include: {
      bookings: {
        include: {
          workshopEvent: { select: { id: true, title: true, startsAt: true, status: true } },
          payments: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

export async function updateCustomer(
  prisma: PrismaClient,
  studioId: string,
  customerId: string,
  data: {
    name?: string;
    email?: string | null;
    phone?: string | null;
    notes?: string | null;
    tags?: string[];
    preferredContactMethod?: string | null;
  }
) {
  return prisma.customer.update({
    where: { id: customerId, studioId },
    data,
  });
}
