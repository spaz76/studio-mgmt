"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle, ShoppingCart } from "lucide-react";
import { markPurchasedAction } from "@/actions/materials";

export function MarkPurchasedButton({
  materialId,
  suggestedQuantity,
}: {
  materialId: string;
  suggestedQuantity: number;
}) {
  const [open, setOpen] = useState(false);
  const [quantity, setQuantity] = useState(suggestedQuantity.toString());
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  function handleConfirm() {
    const qty = parseFloat(quantity);
    if (!qty || qty <= 0) return;

    startTransition(async () => {
      await markPurchasedAction(materialId, qty);
      setDone(true);
      setOpen(false);
      setTimeout(() => setDone(false), 4000);
    });
  }

  if (done) {
    return (
      <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
        <CheckCircle className="h-3.5 w-3.5" />
        נרכש
      </span>
    );
  }

  if (!open) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-1 h-7 text-xs"
      >
        <ShoppingCart className="h-3 w-3" />
        סמן כנרכש
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        type="number"
        step="0.001"
        min="0.001"
        value={quantity}
        onChange={(e) => setQuantity(e.target.value)}
        className="h-7 w-20 text-xs"
      />
      <Button
        size="sm"
        className="h-7 text-xs"
        onClick={handleConfirm}
        disabled={isPending}
      >
        {isPending ? "..." : "אשר"}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 text-xs"
        onClick={() => setOpen(false)}
        disabled={isPending}
      >
        ביטול
      </Button>
    </div>
  );
}
