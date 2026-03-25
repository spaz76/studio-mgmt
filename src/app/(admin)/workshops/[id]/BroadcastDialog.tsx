"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, Send } from "lucide-react";

interface Participant {
  name: string;
  phone: string | null;
}

interface Props {
  eventTitle: string;
  participants: Participant[];
}

export function BroadcastDialog({ eventTitle, participants }: Props) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState(`עדכון לגבי ${eventTitle}`);
  const [sentCount, setSentCount] = useState(0);

  const withPhone = participants.filter((p) => p.phone);

  function handleSend() {
    setSentCount(0);
    let count = 0;
    for (const p of withPhone) {
      if (!p.phone) continue;
      const raw = p.phone.replace(/\D/g, "");
      const intlPhone = raw.startsWith("0") ? `972${raw.slice(1)}` : raw;
      const text = encodeURIComponent(`היי ${p.name}!\n${message}`);
      window.open(`https://wa.me/${intlPhone}?text=${text}`, "_blank");
      count++;
    }
    setSentCount(count);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setSentCount(0); }}>
      <DialogTrigger className={buttonVariants({ variant: "outline", size: "sm" })}>
        <MessageCircle className="h-4 w-4 ml-1" />
        שלח עדכון למשתתפים
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>שלח עדכון לכל המשתתפים</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            {withPhone.length} משתתפים עם מספר טלפון מתוך {participants.length} סה&quot;כ
          </p>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            placeholder="הודעה..."
            className="resize-none"
          />
          {sentCount > 0 && (
            <div className="rounded-md bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-700">
              נפתחו {sentCount} חלונות וואטסאפ
            </div>
          )}
          <Button
            className="w-full"
            onClick={handleSend}
            disabled={!message.trim() || withPhone.length === 0}
            type="button"
          >
            <Send className="h-4 w-4 ml-1" />
            שלח לכולם ({withPhone.length})
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
