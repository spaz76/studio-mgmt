import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { getStudioId } from "@/lib/studio";
import { updateEvent } from "@/actions/workshop-events";
import { EventForm } from "../../EventForm";
import type { EventFormState } from "@/actions/workshop-events";

export const metadata = { title: "עריכת סדנה" };

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const studioId = await getStudioId();

  const event = await prisma.workshopEvent.findFirst({
    where: { id, studioId },
  });

  if (!event) notFound();

  const boundAction = async (
    prev: EventFormState,
    formData: FormData
  ): Promise<EventFormState> => {
    "use server";
    return updateEvent(id, prev, formData);
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">עריכת סדנה: {event.title}</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">פרטי האירוע</CardTitle>
        </CardHeader>
        <CardContent>
          <EventForm
            action={boundAction}
            initialData={event}
            submitLabel="שמור שינויים"
          />
        </CardContent>
      </Card>
    </div>
  );
}
