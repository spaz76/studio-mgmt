import { prisma } from "@/lib/prisma";
import { getStudioId } from "@/lib/studio";
import { ProductForm } from "../ProductForm";

export const metadata = { title: "מוצר חדש" };

export default async function NewProductPage() {
  const studioId = await getStudioId();
  const categories = await prisma.category.findMany({
    where: { studioId },
    select: { id: true, name: true, parentId: true },
    orderBy: [{ parentId: "asc" }, { name: "asc" }],
  });

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold">מוצר חדש</h1>
      <ProductForm categories={categories} />
    </div>
  );
}
