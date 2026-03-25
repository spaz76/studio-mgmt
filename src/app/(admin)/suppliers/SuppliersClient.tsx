"use client";

import { useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Phone, Mail, Globe, Search } from "lucide-react";

type SupplierItem = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  materialSuppliers: unknown[];
  contacts: unknown[];
};

export function SuppliersClient({ suppliers }: { suppliers: SupplierItem[] }) {
  const [search, setSearch] = useState("");

  const filtered = search
    ? suppliers.filter((s) =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.email?.toLowerCase().includes(search.toLowerCase())
      )
    : suppliers;

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="חיפוש לפי שם ספק..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pr-9"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">לא נמצאו ספקים</p>
      ) : (
        <div className="rounded-md border divide-y">
          {filtered.map((supplier) => (
            <Link
              key={supplier.id}
              href={`/suppliers/${supplier.id}`}
              className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm">{supplier.name}</p>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground mt-0.5">
                  {supplier.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {supplier.phone}
                    </span>
                  )}
                  {supplier.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {supplier.email}
                    </span>
                  )}
                  {supplier.website && (
                    <span className="flex items-center gap-1">
                      <Globe className="h-3 w-3" />
                      {supplier.website}
                    </span>
                  )}
                  {supplier.materialSuppliers.length > 0 && (
                    <span>{supplier.materialSuppliers.length} חומרים</span>
                  )}
                  {supplier.contacts.length > 0 && (
                    <span>{supplier.contacts.length} אנשי קשר</span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
