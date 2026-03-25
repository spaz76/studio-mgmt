"use client";

import { useState } from "react";

interface Props {
  event: {
    id: string;
    title: string;
    description: string | null;
    startsAt: Date;
    endsAt: Date;
    price: number;
    maxParticipants: number;
    bookedCount: number;
    imageUrl?: string | null;
    marketingText?: string | null;
  };
  studio: {
    publicName: string;
    logoUrl?: string | null;
    primaryColor?: string | null;
    contactEmail?: string | null;
    contactPhone?: string | null;
    paymentUrl?: string | null;
  };
  day: string;
  date: string;
  time: string;
}

export function EventRegistrationPage({ event, studio, day, date, time }: Props) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [waitlisted, setWaitlisted] = useState(false);

  const color = studio.primaryColor ?? "#6366f1";
  const spotsLeft = event.maxParticipants - event.bookedCount;
  const fillPct = Math.min(100, Math.round((event.bookedCount / event.maxParticipants) * 100));

  async function handleSubmit(e: React.FormEvent, isWaitlist = false) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/public/register-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: event.id,
          name: name.trim(),
          phone,
          email,
          waitlist: isWaitlist,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error ?? "שגיאה בהרשמה");
        return;
      }

      setSuccess(true);
      if (data.waitlisted) {
        setWaitlisted(true);
      } else if (data.paymentUrl) {
        setTimeout(() => {
          window.location.href = data.paymentUrl;
        }, 1500);
      }
    } catch {
      setError("שגיאה בחיבור לשרת");
    } finally {
      setLoading(false);
    }
  }

  const registrationForm = (isWaitlist: boolean) => (
    <form onSubmit={(e) => handleSubmit(e, isWaitlist)} className="space-y-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <h2 className="font-semibold text-gray-900 text-base">
          {isWaitlist ? "הצטרפות לרשימת המתנה" : "פרטי הרשמה"}
        </h2>

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">שם מלא *</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="שם מלא"
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
            style={{ "--tw-ring-color": color } as React.CSSProperties}
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">טלפון</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="05x-xxxxxxx"
            dir="ltr"
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">דוא&quot;ל</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            dir="ltr"
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading || !name.trim()}
        className="w-full rounded-2xl py-4 text-base font-bold text-white disabled:opacity-60 transition-opacity shadow-md"
        style={{ backgroundColor: color }}
      >
        {loading
          ? "שולח..."
          : isWaitlist
          ? "הצטרף לרשימת המתנה"
          : studio.paymentUrl
          ? "אישור הרשמה ותשלום"
          : "אישור הרשמה"}
      </button>
    </form>
  );

  return (
    <div
      dir="rtl"
      style={{ "--primary": color } as React.CSSProperties}
      className="min-h-screen bg-gray-50"
    >
      {/* ── Hero Image ── */}
      {event.imageUrl && (
        <div className="relative w-full max-h-64 overflow-hidden bg-gray-100">
          <img
            src={event.imageUrl}
            alt={event.title}
            className="w-full max-h-64 object-contain"
          />
        </div>
      )}

      {/* ── Studio Header ── */}
      <div
        className="py-4 px-4 text-center"
        style={{ backgroundColor: color }}
      >
        {/* Brand line */}
        <div className="flex items-center justify-center gap-3">
          {studio.logoUrl ? (
            <img
              src={studio.logoUrl}
              alt={studio.publicName}
              className="h-10 w-10 rounded-full object-cover ring-2 ring-white/50 shrink-0"
            />
          ) : (
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white text-lg font-bold shrink-0">
              {studio.publicName.charAt(0)}
            </span>
          )}
          <p className="text-white font-semibold text-lg">{studio.publicName}</p>
        </div>
      </div>

      {/* ── Brand separator line ── */}
      <div className="h-1 w-full" style={{ backgroundColor: color }} />

      <div className="max-w-md mx-auto px-4 py-6 space-y-5">

        {/* ── Event Title & Description ── */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">{event.title}</h1>
          {(event.marketingText || event.description) && (
            <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap mt-2">
              {event.marketingText ?? event.description}
            </p>
          )}
        </div>

        {/* ── Date cells ── */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "יום", value: day },
            { label: "תאריך", value: date },
            { label: "שעה", value: time },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="rounded-2xl bg-white shadow-sm border border-gray-100 p-4 text-center"
            >
              <div className="text-xs text-gray-400 mb-1">{label}</div>
              <div className="text-base font-bold text-gray-900">{value}</div>
            </div>
          ))}
        </div>

        {/* ── Price + Spots ── */}
        <div className="flex items-center justify-between bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
          {event.price > 0 ? (
            <div>
              <div className="text-xs text-gray-400">מחיר</div>
              <div className="text-xl font-bold text-gray-900">
                ₪{event.price.toFixed(0)}
              </div>
            </div>
          ) : (
            <div className="text-sm font-medium text-gray-600">ללא עלות</div>
          )}
          <div className="text-left">
            <div className="text-xs text-gray-400">מקומות פנויים</div>
            <div
              className={`text-xl font-bold ${
                spotsLeft <= 0 ? "text-red-500" : spotsLeft <= 3 ? "text-orange-500" : "text-green-600"
              }`}
            >
              {spotsLeft <= 0 ? "מלא" : spotsLeft}
            </div>
          </div>
        </div>

        {/* ── Registration Progress Bar ── */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-gray-500">
            <span>{event.bookedCount} מתוך {event.maxParticipants} נרשמו</span>
            <span>{fillPct}%</span>
          </div>
          <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${fillPct}%`,
                backgroundColor: spotsLeft <= 0 ? "#ef4444" : color,
              }}
            />
          </div>
        </div>

        {/* ── Registration Form / Success ── */}
        {success ? (
          <div className="rounded-2xl bg-green-50 border border-green-200 p-6 text-center">
            <div className="text-3xl mb-2">✓</div>
            {waitlisted ? (
              <>
                <h2 className="font-bold text-green-800 text-lg mb-1">נרשמת לרשימת המתנה!</h2>
                <p className="text-sm text-green-700">ניצור איתך קשר כשיתפנה מקום.</p>
              </>
            ) : (
              <>
                <h2 className="font-bold text-green-800 text-lg mb-1">ההרשמה התקבלה!</h2>
                {studio.paymentUrl ? (
                  <p className="text-sm text-green-700">מעביר אותך לדף התשלום...</p>
                ) : (
                  <p className="text-sm text-green-700">נראה אותך בסדנה!</p>
                )}
              </>
            )}
          </div>
        ) : spotsLeft <= 0 ? (
          registrationForm(true)
        ) : (
          registrationForm(false)
        )}
      </div>

      {/* ── Footer ── */}
      <footer className="mt-8 border-t border-gray-200 bg-white py-6 px-4 text-center text-sm text-gray-500">
        <div className="flex flex-col items-center gap-2 max-w-md mx-auto">
          {studio.logoUrl ? (
            <img src={studio.logoUrl} alt={studio.publicName} className="h-8 w-8 rounded-full object-cover" />
          ) : (
            <span
              className="flex h-8 w-8 items-center justify-center rounded-full text-white font-bold text-sm"
              style={{ backgroundColor: color }}
            >
              {studio.publicName.charAt(0)}
            </span>
          )}
          <span className="font-semibold text-gray-700">{studio.publicName}</span>
          <div className="flex flex-col items-center gap-1 text-xs">
            {studio.contactPhone && (
              <a href={`tel:${studio.contactPhone}`} className="hover:underline">
                {studio.contactPhone}
              </a>
            )}
            {studio.contactEmail && (
              <a href={`mailto:${studio.contactEmail}`} className="hover:underline">
                {studio.contactEmail}
              </a>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
