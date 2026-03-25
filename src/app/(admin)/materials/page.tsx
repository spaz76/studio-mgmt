import { prisma } from "@/lib/prisma";
import { getStudioId } from "@/lib/studio";
import { getMaterialsList } from "@/services/materials";
import { MaterialsClient } from "./MaterialsClient";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { Plus, ShoppingCart } from "lucide-react";

export const metadata = { title: "חומרים" };

export default async function MaterialsPage({
  searchParams,
}: {
  searchParams: Promise<{ lowStock?: string }>;
}) {
  const { lowStock } = await searchParams;
  const studioId = await getStudioId();

  const materials = await getMaterialsList(prisma, studioId, {
    lowStock: lowStock === "1",
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">חומרים</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{materials.length} חומרים</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/materials/shopping-list"
            className={cn(buttonVariants({ variant: "outline" }), "gap-1")}
          >
            <ShoppingCart className="h-4 w-4 ml-1" />
            רשימת קניות
          </Link>
          <Link
            href="/materials/new"
            className={cn(buttonVariants({ variant: "default" }), "gap-1")}
          >
            <Plus className="h-4 w-4 ml-1" />
            הוסף חומר
          </Link>
        </div>
      </div>

      <MaterialsClient materials={materials} initialLowStock={lowStock === "1"} />
    </div>
  );
}
