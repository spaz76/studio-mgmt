import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { MaterialForm } from "../MaterialForm";
import { createMaterialAction } from "@/actions/materials";
import { prisma } from "@/lib/prisma";
import { getStudioId } from "@/lib/studio";

export const metadata = { title: "חומר חדש" };

export default async function NewMaterialPage() {
  const studioId = await getStudioId();
  const [suppliers, categories, studio] = await Promise.all([
    prisma.supplier.findMany({
      where: { studioId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.category.findMany({
      where: { studioId },
      select: { id: true, name: true, parentId: true },
      orderBy: [{ parentId: "asc" }, { name: "asc" }],
    }),
    prisma.studio.findUnique({
      where: { id: studioId },
      select: { vatRate: true },
    }),
  ]);

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/materials" className="hover:text-foreground">
          חומרים
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">חומר חדש</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold">הוסף חומר</h1>
        <p className="text-sm text-muted-foreground mt-1">הוספת חומר חדש למלאי הסטודיו</p>
      </div>

      <MaterialForm
        action={createMaterialAction}
        submitLabel="צור חומר"
        suppliers={suppliers}
        categories={categories}
        vatRate={Number(studio?.vatRate ?? 18)}
      />
    </div>
  );
}
