"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, ChevronLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { WorkshopType } from "@/generated/prisma";

const TYPE_COLORS: Record<WorkshopType | string, string> = {
  REGULAR: "bg-blue-500 text-white",
  RECURRING: "bg-green-500 text-white",
  CLASS: "bg-purple-500 text-white",
  SEASONAL: "bg-orange-500 text-white",
  EVENT: "bg-pink-500 text-white",
  PARENT_CHILD: "bg-yellow-500 text-black",
};

const HE_MONTHS = [
  "ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני",
  "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר",
];

const HE_DAYS_SHORT = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"];

interface CalendarEvent {
  id: string;
  title: string;
  startsAt: Date;
  endsAt: Date;
  workshopType: WorkshopType | null;
}

interface Props {
  events: CalendarEvent[];
}

export function CalendarClient({ events }: Props) {
  const router = useRouter();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth()); // 0-based

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  }

  function nextMonth() {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  }

  // Build the grid — weeks start on Sunday (day 0)
  const firstDay = new Date(year, month, 1);
  const startDow = firstDay.getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Total cells: pad front + days + pad back to multiple of 7
  const totalCells = Math.ceil((startDow + daysInMonth) / 7) * 7;
  const cells: Array<number | null> = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length < totalCells) cells.push(null);

  const weeks: Array<Array<number | null>> = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  // Index events by day
  const eventsByDay: Record<number, CalendarEvent[]> = {};
  events.forEach((ev) => {
    const d = new Date(ev.startsAt);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate();
      if (!eventsByDay[day]) eventsByDay[day] = [];
      eventsByDay[day].push(ev);
    }
  });

  const todayDate = today.getDate();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">לוח שנה</h1>
          <p className="text-sm text-muted-foreground">
            {HE_MONTHS[month]} {year}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={prevMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setYear(today.getFullYear()); setMonth(today.getMonth()); }}
          >
            היום
          </Button>
          <Button variant="outline" size="sm" onClick={nextMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 text-xs">
        {Object.entries({
          REGULAR: "רגילה",
          RECURRING: "מתמשכת",
          CLASS: "חוג",
          SEASONAL: "עונתית",
          EVENT: "אירוע",
          PARENT_CHILD: "הורה-ילד",
        }).map(([type, label]) => (
          <span key={type} className={`px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[type]}`}>
            {label}
          </span>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="border rounded-lg overflow-hidden">
        {/* Day-of-week header */}
        <div className="grid grid-cols-7 bg-muted">
          {HE_DAYS_SHORT.map((d) => (
            <div key={d} className="py-2 text-center text-xs font-medium text-muted-foreground">
              {d}
            </div>
          ))}
        </div>

        {/* Weeks */}
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 divide-x divide-x-reverse border-t">
            {week.map((day, di) => {
              const dayEvents = day ? (eventsByDay[day] ?? []) : [];
              const isToday = isCurrentMonth && day === todayDate;
              return (
                <div
                  key={di}
                  className={`min-h-[80px] p-1 relative ${day ? "bg-background" : "bg-muted/30"} ${di < 6 ? "border-l" : ""}`}
                >
                  {day !== null && (
                    <>
                      {/* Day number + add button */}
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`text-xs font-medium inline-flex h-6 w-6 items-center justify-center rounded-full ${
                            isToday
                              ? "bg-primary text-primary-foreground"
                              : "text-foreground"
                          }`}
                        >
                          {day}
                        </span>
                        <button
                          onClick={() => router.push(`/workshops/new?date=${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`)}
                          className="opacity-0 group-hover:opacity-100 hover:opacity-100 p-0.5 rounded hover:bg-muted"
                          title="צור אירוע"
                        >
                          <Plus className="h-3 w-3 text-muted-foreground" />
                        </button>
                      </div>

                      {/* Events */}
                      <div className="space-y-0.5">
                        {dayEvents.slice(0, 3).map((ev) => (
                          <button
                            key={ev.id}
                            onClick={() => router.push(`/workshops/${ev.id}`)}
                            className={`w-full text-right text-xs px-1.5 py-0.5 rounded truncate block ${
                              TYPE_COLORS[ev.workshopType ?? "REGULAR"]
                            } hover:opacity-80 transition-opacity`}
                          >
                            {ev.title}
                          </button>
                        ))}
                        {dayEvents.length > 3 && (
                          <span className="text-xs text-muted-foreground px-1">
                            +{dayEvents.length - 3} נוספים
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
