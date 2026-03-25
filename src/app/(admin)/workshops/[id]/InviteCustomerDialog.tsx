"use client";

import { useState, useTransition, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { buttonVariants } from "@/components/ui/button-variants";
import { UserPlus, Send, MessageCircle, Check } from "lucide-react";
import { inviteCustomerToEvent } from "@/actions/invite-customer";

interface Customer {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
}

interface Props {
  eventId: string;
  customers: Customer[];
  inviteChannel?: string | null;
}

export function InviteCustomerDialog({ eventId, customers, inviteChannel }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [whatsappUrl, setWhatsappUrl] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState<boolean | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filtered =
    query.length >= 1
      ? customers.filter(
          (c) =>
            c.name.includes(query) ||
            (c.phone && c.phone.includes(query))
        )
      : [];

  function reset() {
    setQuery("");
    setSelectedCustomer(null);
    setShowNewForm(false);
    setNewName("");
    setNewPhone("");
    setNewEmail("");
    setError(null);
    setDone(false);
    setWhatsappUrl(null);
    setEmailSent(null);
  }

  function handleSend() {
    setError(null);
    const hasSelected = !!selectedCustomer;
    const hasNew = showNewForm && newName.trim();
    if (!hasSelected && !hasNew) {
      setError("יש לבחור לקוח קיים או להזין לקוח חדש");
      return;
    }

    startTransition(async () => {
      const result = await inviteCustomerToEvent(
        eventId,
        selectedCustomer?.id ?? null,
        hasNew
          ? { name: newName.trim(), phone: newPhone || undefined, email: newEmail || undefined }
          : null,
        inviteChannel ?? "both"
      );

      if (!result.ok) {
        setError(result.error ?? "שגיאה");
        return;
      }

      setDone(true);
      setEmailSent(result.emailSent ?? false);
      if (result.whatsappUrl) {
        setWhatsappUrl(result.whatsappUrl);
        window.open(result.whatsappUrl, "_blank");
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) reset();
      }}
    >
      <DialogTrigger className={buttonVariants({ variant: "outline", size: "sm" })}>
        <UserPlus className="h-4 w-4 ml-1" />
        הזמן לקוח
      </DialogTrigger>

      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>הזמנת לקוח לאירוע</DialogTitle>
        </DialogHeader>

        {done ? (
          <div className="space-y-4 py-2">
            <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-center">
              <p className="font-semibold text-green-800 mb-1">ההזמנה נשלחה!</p>
              <p className="text-sm text-green-700">
                ההזמנה נרשמה ובמידת הצורך נשלח מייל ללקוח.
              </p>
              {emailSent === true && (
                <p className="text-xs text-green-600 flex items-center gap-1 justify-center mt-2">
                  <Check className="h-3 w-3" />
                  מייל נשלח ✓
                </p>
              )}
              {emailSent === false && (
                <p className="text-xs text-muted-foreground mt-2">
                  לא נשלח מייל (אין כתובת / אין חיבור Gmail)
                </p>
              )}
            </div>
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full rounded-lg bg-green-500 hover:bg-green-600 text-white font-medium py-2.5 transition-colors"
              >
                <MessageCircle className="h-4 w-4" />
                פתח שוב בוואטסאפ
              </a>
            )}
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                reset();
                setOpen(false);
              }}
            >
              סגור
            </Button>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            {error && (
              <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}

            {/* Customer search */}
            {!showNewForm && (
              <div className="space-y-2">
                <Label>חיפוש לקוח קיים</Label>
                <Input
                  placeholder="חפש לפי שם או טלפון..."
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setSelectedCustomer(null);
                  }}
                />

                {selectedCustomer ? (
                  <div className="flex items-center justify-between rounded-lg border border-primary/40 bg-primary/5 px-3 py-2">
                    <div>
                      <p className="text-sm font-medium">{selectedCustomer.name}</p>
                      {selectedCustomer.phone && (
                        <p className="text-xs text-muted-foreground" dir="ltr">
                          {selectedCustomer.phone}
                        </p>
                      )}
                    </div>
                    <button
                      className="text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => {
                        setSelectedCustomer(null);
                        setQuery("");
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  filtered.length > 0 && (
                    <div
                      ref={listRef}
                      className="max-h-40 overflow-y-auto rounded-lg border divide-y"
                    >
                      {filtered.slice(0, 8).map((c) => (
                        <button
                          key={c.id}
                          className="w-full text-right px-3 py-2 hover:bg-muted text-sm flex items-center justify-between gap-2"
                          onClick={() => {
                            setSelectedCustomer(c);
                            setQuery(c.name);
                          }}
                        >
                          <span>{c.name}</span>
                          {c.phone && (
                            <span className="text-xs text-muted-foreground" dir="ltr">
                              {c.phone}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )
                )}

                <button
                  type="button"
                  className="text-xs text-primary underline-offset-4 hover:underline"
                  onClick={() => {
                    setShowNewForm(true);
                    setSelectedCustomer(null);
                    setQuery("");
                  }}
                >
                  + הוסף לקוח חדש
                </button>
              </div>
            )}

            {/* New customer form */}
            {showNewForm && (
              <div className="space-y-3 rounded-lg border p-4 bg-muted/20">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">לקוח חדש</p>
                  <button
                    className="text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => setShowNewForm(false)}
                  >
                    חזור לחיפוש
                  </button>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="inv-name">שם *</Label>
                  <Input
                    id="inv-name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="שם מלא"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="inv-phone">טלפון</Label>
                    <Input
                      id="inv-phone"
                      type="tel"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      placeholder="05x-xxxxxxx"
                      dir="ltr"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="inv-email">דוא&quot;ל</Label>
                    <Input
                      id="inv-email"
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="email@example.com"
                      dir="ltr"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Channel info */}
            <p className="text-xs text-muted-foreground">
              {(inviteChannel === "email")
                ? "תישלח הזמנה במייל"
                : (inviteChannel === "whatsapp")
                ? "יפתח וואטסאפ עם הודעה מוכנה"
                : "יישלח מייל ויפתח וואטסאפ"}
            </p>

            <Button
              className="w-full"
              onClick={handleSend}
              disabled={isPending || (!selectedCustomer && !(showNewForm && newName.trim()))}
            >
              {isPending ? (
                "שולח..."
              ) : (
                <>
                  <Send className="h-4 w-4 ml-1" />
                  שלח הזמנה
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
