import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { EventRegistrationPage } from "./EventRegistrationPage";
import { formatEventDate } from "@/lib/format-date";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ studioSlug: string; eventId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { studioSlug, eventId } = await params;

  const [event, studio] = await Promise.all([
    prisma.workshopEvent.findUnique({
      where: { id: eventId },
      select: {
        title: true,
        description: true,
        template: {
          select: {
            images: { where: { isPrimary: true }, select: { url: true }, take: 1 },
          },
        },
      },
    }),
    prisma.studio.findUnique({
      where: { slug: studioSlug },
      select: { publicName: true, logoUrl: true },
    }),
  ]);

  const title = event?.title ?? "הרשמה לסדנה";
  const description = event?.description ?? `הירשם לסדנה של ${studio?.publicName ?? ""}`;
  const imageUrl = event?.template?.images?.[0]?.url ?? studio?.logoUrl ?? undefined;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: imageUrl ? [{ url: imageUrl, width: 1200, height: 630, alt: title }] : undefined,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: imageUrl ? [imageUrl] : undefined,
    },
  };
}

export default async function PublicEventPage({ params }: PageProps) {
  const { studioSlug, eventId } = await params;

  const studio = await prisma.studio.findUnique({
    where: { slug: studioSlug },
    select: {
      id: true,
      publicName: true,
      logoUrl: true,
      primaryColor: true,
      paymentUrl: true,
      contactEmail: true,
      contactPhone: true,
    },
  });

  if (!studio) notFound();

  const event = await prisma.workshopEvent.findFirst({
    where: { id: eventId, studioId: studio.id },
    select: {
      id: true,
      title: true,
      description: true,
      startsAt: true,
      endsAt: true,
      price: true,
      maxParticipants: true,
      status: true,
      template: {
        select: {
          marketingText: true,
          images: {
            where: { isPrimary: true },
            select: { url: true },
            take: 1,
          },
        },
      },
      bookings: {
        where: { status: { in: ["confirmed", "pending"] } },
        select: { participantCount: true },
      },
    },
  });

  if (!event) notFound();

  const bookedCount = event.bookings.reduce(
    (s, b) => s + b.participantCount,
    0
  );

  const { day, date, time } = formatEventDate(event.startsAt);

  return (
    <EventRegistrationPage
      event={{
        id: event.id,
        title: event.title,
        description: event.description,
        startsAt: event.startsAt,
        endsAt: event.endsAt,
        price: Number(event.price),
        maxParticipants: event.maxParticipants,
        bookedCount,
        imageUrl: event.template?.images?.[0]?.url ?? null,
        marketingText: event.template?.marketingText ?? null,
      }}
      studio={{
        publicName: studio.publicName,
        logoUrl: studio.logoUrl,
        primaryColor: studio.primaryColor,
        paymentUrl: studio.paymentUrl,
        contactEmail: studio.contactEmail,
        contactPhone: studio.contactPhone,
      }}
      day={day}
      date={date}
      time={time}
    />
  );
}
