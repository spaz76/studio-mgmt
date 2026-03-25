"use client";

import { useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import type { StockStatus } from "@/services/materials";

type MaterialItem = {
  id: string;
  name: string;
  unit: string;
  stockQuantity: { toString(): string } | number;
  stockStatus: StockStatus;
  description: string | null;
  notes: string | null;
};

const STATUS_DOT: Record<StockStatus, string> = {
  green: "bg-green-500",
  yellow: "bg-yellow-400",
  orange: "bg-orange-500",
  red: "bg-red-600",
};

const STATUS_LABEL: Record<StockStatus, string> = {
  green: "תקין",
  yellow: "מלאי נמוך",
  orange: "מלאי בינוני",
  red: "מלאי קריטי",
};

type FilterType = "all" | "low";

export function MaterialsClient({
  materials,
  initialLowStock,
}: {
  materials: MaterialItem[];
  initialLowStock?: boolean;
}) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>(initialLowStock ? "low" : "all");

  const filtered = materials.filter((m) => {
    const matchesSearch =
      !search ||
      m.name.includes(search) ||
      m.name.toLowerCase().includes(search.toLowerCase());

    const matchesFilter =
      filter === "all" ||
      (filter === "low" && (m.stockStatus === "red" || m.stockStatus === "orange" || m.stockStatus === "yellow"));

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-4">
      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="חיפוש לפי שם..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-9"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
          >
            הכל
          </Button>
          <Button
            variant={filter === "low" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("low")}
          >
            מלאי נמוך
          </Button>
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">לא נמצאו חומרים</p>
      ) : (
        <div className="rounded-md border divide-y">
          {filtered.map((material) => (
            <Link
              key={material.id}
              href={`/materials/${material.id}`}
              className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {/* Status dot */}
                <span
                  className={`inline-block h-2.5 w-2.5 rounded-full shrink-0 ${STATUS_DOT[material.stockStatus]}`}
                  title={STATUS_LABEL[material.stockStatus]}
                />
                <div className="min-w-0">
                  <p className="font-medium text-sm">{material.name}</p>
                  {material.description && (
                    <p className="text-xs text-muted-foreground break-words">{material.description}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-left">
                  <p className="text-sm font-medium tabular-nums">
                    {Number(material.stockQuantity).toLocaleString("he-IL")}
                  </p>
                  <p className="text-xs text-muted-foreground">{material.unit}</p>
                </div>
                <Badge
                  variant="outline"
                  className={
                    material.stockStatus === "green"
                      ? "border-green-300 text-green-700 bg-green-50"
                      : material.stockStatus === "yellow"
                      ? "border-yellow-300 text-yellow-700 bg-yellow-50"
                      : material.stockStatus === "orange"
                      ? "border-orange-300 text-orange-700 bg-orange-50"
                      : "border-red-300 text-red-700 bg-red-50"
                  }
                >
                  {STATUS_LABEL[material.stockStatus]}
                </Badge>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
