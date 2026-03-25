/**
 * Products service — pure business logic, no Next.js dependencies.
 * Accepts a PrismaClient so it can be called from server actions and tests.
 */

import type { PrismaClient } from "@/generated/prisma";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProductVariantInput {
  name: string;
  sku: string;
  price: number;
  stockQuantity: number;
  lowStockThreshold: number;
  barcode?: string | null;
}

export interface CreateProductInput {
  name: string;
  description?: string | null;
  skuBase?: string | null;
  category?: string | null;
  categoryId?: string | null;
  imageUrl?: string | null;
  isSeasonal?: boolean;
  seasonStart?: number | null;
  seasonEnd?: number | null;
  isActive?: boolean;
  variants: ProductVariantInput[];
}

export interface UpdateProductInput {
  name?: string;
  description?: string | null;
  skuBase?: string | null;
  category?: string | null;
  categoryId?: string | null;
  imageUrl?: string | null;
  isSeasonal?: boolean;
  seasonStart?: number | null;
  seasonEnd?: number | null;
  isActive?: boolean;
  variants?: ProductVariantInput[];
}

export interface GetProductsListFilters {
  search?: string;
  category?: string;
  lowStock?: boolean;
  isActive?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// ─── Service functions ────────────────────────────────────────────────────────

export async function getProductsList(
  prisma: PrismaClient,
  studioId: string,
  filters: GetProductsListFilters = {}
) {
  const { search, category, lowStock, isActive } = filters;

  const products = await prisma.product.findMany({
    where: {
      studioId,
      ...(isActive !== undefined ? { isActive } : {}),
      ...(category ? { category: { equals: category, mode: "insensitive" } } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { category: { contains: search, mode: "insensitive" } },
              { skuBase: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: {
      variants: {
        where: { isActive: true },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });

  if (lowStock) {
    return products.filter((p) =>
      p.variants.some((v) => v.stockQuantity <= v.lowStockThreshold)
    );
  }

  return products;
}

export async function getProductById(
  prisma: PrismaClient,
  studioId: string,
  productId: string
) {
  return prisma.product.findFirst({
    where: { id: productId, studioId },
    include: {
      variants: {
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

export async function createProduct(
  prisma: PrismaClient,
  studioId: string,
  data: CreateProductInput
) {
  const skuBase =
    data.skuBase && data.skuBase.trim() !== ""
      ? data.skuBase.trim()
      : slugify(data.name) || "product";

  return prisma.product.create({
    data: {
      studioId,
      name: data.name,
      description: data.description ?? null,
      skuBase,
      category: data.category ?? null,
      categoryId: data.categoryId ?? null,
      imageUrl: data.imageUrl ?? null,
      isSeasonal: data.isSeasonal ?? false,
      seasonStart: data.seasonStart ?? null,
      seasonEnd: data.seasonEnd ?? null,
      isActive: data.isActive ?? true,
      variants: {
        create: data.variants.map((v) => ({
          studioId,
          name: v.name,
          sku: v.sku,
          price: v.price,
          stockQuantity: v.stockQuantity,
          lowStockThreshold: v.lowStockThreshold,
          barcode: v.barcode ?? null,
          isActive: true,
        })),
      },
    },
    include: { variants: true },
  });
}

export async function updateProduct(
  prisma: PrismaClient,
  studioId: string,
  productId: string,
  data: UpdateProductInput
) {
  // If variants provided, replace all existing variants
  if (data.variants !== undefined) {
    // Delete existing and recreate
    await prisma.productVariant.deleteMany({
      where: { productId, studioId },
    });
  }

  const skuBase =
    data.skuBase !== undefined
      ? data.skuBase && data.skuBase.trim() !== ""
        ? data.skuBase.trim()
        : data.name
          ? slugify(data.name)
          : undefined
      : undefined;

  return prisma.product.update({
    where: { id: productId },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(skuBase !== undefined ? { skuBase } : {}),
      ...(data.category !== undefined ? { category: data.category } : {}),
      ...(data.categoryId !== undefined ? { categoryId: data.categoryId } : {}),
      ...(data.imageUrl !== undefined ? { imageUrl: data.imageUrl } : {}),
      ...(data.isSeasonal !== undefined ? { isSeasonal: data.isSeasonal } : {}),
      ...(data.seasonStart !== undefined ? { seasonStart: data.seasonStart } : {}),
      ...(data.seasonEnd !== undefined ? { seasonEnd: data.seasonEnd } : {}),
      ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      ...(data.variants !== undefined
        ? {
            variants: {
              create: data.variants.map((v) => ({
                studioId,
                name: v.name,
                sku: v.sku,
                price: v.price,
                stockQuantity: v.stockQuantity,
                lowStockThreshold: v.lowStockThreshold,
                barcode: v.barcode ?? null,
                isActive: true,
              })),
            },
          }
        : {}),
    },
    include: { variants: true },
  });
}

export async function deleteProduct(
  prisma: PrismaClient,
  studioId: string,
  productId: string
) {
  return prisma.product.delete({
    where: { id: productId, studioId },
  });
}

export async function updateVariantStock(
  prisma: PrismaClient,
  studioId: string,
  variantId: string,
  quantity: number
) {
  return prisma.productVariant.update({
    where: { id: variantId, studioId },
    data: { stockQuantity: quantity },
  });
}
