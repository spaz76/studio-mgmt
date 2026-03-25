import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getStudioId } from "@/lib/studio";
import { getCustomerById } from "@/services/customers";
import { CustomerDetailClient } from "./CustomerDetailClient";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const studioId = await getStudioId();
  const customer = await prisma.customer.findUnique({
    where: { id, studioId },
    select: { name: true },
  });
  return { title: customer?.name ?? "לקוח" };
}

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const studioId = await getStudioId();

  const [customer, punchCards, availableWorkshops, templates] = await Promise.all([
    getCustomerById(prisma, studioId, id),
    prisma.punchCard.findMany({
      where: { customerId: id, studioId },
      include: { template: { select: { name: true } } },
      orderBy: { purchasedAt: "desc" },
    }),
    prisma.workshopEvent.findMany({
      where: {
        studioId,
        status: { in: ["open", "confirmed", "pending_minimum"] },
        startsAt: { gte: new Date() },
      },
      select: { id: true, title: true, startsAt: true, status: true, maxParticipants: true },
      orderBy: { startsAt: "asc" },
      take: 20,
    }),
    prisma.workshopTemplate.findMany({
      where: { studioId, isActive: true, isArchived: false },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!customer) notFound();

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/customers" className="hover:text-foreground">
          לקוחות
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">{customer.name}</span>
      </div>

      <CustomerDetailClient
        customer={{ ...customer, punchCards }}
        availableWorkshops={availableWorkshops}
        templates={templates}
      />
    </div>
  );
}
