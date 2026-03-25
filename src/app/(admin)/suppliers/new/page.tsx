import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { SupplierForm } from "../SupplierForm";
import { createSupplierAction } from "@/actions/suppliers";

export const metadata = { title: "ספק חדש" };

export default function NewSupplierPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/suppliers" className="hover:text-foreground">
          ספקים
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">ספק חדש</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold">הוסף ספק</h1>
        <p className="text-sm text-muted-foreground mt-1">הוספת ספק חדש לסטודיו</p>
      </div>

      <SupplierForm action={createSupplierAction} submitLabel="צור ספק" />
    </div>
  );
}
