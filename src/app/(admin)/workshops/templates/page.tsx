import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getStudioId } from "@/lib/studio";
import { buttonVariants } from "@/components/ui/button-variants";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Plus, Clock, Users, Pencil } from "lucide-react";
import { DeleteTemplateButton } from "./DeleteTemplateButton";

export const metadata = { title: "תבניות סדנאות" };

export default async function TemplatesPage() {
  const studioId = await getStudioId();

  const templates = await prisma.workshopTemplate.findMany({
    where: { studioId },
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { workshopEvents: true } } },
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => (
            <Card key={t.id} className={t.isActive ? "" : "opacity-60"}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base leading-tight">
                    {t.name}
                  </CardTitle>
                  <div className="flex gap-1 shrink-0">
                    {!t.isActive && (
                      <Badge variant="outline" className="text-xs">
                        לא פעיל
                      </Badge>
                    )}
                    <Badge variant="secondary" className="text-xs">
                      {t._count.workshopEvents} אירועים
                    </Badge>
                  </div>
                </div>
                {t.description && (
                  <CardDescription className="text-sm line-clamp-2">
                    {t.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-4">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {t.durationMinutes} דקות
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {t.minParticipants}–{t.maxParticipants} משתתפים
                  </span>
                  {Number(t.defaultPrice) > 0 && (
                    <span>₪{Number(t.defaultPrice).toFixed(0)}</span>
                  )}
                </div>
                {t.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {t.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <Link
                    href={`/workshops/templates/${t.id}/edit`}
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                      "flex-1"
                    )}
                  >
                    <Pencil className="h-3.5 w-3.5 ml-1" />
                    עריכה
                  </Link>
                  <Link
                    href={`/workshops/new?templateId=${t.id}`}
                    className={cn(
                      buttonVariants({ variant: "default", size: "sm" }),
                      "flex-1"
                    )}
                  >
                    <Plus className="h-3.5 w-3.5 ml-1" />
                    צור אירוע
                  </Link>
                </div>
                <div className="mt-2">
                  <DeleteTemplateButton id={t.id} name={t.name} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
