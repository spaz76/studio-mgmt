import type { PrismaClient } from "@/generated/prisma";

export async function getSuppliersList(prisma: PrismaClient, studioId: string) {
  return prisma.supplier.findMany({
    where: { studioId },
    include: {
      contacts: { orderBy: { createdAt: "asc" } },
      materialSuppliers: {
        include: { material: { select: { id: true, name: true } } },
      },
    },
    orderBy: { name: "asc" },
  });
}

export async function getSupplierById(prisma: PrismaClient, studioId: string, id: string) {
  return prisma.supplier.findFirst({
    where: { id, studioId },
    include: {
      contacts: { orderBy: { createdAt: "asc" } },
      materialSuppliers: {
        include: { material: { select: { id: true, name: true } } },
      },
    },
  });
}

export async function createSupplier(
  prisma: PrismaClient,
  studioId: string,
  data: {
    name: string;
    email?: string | null;
    phone?: string | null;
    website?: string | null;
    notes?: string | null;
  }
) {
  return prisma.supplier.create({ data: { ...data, studioId } });
}

export async function updateSupplier(
  prisma: PrismaClient,
  studioId: string,
  id: string,
  data: {
    name?: string;
    email?: string | null;
    phone?: string | null;
    website?: string | null;
    notes?: string | null;
  }
) {
  return prisma.supplier.updateMany({ where: { id, studioId }, data });
}

export async function addSupplierContact(
  prisma: PrismaClient,
  supplierId: string,
  data: {
    name: string;
    role?: string | null;
    phone?: string | null;
    extension?: string | null;
    email?: string | null;
  }
) {
  return prisma.supplierContact.create({ data: { ...data, supplierId } });
}

export async function deleteSupplierContact(prisma: PrismaClient, id: string) {
  return prisma.supplierContact.delete({ where: { id } });
}
