"use client";

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { updateVariantStockAction } from "@/actions/products";
import { Check } from "lucide-react";

interface StockUpdateFormProps {
  variantId: string;
  currentQuantity: number;
}

export function StockUpdateForm({ variantId, currentQuantity }: StockUpdateFormProps) {
  const [value, setValue] = useState(currentQuantity.toString());
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const qty = parseInt(value);
    if (isNaN(qty) || qty < 0) {
      setError("כמות לא תקינה");
      return;
    }
    setError(null);

    startTransition(async () => {
      try {
        await updateVariantStockAction(variantId, qty);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } catch {
        setError("שגיאה בשמירה");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-1.5">
      <Input
        type="number"
        min="0"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setSaved(false);
        }}
        className="h-7 w-20 text-sm"
        aria-label="כמות חדשה"
      />
      <Button
        type="submit"
        size="sm"
        variant="outline"
        disabled={isPending}
        className="h-7 px-2"
      >
        {saved ? (
          <Check className="h-3.5 w-3.5 text-green-600" />
        ) : isPending ? (
          "..."
        ) : (
          "עדכן"
        )}
      </Button>
      {error && <span className="text-xs text-destructive">{error}</span>}
    </form>
  );
}
