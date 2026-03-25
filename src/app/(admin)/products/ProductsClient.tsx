"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Search, Package } from "lucide-react";
import type { Product, ProductVariant } from "@/generated/prisma";

type ProductWithVariants = Product & { variants: ProductVariant[] };

type FilterKey = "all" | "active" | "inactive" | "lowStock";
type SortKey = "name" | "price" | "stock";

const FILTER_LABELS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "הכל" },
  { key: "active", label: "פעיל" },
  { key: "inactive", label: "לא פעיל" },
  { key: "lowStock", label: "מלאי נמוך" },
];

const SORT_LABELS: { key: SortKey; label: string }[] = [
  { key: "name", label: "שם" },
  { key: "price", label: "מחיר" },
  { key: "stock", label: "מלאי" },
];

const MONTH_NAMES: Record<number, string> = {
  1: "ינואר", 2: "פברואר", 3: "מרץ", 4: "אפריל",
  5: "מאי", 6: "יוני", 7: "יולי", 8: "אוגוסט",
  9: "ספטמבר", 10: "אוקטובר", 11: "נובמבר", 12: "דצמבר",
};

interface ProductsClientProps {
  products: ProductWithVariants[];
  initialSearch: string;
  initialFilter: string;
  initialSort: string;
}

export function ProductsClient({
  products,
  initialSearch,
  initialFilter,
  initialSort,
}: ProductsClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState(initialSearch);
  const [filter, setFilter] = useState<FilterKey>((initialFilter as FilterKey) || "all");
  const [sort, setSort] = useState<SortKey>((initialSort as SortKey) || "name");

  const filtered = useMemo(() => {
    let list = [...products];

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.category?.toLowerCase().includes(q) ?? false)
      );
    }

    if (filter === "active") list = list.filter((p) => p.isActive);
    else if (filter === "inactive") list = list.filter((p) => !p.isActive);
    else if (filter === "lowStock")
      list = list.filter((p) =>
        p.variants.some((v) => v.stockQuantity <= v.lowStockThreshold)
      );

    list.sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name, "he");
      if (sort === "price") {
        const aMin = Math.min(...(a.variants.map((v) => Number(v.price)) || [0]));
        const bMin = Math.min(...(b.variants.map((v) => Number(v.price)) || [0]));
        return aMin - bMin;
      }
      if (sort === "stock") {
        const aTotal = a.variants.reduce((s, v) => s + v.stockQuantity, 0);
        const bTotal = b.variants.reduce((s, v) => s + v.stockQuantity, 0);
        return aTotal - bTotal;
      }
      return 0;
    });

    return list;
  }, [products, search, filter, sort]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (filter !== "all") params.set("filter", filter);
    if (sort !== "name") params.set("sort", sort);
    router.push(`/products?${params.toString()}`);
  }

  function getPriceRange(variants: ProductVariant[]) {
    if (!variants.length) return "—";
    const prices = variants.map((v) => Number(v.price));
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    if (min === max) return `₪${min.toFixed(0)}`;
    return `₪${min.toFixed(0)}–₪${max.toFixed(0)}`;
  }

  function getTotalStock(variants: ProductVariant[]) {
    return variants.reduce((s, v) => s + v.stockQuantity, 0);
  }

  function hasLowStock(variants: ProductVariant[]) {
    return variants.some((v) => v.stockQuantity <= v.lowStockThreshold);
  }

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 max-w-sm">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="חיפוש לפי שם או קטגוריה..."
              className="pr-9"
            />
          </div>
          <Button type="submit" variant="secondary" size="sm">
            חפש
          </Button>
        </form>
        <Link href="/products/new">
          <Button size="sm" className="gap-1">
            <Plus className="h-4 w-4" />
            מוצר חדש
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-sm text-muted-foreground">סינון:</span>
        {FILTER_LABELS.map(({ key, label }) => (
          <Button
            key={key}
            variant={filter === key ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(key)}
          >
            {label}
          </Button>
        ))}
        <span className="text-sm text-muted-foreground mr-4">מיון:</span>
        {SORT_LABELS.map(({ key, label }) => (
          <Button
            key={key}
            variant={sort === key ? "default" : "outline"}
            size="sm"
            onClick={() => setSort(key)}
          >
            {label}
          </Button>
        ))}
      </div>

      {/* Count */}
      <p className="text-sm text-muted-foreground">
        {filtered.length} מוצרים
      </p>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
          <Package className="h-12 w-12 opacity-30" />
          <p>לא נמצאו מוצרים</p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">תמונה</TableHead>
                <TableHead>שם</TableHead>
                <TableHead>קטגוריה</TableHead>
                <TableHead>מחיר</TableHead>
                <TableHead>מלאי</TableHead>
                <TableHead>סטטוס</TableHead>
                <TableHead className="w-20"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((product) => (
                <TableRow key={product.id} className="cursor-pointer hover:bg-muted/50" onClick={() => router.push(`/products/${product.id}`)}>
                  <TableCell>
                    {product.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="h-10 w-10 rounded object-contain bg-muted/20"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                        <Package className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {product.category ?? "—"}
                  </TableCell>
                  <TableCell>{getPriceRange(product.variants)}</TableCell>
                  <TableCell>
                    <span
                      className={
                        hasLowStock(product.variants)
                          ? "text-amber-600 font-medium"
                          : undefined
                      }
                    >
                      {getTotalStock(product.variants)}
                    </span>
                    {hasLowStock(product.variants) && (
                      <span className="mr-1 text-xs text-amber-600">⚠</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {product.isActive ? (
                      <Badge variant="default">פעיל</Badge>
                    ) : (
                      <Badge variant="secondary">לא פעיל</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/products/${product.id}`}
                      className="text-sm text-primary hover:underline"
                    >
                      פרטים
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
