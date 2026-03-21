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
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Plus, CalendarDays, Users, MapPin, Layers } from "lucide-react";
import { STATUS_LABELS, STATUS_VARIANTS } from "@/lib/workshop-status";

export const metadata = { title: "סדנאות" };

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("he-IL", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default async function WorkshopsPage() {
  const studioId = await getStudioId();

  const events = await prisma.workshopEvent.findMany({
    where: { studioId },
    orderBy: { startsAt: "desc" },
    include: {
      template: { select: { name: true } },
      bookings: {
        where: { status: { in: ["confirmed", "pending"] } },
        select: { participantCount: true },
      },
      _count: { select: { bookings: true } },
    },
  });

  const upcoming = events.filter(
    (e) =>
      e.startsAt > new Date() &&
      !["cancelled", "postponed", "completed"].includes(e.status)
  );
  const past = events.filter(
    (e) =>
      e.startsAt <= new Date() ||
      ["cancelled", "postponed", "completed"].includes(e.status)
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">סדנאות</h1>
          <p className="text-muted-foreground text-sm mt-1">
            ניהול אירועי סדנה והזמנות
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/workshops/templates"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <Layers className="h-4 w-4 ml-1" />
            תבניות
          </Link>
          <Link
            href="/workshops/new"
            className={buttonVariants({ variant: "default" })}
          >
            <Plus className="h-4 w-4 ml-1" />
            סדנה חדשה
          </Link>
        </div>
      </div>

      {events.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <CalendarDays className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground mb-4">אין אירועי סדנה עדיין</p>
            <div className="flex gap-2">
              <Link
                href="/workshops/templates"
                className={buttonVariants({ variant: "outline" })}
              >
                <Layers className="h-4 w-4 ml-1" />
                נהל תבניות
              </Link>
              <Link
                href="/workshops/new"
                className={buttonVariants({ variant: "default" })}
              >
                <Plus className="h-4 w-4 ml-1" />
                צור סדנה ראשונה
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {upcoming.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-3">קרובות</h2>
              <EventGrid events={upcoming} />
            </section>
          )}
          {past.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-3 text-muted-foreground">
                עבר / מבוטל
              </h2>
              <EventGrid events={past} muted />
            </section>
          )}
        </div>
      )}
    </div>
  );
}

type EventWithRelations = {
  id: string;
  title: string;
  startsAt: Date;
  endsAt: Date;
  status: import("@/generated/prisma").WorkshopStatus;
  maxParticipants: number;
  minParticipants: number;
  price: { toString(): string } | string | number;
  location: string | null;
  template: { name: string } | null;
  bookings: { participantCount: number }[];
};

function EventGrid({
  events,
  muted,
}: {
  events: EventWithRelations[];
  muted?: boolean;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {events.map((e) => {
        const booked = e.bookings.reduce((s, b) => s + b.participantCount, 0);
        const spotsLeft = e.maxParticipants - booked;

        return (
          <Link key={e.id} href={`/workshops/${e.id}`}>
            <Card
              className={cn(
                "hover:border-primary/50 hover:shadow-sm transition-all cursor-pointer h-full",
                muted && "opacity-70"
              )}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base leading-tight">
                    {e.title}
                  </CardTitle>
                  <Badge
                    variant={STATUS_VARIANTS[e.status]}
                    className="text-xs shrink-0"
                  >
                    {STATUS_LABELS[e.status]}
                  </Badge>
                </div>
                {e.template && (
                  <p className="text-xs text-muted-foreground">
                    {e.template.name}
                  </p>
                )}
              </CardHeader>
              <CardContent className="pt-0 space-y-1.5 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5" />
                  <span>{formatDate(e.startsAt)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" />
                  <span>
                    {booked}/{e.maxParticipants} משתתפים
                    {spotsLeft > 0 && spotsLeft <= 3 && (
                      <span className="text-orange-500 mr-1">
                        ({spotsLeft} מקומות נותרו)
                      </span>
                    )}
                  </span>
                </div>
                {e.location && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" />
                    <span className="truncate">{e.location}</span>
                  </div>
                )}
                {Number(e.price) > 0 && (
                  <div className="font-medium text-foreground">
                    ₪{Number(e.price).toFixed(0)} למשתתף
                  </div>
                )}
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
