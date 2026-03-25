"use client";

import { useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Search, CalendarDays, Users, MapPin } from "lucide-react";
import { STATUS_LABELS, STATUS_VARIANTS } from "@/lib/workshop-status";
import { formatEventDate } from "@/lib/format-date";
import type { WorkshopStatus } from "@/generated/prisma";

type EventItem = {
  id: string;
  title: string;
  startsAt: Date;
  endsAt: Date;
  status: WorkshopStatus;
  maxParticipants: number;
  minParticipants: number;
  price: { toString(): string } | string | number;
  location: string | null;
  template: { name: string } | null;
  bookings: { participantCount: number }[];
};

function EventCard({ e, muted }: { e: EventItem; muted?: boolean }) {
  const booked = e.bookings.reduce((s, b) => s + b.participantCount, 0);
  const spotsLeft = e.maxParticipants - booked;
  const d = formatEventDate(new Date(e.startsAt));

  return (
    <Link key={e.id} href={`/workshops/${e.id}`}>
      <Card
        className={cn(
          "hover:border-primary/50 hover:shadow-sm transition-all cursor-pointer h-full",
          muted && "opacity-70"
        )}
      >
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base leading-tight">
              {e.title}
            </CardTitle>
            <Badge
              variant={STATUS_VARIANTS[e.status]}
              className="text-xs shrink-0"
            >
              {STATUS_LABELS[e.status]}
            </Badge>
          </div>
          {e.template && (
            <p className="text-xs text-muted-foreground">
              {e.template.name}
            </p>
          )}
        </CardHeader>
        <CardContent className="pt-0 space-y-1.5 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5 flex-wrap">
            <CalendarDays className="h-3.5 w-3.5 shrink-0" />
            <span>{d.day}</span>
            <span className="text-muted-foreground/50">|</span>
            <span>{d.date}</span>
            <span className="text-muted-foreground/50">|</span>
            <span>{d.time}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            <span>
              {booked}/{e.maxParticipants} משתתפים
              {spotsLeft > 0 && spotsLeft <= 3 && (
                <span className="text-orange-500 mr-1">
                  ({spotsLeft} מקומות נותרו)
                </span>
              )}
            </span>
          </div>
          {e.location && (
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              <span className="break-words">{e.location}</span>
            </div>
          )}
          {Number(e.price) > 0 && (
            <div className="font-medium text-foreground">
              ₪{Number(e.price).toFixed(0)} למשתתף
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

export function WorkshopsClient({
  upcoming,
  past,
}: {
  upcoming: EventItem[];
  past: EventItem[];
}) {
  const [search, setSearch] = useState("");

  const filterEvents = (events: EventItem[]) =>
    search
      ? events.filter((e) =>
          e.title.toLowerCase().includes(search.toLowerCase()) ||
          e.template?.name.toLowerCase().includes(search.toLowerCase())
        )
      : events;

  const filteredUpcoming = filterEvents(upcoming);
  const filteredPast = filterEvents(past);

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="חיפוש לפי שם אירוע..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pr-9"
        />
      </div>

      {filteredUpcoming.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3">קרובות</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredUpcoming.map((e) => (
              <EventCard key={e.id} e={e} />
            ))}
          </div>
        </section>
      )}
      {filteredPast.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3 text-muted-foreground">
            עבר / מבוטל
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredPast.map((e) => (
              <EventCard key={e.id} e={e} muted />
            ))}
          </div>
        </section>
      )}

      {filteredUpcoming.length === 0 && filteredPast.length === 0 && (
        <p className="text-center text-muted-foreground py-8">לא נמצאו אירועים</p>
      )}
    </div>
  );
}
