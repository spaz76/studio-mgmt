import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getStudioId } from "@/lib/studio";
import { buttonVariants } from "@/components/ui/button-variants";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, CalendarDays, Layers } from "lucide-react";
import { WorkshopsClient } from "./WorkshopsClient";

export const metadata = { title: "סדנאות" };

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
        <WorkshopsClient upcoming={upcoming} past={past} />
      )}
    </div>
  );
}
