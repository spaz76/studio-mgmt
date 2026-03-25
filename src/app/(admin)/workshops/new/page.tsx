import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { getStudioId } from "@/lib/studio";
import { createEvent } from "@/actions/workshop-events";
import { EventForm } from "../EventForm";
import type { EventFormState } from "@/actions/workshop-events";

export const metadata = { title: "סדנה חדשה" };

export default async function NewEventPage({
  searchParams,
}: {
  searchParams: Promise<{ templateId?: string }>;
}) {
  const { templateId } = await searchParams;
  const studioId = await getStudioId();

  const template = templateId
    ? await prisma.workshopTemplate.findFirst({
        where: { id: templateId, studioId },
      })
    : null;

  const templates = await prisma.workshopTemplate.findMany({
    where: { studioId, isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  const boundAction = async (
    prev: EventFormState,
    formData: FormData
  ): Promise<EventFormState> => {
    "use server";
    return createEvent(prev, formData);
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-2">סדנה חדשה</h1>
      {template && (
        <p className="text-muted-foreground text-sm mb-6">
          מבוסס על תבנית: {template.name}
        </p>
      )}
      {!template && (
        <p className="text-muted-foreground text-sm mb-6">
          {templates.length > 0 ? (
            <>
              טיפ: תוכל{" "}
              <Link
                href="/workshops/templates"
                className="underline hover:no-underline"
              >
                לבחור תבנית
              </Link>{" "}
              כדי למלא ערכי ברירת מחדל
            </>
          ) : (
            "מלא את פרטי הסדנה"
          )}
        </p>
      )}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">פרטי האירוע</CardTitle>
        </CardHeader>
        <CardContent>
          <EventForm
            action={boundAction}
            template={template}
            submitLabel="צור סדנה"
          />
        </CardContent>
      </Card>
    </div>
  );
}
