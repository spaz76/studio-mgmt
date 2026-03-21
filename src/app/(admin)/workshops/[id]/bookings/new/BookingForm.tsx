"use client";

import { useActionState, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { BookingFormState } from "@/actions/bookings";
import { createCustomer } from "@/actions/bookings";
import { UserPlus } from "lucide-react";

interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
}

interface BookingFormProps {
  action: (prev: BookingFormState, formData: FormData) => Promise<BookingFormState>;
  customers: Customer[];
  spotsLeft: number;
  pricePerParticipant: number;
  studioId: string;
}

export function BookingForm({
  action,
  customers,
  spotsLeft,
  pricePerParticipant,
  studioId,
}: BookingFormProps) {
  const [state, formAction, isPending] = useActionState(action, {});
  const [participantCount, setParticipantCount] = useState(1);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerEmail, setNewCustomerEmail] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [createdCustomers, setCreatedCustomers] = useState<Customer[]>([]);
  const [isCreating, startCreateTransition] = useTransition();

  const allCustomers = [...customers, ...createdCustomers];

  function handleCreateCustomer() {
    if (!newCustomerName.trim()) return;
    startCreateTransition(async () => {
      const newC = await createCustomer(
        studioId,
        newCustomerName.trim(),
        newCustomerEmail || undefined,
        newCustomerPhone || undefined
      );
      const customer: Customer = {
        id: newC.id,
        name: newC.name,
        email: newC.email,
        phone: newC.phone,
      };
      setCreatedCustomers((prev) => [...prev, customer]);
      setSelectedCustomerId(newC.id);
      setNewCustomerName("");
      setNewCustomerEmail("");
      setNewCustomerPhone("");
      setShowNewCustomer(false);
    });
  }

  const totalPrice = pricePerParticipant * participantCount;

  return (
    <form action={formAction} className="space-y-5">
      {state.message && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {state.message}
        </div>
      )}

      {/* Customer Selection */}
      <div className="space-y-2">
        <Label htmlFor="customerId">לקוח *</Label>
        <div className="flex gap-2">
          <select
            id="customerId"
            name="customerId"
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
            className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-invalid={!!state.errors?.customerId}
          >
            <option value="">בחר לקוח...</option>
            {allCustomers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.phone ? ` — ${c.phone}` : ""}
              </option>
            ))}
          </select>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setShowNewCustomer((v) => !v)}
            title="הוסף לקוח חדש"
          >
            <UserPlus className="h-4 w-4" />
          </Button>
        </div>
        {state.errors?.customerId && (
          <p className="text-xs text-destructive">
            {state.errors.customerId[0]}
          </p>
        )}
      </div>

      {/* New Customer Quick-Create */}
      {showNewCustomer && (
        <div className="rounded-md border p-4 space-y-3 bg-muted/30">
          <div className="text-sm font-medium">לקוח חדש</div>
          <div className="space-y-1.5">
            <Label htmlFor="newName">שם *</Label>
            <Input
              id="newName"
              value={newCustomerName}
              onChange={(e) => setNewCustomerName(e.target.value)}
              placeholder="שם מלא"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="newEmail">דוא&quot;ל</Label>
              <Input
                id="newEmail"
                type="email"
                value={newCustomerEmail}
                onChange={(e) => setNewCustomerEmail(e.target.value)}
                placeholder="דוא&quot;ל"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="newPhone">טלפון</Label>
              <Input
                id="newPhone"
                value={newCustomerPhone}
                onChange={(e) => setNewCustomerPhone(e.target.value)}
                placeholder="05x-xxxxxxx"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              onClick={handleCreateCustomer}
              disabled={!newCustomerName.trim() || isCreating}
            >
              {isCreating ? "יוצר..." : "צור לקוח"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setShowNewCustomer(false)}
            >
              ביטול
            </Button>
          </div>
        </div>
      )}

      {/* Participant Count */}
      <div className="space-y-1.5">
        <Label htmlFor="participantCount">מספר משתתפים</Label>
        <NumberInput
          id="participantCount"
          name="participantCount"
          min={1}
          max={spotsLeft}
          value={participantCount}
          onChange={(e) => setParticipantCount(Number(e.target.value))}
        />
        {pricePerParticipant > 0 && (
          <p className="text-xs text-muted-foreground">
            סה&quot;כ לתשלום: ₪{totalPrice.toFixed(0)}
          </p>
        )}
      </div>

      {/* Notes */}
      <div className="space-y-1.5">
        <Label htmlFor="notes">הערות</Label>
        <Textarea
          id="notes"
          name="notes"
          placeholder="הערות מיוחדות, בקשות..."
          rows={2}
        />
      </div>

      <div className="flex gap-3 pt-2">
        <Button
          type="submit"
          disabled={isPending || !selectedCustomerId}
          className="flex-1 sm:flex-none"
        >
          {isPending ? "שומר..." : "אשר הזמנה"}
        </Button>
        <Button type="button" variant="outline" onClick={() => history.back()}>
          ביטול
        </Button>
      </div>
    </form>
  );
}
