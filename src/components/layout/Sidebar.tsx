"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Package,
  FlaskConical,
  Bell,
  BarChart2,
  Settings,
  X,
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
  { href: "/customers", label: "לקוחות", icon: Users },
  { href: "/products", label: "מוצרים", icon: Package },
  { href: "/materials", label: "חומרים", icon: FlaskConical },
  { href: "/reminders", label: "תזכורות", icon: Bell },
  { href: "/reports", label: "דוחות", icon: BarChart2 },
  { href: "/settings", label: "הגדרות", icon: Settings },
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
      {/* Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="text-xl font-bold text-sidebar-primary">
            Atnachta
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
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span>{item.label}</span>
                </Link>
                {"children" in item && item.children && isActive && (
                  <ul className="mt-1 mr-8 space-y-1">
                    {item.children.map((child) => {
                      const isChildActive =
                        pathname === child.href ||
                        pathname.startsWith(child.href + "/");
                      return (
                        <li key={child.href}>
                          <Link
                            href={child.href}
                            onClick={onClose}
                            className={cn(
                              "flex items-center rounded-md px-3 py-1.5 text-sm transition-colors",
                              isChildActive
                                ? "font-medium text-sidebar-primary"
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
