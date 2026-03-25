"use client";

import { useState, useTransition } from "react";
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
import { addStockLogAction } from "@/actions/materials";

const ACTION_OPTIONS = [
  { value: "ordered", label: "הוזמן" },
  { value: "purchase", label: "התקבל" },
  { value: "consumption", label: "צריכה" },
  { value: "adjustment", label: "תיאום" },
  { value: "loss", label: "אובדן" },
] as const;

export function StockUpdateForm({ materialId }: { materialId: string }) {
  const [action, setAction] = useState("purchase");
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const qty = parseFloat(quantity);
    if (!qty || qty <= 0) return;

    startTransition(async () => {
      await addStockLogAction(materialId, action, qty, notes || undefined);
      setQuantity("");
      setNotes("");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border p-4 space-y-4">
      {/* Action select */}
      <div className="space-y-1.5">
        <Label>פעולה</Label>
        <Select value={action} onValueChange={(v) => { if (v) setAction(v as string); }}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ACTION_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Quantity */}
      <div className="space-y-1.5">
        <Label htmlFor="stock-qty">
          כמות {action === "adjustment" ? "(מלאי חדש)" : ""}
        </Label>
        <Input
          id="stock-qty"
          type="number"
          step="0.001"
          min="0.001"
          placeholder="0"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          required
        />
      </div>

      {/* Notes */}
      <div className="space-y-1.5">
        <Label htmlFor="stock-notes">הערות</Label>
        <Textarea
          id="stock-notes"
          placeholder="הערות אופציונליות..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
        />
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending || !quantity}>
          {isPending ? "שומר..." : "עדכן מלאי"}
        </Button>
        {success && (
          <span className="text-sm text-green-600">המלאי עודכן בהצלחה</span>
        )}
      </div>
    </form>
  );
}
