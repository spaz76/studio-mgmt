import type { PrismaClient } from "@/generated/prisma";

const ACTIVE_STATUSES = ["loading", "firing", "cooling", "unloading"];

export async function getFiringTypes(
  prisma: PrismaClient,
  studioId: string,
  kilnId: string
) {
  return prisma.firingType.findMany({
    where: { studioId, kilnId },
    include: { stages: { orderBy: { sortOrder: "asc" } } },
    orderBy: { name: "asc" },
  });
}

export async function createFiringType(
  prisma: PrismaClient,
  studioId: string,
  kilnId: string,
  data: {
    name: string;
    stages: Array<{ targetTemp: number; durationMinutes: number; sortOrder: number }>;
  }
) {
  return prisma.firingType.create({
    data: {
      studioId,
      kilnId,
      name: data.name,
      stages: { create: data.stages },
    },
    include: { stages: { orderBy: { sortOrder: "asc" } } },
  });
}

export async function getKilnsList(prisma: PrismaClient, studioId: string) {
  const kilns = await prisma.kiln.findMany({
    where: { studioId },
    include: {
      firings: {
        orderBy: { createdAt: "desc" },
        select: { id: true, status: true, firingType: true, createdAt: true },
      },
    },
    orderBy: { name: "asc" },
  });

  return kilns.map((kiln) => {
    const activeFiring = kiln.firings.find((f) =>
      ACTIVE_STATUSES.includes(f.status)
    );
    const latestFiring = kiln.firings[0] ?? null;
    const currentStatus = activeFiring ? activeFiring.status : "פנוי";

    return {
      ...kiln,
      _count: { firings: kiln.firings.length },
      latestFiring,
      currentStatus,
    };
  });
}

export async function getKilnById(
  prisma: PrismaClient,
  studioId: string,
  kilnId: string
) {
  return prisma.kiln.findFirst({
    where: { id: kilnId, studioId },
    include: {
      firings: { orderBy: { createdAt: "desc" } },
      firingTypes: {
        include: { stages: { orderBy: { sortOrder: "asc" } } },
        orderBy: { name: "asc" },
      },
    },
  });
}

export async function createKiln(
  prisma: PrismaClient,
  studioId: string,
  data: {
    name: string;
    type?: string | null;
    maxTemp?: number | null;
    capacity?: string | null;
    isActive?: boolean;
  }
) {
  return prisma.kiln.create({
    data: { studioId, ...data },
  });
}

export async function updateKiln(
  prisma: PrismaClient,
  studioId: string,
  kilnId: string,
  data: {
    name?: string;
    type?: string | null;
    maxTemp?: number | null;
    capacity?: string | null;
    isActive?: boolean;
  }
) {
  return prisma.kiln.update({
    where: { id: kilnId, studioId },
    data,
  });
}

export async function createFiring(
  prisma: PrismaClient,
  studioId: string,
  kilnId: string,
  data: {
    firingType: string;
    targetTemp?: number | null;
    startedAt?: Date | null;
    notes?: string | null;
    firingTypeId?: string | null;
    loadLevel?: string | null;
    estimatedEndAt?: Date | null;
    status?: string;
  }
) {
  const { status, ...rest } = data;
  return prisma.firing.create({
    data: {
      studioId,
      kilnId,
      status: status ?? "planned",
      ...rest,
    },
  });
}

export async function updateFiringStatus(
  prisma: PrismaClient,
  studioId: string,
  firingId: string,
  status: string,
  extra?: { startedAt?: Date; completedAt?: Date }
) {
  return prisma.firing.update({
    where: { id: firingId, studioId },
    data: {
      status,
      ...(extra?.startedAt ? { startedAt: extra.startedAt } : {}),
      ...(extra?.completedAt ? { completedAt: extra.completedAt } : {}),
    },
  });
}
