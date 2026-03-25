"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Menu,
  Plus,
  X,
  Flame,
  UserPlus,
  ShoppingCart,
  Bell,
} from "lucide-react";

interface AdminShellProps {
  children: React.ReactNode;
  studioName?: string;
  studioLogoUrl?: string | null;
}

const bottomNavItems = [
  { href: "/dashboard", label: "דשבורד", icon: LayoutDashboard },
  { href: "/workshops", label: "סדנאות", icon: CalendarDays },
  { href: "/customers", label: "לקוחות", icon: Users },
  { href: "/settings", label: "עוד", icon: Menu },
];

const fabActions = [
  { href: "/workshops/new", label: "סדנה חדשה", icon: CalendarDays },
  { href: "/customers/new", label: "לקוח חדש", icon: UserPlus },
  { href: "/payments/new", label: "מכירה", icon: ShoppingCart },
  { href: "/kilns/new", label: "שריפת תנור", icon: Flame },
  { href: "/reminders/new", label: "תזכורת", icon: Bell },
];

export function AdminShell({ children, studioName, studioLogoUrl }: AdminShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="absolute inset-0 bg-black/50" />
        </div>
      )}

      {/* Mobile sidebar panel */}
      <div
        className={cn(
          "fixed inset-y-0 right-0 z-50 w-72 transform transition-transform duration-300 ease-in-out md:hidden",
          sidebarOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} className="h-full" />
      </div>

      {/* Main content area */}
      <div className="flex flex-1 flex-col md:mr-64">
        <TopBar
          onMenuToggle={() => setSidebarOpen(true)}
          studioName={studioName}
          studioLogoUrl={studioLogoUrl}
        />
        <div className="bg-amber-100 border-b border-amber-300 text-amber-800 text-center text-sm py-2 px-4">
          🚧 האתר בבנייה — חלק מהפונקציות עדיין בפיתוח
        </div>
        {/* Extra bottom padding on mobile for the nav bar */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6">{children}</main>
      </div>

      {/* ── Mobile Bottom Nav ── */}
      <nav className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-white border-t border-gray-200 safe-area-inset-bottom">
        <div className="flex items-center justify-around h-16 px-2">
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 flex-1 py-2 rounded-xl transition-colors",
                  isActive ? "text-[var(--studio-primary)]" : "text-gray-400"
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5 transition-colors",
                    isActive ? "stroke-[2.5px]" : "stroke-[1.5px]"
                  )}
                />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* ── FAB "+" Button ── */}
      <div className="fixed bottom-[4.5rem] left-4 z-50 md:hidden">
        {/* FAB Dropdown */}
        {fabOpen && (
          <>
            {/* backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setFabOpen(false)}
            />
            <div className="absolute bottom-14 left-0 z-50 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden min-w-[160px]">
              {fabActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.href}
                    href={action.href}
                    onClick={() => setFabOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-sm font-medium text-gray-800"
                  >
                    <span
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                      style={{ backgroundColor: "color-mix(in srgb, var(--studio-primary) 15%, transparent)" }}
                    >
                      <Icon className="h-4 w-4" style={{ color: "var(--studio-primary)" }} />
                    </span>
                    <span>{action.label}</span>
                  </Link>
                );
              })}
            </div>
          </>
        )}

        <button
          onClick={() => setFabOpen((v) => !v)}
          aria-label="פעולות מהירות"
          className="h-12 w-12 rounded-full shadow-lg flex items-center justify-center transition-transform active:scale-95"
          style={{ backgroundColor: "var(--studio-primary)" }}
        >
          {fabOpen ? (
            <X className="h-5 w-5 text-white" />
          ) : (
            <Plus className="h-5 w-5 text-white" />
          )}
        </button>
      </div>
    </div>
  );
}
