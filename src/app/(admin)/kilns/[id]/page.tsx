import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getStudioId } from "@/lib/studio";
import { getKilnById } from "@/services/kilns";
import { buttonVariants } from "@/components/ui/button-variants";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Flame, Pencil, Thermometer, Package, List } from "lucide-react";
import { FiringStatusButton } from "./FiringStatusButton";
import { FiringTypeDialog } from "./FiringTypeDialog";
import { StartFiringDialog } from "./StartFiringDialog";
import { CooledAtButton } from "./CooledAtButton";
import { EditFiringTimesDialog } from "./EditFiringTimesDialog";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const kiln = await prisma.kiln.findUnique({
    where: { id },
    select: { name: true },
  });
  return { title: kiln?.name ?? "תנור" };
}

const KILN_TYPE_LABELS: Record<string, string> = {
  electric: "חשמלי",
  gas: "גז",
  wood: "עצים",
  raku: "ראקו",
};

const LOAD_LEVEL_LABELS: Record<string, string> = {
  quarter: "¼",
  half: "½",
  three_quarter: "¾",
  full: "מלא",
};

const FIRING_TYPE_LABELS: Record<string, string> = {
  bisque: "ביסקוויט",
  glaze: "גלזורה",
  raku: "ראקו",
  pit: "בור",
  custom: "מותאם",
};

type FiringStatus =
  | "planned"
  | "loading"
  | "firing"
  | "cooling"
  | "unloading"
  | "completed";

const FIRING_STATUS_LABELS: Record<FiringStatus, string> = {
  planned: "מתוכנן",
  loading: "טוען",
  firing: "שורף",
  cooling: "מתקרר",
  unloading: "פורק",
  completed: "הושלם",
};

function firingStatusBadge(status: string) {
  switch (status as FiringStatus) {
    case "planned":
      return (
        <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-200">
          מתוכנן
        </Badge>
      );
    case "loading":
      return (
        <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
          טוען
        </Badge>
      );
    case "firing":
      return (
        <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
          שורף
        </Badge>
      );
    case "cooling":
      return (
        <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
          מתקרר
        </Badge>
      );
    case "unloading":
      return (
        <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200">
          פורק
        </Badge>
      );
    case "completed":
      return (
        <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
          הושלם
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function kilnCurrentStatusBadge(firings: { status: string }[]) {
  const ACTIVE = ["loading", "firing", "cooling", "unloading"];
  const active = firings.find((f) => ACTIVE.includes(f.status));
  if (active) return firingStatusBadge(active.status);
  return (
    <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
      פנוי
    </Badge>
  );
}

function formatDate(date: Date | null | undefined) {
  if (!date) return null;
  return new Intl.DateTimeFormat("he-IL", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function formatDateShort(date: Date | null | undefined) {
  if (!date) return null;
  return new Intl.DateTimeFormat("he-IL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export default async function KilnDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const studioId = await getStudioId();
  const kiln = await getKilnById(prisma, studioId, id);

  if (!kiln) notFound();

  const activeFirings = kiln.firings.filter((f) =>
    ["loading", "firing", "cooling", "unloading"].includes(f.status)
  );

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Flame className="h-5 w-5 text-orange-500 shrink-0" />
            <h1 className="text-2xl font-bold">{kiln.name}</h1>
            {kilnCurrentStatusBadge(kiln.firings)}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {kiln.type && <span>{KILN_TYPE_LABELS[kiln.type] ?? kiln.type}</span>}
            {kiln.maxTemp && (
              <span className="flex items-center gap-1">
                <Thermometer className="h-3.5 w-3.5" />
                עד {kiln.maxTemp}°C
              </span>
            )}
            {kiln.capacity && (
              <span className="flex items-center gap-1">
                <Package className="h-3.5 w-3.5" />
                {kiln.capacity}
              </span>
            )}
            {!kiln.isActive && (
              <span className="text-red-500 font-medium">לא פעיל</span>
            )}
          </div>
        </div>
        <Link
          href={`/kilns/${id}/edit`}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "shrink-0"
          )}
        >
          <Pencil className="h-4 w-4 ml-1" />
          עריכה
        </Link>
      </div>

      {/* Active firings */}
      {activeFirings.length > 0 && (
        <Card className="border-orange-200 bg-orange-50/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-orange-700">שריפה פעילה</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeFirings.map((firing) => (
              <div key={firing.id} className="space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    {firingStatusBadge(firing.status)}
                    <span className="font-medium text-sm">
                      {FIRING_TYPE_LABELS[firing.firingType] ?? firing.firingType}
                    </span>
                    {firing.targetTemp && (
                      <span className="text-xs text-muted-foreground">
                        יעד: {firing.targetTemp}°C
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-wrap">
                    <div className="flex items-center gap-1 flex-wrap">
                      <FiringStatusButton
                        firingId={firing.id}
                        currentStatus={firing.status}
                      />
                      <EditFiringTimesDialog
                        firingId={firing.id}
                        startedAt={firing.startedAt?.toISOString() ?? null}
                        completedAt={firing.completedAt?.toISOString() ?? null}
                        estimatedEndAt={firing.estimatedEndAt?.toISOString() ?? null}
                      />
                    </div>
                    <EditFiringTimesDialog
                      firingId={firing.id}
                      startedAt={firing.startedAt?.toISOString() ?? null}
                      completedAt={firing.completedAt?.toISOString() ?? null}
                      estimatedEndAt={firing.estimatedEndAt?.toISOString() ?? null}
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                  {firing.startedAt && (
                    <span>התחיל: {formatDate(firing.startedAt)}</span>
                  )}
                  {firing.estimatedEndAt && (
                    <span>סיום משוער: {formatDate(firing.estimatedEndAt)}</span>
                  )}
                  {firing.loadLevel && (
                    <span>טעינה: {LOAD_LEVEL_LABELS[firing.loadLevel] ?? firing.loadLevel}</span>
                  )}
                </div>
                {firing.status === "cooling" && (
                  <CooledAtButton firingId={firing.id} cooledAt={firing.cooledAt} />
                )}
                {firing.notes && (
                  <p className="text-xs text-muted-foreground bg-white/60 rounded px-2 py-1">
                    {firing.notes}
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-3 flex-wrap">
        <FiringTypeDialog kilnId={kiln.id} />
        <StartFiringDialog kilnId={kiln.id} firingTypes={kiln.firingTypes} />
      </div>

      {/* Firing type programs */}
      {kiln.firingTypes.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <List className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">תוכניות שריפה</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {kiln.firingTypes.map((ft) => {
                const totalMins = ft.stages.reduce((s, st) => s + st.durationMinutes, 0);
                const h = Math.floor(totalMins / 60);
                const m = totalMins % 60;
                const durationLabel = totalMins > 0
                  ? `${h > 0 ? `${h} שע'` : ""}${m > 0 ? ` ${m} דק'` : ""}`.trim()
                  : "";
                return (
                  <div key={ft.id} className="px-4 py-3 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-sm">{ft.name}</span>
                      {durationLabel && (
                        <span className="text-xs text-muted-foreground">סה״כ: {durationLabel}</span>
                      )}
                    </div>
                    {ft.stages.length > 0 && (
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                        {ft.stages.map((stage, i) => {
                          const sh = Math.floor(stage.durationMinutes / 60);
                          const sm = stage.durationMinutes % 60;
                          const dur = sh > 0 ? `${sh}:${String(sm).padStart(2, "0")} שע'` : `${sm} דק'`;
                          return (
                            <span key={stage.id} className="text-xs text-muted-foreground">
                              שלב {i + 1}: {stage.targetTemp}°C · {dur}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Firings history */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">היסטוריית שריפות</CardTitle>
            <span className="text-xs text-muted-foreground">
              {kiln.firings.length} שריפות
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {kiln.firings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm px-4">
              אין שריפות עדיין
            </div>
          ) : (
            <div className="divide-y">
              {kiln.firings.map((firing) => (
                <div key={firing.id} className="px-4 py-3 space-y-1.5">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      {firingStatusBadge(firing.status)}
                      <span className="font-medium text-sm">
                        {FIRING_TYPE_LABELS[firing.firingType] ?? firing.firingType}
                      </span>
                    </div>
                    <FiringStatusButton
                      firingId={firing.id}
                      currentStatus={firing.status}
                    />
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                    {firing.targetTemp && (
                      <span>טמפרטורה יעד: {firing.targetTemp}°C</span>
                    )}
                    {firing.startedAt && (
                      <span>התחלה: {formatDateShort(firing.startedAt)}</span>
                    )}
                    {firing.completedAt && (
                      <span>סיום: {formatDateShort(firing.completedAt)}</span>
                    )}
                    {!firing.startedAt && !firing.completedAt && (
                      <span>תוכנן: {formatDateShort(firing.createdAt)}</span>
                    )}
                  </div>
                  {firing.status === "cooling" && (
                    <CooledAtButton firingId={firing.id} cooledAt={firing.cooledAt} />
                  )}
                  {firing.notes && (
                    <p className="text-xs text-muted-foreground bg-muted rounded px-2 py-1">
                      {firing.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Back link */}
      <div>
        <Link
          href="/kilns"
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
        >
          ← חזרה לתנורים
        </Link>
      </div>
    </div>
  );
}
