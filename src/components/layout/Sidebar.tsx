"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  CalendarDays,
  Calendar,
  Users,
  Package,
  FlaskConical,
  Bell,
  BarChart2,
  Settings,
  X,
  CreditCard,
  Flame,
  Palette,
  Truck,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "לוח בקרה", icon: LayoutDashboard },
  {
    href: "/workshops",
    label: "סדנאות",
    icon: CalendarDays,
    children: [
      { href: "/workshops/templates", label: "תבניות" },
    ],
  },
  { href: "/calendar", label: "לוח שנה", icon: Calendar },
  { href: "/payments", label: "תשלומים", icon: CreditCard },
  { href: "/customers", label: "לקוחות", icon: Users },
  { href: "/products", label: "מוצרים", icon: Package },
  { href: "/kilns", label: "מעקב תנור", icon: Flame },
  { href: "/materials", label: "חומרים", icon: Palette },
  { href: "/suppliers", label: "ספקים", icon: Truck },
  { href: "/reminders", label: "תזכורות", icon: Bell },
  { href: "/reports", label: "דוחות", icon: BarChart2 },
  {
    href: "/settings",
    label: "הגדרות",
    icon: Settings,
    children: [
      { href: "/settings/messages", label: "תבניות הודעות" },
    ],
  },
];

interface SidebarProps {
  onClose?: () => void;
  className?: string;
}

export function Sidebar({ onClose, className }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "flex h-full flex-col bg-sidebar text-sidebar-foreground",
        className
      )}
    >
      {/* Accent bar */}
      <div className="h-1 w-full bg-[var(--studio-primary,var(--sidebar-primary))]" />

      {/* Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span
            className="text-xl font-bold"
            style={{ color: "var(--studio-primary, var(--sidebar-primary))" }}
          >
            Studio-Labs
          </span>
          <span className="text-xs text-sidebar-foreground/60">Studio</span>
        </Link>
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden p-1 rounded-md hover:bg-sidebar-accent"
            aria-label="סגור תפריט"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onClose}
                  style={
                    isActive
                      ? {
                          borderRightColor: "var(--studio-primary)",
                          color: "var(--studio-primary)",
                          backgroundColor: "color-mix(in srgb, var(--studio-primary) 10%, transparent)",
                        }
                      : undefined
                  }
                  className={cn(
                    "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors border-r-[3px] border-transparent",
                    !isActive &&
                      "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" strokeWidth={isActive ? 2.5 : 1.75} />
                  <span>{item.label}</span>
                </Link>
                {"children" in item && item.children && isActive && (
                  <ul className="mt-0.5 mr-10 space-y-0.5">
                    {item.children.map((child) => {
                      const isChildActive =
                        pathname === child.href ||
                        pathname.startsWith(child.href + "/");
                      return (
                        <li key={child.href}>
                          <Link
                            href={child.href}
                            onClick={onClose}
                            style={
                              isChildActive
                                ? { color: "var(--studio-primary)" }
                                : undefined
                            }
                            className={cn(
                              "flex items-center rounded-md px-3 py-1.5 text-sm transition-colors",
                              isChildActive
                                ? "font-medium"
                                : "text-sidebar-foreground/70 hover:text-sidebar-foreground"
                            )}
                          >
                            {child.label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
