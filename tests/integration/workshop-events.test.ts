/**
 * Integration tests — WorkshopEvent creation and status transitions
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getTestPrisma, disconnectTestPrisma } from "../helpers/prisma";
import {
  createTestStudio,
  createTestUser,
  createTestOwner,
  createTestTemplate,
  createTestEvent,
  cleanupStudio,
} from "../helpers/factories";
import {
  createEvent,
  updateEvent,
  updateEventStatus,
  deleteEvent,
  getEvent,
  recomputeEventStatus,
} from "@/services/workshop-events";

const prisma = getTestPrisma();

let studioId: string;
let userId: string;
let templateId: string;

beforeAll(async () => {
  const studio = await createTestStudio(prisma);
  const user = await createTestUser(prisma);
  await createTestOwner(prisma, studio.id, user.id);
  const template = await createTestTemplate(prisma, studio.id);
  studioId = studio.id;
  userId = user.id;
  templateId = template.id;
});

afterAll(async () => {
  await cleanupStudio(prisma, studioId);
  await prisma.user.deleteMany({ where: { id: userId } });
  await disconnectTestPrisma();
});

describe("createEvent", () => {
  it("creates an event with default open status", async () => {
    const event = await createEvent(prisma, studioId, userId, {
      title: "Spring Pottery",
      startsAt: new Date("2026-06-01T10:00:00Z"),
      endsAt: new Date("2026-06-01T12:00:00Z"),
      minParticipants: 4,
      maxParticipants: 10,
      price: 150,
    });

    expect(event.id).toBeDefined();
    expect(event.title).toBe("Spring Pottery");
    expect(event.status).toBe("open");
    expect(event.studioId).toBe(studioId);
    expect(event.createdById).toBe(userId);
  });

  it("creates an event linked to a template", async () => {
    const event = await createEvent(prisma, studioId, userId, {
      title: "Templated Event",
      startsAt: new Date("2026-07-01T10:00:00Z"),
      endsAt: new Date("2026-07-01T12:00:00Z"),
      templateId,
    });

    expect(event.templateId).toBe(templateId);
  });

  it("creates an event with explicit status", async () => {
    const event = await createEvent(prisma, studioId, userId, {
      title: "Open Event",
      startsAt: new Date("2026-08-01T10:00:00Z"),
      endsAt: new Date("2026-08-01T12:00:00Z"),
      status: "open",
    });

    expect(event.status).toBe("open");
  });
});

describe("updateEvent", () => {
  it("updates event title and price", async () => {
    const event = await createTestEvent(prisma, studioId, userId);

    await updateEvent(prisma, event.id, studioId, {
      title: "Updated Title",
      price: 200,
    });

    const updated = await getEvent(prisma, event.id, studioId);
    expect(updated!.title).toBe("Updated Title");
    expect(Number(updated!.price)).toBe(200);
  });

  it("enforces tenant isolation on update", async () => {
    const event = await createTestEvent(prisma, studioId, userId, {
      title: "Immutable",
    });

    await updateEvent(prisma, event.id, "other-studio", {
      title: "Hacked",
    });

    const unchanged = await getEvent(prisma, event.id, studioId);
    expect(unchanged!.title).toBe("Immutable");
  });
});

describe("updateEventStatus", () => {
  const manualStatuses = [
    "cancelled",
    "postponed",
    "completed",
    "confirmed",
  ] as const;

  for (const status of manualStatuses) {
    it(`manually sets status to ${status}`, async () => {
      const event = await createTestEvent(prisma, studioId, userId);
      await updateEventStatus(prisma, event.id, studioId, status);
      const updated = await getEvent(prisma, event.id, studioId);
      expect(updated!.status).toBe(status);
    });
  }
});

describe("recomputeEventStatus", () => {
  it("stays draft when event is in draft state", async () => {
    const event = await createTestEvent(prisma, studioId, userId, {
      status: "draft",
      minParticipants: 2,
      maxParticipants: 5,
    });

    await recomputeEventStatus(prisma, event.id);

    const result = await prisma.workshopEvent.findUnique({ where: { id: event.id } });
    expect(result!.status).toBe("draft");
  });

  it("transitions open→pending_minimum when bookings exist but below min", async () => {
    const customer = await prisma.customer.create({
      data: { studioId, name: "Test Customer" },
    });
    const event = await createTestEvent(prisma, studioId, userId, {
      status: "open",
      minParticipants: 4,
      maxParticipants: 10,
    });

    await prisma.booking.create({
      data: {
        studioId,
        workshopEventId: event.id,
        customerId: customer.id,
        participantCount: 2,
        status: "confirmed",
      },
    });

    await recomputeEventStatus(prisma, event.id);

    const result = await prisma.workshopEvent.findUnique({ where: { id: event.id } });
    expect(result!.status).toBe("pending_minimum");
  });

  it("transitions to confirmed when at minimum", async () => {
    const customer = await prisma.customer.create({
      data: { studioId, name: "Test Customer 2" },
    });
    const event = await createTestEvent(prisma, studioId, userId, {
      status: "open",
      minParticipants: 3,
      maxParticipants: 10,
    });

    await prisma.booking.create({
      data: {
        studioId,
        workshopEventId: event.id,
        customerId: customer.id,
        participantCount: 3,
        status: "confirmed",
      },
    });

    await recomputeEventStatus(prisma, event.id);

    const result = await prisma.workshopEvent.findUnique({ where: { id: event.id } });
    expect(result!.status).toBe("confirmed");
  });

  it("transitions to full when at capacity", async () => {
    const customer = await prisma.customer.create({
      data: { studioId, name: "Test Customer 3" },
    });
    const event = await createTestEvent(prisma, studioId, userId, {
      status: "open",
      minParticipants: 2,
      maxParticipants: 4,
    });

    await prisma.booking.create({
      data: {
        studioId,
        workshopEventId: event.id,
        customerId: customer.id,
        participantCount: 4,
        status: "confirmed",
      },
    });

    await recomputeEventStatus(prisma, event.id);

    const result = await prisma.workshopEvent.findUnique({ where: { id: event.id } });
    expect(result!.status).toBe("full");
  });

  it("does not transition cancelled/postponed/completed events", async () => {
    const terminalStatuses = ["cancelled", "postponed", "completed"] as const;

    for (const status of terminalStatuses) {
      const event = await createTestEvent(prisma, studioId, userId, { status });
      await recomputeEventStatus(prisma, event.id);
      const result = await prisma.workshopEvent.findUnique({ where: { id: event.id } });
      expect(result!.status).toBe(status);
    }
  });
});

describe("deleteEvent", () => {
  it("deletes an event", async () => {
    const event = await createTestEvent(prisma, studioId, userId);
    await deleteEvent(prisma, event.id, studioId);
    const result = await getEvent(prisma, event.id, studioId);
    expect(result).toBeNull();
  });
});
