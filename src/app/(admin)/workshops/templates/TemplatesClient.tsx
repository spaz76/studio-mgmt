"use client";

import { useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Plus, Clock, Users, Pencil, Search } from "lucide-react";
import { buttonVariants } from "@/components/ui/button-variants";
import { DeleteTemplateButton } from "./DeleteTemplateButton";

const WORKSHOP_TYPE_LABELS: Record<string, string> = {
  REGULAR: "רגילה",
  RECURRING: "מחזורית",
  CLASS: "חוג",
  SEASONAL: "עונתית",
  EVENT: "אירוע",
  PARENT_CHILD: "הורה-ילד",
};

type TemplateItem = {
  id: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  minParticipants: number;
  maxParticipants: number;
  defaultPrice: { toString(): string } | number;
  tags: string[];
  isActive: boolean;
  usageCount: number;
  workshopType: string;
  images: { url: string; alt: string | null }[];
  _count: { workshopEvents: number };
};

export function TemplatesClient({ templates }: { templates: TemplateItem[] }) {
  const [search, setSearch] = useState("");

  const filtered = search
    ? templates.filter((t) =>
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.description?.toLowerCase().includes(search.toLowerCase())
      )
    : templates;

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="חיפוש לפי שם תבנית..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pr-9"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">לא נמצאו תבניות</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((t) => {
            const primaryImage = t.images[0];
            return (
              <Card key={t.id} className={t.isActive ? "" : "opacity-60"}>
                {primaryImage && (
                  <div className="w-full h-36 bg-muted/20 rounded-t-lg overflow-hidden flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={primaryImage.url}
                      alt={primaryImage.alt ?? t.name}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                )}
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base leading-tight">
                      {t.name}
                    </CardTitle>
                    <div className="flex gap-1 shrink-0 flex-wrap justify-end">
                      {!t.isActive && (
                        <Badge variant="outline" className="text-xs">
                          לא פעיל
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {WORKSHOP_TYPE_LABELS[t.workshopType] ?? t.workshopType}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {t._count.workshopEvents} אירועים
                      </Badge>
                    </div>
                  </div>
                  {t.description && (
                    <CardDescription className="text-sm line-clamp-2">
                      {t.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-3">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {t.durationMinutes} דקות
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {t.minParticipants}–{t.maxParticipants} משתתפים
                    </span>
                    {Number(t.defaultPrice) > 0 && (
                      <span>₪{Number(t.defaultPrice).toFixed(0)}</span>
                    )}
                  </div>
                  {t.usageCount > 0 && (
                    <p className="text-xs text-muted-foreground mb-3">
                      שימש ל-{t.usageCount} אירועים
                    </p>
                  )}
                  {t.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {t.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Link
                      href={`/workshops/templates/${t.id}/edit`}
                      className={cn(
                        buttonVariants({ variant: "outline", size: "sm" }),
                        "flex-1"
                      )}
                    >
                      <Pencil className="h-3.5 w-3.5 ml-1" />
                      עריכה
                    </Link>
                    <Link
                      href={`/workshops/new?templateId=${t.id}`}
                      className={cn(
                        buttonVariants({ variant: "default", size: "sm" }),
                        "flex-1"
                      )}
                    >
                      <Plus className="h-3.5 w-3.5 ml-1" />
                      צור אירוע
                    </Link>
                  </div>
                  <div className="mt-2">
                    <DeleteTemplateButton
                      id={t.id}
                      name={t.name}
                      eventCount={t._count.workshopEvents}
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
