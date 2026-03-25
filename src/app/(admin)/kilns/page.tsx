import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getStudioId } from "@/lib/studio";
import { getKilnsList } from "@/services/kilns";
import { KilnsClient } from "./KilnsClient";

export const metadata = { title: "תנורים" };

export default async function KilnsPage() {
  const studioId = await getStudioId();
  const kilns = await getKilnsList(prisma, studioId);

  if (kilns.length === 1) {
    redirect(`/kilns/${kilns[0].id}`);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">תנורים</h1>
        <span className="text-sm text-muted-foreground">{kilns.length} תנורים</span>
      </div>
      <KilnsClient kilns={kilns} />
    </div>
  );
}
