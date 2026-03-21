/**
 * Data factories — create isolated test fixtures with unique IDs so that
 * parallel / repeated test runs don't collide.
 */

import { randomUUID } from "crypto";
import type { PrismaClient } from "../../src/generated/prisma";

// ── Studio ─────────────────────────────────────────────────────────────────

export async function createTestStudio(prisma: PrismaClient, overrides?: {
  name?: string;
  slug?: string;
}) {
  const id = randomUUID();
  const slug = overrides?.slug ?? `test-studio-${id}`;
  return prisma.studio.create({
    data: {
      name: overrides?.name ?? "Test Studio",
      publicName: overrides?.name ?? "Test Studio",
      slug,
      planType: "FREE",
      contactEmail: `hello@${slug}.test`,
    },
  });
}

// ── User ───────────────────────────────────────────────────────────────────

export async function createTestUser(prisma: PrismaClient, overrides?: {
  email?: string;
  name?: string;
}) {
  const id = randomUUID();
  return prisma.user.create({
    data: {
      email: overrides?.email ?? `user-${id}@test.example`,
      name: overrides?.name ?? "Test User",
      passwordHash: "$2b$12$fakehashfortest",
    },
  });
}

// ── StudioMember ───────────────────────────────────────────────────────────

export async function createTestOwner(
  prisma: PrismaClient,
  studioId: string,
  userId: string
) {
  return prisma.studioMember.create({
    data: {
      studioId,
      userId,
      role: "OWNER",
      isActive: true,
      joinedAt: new Date(),
    },
  });
}

// ── Customer ───────────────────────────────────────────────────────────────

export async function createTestCustomer(prisma: PrismaClient, studioId: string, overrides?: {
  name?: string;
  email?: string;
  phone?: string;
}) {
  const id = randomUUID();
  return prisma.customer.create({
    data: {
      studioId,
      name: overrides?.name ?? `Customer ${id}`,
      email: overrides?.email ?? `customer-${id}@test.example`,
      phone: overrides?.phone,
    },
  });
}

// ── WorkshopTemplate ───────────────────────────────────────────────────────

export async function createTestTemplate(prisma: PrismaClient, studioId: string, overrides?: {
  name?: string;
  durationMinutes?: number;
  minParticipants?: number;
  maxParticipants?: number;
  defaultPrice?: number;
  tags?: string[];
}) {
  const id = randomUUID();
  return prisma.workshopTemplate.create({
    data: {
      studioId,
      name: overrides?.name ?? `Template ${id}`,
      durationMinutes: overrides?.durationMinutes ?? 120,
      minParticipants: overrides?.minParticipants ?? 4,
      maxParticipants: overrides?.maxParticipants ?? 10,
      defaultPrice: overrides?.defaultPrice ?? 100,
      tags: overrides?.tags ?? [],
    },
  });
}

// ── WorkshopEvent ──────────────────────────────────────────────────────────

export async function createTestEvent(
  prisma: PrismaClient,
  studioId: string,
  createdById: string,
  overrides?: {
    templateId?: string;
    title?: string;
    status?: import("../../src/generated/prisma").WorkshopStatus;
    minParticipants?: number;
    maxParticipants?: number;
    price?: number;
    startsAt?: Date;
    endsAt?: Date;
  }
) {
  const id = randomUUID();
  const startsAt = overrides?.startsAt ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const endsAt = overrides?.endsAt ?? new Date(startsAt.getTime() + 2 * 60 * 60 * 1000);

  return prisma.workshopEvent.create({
    data: {
      studioId,
      createdById,
      templateId: overrides?.templateId,
      title: overrides?.title ?? `Event ${id}`,
      startsAt,
      endsAt,
      status: overrides?.status ?? "open",
      minParticipants: overrides?.minParticipants ?? 4,
      maxParticipants: overrides?.maxParticipants ?? 10,
      price: overrides?.price ?? 100,
    },
  });
}

// ── Teardown helper ────────────────────────────────────────────────────────

/**
 * Delete all data created during a test run for the given studioId.
 * Call this in afterEach / afterAll to keep the DB clean.
 */
export async function cleanupStudio(prisma: PrismaClient, studioId: string) {
  // Order respects foreign-key constraints
  await prisma.materialStockLog.deleteMany({ where: { studioId } });
  await prisma.materialSupplier.deleteMany({
    where: { material: { studioId } },
  });
  await prisma.material.deleteMany({ where: { studioId } });
  await prisma.productVariant.deleteMany({ where: { studioId } });
  await prisma.product.deleteMany({ where: { studioId } });
  await prisma.supplier.deleteMany({ where: { studioId } });
  await prisma.reminder.deleteMany({ where: { studioId } });
  await prisma.payment.deleteMany({ where: { studioId } });
  await prisma.booking.deleteMany({ where: { studioId } });
  await prisma.workshopEvent.deleteMany({ where: { studioId } });
  await prisma.workshopTemplate.deleteMany({ where: { studioId } });
  await prisma.customer.deleteMany({ where: { studioId } });
  await prisma.studioMember.deleteMany({ where: { studioId } });
  await prisma.studio.deleteMany({ where: { id: studioId } });
}
