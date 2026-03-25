"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";

type Contact = {
  name: string;
  role: string;
  phone: string;
  extension: string;
  email: string;
};

type InitialData = {
  id?: string;
  name?: string;
  website?: string | null;
  email?: string | null;
  phone?: string | null;
  notes?: string | null;
};

interface SupplierFormProps {
  action: (formData: FormData) => Promise<void | { error: string }>;
  initialData?: InitialData;
  submitLabel?: string;
}

function emptyContact(): Contact {
  return { name: "", role: "", phone: "", extension: "", email: "" };
}

export function SupplierForm({
  action,
  initialData,
  submitLabel = "שמור",
}: SupplierFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [error, setError] = useState<string | null>(null);

  function addContact() {
    setContacts((c) => [...c, emptyContact()]);
  }

  function removeContact(i: number) {
    setContacts((c) => c.filter((_, idx) => idx !== i));
  }

  function updateContact(i: number, field: keyof Contact, value: string) {
    setContacts((c) =>
      c.map((ct, idx) => (idx === i ? { ...ct, [field]: value } : ct))
    );
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    formData.set("contacts", JSON.stringify(contacts));
    startTransition(async () => {
      try {
        await action(formData);
      } catch {
        setError("שגיאה בשמירת הספק");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded-md bg-destructive/10 text-destructive text-sm px-3 py-2">
          {error}
        </div>
      )}

      {/* Name */}
      <div className="space-y-1.5">
        <Label htmlFor="name">
          שם הספק <span className="text-destructive">*</span>
        </Label>
        <Input
          id="name"
          name="name"
          placeholder="שם הספק"
          defaultValue={initialData?.name ?? ""}
          required
        />
      </div>

      {/* Website */}
      <div className="space-y-1.5">
        <Label htmlFor="website">אתר אינטרנט</Label>
        <Input
          id="website"
          name="website"
          type="url"
          placeholder="https://example.com"
          defaultValue={initialData?.website ?? ""}
          dir="ltr"
        />
      </div>

      {/* Email */}
      <div className="space-y-1.5">
        <Label htmlFor="email">דוא״ל</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="info@supplier.com"
          defaultValue={initialData?.email ?? ""}
          dir="ltr"
        />
      </div>

      {/* Phone */}
      <div className="space-y-1.5">
        <Label htmlFor="phone">טלפון ראשי</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          placeholder="03-0000000"
          defaultValue={initialData?.phone ?? ""}
          dir="ltr"
        />
      </div>

      {/* Notes */}
      <div className="space-y-1.5">
        <Label htmlFor="notes">הערות</Label>
        <Textarea
          id="notes"
          name="notes"
          placeholder="הערות כלליות על הספק..."
          defaultValue={initialData?.notes ?? ""}
          rows={2}
        />
      </div>

      {/* Contacts */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>אנשי קשר</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addContact}
          >
            <Plus className="h-3.5 w-3.5 ml-1" />
            הוסף איש קשר
          </Button>
        </div>

        {contacts.map((ct, i) => (
          <div key={i} className="rounded-lg border p-4 space-y-3 bg-muted/20">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                איש קשר {i + 1}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                onClick={() => removeContact(i)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">
                  שם <span className="text-destructive">*</span>
                </Label>
                <Input
                  placeholder="שם מלא"
                  value={ct.name}
                  onChange={(e) => updateContact(i, "name", e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">תפקיד</Label>
                <Input
                  placeholder="מנהל מכירות"
                  value={ct.role}
                  onChange={(e) => updateContact(i, "role", e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">טלפון</Label>
                <Input
                  type="tel"
                  placeholder="050-0000000"
                  value={ct.phone}
                  onChange={(e) => updateContact(i, "phone", e.target.value)}
                  className="h-8 text-sm"
                  dir="ltr"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">שלוחה</Label>
                <Input
                  placeholder="123"
                  value={ct.extension}
                  onChange={(e) =>
                    updateContact(i, "extension", e.target.value)
                  }
                  className="h-8 text-sm"
                  dir="ltr"
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs">דוא״ל</Label>
                <Input
                  type="email"
                  placeholder="name@supplier.com"
                  value={ct.email}
                  onChange={(e) => updateContact(i, "email", e.target.value)}
                  className="h-8 text-sm"
                  dir="ltr"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

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
