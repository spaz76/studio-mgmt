import type { PrismaClient, StockLogAction } from "@/generated/prisma";

export type StockStatus = "green" | "yellow" | "orange" | "red";

export function getStockStatus(
  stockQuantity: number,
  redThreshold: number,
  orangeThreshold: number,
  lowStockThreshold: number
): StockStatus {
  if (stockQuantity <= redThreshold) return "red";
  if (stockQuantity <= orangeThreshold) return "orange";
  if (stockQuantity <= lowStockThreshold) return "yellow";
  return "green";
}

export async function getMaterialsList(
  prisma: PrismaClient,
  studioId: string,
  opts?: { lowStock?: boolean }
) {
  const materials = await prisma.material.findMany({
    where: { studioId },
    include: {
      materialSuppliers: {
        include: { supplier: true },
      },
    },
    orderBy: { name: "asc" },
  });

  const withStatus = materials.map((m) => ({
    ...m,
    stockStatus: getStockStatus(
      Number(m.stockQuantity),
      Number(m.redThreshold),
      Number(m.orangeThreshold),
      Number(m.lowStockThreshold)
    ),
  }));

  if (opts?.lowStock) {
    return withStatus.filter(
      (m) => Number(m.stockQuantity) < Number(m.lowStockThreshold)
    );
  }

  return withStatus;
}

export async function getMaterialById(
  prisma: PrismaClient,
  studioId: string,
  materialId: string
) {
  const material = await prisma.material.findUnique({
    where: { id: materialId, studioId },
    include: {
      materialSuppliers: {
        include: { supplier: true },
        orderBy: [{ isPreferred: "desc" }, { createdAt: "asc" }],
      },
      stockLogs: {
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });

  if (!material) return null;

  return {
    ...material,
    stockStatus: getStockStatus(
      Number(material.stockQuantity),
      Number(material.redThreshold),
      Number(material.orangeThreshold),
      Number(material.lowStockThreshold)
    ),
  };
}

export async function createMaterial(
  prisma: PrismaClient,
  studioId: string,
  data: {
    name: string;
    description?: string | null;
    unit?: string;
    stockQuantity?: number;
    lowStockThreshold?: number;
    orangeThreshold?: number;
    redThreshold?: number;
    barcode?: string | null;
    notes?: string | null;
    categoryId?: string | null;
    purchaseUrl?: string | null;
    pricePerUnit?: number | null;
    pricePerPackage?: number | null;
    packageSize?: string | null;
    width?: string | null;
    height?: string | null;
    minTemp?: number | null;
    maxTemp?: number | null;
  }
) {
  return prisma.material.create({
    data: {
      studioId,
      name: data.name,
      description: data.description ?? null,
      unit: data.unit ?? "יחידה",
      stockQuantity: data.stockQuantity ?? 0,
      lowStockThreshold: data.lowStockThreshold ?? 5,
      orangeThreshold: data.orangeThreshold ?? 10,
      redThreshold: data.redThreshold ?? 3,
      barcode: data.barcode ?? null,
      notes: data.notes ?? null,
      categoryId: data.categoryId ?? null,
      purchaseUrl: data.purchaseUrl ?? null,
      pricePerUnit: data.pricePerUnit ?? null,
      pricePerPackage: data.pricePerPackage ?? null,
      packageSize: data.packageSize ?? null,
      width: data.width ?? null,
      height: data.height ?? null,
      minTemp: data.minTemp ?? null,
      maxTemp: data.maxTemp ?? null,
    },
  });
}

export async function updateMaterial(
  prisma: PrismaClient,
  studioId: string,
  materialId: string,
  data: {
    name?: string;
    description?: string | null;
    unit?: string;
    stockQuantity?: number;
    lowStockThreshold?: number;
    orangeThreshold?: number;
    redThreshold?: number;
    barcode?: string | null;
    notes?: string | null;
    categoryId?: string | null;
    purchaseUrl?: string | null;
    pricePerUnit?: number | null;
    pricePerPackage?: number | null;
    packageSize?: string | null;
    width?: string | null;
    height?: string | null;
    minTemp?: number | null;
    maxTemp?: number | null;
  }
) {
  return prisma.material.update({
    where: { id: materialId, studioId },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.unit !== undefined ? { unit: data.unit } : {}),
      ...(data.stockQuantity !== undefined ? { stockQuantity: data.stockQuantity } : {}),
      ...(data.lowStockThreshold !== undefined ? { lowStockThreshold: data.lowStockThreshold } : {}),
      ...(data.orangeThreshold !== undefined ? { orangeThreshold: data.orangeThreshold } : {}),
      ...(data.redThreshold !== undefined ? { redThreshold: data.redThreshold } : {}),
      ...(data.barcode !== undefined ? { barcode: data.barcode } : {}),
      ...(data.notes !== undefined ? { notes: data.notes } : {}),
      ...(data.categoryId !== undefined ? { categoryId: data.categoryId } : {}),
      ...(data.purchaseUrl !== undefined ? { purchaseUrl: data.purchaseUrl } : {}),
      ...(data.pricePerUnit !== undefined ? { pricePerUnit: data.pricePerUnit } : {}),
      ...(data.pricePerPackage !== undefined ? { pricePerPackage: data.pricePerPackage } : {}),
      ...(data.packageSize !== undefined ? { packageSize: data.packageSize } : {}),
      ...(data.width !== undefined ? { width: data.width } : {}),
      ...(data.height !== undefined ? { height: data.height } : {}),
      ...(data.minTemp !== undefined ? { minTemp: data.minTemp } : {}),
      ...(data.maxTemp !== undefined ? { maxTemp: data.maxTemp } : {}),
    },
  });
}

export async function addMaterialStockLog(
  prisma: PrismaClient,
  studioId: string,
  materialId: string,
  action: StockLogAction,
  quantity: number,
  notes?: string | null
) {
  const material = await prisma.material.findUnique({
    where: { id: materialId, studioId },
    select: { stockQuantity: true },
  });

  if (!material) throw new Error("Material not found");

  const current = Number(material.stockQuantity);
  let newQuantity: number;

  if (action === "ordered") {
    newQuantity = current; // order placed — stock unchanged until received
  } else if (action === "purchase") {
    newQuantity = current + quantity;
  } else if (action === "adjustment") {
    newQuantity = quantity;
  } else {
    // consumption or loss
    newQuantity = Math.max(0, current - quantity);
  }

  const [log] = await prisma.$transaction([
    prisma.materialStockLog.create({
      data: {
        studioId,
        materialId,
        action,
        quantity,
        notes: notes ?? null,
      },
    }),
    prisma.material.update({
      where: { id: materialId },
      data: { stockQuantity: newQuantity },
    }),
  ]);

  return log;
}

export async function addSupplierToMaterial(
  prisma: PrismaClient,
  studioId: string,
  materialId: string,
  supplierData: {
    name: string;
    phone?: string | null;
    email?: string | null;
    website?: string | null;
    pricePerUnit?: number | null;
    isPreferred?: boolean;
    notes?: string | null;
  }
) {
  // Find existing supplier by name in this studio, or create new one
  let supplier = await prisma.supplier.findFirst({
    where: { studioId, name: supplierData.name },
  });

  if (!supplier) {
    supplier = await prisma.supplier.create({
      data: {
        studioId,
        name: supplierData.name,
        phone: supplierData.phone ?? null,
        email: supplierData.email ?? null,
        website: supplierData.website ?? null,
      },
    });
  }

  // If isPreferred, unset any existing preferred supplier for this material
  if (supplierData.isPreferred) {
    await prisma.materialSupplier.updateMany({
      where: { materialId, isPreferred: true },
      data: { isPreferred: false },
    });
  }

  return prisma.materialSupplier.upsert({
    where: {
      materialId_supplierId: {
        materialId,
        supplierId: supplier.id,
      },
    },
    create: {
      materialId,
      supplierId: supplier.id,
      pricePerUnit: supplierData.pricePerUnit ?? null,
      isPreferred: supplierData.isPreferred ?? false,
      notes: supplierData.notes ?? null,
    },
    update: {
      pricePerUnit: supplierData.pricePerUnit ?? null,
      isPreferred: supplierData.isPreferred ?? false,
      notes: supplierData.notes ?? null,
    },
  });
}

export async function getShoppingList(prisma: PrismaClient, studioId: string) {
  const materials = await prisma.material.findMany({
    where: {
      studioId,
      // We'll filter in JS since Prisma doesn't support field-to-field comparison directly
    },
    include: {
      materialSuppliers: {
        where: { isPreferred: true },
        include: { supplier: true },
        take: 1,
      },
    },
    orderBy: { name: "asc" },
  });

  return materials
    .filter((m) => Number(m.stockQuantity) < Number(m.lowStockThreshold))
    .map((m) => ({
      ...m,
      stockStatus: getStockStatus(
        Number(m.stockQuantity),
        Number(m.redThreshold),
        Number(m.orangeThreshold),
        Number(m.lowStockThreshold)
      ),
      preferredSupplier: m.materialSuppliers[0] ?? null,
    }));
}
