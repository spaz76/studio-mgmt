import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getStudioId } from "@/lib/studio";
import { getMaterialById } from "@/services/materials";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Star, Phone, Globe } from "lucide-react";
import { StockUpdateForm } from "./StockUpdateForm";
import { AddSupplierForm } from "./AddSupplierForm";
import { updateMaterialAction } from "@/actions/materials";
import { MaterialForm } from "../MaterialForm";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const studioId = await getStudioId();
  const material = await prisma.material.findUnique({
    where: { id, studioId },
    select: { name: true },
  });
  return { title: material?.name ?? "חומר" };
}

const STATUS_LABEL: Record<string, string> = {
  green: "תקין",
  yellow: "מלאי נמוך",
  orange: "מלאי בינוני",
  red: "מלאי קריטי",
};

const STATUS_BADGE: Record<string, string> = {
  green: "border-green-300 text-green-700 bg-green-50",
  yellow: "border-yellow-300 text-yellow-700 bg-yellow-50",
  orange: "border-orange-300 text-orange-700 bg-orange-50",
  red: "border-red-300 text-red-700 bg-red-50",
};

const ACTION_LABEL: Record<string, string> = {
  ordered: "הוזמן",
  purchase: "התקבל",
  consumption: "צריכה",
  adjustment: "תיאום",
  loss: "אובדן",
};

const ACTION_COLOR: Record<string, string> = {
  ordered: "text-purple-700",
  purchase: "text-green-700",
  consumption: "text-blue-700",
  adjustment: "text-gray-700",
  loss: "text-red-700",
};

export default async function MaterialDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const studioId = await getStudioId();
  const [material, categories, studio] = await Promise.all([
    getMaterialById(prisma, studioId, id),
    prisma.category.findMany({
      where: { studioId },
      select: { id: true, name: true, parentId: true },
      orderBy: [{ parentId: "asc" }, { name: "asc" }],
    }),
    prisma.studio.findUnique({
      where: { id: studioId },
      select: { vatRate: true },
    }),
  ]);

  if (!material) notFound();

  const updateAction = updateMaterialAction.bind(null, id);

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/materials" className="hover:text-foreground">
          חומרים
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">{material.name}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">{material.name}</h1>
          {material.description && (
            <p className="text-muted-foreground mt-1">{material.description}</p>
          )}
        </div>
        <Badge variant="outline" className={STATUS_BADGE[material.stockStatus]}>
          {STATUS_LABEL[material.stockStatus]}
        </Badge>
      </div>

      {/* Stock info */}
      <div className="rounded-lg border p-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div>
          <p className="text-xs text-muted-foreground">מלאי נוכחי</p>
          <p className="text-2xl font-bold tabular-nums">
            {Number(material.stockQuantity).toLocaleString("he-IL")}
          </p>
          <p className="text-xs text-muted-foreground">{material.unit}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">סף מינימום</p>
          <p className="text-lg font-semibold tabular-nums text-yellow-600">
            {Number(material.lowStockThreshold).toLocaleString("he-IL")}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">סף כתום</p>
          <p className="text-lg font-semibold tabular-nums text-orange-600">
            {Number(material.orangeThreshold).toLocaleString("he-IL")}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">סף אדום</p>
          <p className="text-lg font-semibold tabular-nums text-red-600">
            {Number(material.redThreshold).toLocaleString("he-IL")}
          </p>
        </div>
      </div>

      {/* Extra info */}
      {(material.barcode || material.notes) && (
        <div className="rounded-lg border p-4 space-y-2 text-sm">
          {material.barcode && (
            <div className="flex gap-2">
              <span className="text-muted-foreground">ברקוד:</span>
              <span className="font-mono">{material.barcode}</span>
            </div>
          )}
          {material.notes && (
            <div className="flex gap-2">
              <span className="text-muted-foreground">הערות:</span>
              <span>{material.notes}</span>
            </div>
          )}
        </div>
      )}

      {/* Two columns: suppliers + stock update */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Suppliers */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">ספקים</h2>

          {material.materialSuppliers.length === 0 ? (
            <p className="text-sm text-muted-foreground">אין ספקים קשורים עדיין</p>
          ) : (
            <div className="rounded-md border divide-y">
              {material.materialSuppliers.map((ms) => (
                <div key={ms.id} className="px-4 py-3 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{ms.supplier.name}</span>
                      {ms.isPreferred && (
                        <Badge className="text-xs bg-amber-100 text-amber-800 border-amber-200 gap-1" variant="outline">
                          <Star className="h-3 w-3" />
                          מומלץ
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                      {ms.supplier.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {ms.supplier.phone}
                        </span>
                      )}
                      {ms.supplier.website && (
                        <a
                          href={ms.supplier.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 hover:text-foreground"
                        >
                          <Globe className="h-3 w-3" />
                          אתר
                        </a>
                      )}
                    </div>
                  </div>
                  {ms.pricePerUnit != null && (
                    <span className="text-sm font-medium shrink-0">
                      ₪{Number(ms.pricePerUnit).toFixed(2)} / {material.unit}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          <AddSupplierForm materialId={material.id} />
        </section>

        {/* Stock Update */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">עדכון מלאי</h2>
          <StockUpdateForm materialId={material.id} />
        </section>
      </div>

      {/* Stock history */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">היסטוריית מלאי</h2>
        {material.stockLogs.length === 0 ? (
          <p className="text-sm text-muted-foreground">אין פעולות מלאי עדיין</p>
        ) : (
          <div className="rounded-md border divide-y">
            {material.stockLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between gap-3 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`text-sm font-medium ${ACTION_COLOR[log.action] ?? "text-foreground"}`}
                  >
                    {ACTION_LABEL[log.action] ?? log.action}
                  </span>
                  {log.notes && (
                    <span className="text-xs text-muted-foreground">{log.notes}</span>
                  )}
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <span className="text-sm font-semibold tabular-nums">
                    {log.action === "purchase" ? "+" : log.action === "ordered" ? "~" : log.action === "adjustment" ? "=" : "-"}
                    {Number(log.quantity).toLocaleString("he-IL")} {material.unit}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(log.createdAt).toLocaleDateString("he-IL", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Edit form */}
      <section className="space-y-3 pt-2 border-t">
        <h2 className="text-lg font-semibold">עריכת פרטי החומר</h2>
        <MaterialForm
          action={updateAction}
          initialData={material}
          submitLabel="עדכן חומר"
          categories={categories}
          vatRate={Number(studio?.vatRate ?? 18)}
        />
      </section>
    </div>
  );
}
