"use server";
import { prisma } from "@/lib/prisma";
import { getStudioId } from "@/lib/studio";
import { revalidatePath } from "next/cache";
import * as paymentsService from "@/services/payments";

export async function updatePaymentAction(
  paymentId: string,
  data: { status: string; amount?: number; notes?: string | null }
) {
  const studioId = await getStudioId();
  await paymentsService.updatePayment(prisma, studioId, paymentId, data);
  revalidatePath("/payments");
  revalidatePath("/workshops");
}
