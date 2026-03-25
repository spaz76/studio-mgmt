"use client";

import { useState } from "react";

// ─── Types ─────────────────────────────────────────────────────────────────

interface Studio {
  id: string;
  name: string;
  publicName: string;
  slug: string;
  logoUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  websiteUrl: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  phoneNumber: string | null;
  whatsappNumber: string | null;
  fontFamily: string | null;
}

interface TemplateImage {
  url: string;
  alt: string | null;
}

interface EventTemplate {
  registrationUrl: string | null;
  images: TemplateImage[];
}

interface WorkshopEvent {
  id: string;
  title: string;
  startsAt: Date | string;
  endsAt: Date | string;
  status: string;
  price: number | string | { toNumber?: () => number };
  maxParticipants: number;
  template: EventTemplate | null;
  bookings: { participantCount: number }[];
}

interface ProductVariant {
  price: number | string | { toNumber?: () => number };
  stockQuantity: number;
}

interface Product {
  id: string;
  name: string;
  imageUrl: string | null;
  category: string | null;
  variants: ProductVariant[];
}

interface Props {
  studio: Studio;
  events: WorkshopEvent[];
  products: Product[];
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function toNumber(v: number | string | { toNumber?: () => number }): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") return parseFloat(v);
  if (v && typeof (v as { toNumber?: () => number }).toNumber === "function") {
    return (v as { toNumber: () => number }).toNumber();
  }
  return 0;
}

function formatDate(d: Date | string): string {
  return new Intl.DateTimeFormat("he-IL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(d));
}

function formatTime(d: Date | string): string {
  return new Intl.DateTimeFormat("he-IL", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(d));
}

function normalizePhone(phone: string): string {
  return phone.replace(/[^\d+]/g, "");
}

// ─── SVG Icons (inline) ────────────────────────────────────────────────────

function PhoneIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function EmailIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
  );
}

// ─── Header ────────────────────────────────────────────────────────────────

function StudioHeader({ studio }: { studio: Studio }) {
  const phone = studio.phoneNumber ?? studio.contactPhone;
  const wa = studio.whatsappNumber;
  const waLink = wa
    ? `https://wa.me/${normalizePhone(wa).replace("+", "")}`
    : null;

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-4xl mx-auto px-4 py-6 flex flex-col items-center gap-4 text-center">
        {/* Logo or initial */}
        {studio.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={studio.logoUrl}
            alt={studio.publicName}
            className="h-20 w-20 object-contain rounded-full border"
          />
        ) : (
          <div
            className="h-20 w-20 rounded-full flex items-center justify-center text-white text-3xl font-bold"
            style={{ backgroundColor: "var(--studio-primary)" }}
          >
            {studio.publicName.charAt(0)}
          </div>
        )}

        {/* Name */}
        <h1
          className="text-3xl font-bold"
          style={{ color: "var(--studio-primary)" }}
        >
          {studio.publicName}
        </h1>

        {/* Contact row */}
        <div className="flex flex-wrap justify-center gap-3 text-sm">
          {phone && (
            <a
              href={`tel:${normalizePhone(phone)}`}
              className="flex items-center gap-1 text-gray-600 hover:text-gray-900"
            >
              <PhoneIcon />
              <span dir="ltr">{phone}</span>
            </a>
          )}
          {waLink && (
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-green-600 hover:text-green-700 font-medium"
            >
              <WhatsAppIcon />
              <span>וואטסאפ</span>
            </a>
          )}
          {studio.contactEmail && (
            <a
              href={`mailto:${studio.contactEmail}`}
              className="flex items-center gap-1 text-gray-600 hover:text-gray-900"
            >
              <EmailIcon />
              <span>{studio.contactEmail}</span>
            </a>
          )}
        </div>

        {/* Social links */}
        <div className="flex gap-3">
          {studio.websiteUrl && (
            <a
              href={studio.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
              aria-label="אתר אינטרנט"
            >
              <GlobeIcon />
            </a>
          )}
          {studio.facebookUrl && (
            <a
              href={studio.facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors"
              aria-label="פייסבוק"
            >
              <FacebookIcon />
            </a>
          )}
          {studio.instagramUrl && (
            <a
              href={studio.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-full bg-pink-50 hover:bg-pink-100 text-pink-600 transition-colors"
              aria-label="אינסטגרם"
            >
              <InstagramIcon />
            </a>
          )}
        </div>
      </div>
    </header>
  );
}

// ─── Workshop Card ─────────────────────────────────────────────────────────

function WorkshopCard({ event, studio }: { event: WorkshopEvent; studio: Studio }) {
  const bookedCount = event.bookings.reduce((s, b) => s + b.participantCount, 0);
  const spotsLeft = Math.max(0, event.maxParticipants - bookedCount);
  const price = toNumber(event.price);
  const imageUrl = event.template?.images?.[0]?.url ?? null;
  const imageAlt = event.template?.images?.[0]?.alt ?? event.title;
  const registrationUrl = event.template?.registrationUrl;
  const wa = studio.whatsappNumber;
  const waLink = wa
    ? `https://wa.me/${normalizePhone(wa).replace("+", "")}?text=${encodeURIComponent(
        `היי, אני מעוניין להירשם לסדנת "${event.title}"`
      )}`
    : null;
  const ctaUrl = registrationUrl ?? waLink ?? "#";

  return (
    <div className="bg-white rounded-2xl shadow-sm border overflow-hidden flex flex-col">
      {/* Image */}
      <div className="h-48 bg-gray-100 overflow-hidden">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt={imageAlt} className="w-full h-full object-contain bg-muted/20" />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-white text-5xl font-bold opacity-20"
            style={{ backgroundColor: "var(--studio-primary)" }}
          >
            {event.title.charAt(0)}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <h3 className="text-lg font-bold leading-tight">{event.title}</h3>
        <p className="text-sm text-gray-500">{formatDate(event.startsAt)}</p>
        <p className="text-sm text-gray-500">
          {formatTime(event.startsAt)} – {formatTime(event.endsAt)}
        </p>

        <div className="flex items-center justify-between mt-auto pt-2">
          <span className="text-sm text-gray-600">
            {spotsLeft > 0 ? (
              <>
                <span className="font-medium text-green-600">{spotsLeft}</span>
                {" "}מקומות פנויים
              </>
            ) : (
              <span className="text-red-500 font-medium">אין מקומות</span>
            )}
          </span>
          {price > 0 && (
            <span className="text-lg font-bold" style={{ color: "var(--studio-primary)" }}>
              ₪{price}
            </span>
          )}
        </div>

        <a
          href={spotsLeft > 0 ? ctaUrl : undefined}
          target={spotsLeft > 0 && ctaUrl !== "#" ? "_blank" : undefined}
          rel="noopener noreferrer"
          className="mt-2 block text-center py-2.5 px-4 rounded-xl font-semibold text-white transition-opacity hover:opacity-90"
          style={{
            backgroundColor: spotsLeft > 0 ? "var(--studio-primary)" : "#9ca3af",
            cursor: spotsLeft > 0 ? "pointer" : "default",
          }}
        >
          {spotsLeft > 0 ? "להרשמה" : "מלא"}
        </a>
      </div>
    </div>
  );
}

// ─── Product Card ──────────────────────────────────────────────────────────

function ProductCard({ product }: { product: Product }) {
  const price =
    product.variants.length > 0 ? toNumber(product.variants[0].price) : null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border overflow-hidden flex flex-col">
      <div className="h-40 bg-gray-100 overflow-hidden">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-contain bg-muted/20"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl text-gray-200">
            🛍
          </div>
        )}
      </div>
      <div className="p-3 flex flex-col gap-1 flex-1">
        <h3 className="font-semibold text-sm leading-tight">{product.name}</h3>
        {product.category && (
          <p className="text-xs text-gray-400">{product.category}</p>
        )}
        {price !== null && price > 0 && (
          <p className="text-base font-bold mt-auto" style={{ color: "var(--studio-primary)" }}>
            ₪{price}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Contact Section ───────────────────────────────────────────────────────

function ContactSection({ studio }: { studio: Studio }) {
  const phone = studio.phoneNumber ?? studio.contactPhone;
  const wa = studio.whatsappNumber;
  const waLink = wa
    ? `https://wa.me/${normalizePhone(wa).replace("+", "")}`
    : null;

  return (
    <section className="py-12 bg-white rounded-2xl border px-6 text-center space-y-4">
      <h2 className="text-2xl font-bold" style={{ color: "var(--studio-primary)" }}>
        צור קשר
      </h2>
      <div className="flex flex-wrap justify-center gap-3">
        {phone && (
          <a
            href={`tel:${normalizePhone(phone)}`}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border font-medium text-sm hover:shadow-sm transition-shadow"
          >
            <PhoneIcon />
            <span dir="ltr">{phone}</span>
          </a>
        )}
        {waLink && (
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-500 text-white font-medium text-sm hover:bg-green-600 transition-colors"
          >
            <WhatsAppIcon />
            שלח הודעה
          </a>
        )}
        {studio.contactEmail && (
          <a
            href={`mailto:${studio.contactEmail}`}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border font-medium text-sm hover:shadow-sm transition-shadow"
          >
            <EmailIcon />
            <span>{studio.contactEmail}</span>
          </a>
        )}
      </div>
    </section>
  );
}

// ─── Share Buttons ─────────────────────────────────────────────────────────

function ShareButtons({ studio }: { studio: Studio }) {
  const [copied, setCopied] = useState(false);

  const pageUrl =
    typeof window !== "undefined"
      ? window.location.href
      : `https://studio.app/s/${studio.slug}`;

  const waShareUrl = `https://wa.me/?text=${encodeURIComponent(
    `${studio.publicName} — ${pageUrl}`
  )}`;
  const fbShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
    pageUrl
  )}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(pageUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // silently ignore
    }
  }

  return (
    <div className="flex flex-wrap gap-3 justify-center">
      <a
        href={waShareUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500 text-white font-medium text-sm hover:bg-green-600 transition-colors"
      >
        <WhatsAppIcon />
        שתף בוואטסאפ
      </a>
      <a
        href={fbShareUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white font-medium text-sm hover:bg-blue-700 transition-colors"
      >
        <FacebookIcon />
        שתף בפייסבוק
      </a>
      <button
        onClick={handleCopy}
        className="flex items-center gap-2 px-4 py-2 rounded-xl border font-medium text-sm hover:bg-gray-50 transition-colors"
      >
        <LinkIcon />
        {copied ? "הקישור הועתק!" : "העתק קישור"}
      </button>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────

export function PublicStudioPage({ studio, events, products }: Props) {
  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <StudioHeader studio={studio} />

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-12">
        {/* Workshops Section */}
        <section>
          <h2
            className="text-2xl font-bold mb-6"
            style={{ color: "var(--studio-primary)" }}
          >
            סדנאות פתוחות להרשמה
          </h2>

          {events.length === 0 ? (
            <div className="text-center py-12 text-gray-400 bg-white rounded-2xl border">
              <p className="text-lg">אין סדנאות פתוחות כרגע</p>
              <p className="text-sm mt-1">בדקו שוב בקרוב</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {events.map((event) => (
                <WorkshopCard key={event.id} event={event} studio={studio} />
              ))}
            </div>
          )}
        </section>

        {/* Products Section */}
        {products.length > 0 && (
          <section>
            <h2
              className="text-2xl font-bold mb-6"
              style={{ color: "var(--studio-primary)" }}
            >
              מוצרים
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}

        {/* Contact Section */}
        <ContactSection studio={studio} />

        {/* Share */}
        <section className="text-center space-y-3">
          <h2 className="text-lg font-semibold text-gray-600">שתפו את הסטודיו</h2>
          <ShareButtons studio={studio} />
        </section>
      </main>

      <footer className="text-center py-6 text-xs text-gray-400 border-t mt-8 bg-white">
        {studio.publicName}
      </footer>
    </div>
  );
}
