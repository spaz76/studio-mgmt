import { prisma } from "@/lib/prisma";
import { getStudioId } from "@/lib/studio";
import { getProductsList } from "@/services/products";
import { ProductsClient } from "./ProductsClient";

export const metadata = { title: "מוצרים" };

interface ProductsPageProps {
  searchParams: Promise<{
    search?: string;
    category?: string;
    filter?: string;
    sort?: string;
  }>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  const studioId = await getStudioId();

  const isActiveFilter =
    params.filter === "active"
      ? true
      : params.filter === "inactive"
        ? false
        : undefined;

  const lowStock = params.filter === "lowStock";

  const products = await getProductsList(prisma, studioId, {
    search: params.search,
    category: params.category,
    lowStock,
    isActive: isActiveFilter,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">מוצרים</h1>
      <ProductsClient
        products={products}
        initialSearch={params.search ?? ""}
        initialFilter={params.filter ?? "all"}
        initialSort={params.sort ?? "name"}
      />
    </div>
  );
}
