"use client";

import { useState, useTransition, useMemo, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Upload, X, Loader2 } from "lucide-react";
import { compressImage } from "@/lib/compress-image";
import { createProductAction, updateProductAction } from "@/actions/products";
import { createCategoryAction } from "@/actions/materials";
import type { Product, ProductVariant } from "@/generated/prisma";

type CategoryOption = { id: string; name: string; parentId: string | null };

function buildLabel(id: string, map: Map<string, CategoryOption>): string {
  const cat = map.get(id);
  if (!cat) return "";
  if (!cat.parentId) return cat.name;
  return `${buildLabel(cat.parentId, map)} > ${cat.name}`;
}

export type ProductWithVariants = Product & { variants: ProductVariant[] };

interface VariantDraft {
  name: string;
  sku: string;
  price: string;
  stockQuantity: string;
  lowStockThreshold: string;
  barcode: string;
}

function emptyVariant(): VariantDraft {
  return {
    name: "",
    sku: "",
    price: "0",
    stockQuantity: "0",
    lowStockThreshold: "5",
    barcode: "",
  };
}

function variantFromModel(v: ProductVariant): VariantDraft {
  return {
    name: v.name,
    sku: v.sku,
    price: Number(v.price).toString(),
    stockQuantity: v.stockQuantity.toString(),
    lowStockThreshold: v.lowStockThreshold.toString(),
    barcode: v.barcode ?? "",
  };
}

const MONTHS = [
  "ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני",
  "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר",
];

interface ProductFormProps {
  product?: ProductWithVariants;
  categories?: CategoryOption[];
}

export function ProductForm({ product, categories = [] }: ProductFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isAddingCategory, startAddCategory] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? "");
  const [localCategories, setLocalCategories] = useState<CategoryOption[]>(categories);

  // Inline add-category state
  const [showAddCat, setShowAddCat] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatParentId, setNewCatParentId] = useState("");

  const catMap = useMemo(
    () => new Map(localCategories.map((c) => [c.id, c])),
    [localCategories]
  );
  const categoryOptions = useMemo(
    () =>
      localCategories
        .map((c) => ({ value: c.id, label: buildLabel(c.id, catMap) }))
        .sort((a, b) => a.label.localeCompare(b.label, "he")),
    [localCategories, catMap]
  );

  async function handleAddCategory() {
    if (!newCatName.trim()) return;
    const fd = new FormData();
    fd.set("name", newCatName.trim());
    if (newCatParentId) fd.set("parentId", newCatParentId);
    startAddCategory(async () => {
      const newCat = await createCategoryAction(fd);
      setLocalCategories((prev) => [...prev, newCat]);
      setCategoryId(newCat.id);
      setNewCatName("");
      setNewCatParentId("");
      setShowAddCat(false);
    });
  }

  // Keep the old string category for backwards compat display
  const [category, setCategory] = useState(product?.category ?? "");
  const [imageUrl, setImageUrl] = useState(product?.imageUrl ?? "");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleImageFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setImageUploadError("יש לבחור קובץ תמונה");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setImageUploadError("הקובץ גדול מדי (מקסימום 5MB)");
      return;
    }
    setImageUploadError(null);
    setIsUploadingImage(true);
    try {
      const fd = new FormData();
      const compressed = await compressImage(file);
      fd.append("file", compressed);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "שגיאה בהעלאה");
      }
      const { url } = await res.json();
      setImageUrl(url);
    } catch (err) {
      setImageUploadError(err instanceof Error ? err.message : "שגיאה בהעלאה");
    } finally {
      setIsUploadingImage(false);
    }
  }, []);
  const [skuBase, setSkuBase] = useState(product?.skuBase ?? "");
  const [isSeasonal, setIsSeasonal] = useState(product?.isSeasonal ?? false);
  const [seasonStart, setSeasonStart] = useState<string>(
    product?.seasonStart?.toString() ?? "1"
  );
  const [seasonEnd, setSeasonEnd] = useState<string>(
    product?.seasonEnd?.toString() ?? "12"
  );
  const [isActive, setIsActive] = useState(product?.isActive ?? true);

  const [variants, setVariants] = useState<VariantDraft[]>(
    product?.variants && product.variants.length > 0
      ? product.variants.map(variantFromModel)
      : [emptyVariant()]
  );

  function updateVariant(index: number, field: keyof VariantDraft, value: string) {
    setVariants((prev) =>
      prev.map((v, i) => (i === index ? { ...v, [field]: value } : v))
    );
  }

  function addVariant() {
    setVariants((prev) => [...prev, emptyVariant()]);
  }

  function removeVariant(index: number) {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const variantsPayload = variants.map((v) => ({
      name: v.name,
      sku: v.sku,
      price: parseFloat(v.price) || 0,
      stockQuantity: parseInt(v.stockQuantity) || 0,
      lowStockThreshold: parseInt(v.lowStockThreshold) || 5,
      barcode: v.barcode || null,
    }));

    const formData = new FormData(e.currentTarget);
    formData.set("variants", JSON.stringify(variantsPayload));
    formData.set("isSeasonal", isSeasonal ? "true" : "false");
    formData.set("isActive", isActive ? "true" : "false");
    formData.set("categoryId", categoryId);

    startTransition(async () => {
      try {
        if (product) {
          await updateProductAction(product.id, formData);
          router.push(`/products/${product.id}`);
        } else {
          await createProductAction(formData);
          router.push("/products");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "אירעה שגיאה");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Basic info */}
      <Card>
        <CardHeader>
          <CardTitle>פרטי מוצר</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">שם *</Label>
            <Input
              id="name"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="שם המוצר"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">תיאור</Label>
            <Textarea
              id="description"
              name="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="תיאור המוצר (אופציונלי)"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>קטגוריה</Label>
              <div className="flex gap-2">
                <Select value={categoryId} onValueChange={(v) => setCategoryId(v ?? "")}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="בחר קטגוריה" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">ללא קטגוריה</SelectItem>
                    {categoryOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddCat((v) => !v)}
                  className="shrink-0 gap-1"
                >
                  <Plus className="h-3.5 w-3.5" />
                  חדש
                </Button>
              </div>
              {showAddCat && (
                <div className="rounded-md border bg-muted/30 p-3 space-y-2 text-sm">
                  <p className="font-medium">קטגוריה חדשה</p>
                  <Input
                    placeholder="שם קטגוריה"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                  />
                  <Select
                    value={newCatParentId}
                    onValueChange={(v) => setNewCatParentId(v ?? "")}
                  >
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="קטגוריית אב (אופציונלי)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">ללא אב</SelectItem>
                      {categoryOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAddCategory}
                      disabled={isAddingCategory || !newCatName.trim()}
                    >
                      {isAddingCategory ? "יוצר..." : "צור"}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowAddCat(false)}
                    >
                      ביטול
                    </Button>
                  </div>
                </div>
              )}
              {/* hidden legacy field */}
              <input type="hidden" name="category" value={category} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="skuBase">
                SKU בסיסי{" "}
                <span className="text-xs text-muted-foreground font-normal">
                  (ייווצר אוטומטית אם ריק)
                </span>
              </Label>
              <Input
                id="skuBase"
                name="skuBase"
                value={skuBase}
                onChange={(e) => setSkuBase(e.target.value)}
                placeholder="product-sku"
                dir="ltr"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>תמונת מוצר</Label>
            {imageUrl ? (
              <div className="flex items-center gap-3">
                <img
                  src={imageUrl}
                  alt="תמונת מוצר"
                  className="h-16 w-16 rounded-md border border-border object-cover bg-muted/30"
                />
                <div className="flex flex-col gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => imageInputRef.current?.click()}
                    disabled={isUploadingImage}
                    className="gap-1"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    החלף תמונה
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => { setImageUrl(""); if (imageInputRef.current) imageInputRef.current.value = ""; }}
                    className="gap-1 text-destructive hover:text-destructive h-7 px-2"
                  >
                    <X className="h-3.5 w-3.5" />
                    הסר
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={isUploadingImage}
                  className="gap-1"
                >
                  {isUploadingImage ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Upload className="h-3.5 w-3.5" />
                  )}
                  {isUploadingImage ? "מעלה..." : "בחר תמונה"}
                </Button>
              </div>
            )}
            <input
              ref={imageInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageFile(f); }}
            />
            {/* hidden field so imageUrl is submitted with the form */}
            <input type="hidden" name="imageUrl" value={imageUrl} />
            {imageUploadError && (
              <p className="text-xs text-destructive">{imageUploadError}</p>
            )}
          </div>

          {/* Seasonal */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isSeasonal"
                checked={isSeasonal}
                onChange={(e) => setIsSeasonal(e.target.checked)}
                className="h-4 w-4 rounded border-input"
              />
              <Label htmlFor="isSeasonal" className="cursor-pointer font-normal">
                מוצר עונתי
              </Label>
            </div>

            {isSeasonal && (
              <div className="grid grid-cols-2 gap-4 pr-6">
                <div className="space-y-2">
                  <Label htmlFor="seasonStart">תחילת עונה</Label>
                  <select
                    id="seasonStart"
                    name="seasonStart"
                    value={seasonStart}
                    onChange={(e) => setSeasonStart(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                  >
                    {MONTHS.map((m, i) => (
                      <option key={i + 1} value={i + 1}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="seasonEnd">סוף עונה</Label>
                  <select
                    id="seasonEnd"
                    name="seasonEnd"
                    value={seasonEnd}
                    onChange={(e) => setSeasonEnd(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                  >
                    {MONTHS.map((m, i) => (
                      <option key={i + 1} value={i + 1}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Active */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-input"
            />
            <Label htmlFor="isActive" className="cursor-pointer font-normal">
              פעיל
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Variants */}
      <Card>
        <CardHeader>
          <CardTitle>וריאנטים</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {variants.map((variant, idx) => (
            <div
              key={idx}
              className="rounded-lg border p-4 space-y-3 bg-muted/30"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  וריאנט {idx + 1}
                </span>
                {variants.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeVariant(idx)}
                    className="h-7 px-2 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span className="mr-1">הסר</span>
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs">שם וריאנט</Label>
                  <Input
                    value={variant.name}
                    onChange={(e) => updateVariant(idx, "name", e.target.value)}
                    placeholder="לדוגמה: קטן, בינוני, גדול"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">SKU</Label>
                  <Input
                    value={variant.sku}
                    onChange={(e) => updateVariant(idx, "sku", e.target.value)}
                    placeholder="sku-001"
                    dir="ltr"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">מחיר (₪)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={variant.price}
                    onChange={(e) => updateVariant(idx, "price", e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">כמות במלאי</Label>
                  <Input
                    type="number"
                    min="0"
                    value={variant.stockQuantity}
                    onChange={(e) =>
                      updateVariant(idx, "stockQuantity", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">סף מינימום למלאי</Label>
                  <Input
                    type="number"
                    min="0"
                    value={variant.lowStockThreshold}
                    onChange={(e) =>
                      updateVariant(idx, "lowStockThreshold", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">ברקוד</Label>
                  <Input
                    value={variant.barcode}
                    onChange={(e) => updateVariant(idx, "barcode", e.target.value)}
                    placeholder="ברקוד (אופציונלי)"
                    dir="ltr"
                  />
                </div>
              </div>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addVariant}
            className="gap-1"
          >
            <Plus className="h-4 w-4" />
            הוסף וריאנט
          </Button>

          {/* Hidden serialized variants */}
          <input type="hidden" name="variants" value={JSON.stringify(variants)} />
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "שומר..." : product ? "עדכן מוצר" : "צור מוצר"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isPending}
        >
          ביטול
        </Button>
      </div>
    </form>
  );
}
