"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CustomerActions } from "@/components/CustomerActions";
import { Search, MessageCircle } from "lucide-react";

type CustomerItem = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  tags: string[];
  _count: { bookings: number };
  bookings: Array<{
    payments: Array<{ amount: { toString(): string } | string | number; status?: string }>;
  }>;
};

function tagClass(tag: string) {
  switch (tag) {
    case "VIP":
      return "bg-purple-100 text-purple-800 border-purple-200";
    case "חוזר":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "חד-פעמי":
      return "bg-gray-100 text-gray-600 border-gray-200";
    default:
      return "bg-muted text-muted-foreground border-input";
  }
}

export function CustomersList({ customers }: { customers: CustomerItem[] }) {
  const [search, setSearch] = useState("");

  const filtered = search
    ? customers.filter(
        (c) =>
          c.name.includes(search) ||
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.email?.toLowerCase().includes(search.toLowerCase()) ||
          c.phone?.includes(search)
      )
    : customers;

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="חיפוש לפי שם, מייל, טלפון..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pr-9"
        />
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">לא נמצאו לקוחות</p>
      ) : (
        <div className="rounded-md border divide-y">
          {filtered.map((customer) => {
            const openDebt = customer.bookings
              .flatMap((b) => b.payments)
              .filter((p) => !p.status || p.status === "pending" || p.status === "partial")
              .reduce((s, p) => s + Number(p.amount), 0);

            return (
              <div
                key={customer.id}
                className="flex items-center justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      href={`/customers/${customer.id}`}
                      className="font-medium text-sm hover:underline"
                    >
                      {customer.name}
                    </Link>
                    {customer.tags.map((tag) => (
                      <Badge
                        key={tag}
                        className={`text-xs border ${tagClass(tag)}`}
                        variant="outline"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5 flex flex-wrap gap-x-2">
                    {customer.phone && <span>{customer.phone}</span>}
                    {customer.email && <span>{customer.email}</span>}
                    <span>{customer._count.bookings} הזמנות</span>
                    {openDebt > 0 && (
                      <span className="text-red-600 font-medium">חוב: ₪{openDebt.toFixed(0)}</span>
                    )}
                  </div>
                  {openDebt > 0 && customer.phone && (
                    <div className="mt-1">
                      <a
                        href={`https://wa.me/${customer.phone.replace(/\D/g, "")}?text=${encodeURIComponent(`שלום ${customer.name}, נשמח לתזכורת שיש לך חוב פתוח בסך ₪${openDebt.toFixed(0)}. תודה!`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          buttonVariants({ variant: "ghost", size: "sm" }),
                          "h-6 px-2 text-xs text-green-700 hover:text-green-900 hover:bg-green-50"
                        )}
                      >
                        <MessageCircle className="h-3 w-3 ml-1" />
                        תזכורת חוב
                      </a>
                    </div>
                  )}
                </div>
                <div className="shrink-0">
                  <CustomerActions
                    name={customer.name}
                    phone={customer.phone}
                    email={customer.email}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
