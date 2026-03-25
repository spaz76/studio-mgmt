"use server";

import { prisma } from "@/lib/prisma";
import { getStudioId } from "@/lib/studio";
import { revalidatePath } from "next/cache";
import * as kilnsService from "@/services/kilns";

export async function createFiringTypeAction(formData: FormData) {
  const studioId = await getStudioId();
  const kilnId = formData.get("kilnId") as string;
  const name = formData.get("name") as string;

  // Stages are encoded as JSON array in a single field
  const stagesRaw = formData.get("stages") as string;
  const stages: Array<{ targetTemp: number; durationMinutes: number; sortOrder: number }> =
    stagesRaw ? JSON.parse(stagesRaw) : [];

  await kilnsService.createFiringType(prisma, studioId, kilnId, { name, stages });

  revalidatePath(`/kilns/${kilnId}`);
}

export async function createKilnAction(formData: FormData) {
  const studioId = await getStudioId();

  const maxTempRaw = formData.get("maxTemp") as string;
  const maxTemp = maxTempRaw ? parseInt(maxTempRaw, 10) : null;

  await kilnsService.createKiln(prisma, studioId, {
    name: formData.get("name") as string,
    type: (formData.get("type") as string) || null,
    maxTemp: maxTemp && !isNaN(maxTemp) ? maxTemp : null,
    capacity: (formData.get("capacity") as string) || null,
    isActive: formData.get("isActive") === "on" || formData.get("isActive") === "true",
  });

  revalidatePath("/kilns");
}

export async function updateKilnAction(kilnId: string, formData: FormData) {
  const studioId = await getStudioId();

  const maxTempRaw = formData.get("maxTemp") as string;
  const maxTemp = maxTempRaw ? parseInt(maxTempRaw, 10) : null;

  await kilnsService.updateKiln(prisma, studioId, kilnId, {
    name: formData.get("name") as string,
    type: (formData.get("type") as string) || null,
    maxTemp: maxTemp && !isNaN(maxTemp) ? maxTemp : null,
    capacity: (formData.get("capacity") as string) || null,
    isActive: formData.get("isActive") === "on" || formData.get("isActive") === "true",
  });

  revalidatePath("/kilns");
  revalidatePath(`/kilns/${kilnId}`);
}

export async function createFiringAction(formData: FormData) {
  const studioId = await getStudioId();
  const kilnId = formData.get("kilnId") as string;

  const targetTempRaw = formData.get("targetTemp") as string;
  const targetTemp = targetTempRaw ? parseInt(targetTempRaw, 10) : null;

  const startedAtRaw = formData.get("startedAt") as string;
  const startedAt = startedAtRaw ? new Date(startedAtRaw) : null;

  const estimatedEndAtRaw = formData.get("estimatedEndAt") as string;
  const estimatedEndAt = estimatedEndAtRaw ? new Date(estimatedEndAtRaw) : null;

  const firingTypeId = (formData.get("firingTypeId") as string) || null;
  const loadLevel = (formData.get("loadLevel") as string) || null;
  const status = (formData.get("status") as string) || "planned";

  await kilnsService.createFiring(prisma, studioId, kilnId, {
    firingType: (formData.get("firingType") as string) || "custom",
    targetTemp: targetTemp && !isNaN(targetTemp) ? targetTemp : null,
    startedAt,
    notes: (formData.get("notes") as string) || null,
    firingTypeId,
    loadLevel,
    estimatedEndAt,
    status,
  });

  revalidatePath("/kilns");
  revalidatePath(`/kilns/${kilnId}`);
}

export async function updateFiringStatusAction(firingId: string, status: string) {
  const studioId = await getStudioId();

  const extra: { startedAt?: Date; completedAt?: Date } = {};
  if (status === "firing") {
    extra.startedAt = new Date();
  }
  if (status === "completed") {
    extra.completedAt = new Date();
  }

  const firing = await prisma.firing.findFirst({
    where: { id: firingId, studioId },
    select: { kilnId: true, status: true },
  });

  await kilnsService.updateFiringStatus(prisma, studioId, firingId, status, extra);

  revalidatePath("/kilns");
  if (firing?.kilnId) {
    revalidatePath(`/kilns/${firing.kilnId}`);
  }
}

export async function setCooledAtAction(firingId: string) {
  const studioId = await getStudioId();

  const firing = await prisma.firing.findFirst({
    where: { id: firingId, studioId },
    select: { kilnId: true },
  });

  await prisma.firing.update({
    where: { id: firingId, studioId },
    data: { cooledAt: new Date() },
  });

  revalidatePath("/kilns");
  if (firing?.kilnId) {
    revalidatePath(`/kilns/${firing.kilnId}`);
  }
}

export async function updateFiringTimesAction(
  firingId: string,
  values: {
    startedAt?: string | null;
    completedAt?: string | null;
    estimatedEndAt?: string | null;
  }
) {
  const studioId = await getStudioId();

  const firing = await prisma.firing.findFirst({
    where: { id: firingId, studioId },
    select: { kilnId: true },
  });

  if (!firing) {
    throw new Error("Firing not found");
  }

  const parseValue = (value?: string | null) => {
    if (!value) return null;
    const date = new Date(value);
    if (isNaN(date.getTime())) return null;
    return date;
  };

  const startedAtValue =
    values.startedAt !== undefined ? parseValue(values.startedAt) : undefined;
  const completedAtValue =
    values.completedAt !== undefined ? parseValue(values.completedAt) : undefined;
  const estimatedEndValue =
    values.estimatedEndAt !== undefined ? parseValue(values.estimatedEndAt) : undefined;

  await prisma.firing.update({
    where: { id: firingId, studioId },
    data: {
      ...(startedAtValue !== undefined ? { startedAt: startedAtValue } : {}),
      ...(completedAtValue !== undefined ? { completedAt: completedAtValue } : {}),
      ...(estimatedEndValue !== undefined ? { estimatedEndAt: estimatedEndValue } : {}),
      ...(completedAtValue ? { status: "completed" } : {}),
    },
  });

  revalidatePath("/kilns");
  if (firing.kilnId) {
    revalidatePath(`/kilns/${firing.kilnId}`);
  }
}

