"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Share2, MessageCircle, Copy, Check, Facebook, User } from "lucide-react";

const HE_DAYS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];

function formatHebrewDateTime(date: Date, time: string): string {
  const dayName = HE_DAYS[date.getDay()];
  const formatted = new Intl.DateTimeFormat("he-IL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
  return `יום ${dayName}, ${formatted} בשעה ${time}`;
}

interface CustomerOption {
  id: string;
  name: string;
  phone: string | null;
}

interface ShareButtonsProps {
  name: string;
  marketingText?: string | null;
  date: Date;
  time: string;
  registrationUrl?: string | null;
  studioSlug?: string;
  eventId?: string;
  imageUrl?: string | null;
  customers?: CustomerOption[];
}

export function ShareButtons({
  name,
  marketingText,
  date,
  time,
  registrationUrl,
  studioSlug,
  eventId,
  customers = [],
}: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [manualPhone, setManualPhone] = useState("");

  const dateTimeStr = formatHebrewDateTime(date, time);

  // Prefer the event-specific public URL over the template's registrationUrl
  const publicUrl =
    studioSlug && eventId
      ? `${typeof window !== "undefined" ? window.location.origin : ""}/s/${studioSlug}/event/${eventId}`
      : registrationUrl;

  const waText = [
    name,
    marketingText,
    `📅 ${dateTimeStr}`,
    publicUrl ? `🔗 להרשמה: ${publicUrl}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const waUrl = `https://wa.me/?text=${encodeURIComponent(waText)}`;

  const fbShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
    publicUrl ?? (typeof window !== "undefined" ? window.location.href : "")
  )}&quote=${encodeURIComponent(waText)}`;

  function handleFacebook() {
    window.open(fbShareUrl, "_blank", "width=600,height=400");
  }

  function handleWhatsApp() {
    window.open(waUrl, "_blank");
  }

  async function handleCopyLink() {
    const url = publicUrl ?? window.location.href;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function sendToCustomer(phone: string) {
    const raw = phone.replace(/\D/g, "");
    const waNumber = raw.startsWith("0") ? "972" + raw.slice(1) : raw;
    window.open(
      `https://wa.me/${waNumber}?text=${encodeURIComponent(waText)}`,
      "_blank"
    );
    setDialogOpen(false);
  }

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.phone ?? "").includes(search)
  );

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleFacebook}
        className="gap-1.5 text-blue-600 border-blue-200 hover:bg-blue-50"
        type="button"
      >
        <Facebook className="h-4 w-4" />
        שתף בפייסבוק
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={handleWhatsApp}
        className="gap-1.5 text-green-600 border-green-200 hover:bg-green-50"
        type="button"
      >
        <MessageCircle className="h-4 w-4" />
        שתף בוואטסאפ
      </Button>

      {/* Send to specific customer */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger
          className="inline-flex items-center gap-1.5 h-8 px-3 text-sm font-medium rounded-md border border-green-200 text-green-600 bg-background hover:bg-green-50 transition-colors"
          type="button"
        >
          <User className="h-4 w-4" />
          שלח ללקוח
        </DialogTrigger>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>שלח וואטסאפ ללקוח</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            {customers.length > 0 && (
              <>
                <Input
                  placeholder="חפש לקוח לפי שם או טלפון..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <div className="max-h-48 overflow-y-auto space-y-1 border rounded-md p-1">
                  {filtered.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-3">
                      לא נמצאו לקוחות
                    </p>
                  )}
                  {filtered.map((c) => (
                    <button
                      key={c.id}
                      disabled={!c.phone}
                      onClick={() => c.phone && sendToCustomer(c.phone)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded hover:bg-muted text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <span>{c.name}</span>
                      <span className="text-muted-foreground text-xs">
                        {c.phone ?? "אין טלפון"}
                      </span>
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="flex-1 border-t" />
                  <span>או הוסף מספר ידנית</span>
                  <span className="flex-1 border-t" />
                </div>
              </>
            )}
            <div className="flex gap-2">
              <Input
                placeholder="מספר טלפון..."
                value={manualPhone}
                onChange={(e) => setManualPhone(e.target.value)}
                dir="ltr"
              />
              <Button
                size="sm"
                disabled={!manualPhone.trim()}
                onClick={() => sendToCustomer(manualPhone)}
                type="button"
              >
                שלח
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Button
        variant="outline"
        size="sm"
        onClick={handleCopyLink}
        className="gap-1.5"
        type="button"
      >
        {copied ? (
          <>
            <Check className="h-4 w-4 text-green-600" />
            הקישור הועתק
          </>
        ) : (
          <>
            <Copy className="h-4 w-4" />
            העתק לינק
          </>
        )}
      </Button>
    </div>
  );
}
