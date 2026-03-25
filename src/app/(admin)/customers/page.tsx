import { prisma } from "@/lib/prisma";
import { getStudioId } from "@/lib/studio";
import { getCustomersList } from "@/services/customers";
import { CustomersList } from "./CustomersList";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { UserPlus } from "lucide-react";

export const metadata = { title: "לקוחות" };

export default async function CustomersPage() {
  const studioId = await getStudioId();
  const customers = await getCustomersList(prisma, studioId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">לקוחות</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{customers.length} לקוחות</span>
          <Link href="/customers/new" className={buttonVariants({ size: "sm" })}>
            <UserPlus className="h-4 w-4 ml-1" />
            הוסף לקוח
          </Link>
        </div>
      </div>
      <CustomersList customers={customers} />
    </div>
  );
}
