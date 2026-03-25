"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { addSupplierContactAction, deleteSupplierContactAction } from "@/actions/suppliers";

type Contact = {
  id: string;
  name: string;
  role: string | null;
  phone: string | null;
  extension: string | null;
  email: string | null;
};

interface ContactsSectionProps {
  supplierId: string;
  contacts: Contact[];
}

export function ContactsSection({ supplierId, contacts }: ContactsSectionProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [phone, setPhone] = useState("");
  const [ext, setExt] = useState("");
  const [email, setEmail] = useState("");

  function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!name.trim()) return;
    const formData = new FormData();
    formData.set("name", name.trim());
    formData.set("role", role);
    formData.set("phone", phone);
    formData.set("extension", ext);
    formData.set("email", email);
    startTransition(async () => {
      await addSupplierContactAction(supplierId, formData);
      setName("");
      setRole("");
      setPhone("");
      setExt("");
      setEmail("");
      setOpen(false);
    });
  }

  function handleDelete(contactId: string) {
    startTransition(() => deleteSupplierContactAction(supplierId, contactId));
  }

  return (
    <div className="space-y-3">
      {contacts.length === 0 ? (
        <p className="text-sm text-muted-foreground">אין אנשי קשר עדיין</p>
      ) : (
        <div className="rounded-md border divide-y">
          {contacts.map((ct) => (
            <div key={ct.id} className="px-4 py-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium text-sm">{ct.name}</p>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground mt-0.5">
                  {ct.role && <span>{ct.role}</span>}
                  {ct.phone && (
                    <span>
                      {ct.phone}
                      {ct.extension && ` שלוחה ${ct.extension}`}
                    </span>
                  )}
                  {ct.email && <span>{ct.email}</span>}
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                disabled={isPending}
                onClick={() => handleDelete(ct.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen((v) => !v)}
        className="gap-1"
      >
        <Plus className="h-3.5 w-3.5" />
        הוסף איש קשר
        {open ? <ChevronUp className="h-3 w-3 mr-1" /> : <ChevronDown className="h-3 w-3 mr-1" />}
      </Button>

      {open && (
        <form onSubmit={handleAdd} className="rounded-lg border p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">
                שם <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="שם מלא"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-8 text-sm"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">תפקיד</Label>
              <Input
                placeholder="מנהל מכירות"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">טלפון</Label>
              <Input
                type="tel"
                placeholder="050-0000000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-8 text-sm"
                dir="ltr"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">שלוחה</Label>
              <Input
                placeholder="123"
                value={ext}
                onChange={(e) => setExt(e.target.value)}
                className="h-8 text-sm"
                dir="ltr"
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs">דוא״ל</Label>
              <Input
                type="email"
                placeholder="name@supplier.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-8 text-sm"
                dir="ltr"
              />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending ? "שומר..." : "הוסף"}
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
