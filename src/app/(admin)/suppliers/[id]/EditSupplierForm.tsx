"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type InitialData = {
  id: string;
  name: string;
  website?: string | null;
  email?: string | null;
  phone?: string | null;
  notes?: string | null;
};

interface EditSupplierFormProps {
  supplier: InitialData;
  action: (formData: FormData) => Promise<void>;
}

export function EditSupplierForm({ supplier, action }: EditSupplierFormProps) {
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(() => action(formData));
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="edit-name">
          שם הספק <span className="text-destructive">*</span>
        </Label>
        <Input
          id="edit-name"
          name="name"
          defaultValue={supplier.name}
          required
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="edit-phone">טלפון ראשי</Label>
          <Input
            id="edit-phone"
            name="phone"
            type="tel"
            defaultValue={supplier.phone ?? ""}
            dir="ltr"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="edit-email">דוא״ל</Label>
          <Input
            id="edit-email"
            name="email"
            type="email"
            defaultValue={supplier.email ?? ""}
            dir="ltr"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="edit-website">אתר אינטרנט</Label>
        <Input
          id="edit-website"
          name="website"
          type="url"
          defaultValue={supplier.website ?? ""}
          dir="ltr"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="edit-notes">הערות</Label>
        <Textarea
          id="edit-notes"
          name="notes"
          defaultValue={supplier.notes ?? ""}
          rows={2}
        />
      </div>

      <Button type="submit" size="sm" disabled={isPending}>
        {isPending ? "שומר..." : "שמור שינויים"}
      </Button>
    </form>
  );
}
