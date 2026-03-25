"use server";

import { prisma } from "@/lib/prisma";
import { getStudioId } from "@/lib/studio";
import { revalidatePath } from "next/cache";
import * as materialsService from "@/services/materials";
import type { StockLogAction } from "@/generated/prisma";

function parseOptionalFloat(val: FormDataEntryValue | null): number | null {
  if (!val || String(val).trim() === "") return null;
  const n = parseFloat(String(val));
  return isNaN(n) ? null : n;
}

function parseOptionalInt(val: FormDataEntryValue | null): number | null {
  if (!val || String(val).trim() === "") return null;
  const n = parseInt(String(val));
  return isNaN(n) ? null : n;
}

function parseOptionalString(val: FormDataEntryValue | null): string | null {
  const s = String(val ?? "").trim();
  return s || null;
}

function extractMaterialFields(formData: FormData) {
  return {
    name: (formData.get("name") as string)?.trim(),
    description: parseOptionalString(formData.get("description")),
    unit: (formData.get("unit") as string) || "יחידה",
    stockQuantity: parseFloat(formData.get("stockQuantity") as string) || 0,
    lowStockThreshold: parseFloat(formData.get("lowStockThreshold") as string) || 5,
    orangeThreshold: parseFloat(formData.get("orangeThreshold") as string) || 10,
    redThreshold: parseFloat(formData.get("redThreshold") as string) || 3,
    barcode: parseOptionalString(formData.get("barcode")),
    notes: parseOptionalString(formData.get("notes")),
    categoryId: parseOptionalString(formData.get("categoryId")),
    purchaseUrl: parseOptionalString(formData.get("purchaseUrl")),
    pricePerUnit: parseOptionalFloat(formData.get("pricePerUnit")),
    pricePerPackage: parseOptionalFloat(formData.get("pricePerPackage")),
    packageSize: parseOptionalString(formData.get("packageSize")),
    width: parseOptionalString(formData.get("width")),
    height: parseOptionalString(formData.get("height")),
    minTemp: parseOptionalInt(formData.get("minTemp")),
    maxTemp: parseOptionalInt(formData.get("maxTemp")),
  };
}

export async function createMaterialAction(formData: FormData) {
  const studioId = await getStudioId();
  const fields = extractMaterialFields(formData);

  if (!fields.name) throw new Error("שם הוא שדה חובה");

  const material = await materialsService.createMaterial(prisma, studioId, fields);

  const supplierId = parseOptionalString(formData.get("supplierId"));
  if (supplierId) {
    await prisma.materialSupplier.create({
      data: { materialId: material.id, supplierId, isPreferred: true },
    });
  }

  revalidatePath("/materials");
}

export async function updateMaterialAction(materialId: string, formData: FormData) {
  const studioId = await getStudioId();
  const fields = extractMaterialFields(formData);

  if (!fields.name) throw new Error("שם הוא שדה חובה");

  await materialsService.updateMaterial(prisma, studioId, materialId, fields);

  revalidatePath("/materials");
  revalidatePath(`/materials/${materialId}`);
}

export async function addStockLogAction(
  materialId: string,
  action: string,
  quantity: number,
  notes?: string
) {
  const studioId = await getStudioId();

  await materialsService.addMaterialStockLog(
    prisma,
    studioId,
    materialId,
    action as StockLogAction,
    quantity,
    notes ?? null
  );

  revalidatePath("/materials");
  revalidatePath(`/materials/${materialId}`);
}

export async function addSupplierAction(materialId: string, formData: FormData) {
  const studioId = await getStudioId();

  const name = formData.get("name") as string;
  if (!name?.trim()) throw new Error("שם ספק הוא שדה חובה");

  const priceRaw = formData.get("pricePerUnit") as string;
  const isPreferredRaw = formData.get("isPreferred") as string;

  await materialsService.addSupplierToMaterial(prisma, studioId, materialId, {
    name: name.trim(),
    phone: parseOptionalString(formData.get("phone")),
    email: parseOptionalString(formData.get("email")),
    pricePerUnit: priceRaw ? parseFloat(priceRaw) : null,
    isPreferred: isPreferredRaw === "true" || isPreferredRaw === "on",
    notes: parseOptionalString(formData.get("notes")),
  });

  revalidatePath("/materials");
  revalidatePath(`/materials/${materialId}`);
}

export async function markPurchasedAction(materialId: string, quantity: number) {
  const studioId = await getStudioId();

  await materialsService.addMaterialStockLog(
    prisma,
    studioId,
    materialId,
    "purchase",
    quantity,
    "נרכש"
  );

  revalidatePath("/materials");
}

export async function createCategoryAction(formData: FormData) {
  const studioId = await getStudioId();
  const name = (formData.get("name") as string)?.trim();
  if (!name) throw new Error("שם קטגוריה חובה");
  const parentId = parseOptionalString(formData.get("parentId"));

  const category = await prisma.category.create({
    data: { studioId, name, parentId },
  });

  revalidatePath("/materials");
  revalidatePath("/products");

  return category;
}
