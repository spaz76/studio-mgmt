import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getStudioId } from "@/lib/studio";
import { getProductById } from "@/services/products";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Pencil, Package, AlertTriangle, History } from "lucide-react";
import { StockUpdateForm } from "./StockUpdateForm";
import { ProductShareButtons } from "./ProductShareButtons";

export const metadata = { title: "פרטי מוצר" };

const MONTH_NAMES: Record<number, string> = {
  1: "ינואר", 2: "פברואר", 3: "מרץ", 4: "אפריל",
  5: "מאי", 6: "יוני", 7: "יולי", 8: "אוגוסט",
  9: "ספטמבר", 10: "אוקטובר", 11: "נובמבר", 12: "דצמבר",
};

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  const studioId = await getStudioId();
  const product = await getProductById(prisma, studioId, id);

  if (!product) notFound();

  const totalStock = product.variants.reduce((s, v) => s + v.stockQuantity, 0);

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.imageUrl}
              alt={product.name}
              className="h-20 w-20 rounded-lg object-contain bg-muted/20 border"
            />
          ) : (
            <div className="h-20 w-20 rounded-lg bg-muted flex items-center justify-center border">
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold">{product.name}</h1>
            {product.category && (
              <p className="text-sm text-muted-foreground mt-0.5">
                {product.category}
              </p>
            )}
            <div className="mt-2 flex flex-wrap gap-2">
              {product.isActive ? (
                <Badge variant="default">פעיל</Badge>
              ) : (
                <Badge variant="secondary">לא פעיל</Badge>
              )}
              {product.isSeasonal && (
                <Badge variant="outline">
                  עונתי
                  {product.seasonStart && product.seasonEnd
                    ? ` · ${MONTH_NAMES[product.seasonStart]}–${MONTH_NAMES[product.seasonEnd]}`
                    : ""}
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2 shrink-0">
          <Link
            href={`/products/${product.id}/edit`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1")}
          >
            <Pencil className="h-4 w-4" />
            עריכה
          </Link>
        </div>
      </div>

      {/* Description */}
      {product.description && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">תיאור</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {product.description}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">פרטים</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-y-3 text-sm sm:grid-cols-3">
          <div>
            <p className="text-muted-foreground">SKU בסיסי</p>
            <p className="font-mono mt-0.5">{product.skuBase}</p>
          </div>
          <div>
            <p className="text-muted-foreground">סה&quot;כ מלאי</p>
            <p className="font-medium mt-0.5">{totalStock}</p>
          </div>
          <div>
            <p className="text-muted-foreground">מספר וריאנטים</p>
            <p className="font-medium mt-0.5">{product.variants.length}</p>
          </div>
        </CardContent>
      </Card>

      {/* Variants */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">וריאנטים ומלאי</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>שם</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>מחיר</TableHead>
                <TableHead>מלאי</TableHead>
                <TableHead>סף מינימום</TableHead>
                <TableHead>עדכון מלאי</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {product.variants.map((variant) => {
                const isLow = variant.stockQuantity <= variant.lowStockThreshold;
                return (
                  <TableRow key={variant.id}>
                    <TableCell className="font-medium">{variant.name}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {variant.sku}
                    </TableCell>
                    <TableCell>₪{Number(variant.price).toFixed(2)}</TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "font-medium",
                          isLow && "text-amber-600"
                        )}
                      >
                        {variant.stockQuantity}
                      </span>
                      {isLow && (
                        <AlertTriangle className="inline mr-1 h-3.5 w-3.5 text-amber-500" />
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {variant.lowStockThreshold}
                    </TableCell>
                    <TableCell>
                      <StockUpdateForm
                        variantId={variant.id}
                        currentQuantity={variant.stockQuantity}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Share & Sales history */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Card className="flex-1">
          <CardHeader>
            <CardTitle className="text-base">שיתוף</CardTitle>
          </CardHeader>
          <CardContent>
            <ProductShareButtons
              productId={product.id}
              productName={product.name}
            />
          </CardContent>
        </Card>

        <Card className="flex-1">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <History className="h-4 w-4" />
              היסטוריית מכירות
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              היסטוריית מכירות — בקרוב
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
