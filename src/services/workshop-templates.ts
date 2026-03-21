/**
 * Workshop template service — pure business logic, no Next.js dependencies.
 * Accepts a PrismaClient so it can be called from server actions, API routes,
 * and integration tests with an injected client.
 */

import type { PrismaClient } from "@/generated/prisma";

export interface CreateTemplateInput {
  name: string;
  description?: string;
  durationMinutes?: number;
  minParticipants?: number;
  maxParticipants?: number;
  defaultPrice?: number;
  tags?: string[];
  isActive?: boolean;
}

export type UpdateTemplateInput = Partial<CreateTemplateInput>;

export async function listTemplates(prisma: PrismaClient, studioId: string) {
  return prisma.workshopTemplate.findMany({
    where: { studioId },
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { workshopEvents: true } } },
  });
}

export async function getTemplate(
  prisma: PrismaClient,
  id: string,
  studioId: string
) {
  return prisma.workshopTemplate.findFirst({ where: { id, studioId } });
}

export async function createTemplate(
  prisma: PrismaClient,
  studioId: string,
  input: CreateTemplateInput
) {
  return prisma.workshopTemplate.create({
    data: {
      studioId,
      name: input.name,
      description: input.description,
      durationMinutes: input.durationMinutes ?? 120,
      minParticipants: input.minParticipants ?? 1,
      maxParticipants: input.maxParticipants ?? 12,
      defaultPrice: input.defaultPrice ?? 0,
      tags: input.tags ?? [],
      isActive: input.isActive ?? true,
    },
  });
}

export async function updateTemplate(
  prisma: PrismaClient,
  id: string,
  studioId: string,
  input: UpdateTemplateInput
) {
  return prisma.workshopTemplate.updateMany({
    where: { id, studioId },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.durationMinutes !== undefined && {
        durationMinutes: input.durationMinutes,
      }),
      ...(input.minParticipants !== undefined && {
        minParticipants: input.minParticipants,
      }),
      ...(input.maxParticipants !== undefined && {
        maxParticipants: input.maxParticipants,
      }),
      ...(input.defaultPrice !== undefined && {
        defaultPrice: input.defaultPrice,
      }),
      ...(input.tags !== undefined && { tags: input.tags }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
    },
  });
}

export async function deleteTemplate(
  prisma: PrismaClient,
  id: string,
  studioId: string
) {
  return prisma.workshopTemplate.deleteMany({ where: { id, studioId } });
}
