"use server";

import { prisma } from "@/lib/prisma";
import { getStudioId } from "@/lib/studio";
import { revalidatePath } from "next/cache";
import { recomputeEventStatus } from "@/services/workshop-events";
import { sendEmail, buildEventInviteEmail } from "@/services/email";
import { formatEventDate } from "@/lib/format-date";

export interface InviteResult {
  ok: boolean;
  error?: string;
  whatsappUrl?: string;
  registrationUrl?: string;
  emailSent?: boolean;
}

export async function inviteCustomerToEvent(
  eventId: string,
  customerId: string | null,
  newCustomer: { name: string; phone?: string; email?: string } | null,
  inviteChannel: string // "email", "whatsapp", "both"
): Promise<InviteResult> {
  const studioId = await getStudioId();

  // Fetch event + studio
  const [event, studio] = await Promise.all([
    prisma.workshopEvent.findFirst({
      where: { id: eventId, studioId },
      select: {
        id: true,
        title: true,
        description: true,
        startsAt: true,
        endsAt: true,
        price: true,
        maxParticipants: true,
        status: true,
        bookings: {
          where: { status: { in: ["confirmed", "pending"] } },
          select: { participantCount: true },
        },
        template: {
          select: { marketingText: true },
        },
      },
    }),
    prisma.studio.findUnique({
      where: { id: studioId },
      select: {
        slug: true,
        publicName: true,
        logoUrl: true,
        primaryColor: true,
        paymentUrl: true,
        inviteChannel: true,
      },
    }),
  ]);

  if (!event || !studio) {
    return { ok: false, error: "אירוע לא נמצא" };
  }

  if (event.status === "cancelled" || event.status === "completed") {
    return { ok: false, error: "ההרשמה לאירוע זה סגורה" };
  }

  const bookedCount = event.bookings.reduce((s, b) => s + b.participantCount, 0);
  if (bookedCount >= event.maxParticipants) {
    return { ok: false, error: "אין מקומות פנויים" };
  }

  // Resolve or create customer
  let customer: { id: string; name: string; phone?: string | null; email?: string | null };
  if (customerId) {
    const found = await prisma.customer.findFirst({
      where: { id: customerId, studioId },
      select: { id: true, name: true, phone: true, email: true },
    });
    if (!found) return { ok: false, error: "לקוח לא נמצא" };
    customer = found;
  } else if (newCustomer?.name) {
    // Find by phone/email or create
    let existing = null;
    if (newCustomer.phone || newCustomer.email) {
      existing = await prisma.customer.findFirst({
        where: {
          studioId,
          OR: [
            ...(newCustomer.phone ? [{ phone: newCustomer.phone }] : []),
            ...(newCustomer.email ? [{ email: newCustomer.email }] : []),
          ],
        },
        select: { id: true, name: true, phone: true, email: true },
      });
    }
    customer =
      existing ??
      (await prisma.customer.create({
        data: {
          studioId,
          name: newCustomer.name.trim(),
          phone: newCustomer.phone?.trim() || null,
          email: newCustomer.email?.trim() || null,
        },
        select: { id: true, name: true, phone: true, email: true },
      }));
  } else {
    return { ok: false, error: "נדרש לקוח" };
  }

  // Create booking
  await prisma.booking.create({
    data: {
      studioId,
      workshopEventId: eventId,
      customerId: customer.id,
      participantCount: 1,
      status: "confirmed",
    },
  });

  await recomputeEventStatus(prisma, eventId);
  revalidatePath(`/workshops/${eventId}`);

  // Build registration URL
  const registrationUrl = `${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/s/${studio.slug}/event/${eventId}`;

  // Determine channels to use
  const channel = inviteChannel || studio.inviteChannel || "both";

  // Send email (if channel includes email)
  let emailSent = false;
  if (
    (channel === "email" || channel === "both") &&
    customer.email
  ) {
    try {
      const { day, date, time } = formatEventDate(event.startsAt);
      const subject = `הזמנה ל${event.title} - ${studio.publicName}`;
      const html = buildEventInviteEmail({
        studioName: studio.publicName,
        logoUrl: studio.logoUrl,
        primaryColor: studio.primaryColor,
        eventTitle: event.title,
        eventDescription: event.template?.marketingText ?? event.description,
        eventDay: day,
        eventDate: date,
        eventTime: time,
        price: Number(event.price),
        registrationUrl,
      });
      await sendEmail(studioId, customer.email, subject, html);
      emailSent = true;
    } catch (emailErr) {
      console.error("[inviteCustomerToEvent] email send failed", emailErr);
    }
  }

  // Build WhatsApp URL (if channel includes whatsapp)
  let whatsappUrl: string | undefined;
  if ((channel === "whatsapp" || channel === "both") && customer.phone) {
    const phone = customer.phone.replace(/\D/g, "");
    const intlPhone = phone.startsWith("0") ? `972${phone.slice(1)}` : phone;
    const { day, date, time } = formatEventDate(event.startsAt);
    const message = encodeURIComponent(
      `היי ${customer.name}!\n` +
        `הוזמנת לסדנה "${event.title}"\n` +
        `📅 ${day}, ${date} בשעה ${time}\n` +
        (Number(event.price) > 0 ? `💰 ₪${Number(event.price).toFixed(0)}\n` : "") +
        `\nלאישור הרשמה ותשלום:\n${registrationUrl}`
    );
    whatsappUrl = `https://wa.me/${intlPhone}?text=${message}`;
  }

  return { ok: true, whatsappUrl, registrationUrl, emailSent };
}
