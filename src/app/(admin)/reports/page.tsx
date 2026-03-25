import { prisma } from "@/lib/prisma";
import { getStudioId } from "@/lib/studio";
import {
  getWorkshopStatusReport,
  getRevenueReport,
  getLowStockReport,
  getCustomersReport,
} from "@/services/reports";
import { ReportsClient } from "./ReportsClient";

export const metadata = { title: "דוחות" };

export default async function ReportsPage() {
  const studioId = await getStudioId();

  const [workshopStatus, revenue, lowStock, customers] = await Promise.all([
    getWorkshopStatusReport(prisma, studioId),
    getRevenueReport(prisma, studioId),
    getLowStockReport(prisma, studioId),
    getCustomersReport(prisma, studioId),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">דוחות</h1>
      <ReportsClient
        workshopStatus={workshopStatus}
        revenue={revenue}
        lowStock={lowStock}
        customers={customers}
      />
    </div>
  );
}
