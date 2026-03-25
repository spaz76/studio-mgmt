import { prisma } from "@/lib/prisma";
import { getStudioId } from "@/lib/studio";
import { CalendarClient } from "./CalendarClient";

export const metadata = { title: "לוח שנה" };

export default async function CalendarPage() {
  const studioId = await getStudioId();

  // Fetch events for the current year ±1 month for navigation
  const events = await prisma.workshopEvent.findMany({
    where: { studioId },
    select: {
      id: true,
      title: true,
      startsAt: true,
      endsAt: true,
      template: { select: { workshopType: true } },
    },
    orderBy: { startsAt: "asc" },
  });

  const mapped = events.map((e) => ({
    id: e.id,
    title: e.title,
    startsAt: e.startsAt,
    endsAt: e.endsAt,
    workshopType: e.template?.workshopType ?? null,
  }));

  return <CalendarClient events={mapped} />;
}
