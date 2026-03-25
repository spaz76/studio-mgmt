import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PublicStudioPage } from "./PublicStudioPage";

interface PageProps {
  params: Promise<{ studioSlug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { studioSlug } = await params;
  const studio = await prisma.studio.findUnique({
    where: { slug: studioSlug },
    select: { publicName: true },
  });
  if (!studio) return { title: "סטודיו לא נמצא" };
  return { title: studio.publicName };
}

export default async function PublicStudioSlugPage({ params }: PageProps) {
  const { studioSlug } = await params;

  const studio = await prisma.studio.findUnique({
    where: { slug: studioSlug },
    select: {
      id: true,
      name: true,
      publicName: true,
      slug: true,
      logoUrl: true,
      primaryColor: true,
      secondaryColor: true,
      contactEmail: true,
      contactPhone: true,
      websiteUrl: true,
      facebookUrl: true,
      instagramUrl: true,
      phoneNumber: true,
      whatsappNumber: true,
      fontFamily: true,
    },
  });

  if (!studio) {
    notFound();
  }

  const now = new Date();

  const [events, products] = await Promise.all([
    // Upcoming open workshops
    prisma.workshopEvent.findMany({
      where: {
        studioId: studio.id,
        status: { in: ["open", "confirmed", "pending_minimum"] },
        startsAt: { gt: now },
      },
      select: {
        id: true,
        title: true,
        startsAt: true,
        endsAt: true,
        status: true,
        price: true,
        maxParticipants: true,
        template: {
          select: {
            registrationUrl: true,
            images: {
              where: { isPrimary: true },
              select: { url: true, alt: true },
              take: 1,
            },
          },
        },
        bookings: {
          where: { status: { in: ["confirmed", "pending"] } },
          select: { participantCount: true },
        },
      },
      orderBy: { startsAt: "asc" },
    }),

    // Active products with active variants
    prisma.product.findMany({
      where: { studioId: studio.id, isActive: true },
      select: {
        id: true,
        name: true,
        imageUrl: true,
        category: true,
        variants: {
          where: { isActive: true },
          select: { price: true, stockQuantity: true },
          orderBy: { price: "asc" },
          take: 1,
        },
      },
      take: 6,
    }),
  ]);

  const primaryColor = studio.primaryColor ?? "#6366f1";
  const secondaryColor = studio.secondaryColor ?? "#a5b4fc";

  return (
    <div
      style={
        {
          "--studio-primary": primaryColor,
          "--studio-secondary": secondaryColor,
          fontFamily: studio.fontFamily ?? undefined,
        } as React.CSSProperties
      }
    >
      <PublicStudioPage studio={studio} events={events} products={products} />
    </div>
  );
}
