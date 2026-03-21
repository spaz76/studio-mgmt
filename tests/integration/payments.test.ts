/**
 * Integration tests — Payment status updates
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
import { createBooking, updatePaymentStatus } from "@/services/bookings";

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

async function createEventWithBooking(price = 150, participantCount = 2) {
  const customer = await createTestCustomer(prisma, studioId);
  const event = await createTestEvent(prisma, studioId, userId, {
    status: "open",
    maxParticipants: 10,
    price,
  });
  const result = await createBooking(prisma, studioId, event.id, {
    customerId: customer.id,
    participantCount,
  });
  if (!result.ok) throw new Error("Booking failed in test setup");
  return { eventId: event.id, bookingId: result.bookingId, paymentId: result.paymentId };
}

describe("updatePaymentStatus", () => {
  it("marks a payment as paid and sets paidAt", async () => {
    const { paymentId } = await createEventWithBooking();

    await updatePaymentStatus(prisma, paymentId, studioId, "paid");

    const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
    expect(payment!.status).toBe("paid");
    expect(payment!.paidAt).not.toBeNull();
  });

  it("clears paidAt when marking as refunded", async () => {
    const { paymentId } = await createEventWithBooking();

    // First mark as paid
    await updatePaymentStatus(prisma, paymentId, studioId, "paid");
    let payment = await prisma.payment.findUnique({ where: { id: paymentId } });
    expect(payment!.paidAt).not.toBeNull();

    // Then refund — paidAt should be cleared
    await updatePaymentStatus(prisma, paymentId, studioId, "refunded");
    payment = await prisma.payment.findUnique({ where: { id: paymentId } });
    expect(payment!.status).toBe("refunded");
    expect(payment!.paidAt).toBeNull();
  });

  it("marks a payment as partial", async () => {
    const { paymentId } = await createEventWithBooking();

    await updatePaymentStatus(prisma, paymentId, studioId, "partial");

    const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
    expect(payment!.status).toBe("partial");
    expect(payment!.paidAt).toBeNull();
  });

  it("marks a payment as cancelled", async () => {
    const { paymentId } = await createEventWithBooking();

    await updatePaymentStatus(prisma, paymentId, studioId, "cancelled");

    const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
    expect(payment!.status).toBe("cancelled");
  });

  it("does not update payment from another studio (tenant isolation)", async () => {
    const { paymentId } = await createEventWithBooking();

    await updatePaymentStatus(prisma, paymentId, "other-studio-id", "paid");

    const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
    expect(payment!.status).toBe("pending"); // unchanged
  });

  it("initial payment amount is price × participantCount", async () => {
    const { paymentId } = await createEventWithBooking(200, 3);

    const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
    expect(Number(payment!.amount)).toBe(600); // 200 × 3
    expect(payment!.status).toBe("pending");
  });
});
