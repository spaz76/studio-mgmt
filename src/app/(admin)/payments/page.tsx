import { prisma } from "@/lib/prisma";
import { getStudioId } from "@/lib/studio";
import { getPaymentsList } from "@/services/payments";
import { PaymentsClient } from "./PaymentsClient";

export const metadata = { title: "תשלומים" };

export default async function PaymentsPage() {
  const studioId = await getStudioId();
  const { payments, totalDebt } = await getPaymentsList(prisma, studioId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">תשלומים</h1>
      </div>
      <PaymentsClient payments={payments} totalDebt={totalDebt} />
    </div>
  );
}
