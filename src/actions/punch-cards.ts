"use server";

import { prisma } from "@/lib/prisma";
import { getStudioId } from "@/lib/studio";
import { revalidatePath } from "next/cache";

export async function createPunchCardAction(
  customerId: string,
  formData: FormData
): Promise<{ ok: true } | { ok: false; error: string }> {
  const studioId = await getStudioId();

  const totalSessions = parseInt(formData.get("totalSessions") as string, 10);
  if (!totalSessions || totalSessions < 1) return { ok: false, error: "מספר מפגשים לא תקין" };

  const paidAmount = parseFloat(formData.get("paidAmount") as string) || 0;
  const templateId = (formData.get("templateId") as string) || null;
  const expiresAtStr = (formData.get("expiresAt") as string) || "";
  const expiresAt = expiresAtStr ? new Date(expiresAtStr) : null;

  await prisma.punchCard.create({
    data: {
      studioId,
      customerId,
      templateId: templateId || null,
      totalSessions,
      paidAmount,
      expiresAt,
    },
  });

  revalidatePath(`/customers/${customerId}`);
  return { ok: true };
}

export async function deletePunchCardAction(
  punchCardId: string,
  customerId: string
): Promise<void> {
  const studioId = await getStudioId();
  await prisma.punchCard.deleteMany({
    where: { id: punchCardId, studioId },
  });
  revalidatePath(`/customers/${customerId}`);
}
