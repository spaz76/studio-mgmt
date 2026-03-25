"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateCustomerAction } from "@/actions/customers";

type CustomerData = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  tags: string[];
  preferredContactMethod: string | null;
};

export function EditCustomerDialog({
  customer,
  onClose,
}: {
  customer: CustomerData;
  onClose: () => void;
}) {
  const [preferredContact, setPreferredContact] = useState(
    customer.preferredContactMethod ?? ""
  );
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("preferredContactMethod", preferredContact);
    startTransition(async () => {
      await updateCustomerAction(customer.id, formData);
      onClose();
    });
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent dir="rtl">
        <DialogHeader>
          <DialogTitle>עדכון פרטי לקוח</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="ec-name">שם *</Label>
            <Input id="ec-name" name="name" defaultValue={customer.name} required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ec-phone">טלפון</Label>
              <Input id="ec-phone" name="phone" type="tel" defaultValue={customer.phone ?? ""} dir="ltr" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ec-email">מייל</Label>
              <Input id="ec-email" name="email" type="email" defaultValue={customer.email ?? ""} dir="ltr" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>אמצעי תקשורת מועדף</Label>
            <Select value={preferredContact} onValueChange={(v) => setPreferredContact(v ?? "")}>
              <SelectTrigger>
                <SelectValue placeholder="בחר..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">ללא העדפה</SelectItem>
                <SelectItem value="phone">טלפון</SelectItem>
                <SelectItem value="whatsapp">וואטסאפ</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
                <SelectItem value="email">מייל</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ec-tags">תגיות (מופרדות בפסיק)</Label>
            <Input
              id="ec-tags"
              name="tags"
              defaultValue={customer.tags.join(", ")}
              placeholder="VIP, חוזר, חד-פעמי..."
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ec-notes">הערות</Label>
            <Textarea
              id="ec-notes"
              name="notes"
              defaultValue={customer.notes ?? ""}
              rows={3}
              placeholder="הערות..."
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              ביטול
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "שומר..." : "שמור"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
