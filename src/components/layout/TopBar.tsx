"use client";

import { signOut, useSession } from "next-auth/react";
import { Menu, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TopBarProps {
  onMenuToggle: () => void;
}

export function TopBar({ onMenuToggle }: TopBarProps) {
  const { data: session } = useSession();
  const firstMembership = session?.user?.memberships?.[0];

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
      {/* Mobile hamburger */}
      <button
        className="md:hidden p-2 rounded-md hover:bg-accent"
        onClick={onMenuToggle}
        aria-label="פתח תפריט"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Studio name (mobile) */}
      <div className="flex-1 md:hidden">
        <span className="text-sm font-medium text-muted-foreground">
          {firstMembership?.studioName ?? ""}
        </span>
      </div>

      {/* Right side actions */}
      <div className="mr-auto flex items-center gap-3">
        {/* User info */}
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
