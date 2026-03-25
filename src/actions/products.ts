"use server";

import { prisma } from "@/lib/prisma";
import { getStudioId } from "@/lib/studio";
import { revalidatePath } from "next/cache";
import * as productService from "@/services/products";
import type { ProductVariantInput } from "@/services/products";

function parseVariants(raw: string | null): ProductVariantInput[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((v: Record<string, unknown>) => ({
      name: String(v.name ?? ""),
      sku: String(v.sku ?? ""),
      price: Number(v.price ?? 0),
      stockQuantity: Number(v.stockQuantity ?? 0),
      lowStockThreshold: Number(v.lowStockThreshold ?? 5),
      barcode: v.barcode ? String(v.barcode) : null,
    }));
  } catch {
    return [];
  }
}

export async function createProductAction(formData: FormData) {
  const studioId = await getStudioId();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("שם המוצר הוא שדה חובה");

  const variants = parseVariants(formData.get("variants") as string | null);

  const categoryId = (formData.get("categoryId") as string | null) || null;
  await productService.createProduct(prisma, studioId, {
    name,
    description: (formData.get("description") as string | null) || null,
    skuBase: (formData.get("skuBase") as string | null) || null,
    category: (formData.get("category") as string | null) || null,
    categoryId,
    imageUrl: (formData.get("imageUrl") as string | null) || null,
    isSeasonal: formData.get("isSeasonal") === "true",
    seasonStart: formData.get("seasonStart")
      ? Number(formData.get("seasonStart"))
      : null,
    seasonEnd: formData.get("seasonEnd")
      ? Number(formData.get("seasonEnd"))
      : null,
    isActive: formData.get("isActive") !== "false",
    variants,
  });

  revalidatePath("/products");
}

export async function updateProductAction(
  productId: string,
  formData: FormData
) {
  const studioId = await getStudioId();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("שם המוצר הוא שדה חובה");

  const variants = parseVariants(formData.get("variants") as string | null);

  const categoryId = (formData.get("categoryId") as string | null) || null;
  await productService.updateProduct(prisma, studioId, productId, {
    name,
    description: (formData.get("description") as string | null) || null,
    skuBase: (formData.get("skuBase") as string | null) || null,
    category: (formData.get("category") as string | null) || null,
    categoryId,
    imageUrl: (formData.get("imageUrl") as string | null) || null,
    isSeasonal: formData.get("isSeasonal") === "true",
    seasonStart: formData.get("seasonStart")
      ? Number(formData.get("seasonStart"))
      : null,
    seasonEnd: formData.get("seasonEnd")
      ? Number(formData.get("seasonEnd"))
      : null,
    isActive: formData.get("isActive") !== "false",
    variants,
  });

  revalidatePath("/products");
  revalidatePath(`/products/${productId}`);
}

export async function deleteProductAction(productId: string) {
  const studioId = await getStudioId();
  await productService.deleteProduct(prisma, studioId, productId);
  revalidatePath("/products");
}

export async function updateVariantStockAction(
  variantId: string,
  quantity: number
) {
  const studioId = await getStudioId();
  await productService.updateVariantStock(prisma, studioId, variantId, quantity);
  revalidatePath("/products");
}
