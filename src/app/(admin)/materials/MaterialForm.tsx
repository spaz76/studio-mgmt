"use client";

import { useRef, useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createCategoryAction } from "@/actions/materials";
import { Plus } from "lucide-react";

type CategoryOption = { id: string; name: string; parentId: string | null };
type SupplierOption = { id: string; name: string };

type MaterialData = {
  id?: string;
  name?: string;
  description?: string | null;
  unit?: string;
  stockQuantity?: { toString(): string } | number;
  lowStockThreshold?: { toString(): string } | number;
  orangeThreshold?: { toString(): string } | number;
  redThreshold?: { toString(): string } | number;
  barcode?: string | null;
  notes?: string | null;
  categoryId?: string | null;
  purchaseUrl?: string | null;
  pricePerUnit?: { toString(): string } | number | null;
  pricePerPackage?: { toString(): string } | number | null;
  packageSize?: string | null;
  width?: string | null;
  height?: string | null;
  minTemp?: number | null;
  maxTemp?: number | null;
};

interface MaterialFormProps {
  action: (formData: FormData) => Promise<void>;
  initialData?: MaterialData;
  submitLabel?: string;
  suppliers?: SupplierOption[];
  categories?: CategoryOption[];
  vatRate?: number;
}

const UNIT_OPTIONS = ["ק״ג", "גרם", "ליטר", "מ״ל", "יחידות", "מטר", "יחידה"];

/** Build hierarchical label like "קרמיקה > גלזורות > אבקות" */
function buildLabel(id: string, map: Map<string, CategoryOption>): string {
  const cat = map.get(id);
  if (!cat) return "";
  if (!cat.parentId) return cat.name;
  return `${buildLabel(cat.parentId, map)} > ${cat.name}`;
}

/** Check if a category (by id) is under a parent whose name matches a predicate */
function isUnderCategory(
  id: string | null | undefined,
  map: Map<string, CategoryOption>,
  predicate: (name: string) => boolean
): boolean {
  if (!id) return false;
  let current = map.get(id);
  while (current) {
    if (predicate(current.name)) return true;
    current = current.parentId ? map.get(current.parentId) : undefined;
  }
  return false;
}

const CERAMICS_NAMES = ["קרמיקה", "חרס", "ceramics"];
const CANVAS_NAMES = ["קנבאסים", "קנבס", "canvas", "canvases"];

export function MaterialForm({
  action,
  initialData,
  submitLabel = "שמור",
  suppliers,
  categories = [],
  vatRate = 18,
}: MaterialFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [isAddingCategory, startAddCategory] = useTransition();

  const [supplierId, setSupplierId] = useState<string>("");
  const [categoryId, setCategoryId] = useState<string>(initialData?.categoryId ?? "");
  const [pricePerUnit, setPricePerUnit] = useState<string>(
    initialData?.pricePerUnit != null ? Number(initialData.pricePerUnit).toString() : ""
  );
  const [pricePerPackage, setPricePerPackage] = useState<string>(
    initialData?.pricePerPackage != null ? Number(initialData.pricePerPackage).toString() : ""
  );

  // Inline add-category state
  const [showAddCat, setShowAddCat] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatParentId, setNewCatParentId] = useState("");
  const [localCategories, setLocalCategories] = useState<CategoryOption[]>(categories);

  const catMap = useMemo(
    () => new Map(localCategories.map((c) => [c.id, c])),
    [localCategories]
  );

  const categoryOptions = useMemo(
    () =>
      localCategories.map((c) => ({
        value: c.id,
        label: buildLabel(c.id, catMap),
      })).sort((a, b) => a.label.localeCompare(b.label, "he")),
    [localCategories, catMap]
  );

  const showTempFields = isUnderCategory(categoryId || null, catMap, (n) =>
    CERAMICS_NAMES.some((cn) => n.includes(cn))
  );
  const showDimFields = isUnderCategory(categoryId || null, catMap, (n) =>
    CANVAS_NAMES.some((cn) => n.includes(cn))
  );

  const vatMultiplier = 1 + vatRate / 100;

  function vatDisplay(price: string) {
    const n = parseFloat(price);
    if (!n || isNaN(n)) return null;
    const withVat = (n * vatMultiplier).toFixed(2);
    const withoutVat = (n / vatMultiplier).toFixed(2);
    return { withVat, withoutVat };
  }

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

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (supplierId) formData.set("supplierId", supplierId);
    formData.set("categoryId", categoryId);
    formData.set("pricePerUnit", pricePerUnit);
    formData.set("pricePerPackage", pricePerPackage);

    startTransition(async () => {
      await action(formData);
      router.push("/materials");
    });
  }

  const unitVal = initialData?.unit ?? "יחידה";

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
      {/* Name */}
      <div className="space-y-1.5">
        <Label htmlFor="name">
          שם <span className="text-destructive">*</span>
        </Label>
        <Input
          id="name"
          name="name"
          placeholder="למשל: חימר לבן"
          defaultValue={initialData?.name ?? ""}
          required
        />
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <Label htmlFor="description">תיאור</Label>
        <Textarea
          id="description"
          name="description"
          placeholder="תיאור קצר של החומר..."
          defaultValue={initialData?.description ?? ""}
          rows={2}
        />
      </div>

      {/* Category */}
      <div className="space-y-1.5">
        <Label>קטגוריה</Label>
        <div className="flex gap-2">
          <Select value={categoryId} onValueChange={(v) => setCategoryId(v ?? "")}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="בחר קטגוריה (אופציונלי)" />
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

        {/* Inline add category */}
        {showAddCat && (
          <div className="rounded-md border bg-muted/30 p-3 space-y-2 text-sm">
            <p className="font-medium">קטגוריה חדשה</p>
            <Input
              placeholder="שם קטגוריה"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
            />
            <Select value={newCatParentId} onValueChange={(v) => setNewCatParentId(v ?? "")}>
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
      </div>

      {/* Unit + stockQuantity */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="unit">יחידת מידה</Label>
          <Select name="unit" defaultValue={UNIT_OPTIONS.includes(unitVal) ? unitVal : "יחידה"}>
            <SelectTrigger id="unit">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {UNIT_OPTIONS.map((u) => (
                <SelectItem key={u} value={u}>
                  {u}
                </SelectItem>
              ))}
              {!UNIT_OPTIONS.includes(unitVal) && (
                <SelectItem value={unitVal}>{unitVal}</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="stockQuantity">מלאי נוכחי</Label>
          <Input
            id="stockQuantity"
            name="stockQuantity"
            type="number"
            step="0.001"
            min="0"
            defaultValue={
              initialData?.stockQuantity !== undefined ? Number(initialData.stockQuantity) : 0
            }
          />
        </div>
      </div>

      {/* Pricing */}
      <div className="space-y-3">
        <p className="text-sm font-medium">תמחור (אופציונלי)</p>
        <div className="grid grid-cols-2 gap-4">
          {/* Price per unit */}
          <div className="space-y-1.5">
            <Label htmlFor="pricePerUnit">מחיר ליחידה (₪)</Label>
            <Input
              id="pricePerUnit"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={pricePerUnit}
              onChange={(e) => setPricePerUnit(e.target.value)}
            />
            {vatDisplay(pricePerUnit) && (
              <p className="text-xs text-muted-foreground">
                לפני מע״מ: ₪{vatDisplay(pricePerUnit)!.withoutVat} | כולל מע״מ: ₪{vatDisplay(pricePerUnit)!.withVat}
              </p>
            )}
          </div>

          {/* Price per package */}
          <div className="space-y-1.5">
            <Label htmlFor="pricePerPackage">מחיר לחבילה (₪)</Label>
            <Input
              id="pricePerPackage"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={pricePerPackage}
              onChange={(e) => setPricePerPackage(e.target.value)}
            />
            {vatDisplay(pricePerPackage) && (
              <p className="text-xs text-muted-foreground">
                לפני מע״מ: ₪{vatDisplay(pricePerPackage)!.withoutVat} | כולל מע״מ: ₪{vatDisplay(pricePerPackage)!.withVat}
              </p>
            )}
          </div>
        </div>

        {/* Package size */}
        <div className="space-y-1.5">
          <Label htmlFor="packageSize">גודל חבילה</Label>
          <Input
            id="packageSize"
            name="packageSize"
            placeholder='למשל: "10 ק״ג", "24 יחידות"'
            defaultValue={initialData?.packageSize ?? ""}
          />
        </div>

        {/* Purchase URL */}
        <div className="space-y-1.5">
          <Label htmlFor="purchaseUrl">קישור לרכישה</Label>
          <Input
            id="purchaseUrl"
            name="purchaseUrl"
            type="url"
            placeholder="https://..."
            dir="ltr"
            defaultValue={initialData?.purchaseUrl ?? ""}
          />
        </div>
      </div>

      {/* Temperature — ceramics only */}
      {showTempFields && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="minTemp">טמפ׳ מינימום (°C)</Label>
            <Input
              id="minTemp"
              name="minTemp"
              type="number"
              placeholder="למשל: 1000"
              defaultValue={initialData?.minTemp ?? ""}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="maxTemp">טמפ׳ מקסימום (°C)</Label>
            <Input
              id="maxTemp"
              name="maxTemp"
              type="number"
              placeholder="למשל: 1260"
              defaultValue={initialData?.maxTemp ?? ""}
            />
          </div>
        </div>
      )}

      {/* Dimensions — canvas only */}
      {showDimFields && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="width">רוחב</Label>
            <Input
              id="width"
              name="width"
              placeholder='למשל: "40 ס״מ"'
              defaultValue={initialData?.width ?? ""}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="height">גובה</Label>
            <Input
              id="height"
              name="height"
              placeholder='למשל: "50 ס״מ"'
              defaultValue={initialData?.height ?? ""}
            />
          </div>
        </div>
      )}

      {/* Thresholds */}
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="lowStockThreshold" className="text-yellow-600">
            סף מינימום (צהוב)
          </Label>
          <Input
            id="lowStockThreshold"
            name="lowStockThreshold"
            type="number"
            step="0.001"
            min="0"
            defaultValue={
              initialData?.lowStockThreshold !== undefined
                ? Number(initialData.lowStockThreshold)
                : 5
            }
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="orangeThreshold" className="text-orange-600">
            סף כתום
          </Label>
          <Input
            id="orangeThreshold"
            name="orangeThreshold"
            type="number"
            step="0.001"
            min="0"
            defaultValue={
              initialData?.orangeThreshold !== undefined
                ? Number(initialData.orangeThreshold)
                : 10
            }
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="redThreshold" className="text-red-600">
            סף אדום
          </Label>
          <Input
            id="redThreshold"
            name="redThreshold"
            type="number"
            step="0.001"
            min="0"
            defaultValue={
              initialData?.redThreshold !== undefined
                ? Number(initialData.redThreshold)
                : 3
            }
          />
        </div>
      </div>

      {/* Barcode */}
      <div className="space-y-1.5">
        <Label htmlFor="barcode">ברקוד</Label>
        <Input
          id="barcode"
          name="barcode"
          placeholder="ברקוד (אופציונלי)"
          defaultValue={initialData?.barcode ?? ""}
        />
      </div>

      {/* Notes */}
      <div className="space-y-1.5">
        <Label htmlFor="notes">הערות</Label>
        <Textarea
          id="notes"
          name="notes"
          placeholder="הערות נוספות..."
          defaultValue={initialData?.notes ?? ""}
          rows={2}
        />
      </div>

      {/* Supplier */}
      {suppliers && suppliers.length > 0 && (
        <div className="space-y-1.5">
          <Label htmlFor="supplierId">ספק ראשי (אופציונלי)</Label>
          <Select value={supplierId} onValueChange={(v) => setSupplierId(v ?? "")}>
            <SelectTrigger id="supplierId" className="w-full">
              <SelectValue placeholder="בחר ספק" />
            </SelectTrigger>
            <SelectContent>
              {suppliers.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "שומר..." : submitLabel}
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
