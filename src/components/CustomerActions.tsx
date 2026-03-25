"use client";

import { Mail, MessageCircle, Phone, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";

interface CustomerActionsProps {
  name: string;
  phone?: string | null;
  email?: string | null;
  /** Optional extra message appended to WhatsApp */
  whatsappMessage?: string;
  /** Email subject line */
  emailSubject?: string;
  /** Email body text */
  emailBody?: string;
  size?: "sm" | "md";
  className?: string;
}

export function CustomerActions({
  name,
  phone,
  email,
  whatsappMessage,
  emailSubject,
  emailBody,
  size = "sm",
  className,
}: CustomerActionsProps) {
  const iconClass = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  const btnClass = cn(
    "inline-flex items-center justify-center rounded-md border transition-colors",
    size === "sm"
      ? "h-7 w-7 text-xs"
      : "h-8 w-8 text-sm",
    "hover:bg-muted text-muted-foreground hover:text-foreground"
  );

  const waText = whatsappMessage ?? `שלום ${name}`;
  const rawPhone = (phone ?? "").replace(/\D/g, "");
  const waNumber = rawPhone.startsWith("0")
    ? "972" + rawPhone.slice(1)
    : rawPhone;

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {email && (
        <a
          href={`mailto:${email}${emailSubject ? `?subject=${encodeURIComponent(emailSubject)}` : ""}${emailBody ? `${emailSubject ? "&" : "?"}body=${encodeURIComponent(emailBody)}` : ""}`}
          className={btnClass}
          title={`שלח מייל ל-${name}`}
          onClick={(e) => e.stopPropagation()}
        >
          <Mail className={iconClass} />
        </a>
      )}
      {phone && (
        <>
          <a
            href={`https://wa.me/${waNumber}?text=${encodeURIComponent(waText)}`}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(btnClass, "text-green-600 hover:text-green-700")}
            title={`שלח וואטסאפ ל-${name}`}
            onClick={(e) => e.stopPropagation()}
          >
            <MessageCircle className={iconClass} />
          </a>
          <a
            href={`sms:${phone}`}
            className={btnClass}
            title={`שלח SMS ל-${name}`}
            onClick={(e) => e.stopPropagation()}
          >
            <Smartphone className={iconClass} />
          </a>
          <a
            href={`tel:${phone}`}
            className={btnClass}
            title={`חייג ל-${name}`}
            onClick={(e) => e.stopPropagation()}
          >
            <Phone className={iconClass} />
          </a>
        </>
      )}
    </div>
  );
}
