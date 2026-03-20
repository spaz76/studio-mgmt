import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getStudioId } from "@/lib/studio";
import { createBooking } from "@/actions/bookings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { STATUS_LABELS, STATUS_VARIANTS } from "@/lib/workshop-status";
import { BookingForm } from "./BookingForm";
import type { BookingFormState } from "@/actions/bookings";

export const metadata = { title: "הוסף הזמנה" };

export default async function NewBookingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: eventId } = await params;
  const studioId = await getStudioId();

  const [event, customers] = await Promise.all([
    prisma.workshopEvent.findFirst({
      where: { id: eventId, studioId },
      include: {
        bookings: {
          where: { status: { in: ["confirmed", "pending"] } },
          select: { participantCount: true },
        },
      },
    }),
    prisma.customer.findMany({
      where: { studioId },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true, phone: true },
    }),
  ]);

  if (!event) notFound();

  const bookedCount = event.bookings.reduce(
    (s, b) => s + b.participantCount,
    0
  );
  const spotsLeft = event.maxParticipants - bookedCount;

  const boundAction = async (
    prev: BookingFormState,
    formData: FormData
  ): Promise<BookingFormState> => {
    "use server";
    return createBooking(eventId, prev, formData);
  };

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">הוסף הזמנה</h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{event.title}</span>
          <Badge variant={STATUS_VARIANTS[event.status]} className="text-xs">
            {STATUS_LABELS[event.status]}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {spotsLeft} מקומות פנויים מתוך {event.maxParticipants}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">פרטי ההזמנה</CardTitle>
        </CardHeader>
        <CardContent>
          <BookingForm
            action={boundAction}
            customers={customers}
            spotsLeft={spotsLeft}
            pricePerParticipant={Number(event.price)}
            studioId={studioId}
          />
        </CardContent>
      </Card>
    </div>
  );
}
