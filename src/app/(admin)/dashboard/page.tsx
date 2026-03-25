import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getStudioId } from "@/lib/studio";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getDashboardData } from "@/services/dashboard";
import { getOpenRemindersCount, getReminders } from "@/services/reminders";
import { TasksPanel } from "./TasksPanel";
import {
  CalendarDays,
  ClipboardList,
  CreditCard,
  AlertTriangle,
  ArrowLeft,
  UserPlus,
  ShoppingCart,
  Flame,
  Bell,
  Plus,
} from "lucide-react";
import { STATUS_LABELS, STATUS_VARIANTS } from "@/lib/workshop-status";
import { formatEventDate } from "@/lib/format-date";

export const metadata = { title: "לוח בקרה" };

const summaryConfig = [
  {
    key: "eventsThisWeek" as const,
    label: "סדנאות השבוע",
    icon: CalendarDays,
    href: "/workshops",
    pastel: "bg-blue-50",
    iconColor: "text-blue-500",
    numColor: "text-blue-700",
  },
  {
    key: "openBookings" as const,
    label: "הזמנות פתוחות",
    icon: ClipboardList,
    href: "/workshops",
    pastel: "bg-orange-50",
    iconColor: "text-orange-500",
    numColor: "text-orange-700",
  },
  {
    key: "pendingPayments" as const,
    label: "תשלומים ממתינים",
    icon: CreditCard,
    href: "/payments",
    pastel: "bg-pink-50",
    iconColor: "text-pink-500",
    numColor: "text-pink-700",
  },
  {
    key: "lowStockAlerts" as const,
    label: "התראות מלאי",
    icon: AlertTriangle,
    href: "/materials",
    pastel: "bg-yellow-50",
    iconColor: "text-yellow-500",
    numColor: "text-yellow-700",
  },
];

const quickActions = [
  { href: "/workshops/new", label: "סדנה חדשה", icon: CalendarDays, pastel: "bg-blue-50", iconColor: "text-blue-500" },
  { href: "/customers/new", label: "לקוח חדש", icon: UserPlus, pastel: "bg-green-50", iconColor: "text-green-500" },
  { href: "/payments/new", label: "מכירה", icon: ShoppingCart, pastel: "bg-purple-50", iconColor: "text-purple-500" },
  { href: "/kilns/new", label: "שריפת תנור", icon: Flame, pastel: "bg-orange-50", iconColor: "text-orange-500" },
  { href: "/reminders/new", label: "תזכורת", icon: Bell, pastel: "bg-pink-50", iconColor: "text-pink-500" },
];

export default async function DashboardPage() {
  const session = await auth();
  const studioId = await getStudioId();

  const [data, openRemindersCount, openReminders, studioRow] = await Promise.all([
    getDashboardData(prisma, studioId),
    getOpenRemindersCount(prisma, studioId),
    getReminders(prisma, studioId, { status: "open" }),
    prisma.studio.findUnique({
      where: { id: studioId },
      select: { name: true, logoUrl: true },
    }),
  ]);

  const userName = session?.user?.name?.split(" ")[0] ?? "";
  const studioName = studioRow?.name ?? "";
  const logoUrl = studioRow?.logoUrl ?? null;

  return (
    <div className="space-y-6">

      {/* ── Greeting Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            היי {userName} 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {new Intl.DateTimeFormat("he-IL", {
              weekday: "long",
              day: "numeric",
              month: "long",
            }).format(new Date())}
          </p>
        </div>
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={studioName}
            className="h-12 w-12 rounded-full object-cover shadow ring-2 ring-white"
            style={{ outlineColor: "var(--studio-primary)" }}
          />
        ) : studioName ? (
          <span
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white shadow"
            style={{ backgroundColor: "var(--studio-primary)" }}
          >
            {studioName.charAt(0)}
          </span>
        ) : null}
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {summaryConfig.map((c) => {
          const Icon = c.icon;
          const value = data.summary[c.key];
          return (
            <Link key={c.key} href={c.href}>
              <div className={`${c.pastel} rounded-2xl p-4 hover:shadow-md transition-shadow cursor-pointer h-full`}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">{c.label}</p>
                    <p className={`text-3xl font-bold mt-1 ${c.numColor}`}>{value}</p>
                  </div>
                  <span className={`${c.pastel} rounded-xl p-2`}>
                    <Icon className={`h-6 w-6 ${c.iconColor}`} />
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* ── Quick Actions ── */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground mb-3">פעולות מהירות</h2>
        <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href}
                href={action.href}
                className="flex flex-col items-center gap-1.5 shrink-0"
              >
                <span
                  className={`${action.pastel} h-14 w-14 flex items-center justify-center rounded-2xl shadow-sm hover:shadow-md transition-shadow`}
                >
                  <Icon className={`h-6 w-6 ${action.iconColor}`} />
                </span>
                <span className="text-[11px] font-medium text-muted-foreground text-center whitespace-nowrap">
                  {action.label}
                </span>
              </Link>
            );
          })}
          {/* Generic + button */}
          <Link
            href="/workshops/new"
            className="flex flex-col items-center gap-1.5 shrink-0"
          >
            <span
              className="h-14 w-14 flex items-center justify-center rounded-2xl shadow-sm hover:shadow-md transition-shadow"
              style={{ backgroundColor: "color-mix(in srgb, var(--studio-primary) 12%, transparent)" }}
            >
              <Plus className="h-6 w-6" style={{ color: "var(--studio-primary)" }} />
            </span>
            <span className="text-[11px] font-medium text-muted-foreground text-center">
              עוד
            </span>
          </Link>
        </div>
      </div>

      {/* ── Main grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Tasks + Reminders panel — col 1 */}
        <div className="space-y-4">
          <Card className="rounded-2xl shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">משימות</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <TasksPanel tasks={data.tasks} />
            </CardContent>
          </Card>

          {/* Open reminders */}
          {openRemindersCount > 0 && (
            <Card className="rounded-2xl shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    תזכורות פתוחות
                    <Badge className="bg-blue-100 text-blue-800 border-blue-200 border text-xs" variant="outline">
                      {openRemindersCount}
                    </Badge>
                  </CardTitle>
                  <Link
                    href="/reminders"
                    className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                  >
                    צפה בהכל
                    <ArrowLeft className="h-3 w-3" />
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="space-y-1">
                {openReminders.slice(0, 5).map((r) => (
                  <Link
                    key={r.id}
                    href="/reminders"
                    className="flex items-center justify-between rounded-xl p-2 hover:bg-muted text-sm"
                  >
                    <span className="truncate">{r.title}</span>
                    {r.dueAt && (
                      <span className="text-xs text-muted-foreground shrink-0 mr-2">
                        {new Intl.DateTimeFormat("he-IL", { day: "numeric", month: "short" }).format(new Date(r.dueAt))}
                      </span>
                    )}
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Upcoming events — col 2 */}
        <Card className="rounded-2xl shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">אירועים קרובים</CardTitle>
              <Link
                href="/workshops"
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                צפה בהכל
                <ArrowLeft className="h-3 w-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.upcomingEvents.length === 0 && (
              <p className="text-sm text-muted-foreground">אין אירועים קרובים</p>
            )}

            {data.upcomingEvents.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  ב-7 ימים הקרובים
                </p>
                {data.upcomingEvents.map((ev) => (
                  <Link
                    key={ev.id}
                    href={`/workshops/${ev.id}`}
                    className="flex items-center justify-between rounded-xl p-2.5 hover:bg-muted text-sm border border-transparent hover:border-border/50 transition-colors"
                  >
                    <div>
                      <p className="font-medium">{ev.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {(() => {
                          const d = formatEventDate(new Date(ev.startsAt));
                          return (
                            <>
                              <span>{d.day}</span>
                              <span className="mx-1 text-muted-foreground/40">|</span>
                              <span>{d.date}</span>
                              <span className="mx-1 text-muted-foreground/40">|</span>
                              <span>{d.time}</span>
                            </>
                          );
                        })()}
                      </p>
                    </div>
                    <Badge variant={STATUS_VARIANTS[ev.status]} className="text-xs shrink-0">
                      {STATUS_LABELS[ev.status]}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}

            {data.unconfirmedEvents.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  ממתינים לאישור
                </p>
                {data.unconfirmedEvents.map((ev) => (
                  <Link
                    key={ev.id}
                    href={`/workshops/${ev.id}`}
                    className="flex items-center justify-between rounded-xl p-2.5 hover:bg-muted text-sm border border-transparent hover:border-border/50 transition-colors"
                  >
                    <div>
                      <p className="font-medium">{ev.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {(() => {
                          const d = formatEventDate(new Date(ev.startsAt));
                          return (
                            <>
                              <span>{d.day}</span>
                              <span className="mx-1 text-muted-foreground/40">|</span>
                              <span>{d.date}</span>
                              <span className="mx-1 text-muted-foreground/40">|</span>
                              <span>{d.time}</span>
                            </>
                          );
                        })()}
                      </p>
                    </div>
                    <Badge variant={STATUS_VARIANTS[ev.status]} className="text-xs shrink-0">
                      {STATUS_LABELS[ev.status]}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payments + Low stock — col 3 */}
        <div className="space-y-4">
          <Card className="rounded-2xl shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">תשלומים פתוחים</CardTitle>
                <Link
                  href="/payments"
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  צפה בהכל
                  <ArrowLeft className="h-3 w-3" />
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.eventsWithUnpaidBookings.length === 0 ? (
                <p className="text-sm text-muted-foreground">אין חובות פתוחים 🎉</p>
              ) : (
                <>
                  <div className="rounded-xl bg-red-50 px-3 py-3 text-center">
                    <p className="text-xs text-muted-foreground">סה&quot;כ חוב פתוח</p>
                    <p className="text-3xl font-bold text-red-600 mt-0.5">
                      ₪{data.totalDebt.toFixed(0)}
                    </p>
                  </div>
                  {data.eventsWithUnpaidBookings.map((ev) => {
                    const debt = ev.bookings
                      .flatMap((b) => b.payments)
                      .reduce((s, p) => s + Number(p.amount), 0);
                    return (
                      <Link
                        key={ev.id}
                        href={`/workshops/${ev.id}`}
                        className="flex items-center justify-between rounded-xl p-2.5 hover:bg-muted text-sm"
                      >
                        <div>
                          <p className="font-medium">{ev.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {(() => {
                              const d = formatEventDate(new Date(ev.startsAt));
                              return (
                                <>
                                  <span>{d.day}</span>
                                  <span className="mx-1 text-muted-foreground/40">|</span>
                                  <span>{d.date}</span>
                                  <span className="mx-1 text-muted-foreground/40">|</span>
                                  <span>{d.time}</span>
                                </>
                              );
                            })()}
                          </p>
                        </div>
                        <span className="text-red-500 font-semibold text-sm shrink-0">
                          ₪{debt.toFixed(0)}
                        </span>
                      </Link>
                    );
                  })}
                </>
              )}
            </CardContent>
          </Card>

          {/* Low stock materials */}
          {data.lowStockMaterials.length > 0 && (
            <Card className="rounded-2xl shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    מלאי נמוך
                  </CardTitle>
                  <Link
                    href="/materials"
                    className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                  >
                    צפה בהכל
                    <ArrowLeft className="h-3 w-3" />
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="space-y-1">
                {data.lowStockMaterials.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between rounded-xl px-2 py-1.5 text-sm hover:bg-muted"
                  >
                    <span>{m.name}</span>
                    <span className="text-yellow-600 font-medium">
                      {Number(m.stockQuantity).toFixed(1)}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
