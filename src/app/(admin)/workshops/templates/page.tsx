import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getStudioId } from "@/lib/studio";
import { buttonVariants } from "@/components/ui/button-variants";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { TemplatesClient } from "./TemplatesClient";

export const metadata = { title: "תבניות סדנאות" };

export default async function TemplatesPage() {
  const studioId = await getStudioId();

  const templates = await prisma.workshopTemplate.findMany({
    where: { studioId, isArchived: false },
    orderBy: [{ usageCount: "desc" }, { name: "asc" }],
    include: {
      _count: { select: { workshopEvents: true } },
      images: { where: { isPrimary: true }, take: 1 },
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">תבניות סדנאות</h1>
          <p className="text-muted-foreground text-sm mt-1">
            תבניות לשימוש חוזר ביצירת אירועי סדנה
          </p>
        </div>
        <Link
          href="/workshops/templates/new"
          className={buttonVariants({ variant: "default" })}
        >
          <Plus className="h-4 w-4 ml-1" />
          תבנית חדשה
        </Link>
      </div>

      {templates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground mb-4">
              אין תבניות סדנאות עדיין
            </p>
            <Link
              href="/workshops/templates/new"
              className={buttonVariants({ variant: "outline" })}
            >
              <Plus className="h-4 w-4 ml-1" />
              צור תבנית ראשונה
            </Link>
          </CardContent>
        </Card>
      ) : (
        <TemplatesClient templates={templates} />
      )}
    </div>
  );
}
