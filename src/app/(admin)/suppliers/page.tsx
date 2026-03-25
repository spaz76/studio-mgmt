import { prisma } from "@/lib/prisma";
import { getStudioId } from "@/lib/studio";
import { getSuppliersList } from "@/services/suppliers";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Plus, Users } from "lucide-react";
import { SuppliersClient } from "./SuppliersClient";

export const metadata = { title: "ספקים" };

export default async function SuppliersPage() {
  const studioId = await getStudioId();
  const suppliers = await getSuppliersList(prisma, studioId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">ספקים</h1>
        <Link href="/suppliers/new" className={buttonVariants({ size: "sm" })}>
          <Plus className="h-4 w-4 ml-1" />
          ספק חדש
        </Link>
      </div>

      {suppliers.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p>אין ספקים עדיין.</p>
          <Link href="/suppliers/new" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-3")}>הוסף ספק ראשון</Link>
        </div>
      ) : (
        <SuppliersClient suppliers={suppliers} />
      )}
    </div>
  );
}
