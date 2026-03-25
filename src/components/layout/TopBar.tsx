"use client";

import { signOut, useSession } from "next-auth/react";
import { Menu, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TopBarProps {
  onMenuToggle: () => void;
  studioName?: string;
  studioLogoUrl?: string | null;
}

export function TopBar({ onMenuToggle, studioName, studioLogoUrl }: TopBarProps) {
  const { data: session } = useSession();
  const firstMembership = session?.user?.memberships?.[0];
  const displayName = studioName ?? firstMembership?.studioName ?? "";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background px-4 md:px-6">
      {/* Mobile hamburger — hidden when bottom nav is present */}
      <button
        className="md:hidden p-2 rounded-md hover:bg-accent"
        onClick={onMenuToggle}
        aria-label="פתח תפריט"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Studio identity (mobile + desktop) */}
      <div className="flex flex-1 items-center gap-2.5">
        {/* Logo circle */}
        {studioLogoUrl ? (
          <img
            src={studioLogoUrl}
            alt={displayName}
            className="h-8 w-8 rounded-full object-cover shrink-0 ring-2 ring-white shadow-sm"
            style={{ outlineColor: "var(--studio-primary)" }}
          />
        ) : displayName ? (
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white shadow-sm"
            style={{ backgroundColor: "var(--studio-primary)" }}
          >
            {displayName.charAt(0)}
          </span>
        ) : null}

        {/* Studio name */}
        {displayName && (
          <span className="text-sm font-semibold text-foreground truncate max-w-[140px] md:max-w-none">
            {displayName}
          </span>
        )}
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-2">
        {/* User info — desktop only */}
        <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
          <User className="h-4 w-4" />
          <span>{session?.user?.name ?? session?.user?.email}</span>
          {firstMembership && (
            <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
              {roleLabel(firstMembership.role)}
            </span>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => signOut({ callbackUrl: "/login" })}
          aria-label="התנתק"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}

function roleLabel(role: string) {
  const labels: Record<string, string> = {
    OWNER: "בעלים",
    MANAGER: "מנהל",
    OPERATOR: "מפעיל",
    VIEWER: "צופה",
  };
  return labels[role] ?? role;
}
