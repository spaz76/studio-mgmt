import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recomputeEventStatus } from "@/services/workshop-events";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { eventId, name, phone, email, waitlist } = body as {
      eventId?: string;
      name?: string;
      phone?: string;
      email?: string;
      waitlist?: boolean;
    };

    if (!eventId || !name) {
      return NextResponse.json(
        { error: "eventId ו-name הם שדות חובה" },
        { status: 400 }
      );
    }

    const event = await prisma.workshopEvent.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        studioId: true,
        status: true,
        maxParticipants: true,
        studio: {
          select: { paymentUrl: true },
        },
        bookings: {
          where: { status: { in: ["confirmed", "pending"] } },
          select: { participantCount: true },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: "האירוע לא נמצא" }, { status: 404 });
    }

    if (event.status === "cancelled" || event.status === "completed") {
      return NextResponse.json({ error: "ההרשמה לאירוע זה סגורה" }, { status: 400 });
    }

    const bookedCount = event.bookings.reduce(
      (s, b) => s + b.participantCount,
      0
    );
    const isFull = bookedCount >= event.maxParticipants;

    if (isFull && !waitlist) {
      return NextResponse.json({ error: "אין מקומות פנויים" }, { status: 400 });
    }

    const studioId = event.studioId;

    // Find or create customer
    let customer = null;
    if (phone || email) {
      customer = await prisma.customer.findFirst({
        where: {
          studioId,
          OR: [
            ...(phone ? [{ phone }] : []),
            ...(email ? [{ email }] : []),
          ],
        },
      });
    }

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          studioId,
          name: name.trim(),
          phone: phone?.trim() || null,
          email: email?.trim() || null,
        },
      });
    }

    const bookingStatus = isFull ? "waitlist" : "confirmed";

    await prisma.booking.create({
      data: {
        studioId,
        workshopEventId: eventId,
        customerId: customer.id,
        participantCount: 1,
        status: bookingStatus,
      },
    });

    await recomputeEventStatus(prisma, eventId);

    return NextResponse.json({
      success: true,
      waitlisted: bookingStatus === "waitlist",
      paymentUrl: bookingStatus === "confirmed" ? (event.studio.paymentUrl ?? undefined) : undefined,
    });
  } catch (err) {
    console.error("[register-event]", err);
    return NextResponse.json({ error: "שגיאת שרת" }, { status: 500 });
  }
}
