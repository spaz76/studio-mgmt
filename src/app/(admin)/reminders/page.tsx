import { prisma } from "@/lib/prisma";
import { getStudioId } from "@/lib/studio";
import { getReminders, getOpenRemindersCount } from "@/services/reminders";
import { RemindersClient } from "./RemindersClient";

export const metadata = { title: "תזכורות" };

export default async function RemindersPage() {
  const studioId = await getStudioId();
  const [reminders, openCount] = await Promise.all([
    getReminders(prisma, studioId),
    getOpenRemindersCount(prisma, studioId),
  ]);

  return <RemindersClient reminders={reminders} openCount={openCount} />;
}
