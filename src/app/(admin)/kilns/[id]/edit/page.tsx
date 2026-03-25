import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getStudioId } from "@/lib/studio";
import { KilnForm } from "../../KilnForm";

export const metadata = { title: "עריכת תנור" };

export default async function EditKilnPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const studioId = await getStudioId();
  const kiln = await prisma.kiln.findFirst({
    where: { id, studioId },
  });

  if (!kiln) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">עריכת תנור</h1>
        <p className="text-sm text-muted-foreground mt-1">{kiln.name}</p>
      </div>
      <KilnForm kiln={kiln} />
    </div>
  );
}
