/**
 * Integration tests — Booking flow: create customer, create booking,
 * capacity enforcement, booking status updates
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getTestPrisma, disconnectTestPrisma } from "../helpers/prisma";
import {
  createTestStudio,
  createTestUser,
  createTestOwner,
  createTestEvent,
  createTestCustomer,
  cleanupStudio,
} from "../helpers/factories";
import {
  createBooking,
  updateBookingStatus,
  deleteBooking,
  createCustomer,
} from "@/services/bookings";

const prisma = getTestPrisma();

let studioId: string;
let userId: string;

beforeAll(async () => {
  const studio = await createTestStudio(prisma);
  const user = await createTestUser(prisma);
  await createTestOwner(prisma, studio.id, user.id);
  studioId = studio.id;
  userId = user.id;
});

afterAll(async () => {
  await cleanupStudio(prisma, studioId);
  await prisma.user.deleteMany({ where: { id: userId } });
  await disconnectTestPrisma();
});

describe("createCustomer", () => {
  it("creates a customer with full details", async () => {
    const customer = await createCustomer(
      prisma,
      studioId,
      "Alice Cohen",
      "alice@example.com",
      "050-1111111"
    );

    expect(customer.id).toBeDefined();
    expect(customer.name).toBe("Alice Cohen");
    expect(customer.email).toBe("alice@example.com");
    expect(customer.studioId).toBe(studioId);
  });

  it("creates a customer with name only", async () => {
    const customer = await createCustomer(prisma, studioId, "Bob Levi");
    expect(customer.name).toBe("Bob Levi");
    expect(customer.email).toBeNull();
  });
});

describe("createBooking", () => {
  it("creates a booking and returns ok with bookingId + paymentId", async () => {
    const customer = await createTestCustomer(prisma, studioId);
    const event = await createTestEvent(prisma, studioId, userId, {
      status: "open",
      minParticipants: 2,
      maxParticipants: 10,
      price: 150,
    });

    const result = await createBooking(prisma, studioId, event.id, {
      customerId: customer.id,
      participantCount: 2,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.bookingId).toBeDefined();
    expect(result.paymentId).toBeDefined();
  });

  it("creates a pending payment with correct amount", async () => {
    const customer = await createTestCustomer(prisma, studioId);
    const event = await createTestEvent(prisma, studioId, userId, {
      status: "open",
      maxParticipants: 10,
      price: 200,
    });

    const result = await createBooking(prisma, studioId, event.id, {
      customerId: customer.id,
      participantCount: 3,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const payment = await prisma.payment.findUnique({
      where: { id: result.paymentId },
    });
    expect(payment).not.toBeNull();
    expect(Number(payment!.amount)).toBe(600); // 200 × 3
    expect(payment!.status).toBe("pending");
  });

  it("recomputes event status after booking", async () => {
    const customer = await createTestCustomer(prisma, studioId);
    const event = await createTestEvent(prisma, studioId, userId, {
      status: "open",
      minParticipants: 2,
      maxParticipants: 5,
      price: 100,
    });

    await createBooking(prisma, studioId, event.id, {
      customerId: customer.id,
      participantCount: 3, // meets minimum
    });

    const updated = await prisma.workshopEvent.findUnique({
      where: { id: event.id },
    });
    expect(updated!.status).toBe("confirmed");
  });

  it("rejects booking when over capacity", async () => {
    const customer = await createTestCustomer(prisma, studioId);
    const event = await createTestEvent(prisma, studioId, userId, {
      status: "open",
      maxParticipants: 3,
      price: 100,
    });

    // Fill to capacity first
    await createBooking(prisma, studioId, event.id, {
      customerId: customer.id,
      participantCount: 3,
    });

    const customer2 = await createTestCustomer(prisma, studioId);
    const result = await createBooking(prisma, studioId, event.id, {
      customerId: customer2.id,
      participantCount: 1,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.message).toMatch(/capacity|spots|enough/i);
  });

  it("marks event as full when booking fills capacity", async () => {
    const customer = await createTestCustomer(prisma, studioId);
    const event = await createTestEvent(prisma, studioId, userId, {
      status: "open",
      minParticipants: 2,
      maxParticipants: 4,
      price: 100,
    });

    await createBooking(prisma, studioId, event.id, {
      customerId: customer.id,
      participantCount: 4,
    });

    const updated = await prisma.workshopEvent.findUnique({
      where: { id: event.id },
    });
    expect(updated!.status).toBe("full");
  });

  it("returns error for non-existent event", async () => {
    const customer = await createTestCustomer(prisma, studioId);
    const result = await createBooking(prisma, studioId, "non-existent-event", {
      customerId: customer.id,
      participantCount: 1,
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.message).toMatch(/not found/i);
  });
});

describe("updateBookingStatus", () => {
  it("cancels a booking and recomputes event status", async () => {
    const customer = await createTestCustomer(prisma, studioId);
    const event = await createTestEvent(prisma, studioId, userId, {
      status: "open",
      minParticipants: 2,
      maxParticipants: 10,
      price: 100,
    });

    const result = await createBooking(prisma, studioId, event.id, {
      customerId: customer.id,
      participantCount: 3, // triggers confirmed
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    await updateBookingStatus(
      prisma,
      result.bookingId,
      studioId,
      "cancelled",
      event.id
    );

    const booking = await prisma.booking.findUnique({
      where: { id: result.bookingId },
    });
    expect(booking!.status).toBe("cancelled");

    // Status should recompute back to open (no active bookings)
    const updatedEvent = await prisma.workshopEvent.findUnique({
      where: { id: event.id },
    });
    expect(updatedEvent!.status).toBe("open");
  });
});

describe("deleteBooking", () => {
  it("removes the booking record", async () => {
    const customer = await createTestCustomer(prisma, studioId);
    const event = await createTestEvent(prisma, studioId, userId, {
      status: "open",
      maxParticipants: 10,
      price: 100,
    });

    const result = await createBooking(prisma, studioId, event.id, {
      customerId: customer.id,
      participantCount: 1,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    await deleteBooking(prisma, result.bookingId, studioId, event.id);

    const booking = await prisma.booking.findUnique({
      where: { id: result.bookingId },
    });
    expect(booking).toBeNull();
  });
});
