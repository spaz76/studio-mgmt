import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getStudioId } from "@/lib/studio";
import { buttonVariants } from "@/components/ui/button-variants";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  CalendarDays,
  Users,
  MapPin,
  Pencil,
  Plus,
  Clock,
  Banknote,
  Share2,
} from "lucide-react";
import { STATUS_LABELS, STATUS_VARIANTS } from "@/lib/workshop-status";
import { EventStatusControl } from "./EventStatusControl";
import { BookingRow } from "./BookingRow";
import { ShareButtons } from "@/components/ShareButtons";
import { InviteCustomerDialog } from "./InviteCustomerDialog";
import { BroadcastDialog } from "./BroadcastDialog";
import { PreviewModal } from "./PreviewModal";
import { formatEventDate } from "@/lib/format-date";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await prisma.workshopEvent.findUnique({
    where: { id },
    select: { title: true },
  });
  return { title: event?.title ?? "סדנה" };
}

function formatEndTime(date: Date) {
  return new Intl.DateTimeFormat("he-IL", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const studioId = await getStudioId();

  const [event, customers, studio, studioFull] = await Promise.all([
    prisma.workshopEvent.findFirst({
      where: { id, studioId },
      include: {
        template: {
          select: {
            name: true,
            marketingText: true,
            registrationUrl: true,
            images: { where: { isPrimary: true }, take: 1 },
          },
        },
        bookings: {
          orderBy: { createdAt: "asc" },
          include: {
            customer: true,
            payments: { orderBy: { createdAt: "desc" } },
            attendance: { select: { attended: true, punchCardId: true } },
          },
        },
      },
    }),
    prisma.customer.findMany({
      where: { studioId },
      select: { id: true, name: true, phone: true, email: true },
      orderBy: { name: "asc" },
    }),
    prisma.studio.findUnique({
      where: { id: studioId },
      select: { paymentUrl: true },
    }),
    prisma.studio.findUnique({
      where: { id: studioId },
      select: { inviteChannel: true, paymentUrl: true, slug: true, publicName: true },
    }),
  ]);

  if (!event) notFound();

  const activeBookings = event.bookings.filter(
    (b) => b.status !== "cancelled"
  );
  const bookedCount = activeBookings.reduce(
    (s, b) => s + b.participantCount,
    0
  );
  const spotsLeft = event.maxParticipants - bookedCount;

  const totalRevenue = event.bookings
    .filter((b) => b.status !== "cancelled")
    .flatMap((b) => b.payments)
    .filter((p) => p.status === "paid")
    .reduce((s, p) => s + Number(p.amount), 0);

  const totalPending = event.bookings
    .filter((b) => b.status !== "cancelled")
    .flatMap((b) => b.payments)
    .filter((p) => p.status === "pending")
    .reduce((s, p) => s + Number(p.amount), 0);

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold">{event.title}</h1>
            <Badge variant={STATUS_VARIANTS[event.status]}>
              {STATUS_LABELS[event.status]}
            </Badge>
          </div>
          {event.template && (
            <p className="text-sm text-muted-foreground">
              תבנית: {event.template.name}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href={`/workshops/${id}/edit`}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
            )}
          >
            <Pencil className="h-4 w-4 ml-1" />
            עריכה
          </Link>
          {studioFull?.slug && (
            <PreviewModal studioSlug={studioFull.slug} eventId={id} />
          )}
        </div>
      </div>

      {/* Event Info Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">פרטי האירוע</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-start gap-2">
            <CalendarDays className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
            <div className="space-y-2">
              {/* 3-cell date display */}
              {(() => {
                const { day, date, time } = formatEventDate(event.startsAt);
                return (
                  <div className="grid grid-cols-3 gap-2">
                    {[{ label: "יום", value: day }, { label: "תאריך", value: date }, { label: "שעה", value: time }].map(({ label, value }) => (
                      <div key={label} className="rounded-lg bg-muted px-2.5 py-1.5 text-center">
                        <div className="text-[10px] text-muted-foreground">{label}</div>
                        <div className="text-xs font-semibold">{value}</div>
                      </div>
                    ))}
                  </div>
                );
              })()}
              <div className="text-muted-foreground flex items-center gap-1 text-xs">
                <Clock className="h-3 w-3" />
                עד {formatEndTime(event.endsAt)}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground shrink-0" />
            <span>
              {bookedCount} / {event.maxParticipants} משתתפים
              {spotsLeft > 0 && (
                <span className="text-muted-foreground mr-1">
                  ({spotsLeft} מקומות נותרו)
                </span>
              )}
            </span>
          </div>
          {event.location && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
              <span>{event.location}</span>
            </div>
          )}
          {Number(event.price) > 0 && (
            <div className="flex items-center gap-2">
              <Banknote className="h-4 w-4 text-muted-foreground shrink-0" />
              <span>₪{Number(event.price).toFixed(0)} למשתתף</span>
            </div>
          )}
          {event.description && (
            <>
              <Separator />
              <p className="text-muted-foreground whitespace-pre-wrap">
                {event.description}
              </p>
            </>
          )}
          {event.notes && (
            <div className="rounded-md bg-muted p-3 text-muted-foreground">
              <strong className="text-foreground text-xs">
                הערות פנימיות:{" "}
              </strong>
              {event.notes}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Revenue Summary */}
      {(totalRevenue > 0 || totalPending > 0) && (
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="py-4">
              <div className="text-sm text-muted-foreground">שולם</div>
              <div className="text-2xl font-bold text-green-600">
                ₪{totalRevenue.toFixed(0)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4">
              <div className="text-sm text-muted-foreground">ממתין לתשלום</div>
              <div className="text-2xl font-bold text-orange-500">
                ₪{totalPending.toFixed(0)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Share Buttons */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Share2 className="h-4 w-4" />
            שיתוף
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ShareButtons
            name={event.title}
            marketingText={event.template?.marketingText || event.description}
            date={event.startsAt}
            time={new Intl.DateTimeFormat("he-IL", { hour: "2-digit", minute: "2-digit" }).format(event.startsAt)}
            registrationUrl={event.template?.registrationUrl}
            studioSlug={studioFull?.slug}
            eventId={id}
            imageUrl={event.template?.images?.[0]?.url}
            customers={customers}
          />
        </CardContent>
      </Card>

      {/* Status Control */}
      <EventStatusControl eventId={id} currentStatus={event.status} />

      {/* Bookings */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">הזמנות</CardTitle>
              <CardDescription>
                {activeBookings.length} הזמנות פעילות
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <BroadcastDialog
                eventTitle={event.title}
                participants={activeBookings.map((b) => ({
                  name: b.customer.name,
                  phone: b.customer.phone,
                }))}
              />
              {spotsLeft > 0 &&
                event.status !== "cancelled" &&
                event.status !== "completed" && (
                  <>
                    <InviteCustomerDialog
                      eventId={id}
                      customers={customers}
                      inviteChannel={studioFull?.inviteChannel}
                    />
                    <Link
                      href={`/workshops/${id}/bookings/new`}
                      className={buttonVariants({ variant: "default", size: "sm" })}
                    >
                      <Plus className="h-4 w-4 ml-1" />
                      הוסף הזמנה
                    </Link>
                  </>
                )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {event.bookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center px-4">
              <p className="text-muted-foreground text-sm mb-3">
                אין הזמנות עדיין
              </p>
              {event.status !== "cancelled" && (
                <Link
                  href={`/workshops/${id}/bookings/new`}
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  <Plus className="h-4 w-4 ml-1" />
                  הוסף הזמנה ראשונה
                </Link>
              )}
            </div>
          ) : (
            <div className="divide-y">
              {event.bookings.map((booking) => (
                <BookingRow
                  key={booking.id}
                  booking={booking}
                  eventId={id}
                  price={Number(event.price)}
                  paymentUrl={studio?.paymentUrl ?? undefined}
                  studioSlug={studioFull?.slug ?? ""}
                  studioName={studioFull?.publicName ?? ""}
                  eventTitle={event.title}
                  startsAt={event.startsAt}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
