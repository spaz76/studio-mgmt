import { prisma } from "@/lib/prisma";
import { getStudioId } from "@/lib/studio";
import { MessageTemplatesClient } from "./MessageTemplatesClient";

export const metadata = { title: "תבניות הודעות" };

export default async function MessageTemplatesPage() {
  const studioId = await getStudioId();
  const templates = await prisma.messageTemplate.findMany({
    where: { studioId, level: "studio" },
    orderBy: [{ type: "asc" }, { channel: "asc" }],
  });

  return <MessageTemplatesClient templates={templates} />;
}
