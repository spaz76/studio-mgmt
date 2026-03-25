import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getStudioId } from "@/lib/studio";
import { getProductById } from "@/services/products";
import { ProductForm } from "../../ProductForm";
import type { ProductWithVariants } from "../../ProductForm";

export const metadata = { title: "עריכת מוצר" };

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params;
  const studioId = await getStudioId();
  const [product, categories] = await Promise.all([
    getProductById(prisma, studioId, id),
    prisma.category.findMany({
      where: { studioId },
      select: { id: true, name: true, parentId: true },
      orderBy: [{ parentId: "asc" }, { name: "asc" }],
    }),
  ]);

  if (!product) notFound();

  // Prisma Decimal → plain number for client component serialization
  const serializable: ProductWithVariants = {
    ...product,
    variants: product.variants.map((v) => ({
      ...v,
      price: Number(v.price) as unknown as typeof v.price,
    })),
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold">עריכת מוצר: {product.name}</h1>
      <ProductForm product={serializable} categories={categories} />
    </div>
  );
}
