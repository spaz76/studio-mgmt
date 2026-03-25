import { prisma } from "@/lib/prisma";
import { getStudioId } from "@/lib/studio";
import { getShoppingList } from "@/services/materials";
import { MarkPurchasedButton } from "./MarkPurchasedButton";
import Link from "next/link";
import { ChevronRight, Info } from "lucide-react";

export const metadata = { title: "רשימת קניות" };

export default async function ShoppingListPage() {
  const studioId = await getStudioId();
  const items = await getShoppingList(prisma, studioId);

  const totalEstimated = items.reduce((sum, item) => {
    const pricePerUnit = item.preferredSupplier?.pricePerUnit
      ? Number(item.preferredSupplier.pricePerUnit)
      : null;
    const needed = Math.max(
      0,
      Number(item.lowStockThreshold) - Number(item.stockQuantity)
    );
    return sum + (pricePerUnit != null ? pricePerUnit * needed : 0);
  }, 0);

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/materials" className="hover:text-foreground">
          חומרים
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">רשימת קניות</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">רשימת קניות</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {items.length} פריטים מתחת לסף המינימום
          </p>
        </div>
        {totalEstimated > 0 && (
          <div className="text-left">
            <p className="text-xs text-muted-foreground">עלות משוערת</p>
            <p className="text-xl font-bold">₪{totalEstimated.toFixed(2)}</p>
          </div>
        )}
      </div>

      {/* Manual note */}
      <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
        <Info className="h-4 w-4 mt-0.5 shrink-0" />
        <span>
          ניתן להוסיף פריטים לרשימת הקניות ידנית על ידי הוספת חומר חדש עם כמות מלאי נמוכה מהסף.
        </span>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg">המלאי תקין!</p>
          <p className="text-sm mt-1">אין חומרים מתחת לסף המינימום</p>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-4 py-2 bg-muted/50 text-xs font-medium text-muted-foreground border-b">
            <span>חומר</span>
            <span className="text-left min-w-[70px]">מלאי נוכחי</span>
            <span className="text-left min-w-[50px]">סף</span>
            <span className="text-left min-w-[50px]">נדרש</span>
            <span className="text-left min-w-[120px]">ספק / מחיר</span>
          </div>

          {/* Rows */}
          <div className="divide-y">
            {items.map((item) => {
              const current = Number(item.stockQuantity);
              const threshold = Number(item.lowStockThreshold);
              const needed = Math.max(0, threshold - current);
              const ps = item.preferredSupplier;
              const estimatedCost =
                ps?.pricePerUnit != null ? Number(ps.pricePerUnit) * needed : null;

              return (
                <div
                  key={item.id}
                  className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-4 py-3 items-center"
                >
                  {/* Name */}
                  <div className="min-w-0">
                    <Link
                      href={`/materials/${item.id}`}
                      className="font-medium text-sm hover:underline"
                    >
                      {item.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">{item.unit}</p>
                  </div>

                  {/* Current stock */}
                  <span
                    className={`text-sm font-semibold tabular-nums min-w-[70px] ${
                      item.stockStatus === "red"
                        ? "text-red-600"
                        : item.stockStatus === "orange"
                        ? "text-orange-600"
                        : "text-yellow-600"
                    }`}
                  >
                    {current.toLocaleString("he-IL")}
                  </span>

                  {/* Threshold */}
                  <span className="text-sm text-muted-foreground tabular-nums min-w-[50px]">
                    {threshold.toLocaleString("he-IL")}
                  </span>

                  {/* Needed */}
                  <span className="text-sm font-medium tabular-nums min-w-[50px]">
                    {needed.toLocaleString("he-IL")}
                  </span>

                  {/* Supplier + price + action */}
                  <div className="flex items-center gap-3 min-w-[120px]">
                    <div className="text-xs text-muted-foreground">
                      {ps ? (
                        <>
                          <p className="font-medium text-foreground">{ps.supplier.name}</p>
                          {estimatedCost != null && (
                            <p>₪{estimatedCost.toFixed(2)}</p>
                          )}
                        </>
                      ) : (
                        <span>אין ספק</span>
                      )}
                    </div>
                    <MarkPurchasedButton
                      materialId={item.id}
                      suggestedQuantity={needed}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
