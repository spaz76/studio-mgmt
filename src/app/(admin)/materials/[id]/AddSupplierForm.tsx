"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, ChevronDown, ChevronUp } from "lucide-react";
import { addSupplierAction } from "@/actions/materials";

export function AddSupplierForm({ materialId }: { materialId: string }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);
  const [isPreferred, setIsPreferred] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("isPreferred", isPreferred ? "true" : "false");

    startTransition(async () => {
      await addSupplierAction(materialId, formData);
      (e.target as HTMLFormElement).reset();
      setIsPreferred(false);
      setSuccess(true);
      setOpen(false);
      setTimeout(() => setSuccess(false), 3000);
    });
  }

  return (
    <div>
      {success && !open && (
        <p className="text-sm text-green-600 mb-2">הספק נוסף בהצלחה</p>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen((v) => !v)}
        className="gap-1"
      >
        <Plus className="h-4 w-4" />
        הוסף ספק
        {open ? (
          <ChevronUp className="h-3 w-3 mr-1" />
        ) : (
          <ChevronDown className="h-3 w-3 mr-1" />
        )}
      </Button>

      {open && (
        <form
          onSubmit={handleSubmit}
          className="mt-3 rounded-lg border p-4 space-y-4"
        >
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="supplier-name">
              שם ספק <span className="text-destructive">*</span>
            </Label>
            <Input
              id="supplier-name"
              name="name"
              placeholder="שם הספק"
              required
            />
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <Label htmlFor="supplier-phone">טלפון</Label>
            <Input
              id="supplier-phone"
              name="phone"
              type="tel"
              placeholder="050-0000000"
            />
          </div>

          {/* Price per unit */}
          <div className="space-y-1.5">
            <Label htmlFor="supplier-price">מחיר ליחידה (₪)</Label>
            <Input
              id="supplier-price"
              name="pricePerUnit"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
            />
          </div>

          {/* isPreferred */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="supplier-preferred"
              checked={isPreferred}
              onCheckedChange={(checked) => setIsPreferred(checked)}
            />
            <Label htmlFor="supplier-preferred" className="cursor-pointer font-normal">
              ספק מומלץ
            </Label>
          </div>

          <div className="flex gap-2 pt-1">
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending ? "שומר..." : "הוסף ספק"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              ביטול
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
