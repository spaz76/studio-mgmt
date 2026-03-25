"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Flame, Plus, Thermometer, Package, Search } from "lucide-react";

type KilnItem = {
  id: string;
  name: string;
  type: string | null;
  maxTemp: number | null;
  capacity: string | null;
  isActive: boolean;
  currentStatus: string;
  _count: { firings: number };
};

const KILN_TYPE_LABELS: Record<string, string> = {
  electric: "חשמלי",
  gas: "גז",
  wood: "עצים",
  raku: "ראקו",
};

function statusBadge(status: string) {
  switch (status) {
    case "פנוי":
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200" variant="outline">
          פנוי
        </Badge>
      );
    case "firing":
      return (
        <Badge className="bg-red-100 text-red-800 border-red-200" variant="outline">
          בשריפה
        </Badge>
      );
    case "cooling":
      return (
        <Badge className="bg-blue-100 text-blue-800 border-blue-200" variant="outline">
          מתקרר
        </Badge>
      );
    case "loading":
      return (
        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200" variant="outline">
          טוען
        </Badge>
      );
    case "unloading":
      return (
        <Badge className="bg-orange-100 text-orange-800 border-orange-200" variant="outline">
          פורק
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-200">
          {status}
        </Badge>
      );
  }
}

export function KilnsClient({ kilns }: { kilns: KilnItem[] }) {
  const [search, setSearch] = useState("");
  const filtered = search
    ? kilns.filter((k) => k.name.toLowerCase().includes(search.toLowerCase()))
    : kilns;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="חיפוש לפי שם תנור..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-9"
          />
        </div>
        <Link href="/kilns/new">
          <Button size="sm">
            <Plus className="h-4 w-4 ml-1" />
            הוסף תנור
          </Button>
        </Link>
      </div>

      {filtered.length === 0 && kilns.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Flame className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p>אין תנורים עדיין</p>
          <Link href="/kilns/new" className="mt-3 inline-block">
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 ml-1" />
              הוסף תנור ראשון
            </Button>
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">לא נמצאו תנורים</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((kiln) => (
            <Link key={kiln.id} href={`/kilns/${kiln.id}`} className="block group">
              <Card className="h-full transition-shadow group-hover:shadow-md">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h2 className="font-semibold text-base truncate">{kiln.name}</h2>
                      {kiln.type && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {KILN_TYPE_LABELS[kiln.type] ?? kiln.type}
                        </p>
                      )}
                    </div>
                    {statusBadge(kiln.currentStatus)}
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    {kiln.maxTemp && (
                      <span className="flex items-center gap-1">
                        <Thermometer className="h-3.5 w-3.5" />
                        עד {kiln.maxTemp}°C
                      </span>
                    )}
                    {kiln.capacity && (
                      <span className="flex items-center gap-1">
                        <Package className="h-3.5 w-3.5" />
                        {kiln.capacity}
                      </span>
                    )}
                    <span>{kiln._count.firings} שריפות</span>
                    {!kiln.isActive && (
                      <span className="text-red-500">לא פעיל</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
