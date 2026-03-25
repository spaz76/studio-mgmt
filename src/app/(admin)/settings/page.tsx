import { prisma } from "@/lib/prisma";
import { getStudioId } from "@/lib/studio";
import { SettingsForm } from "./SettingsForm";

export const metadata = { title: "הגדרות סטודיו" };

export default async function SettingsPage() {
  const studioId = await getStudioId();
  const [studio, googleIntegration] = await Promise.all([
    prisma.studio.findUnique({ where: { id: studioId } }),
    prisma.studioIntegration.findUnique({
      where: { studioId_provider: { studioId, provider: "google_calendar" } },
    }),
  ]);

  if (!studio) return null;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">הגדרות סטודיו</h1>
        <p className="text-sm text-muted-foreground mt-1">
          מיתוג, פרטי קשר וקישורים
        </p>
      </div>
      <SettingsForm studio={studio} googleCalendarConnected={googleIntegration?.enabled ?? false} />
    </div>
  );
}
