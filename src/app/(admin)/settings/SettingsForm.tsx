"use client";

import { useActionState, useState, useEffect, useCallback, startTransition } from "react";
import Link from "next/link";
import { updateSettings, type SettingsFormState } from "@/actions/studio-settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import type { Studio } from "@/generated/prisma";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { LogoUpload } from "@/components/LogoUpload";

interface SettingsFormProps {
  studio: Studio;
  googleCalendarConnected?: boolean;
}

const FONT_FAMILIES = [
  { value: "", label: "ברירת מחדל (Noto Sans Hebrew)", googleFont: "" },
  { value: "'Heebo', sans-serif", label: "Heebo", googleFont: "Heebo" },
  { value: "'Rubik', sans-serif", label: "Rubik", googleFont: "Rubik" },
  { value: "'Assistant', sans-serif", label: "Assistant", googleFont: "Assistant" },
  { value: "'Varela Round', sans-serif", label: "Varela Round", googleFont: "Varela+Round" },
  { value: "'Secular One', sans-serif", label: "Secular One", googleFont: "Secular+One" },
  { value: "'Alef', sans-serif", label: "Alef", googleFont: "Alef" },
  { value: "'Open Sans', sans-serif", label: "Open Sans (Hebrew)", googleFont: "Open+Sans:ital,wght@0,300..800;1,300..800&subset=hebrew" },
  { value: "'Noto Sans Hebrew', sans-serif", label: "Noto Sans Hebrew", googleFont: "Noto+Sans+Hebrew:wdth,wght@75..125,100..900" },
  { value: "'Frank Ruhl Libre', serif", label: "Frank Ruhl Libre", googleFont: "Frank+Ruhl+Libre" },
  { value: "'Karantina', cursive", label: "Karantina", googleFont: "Karantina" },
  { value: "'Suez One', serif", label: "Suez One", googleFont: "Suez+One" },
  { value: "'Amatic SC', cursive", label: "Amatic SC", googleFont: "Amatic+SC" },
  { value: "'Miriam Libre', serif", label: "Miriam Libre", googleFont: "Miriam+Libre" },
  { value: "'David Libre', serif", label: "David Libre", googleFont: "David+Libre" },
  { value: "'Bellefair', serif", label: "Bellefair", googleFont: "Bellefair" },
];

const FONT_SIZES = [
  { value: "small", label: "קטן" },
  { value: "medium", label: "בינוני" },
  { value: "large", label: "גדול" },
];

export function SettingsForm({ studio, googleCalendarConnected = false }: SettingsFormProps) {
  const [state, formAction, isPending] = useActionState<SettingsFormState, FormData>(
    updateSettings,
    {}
  );

  // ── Controlled text field states ──
  const [name, setName] = useState(studio.name ?? "");
  const [publicName, setPublicName] = useState(studio.publicName ?? "");
  const [contactEmail, setContactEmail] = useState(studio.contactEmail ?? "");
  const [address, setAddress] = useState(studio.address ?? "");
  const [phoneNumber, setPhoneNumber] = useState(studio.phoneNumber ?? "");
  const [whatsappNumber, setWhatsappNumber] = useState(studio.whatsappNumber ?? "");
  const [websiteUrl, setWebsiteUrl] = useState(studio.websiteUrl ?? "");
  const [facebookUrl, setFacebookUrl] = useState(studio.facebookUrl ?? "");
  const [instagramUrl, setInstagramUrl] = useState(studio.instagramUrl ?? "");
  const [reviewsUrl, setReviewsUrl] = useState(studio.reviewsUrl ?? "");
  const [paymentUrl, setPaymentUrl] = useState(studio.paymentUrl ?? "");

  // ── Live preview / boolean states ──
  const [primaryColor, setPrimaryColor] = useState(studio.primaryColor ?? "#6366f1");
  const [secondaryColor, setSecondaryColor] = useState(studio.secondaryColor ?? "#f59e0b");
  const [fontFamily, setFontFamily] = useState(studio.fontFamily ?? "");
  const [fontSize, setFontSize] = useState(studio.fontSize ?? "medium");
  const [hasOwnWebsite, setHasOwnWebsite] = useState(studio.hasOwnWebsite);
  const [inviteChannel, setInviteChannel] = useState(
    (studio as Studio & { inviteChannel?: string | null }).inviteChannel ?? "both"
  );
  const [logoUrl, setLogoUrl] = useState(studio.logoUrl ?? "");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  // Reflect pending state in status pill
  useEffect(() => {
    if (isPending) startTransition(() => setSaveStatus("saving"));
  }, [isPending]);

  // Reflect action result in status pill
  useEffect(() => {
    if (state.success) {
      startTransition(() => setSaveStatus("saved"));
      const t = setTimeout(() => startTransition(() => setSaveStatus("idle")), 3000);
      return () => clearTimeout(t);
    } else if (state.errors && Object.keys(state.errors).length > 0) {
      startTransition(() => setSaveStatus("error"));
    }
  }, [state]);

  const previewFontSize =
    fontSize === "small" ? "0.875rem" : fontSize === "large" ? "1.125rem" : "1rem";

  // Load Google Font dynamically when font selection changes
  useEffect(() => {
    const fontDef = FONT_FAMILIES.find((f) => f.value === fontFamily);
    if (!fontDef?.googleFont) return;
    const linkId = `gfont-${fontDef.googleFont}`;
    if (document.getElementById(linkId)) return;
    const link = document.createElement("link");
    link.id = linkId;
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?family=${fontDef.googleFont}&display=swap`;
    document.head.appendChild(link);
  }, [fontFamily]);

  // Listen for color-pick events from LogoUpload swatches
  const handleColorPick = useCallback((e: Event) => {
    const { color, type } = (e as CustomEvent<{ color: string; type: "primary" | "secondary" }>).detail;
    if (type === "primary") setPrimaryColor(color);
    else setSecondaryColor(color);
  }, []);

  useEffect(() => {
    window.addEventListener("studio-color-pick", handleColorPick);
    return () => window.removeEventListener("studio-color-pick", handleColorPick);
  }, [handleColorPick]);

  function fieldError(field: string) {
    return state.errors?.[field]?.[0];
  }

  return (
    <form id="settings-form" action={formAction} className="space-y-4">
      {/* Save status indicator */}
      <div className="flex items-center justify-end gap-2 text-xs min-h-[20px]">
        {saveStatus === "saving" && (
          <span className="text-muted-foreground animate-pulse">שומר...</span>
        )}
        {saveStatus === "saved" && (
          <span className="text-green-600 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" /> נשמר
          </span>
        )}
        {saveStatus === "error" && (
          <span className="text-red-500 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" /> שגיאה בשמירה
          </span>
        )}
      </div>

      {/* Hidden fields for controlled non-text values */}
      <input type="hidden" name="primaryColor" value={primaryColor} />
      <input type="hidden" name="secondaryColor" value={secondaryColor} />
      <input type="hidden" name="fontFamily" value={fontFamily} />
      <input type="hidden" name="fontSize" value={fontSize} />
      <input type="hidden" name="hasOwnWebsite" value={String(hasOwnWebsite)} />
      <input type="hidden" name="logoUrl" value={logoUrl} />
      <input type="hidden" name="inviteChannel" value={inviteChannel} />

      {/* Status messages */}
      {state.success && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {state.message}
        </div>
      )}
      {state.errors && Object.keys(state.errors).length > 0 && !state.success && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          יש שגיאות בטופס, אנא בדוק את השדות
        </div>
      )}

      <Tabs defaultValue="branding">
        {/* Morning-style pill tabs */}
        <TabsList className="w-full flex-wrap rounded-xl bg-muted/50 p-1 gap-0.5 h-auto">
          <TabsTrigger
            value="branding"
            className="flex-1 rounded-lg text-sm data-[state=active]:bg-[var(--studio-primary,hsl(var(--primary)))] data-[state=active]:text-white data-[state=active]:shadow-sm"
          >
            מיתוג
          </TabsTrigger>
          <TabsTrigger
            value="contact"
            className="flex-1 rounded-lg text-sm data-[state=active]:bg-[var(--studio-primary,hsl(var(--primary)))] data-[state=active]:text-white data-[state=active]:shadow-sm"
          >
            פרטי קשר
          </TabsTrigger>
          <TabsTrigger
            value="links"
            className="flex-1 rounded-lg text-sm data-[state=active]:bg-[var(--studio-primary,hsl(var(--primary)))] data-[state=active]:text-white data-[state=active]:shadow-sm"
          >
            קישורים ורשתות
          </TabsTrigger>
          <TabsTrigger
            value="integrations"
            className="flex-1 rounded-lg text-sm data-[state=active]:bg-[var(--studio-primary,hsl(var(--primary)))] data-[state=active]:text-white data-[state=active]:shadow-sm"
          >
            תשלומים ואינטגרציות
          </TabsTrigger>
        </TabsList>

        {/* ── Tab: מיתוג ── */}
        <TabsContent value="branding">
          <div className="mt-4 rounded-2xl bg-white/80 shadow-sm border border-muted/30 p-5 space-y-6">
            {/* Studio names */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">שם פנימי</Label>
                <Input
                  id="name"
                  name="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                {fieldError("name") && (
                  <p className="text-xs text-red-500">{fieldError("name")}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="publicName">שם ציבורי</Label>
                <Input
                  id="publicName"
                  name="publicName"
                  value={publicName}
                  onChange={(e) => setPublicName(e.target.value)}
                  required
                />
                {fieldError("publicName") && (
                  <p className="text-xs text-red-500">{fieldError("publicName")}</p>
                )}
              </div>
            </div>

            <div className="h-px bg-muted/30" />

            {/* Logo upload */}
            <div className="space-y-1.5">
              <Label>לוגו הסטודיו</Label>
              <LogoUpload
                value={logoUrl}
                onChange={setLogoUrl}
                onColorsExtracted={(colors) => {
                  if (colors[0] && !studio.primaryColor) {
                    setPrimaryColor(colors[0]);
                  }
                }}
              />
            </div>

            <div className="h-px bg-muted/30" />

            {/* Colors */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium">צבעים</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="primaryColorPicker">צבע ראשי</Label>
                  <div className="flex items-center gap-2">
                    <input
                      id="primaryColorPicker"
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="h-9 w-14 cursor-pointer rounded-md border border-input p-0.5"
                    />
                    <span className="text-sm font-mono text-muted-foreground" dir="ltr">
                      {primaryColor}
                    </span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="secondaryColorPicker">צבע משני</Label>
                  <div className="flex items-center gap-2">
                    <input
                      id="secondaryColorPicker"
                      type="color"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="h-9 w-14 cursor-pointer rounded-md border border-input p-0.5"
                    />
                    <span className="text-sm font-mono text-muted-foreground" dir="ltr">
                      {secondaryColor}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="h-px bg-muted/30" />

            {/* Typography: scrollable list + preview side-by-side */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium">טיפוגרפיה</h3>
              <div className="flex flex-col md:flex-row gap-4">
                {/* Left: font list + size pills */}
                <div className="space-y-3 md:w-52 shrink-0">
                  <div className="overflow-y-auto max-h-52 rounded-xl border border-muted/40 bg-muted/10 p-1 space-y-0.5">
                    {FONT_FAMILIES.map((f) => (
                      <button
                        key={f.value}
                        type="button"
                        onClick={() => setFontFamily(f.value)}
                        style={{ fontFamily: f.value || undefined }}
                        className={`w-full text-right px-3 py-2 rounded-lg text-sm transition-colors ${
                          fontFamily === f.value
                            ? "bg-[var(--studio-primary,hsl(var(--primary)))] text-white"
                            : "hover:bg-muted/60"
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">גודל טקסט</Label>
                    <div className="flex gap-1.5">
                      {FONT_SIZES.map((s) => (
                        <button
                          key={s.value}
                          type="button"
                          onClick={() => setFontSize(s.value)}
                          className={`flex-1 rounded-full border px-2 py-1 text-xs font-medium transition-colors ${
                            fontSize === s.value
                              ? "border-[var(--studio-primary,var(--primary))] bg-[var(--studio-primary,var(--primary))] text-white"
                              : "border-input bg-background hover:bg-muted"
                          }`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right: live preview card */}
                <Card className="flex-1 overflow-hidden">
                  <div
                    className="px-4 py-3 text-white text-sm font-medium"
                    style={{ backgroundColor: primaryColor }}
                  >
                    תצוגה מקדימה — כותרת ראשית
                  </div>
                  <CardContent
                    className="py-4 space-y-2"
                    style={{
                      fontFamily: fontFamily || undefined,
                      fontSize: previewFontSize,
                    }}
                  >
                    <p className="font-semibold">{studio.publicName}</p>
                    <p className="text-sm">פרט משני</p>
                    <div className="flex gap-2 mt-1">
                      <span
                        className="inline-block rounded-full px-3 py-0.5 text-xs text-white"
                        style={{ backgroundColor: primaryColor }}
                      >
                        צבע ראשי
                      </span>
                      <span
                        className="inline-block rounded-full px-3 py-0.5 text-xs text-white"
                        style={{ backgroundColor: secondaryColor }}
                      >
                        צבע משני
                      </span>
                    </div>
                    <p className="text-muted-foreground">
                      טקסט רגיל בגודל{" "}
                      {fontSize === "small" ? "קטן" : fontSize === "large" ? "גדול" : "בינוני"}
                    </p>
                    <div
                      className="h-1 w-16 rounded-full mt-2"
                      style={{ backgroundColor: primaryColor }}
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ── Tab: פרטי קשר ── */}
        <TabsContent value="contact">
          <div className="mt-4 rounded-2xl bg-white/80 shadow-sm border border-muted/30 p-5 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="contactEmail">מייל ליצירת קשר</Label>
                <Input
                  id="contactEmail"
                  name="contactEmail"
                  type="email"
                  placeholder="studio@example.com"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                />
                {fieldError("contactEmail") && (
                  <p className="text-xs text-red-500">{fieldError("contactEmail")}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="address">כתובת</Label>
                <Input
                  id="address"
                  name="address"
                  placeholder="רחוב, עיר"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
            </div>

            <div className="h-px bg-muted/30" />

            <div className="space-y-1">
              <h3 className="text-sm font-medium">טלפונים</h3>
              <p className="text-xs text-muted-foreground">ניתן להזין מספרים שונים לשיחות ולוואטסאפ</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="phoneNumber">טלפון לשיחות</Label>
                <Input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  placeholder="050-0000000"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  dir="ltr"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="whatsappNumber">מספר וואטסאפ</Label>
                <Input
                  id="whatsappNumber"
                  name="whatsappNumber"
                  type="tel"
                  placeholder="972500000000"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  dir="ltr"
                />
                <p className="text-xs text-muted-foreground">כולל קוד מדינה, ללא +</p>
              </div>
            </div>

            <input type="hidden" name="contactPhone" value={studio.contactPhone ?? ""} />
          </div>
        </TabsContent>

        {/* ── Tab: קישורים ורשתות ── */}
        <TabsContent value="links">
          <div className="mt-4 rounded-2xl bg-white/80 shadow-sm border border-muted/30 p-5 space-y-6">
            {/* hasOwnWebsite — bigger clickable row */}
            <label
              htmlFor="hasOwnWebsite"
              className="flex items-center gap-3 rounded-xl bg-muted/30 border border-muted/40 px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors"
            >
              <input
                id="hasOwnWebsite"
                type="checkbox"
                checked={hasOwnWebsite}
                onChange={(e) => setHasOwnWebsite(e.target.checked)}
                className="h-4 w-4 rounded border-input"
              />
              <span className="text-sm">יש לי אתר משלי</span>
            </label>

            {hasOwnWebsite ? (
              <div className="space-y-1.5">
                <Label htmlFor="websiteUrl">כתובת האתר</Label>
                <Input
                  id="websiteUrl"
                  name="websiteUrl"
                  type="text"
                  placeholder="https://mystudio.co.il"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  dir="ltr"
                />
                {fieldError("websiteUrl") && (
                  <p className="text-xs text-red-500">{fieldError("websiteUrl")}</p>
                )}
              </div>
            ) : (
              <input type="hidden" name="websiteUrl" value="" />
            )}

            <div className="h-px bg-muted/30" />

            <h3 className="text-sm font-medium">רשתות חברתיות</h3>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="facebookUrl">פייסבוק</Label>
                <Input
                  id="facebookUrl"
                  name="facebookUrl"
                  type="text"
                  placeholder="https://facebook.com/mystudio"
                  value={facebookUrl}
                  onChange={(e) => setFacebookUrl(e.target.value)}
                  dir="ltr"
                />
                {fieldError("facebookUrl") && (
                  <p className="text-xs text-red-500">{fieldError("facebookUrl")}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="instagramUrl">אינסטגרם</Label>
                <Input
                  id="instagramUrl"
                  name="instagramUrl"
                  type="text"
                  placeholder="https://instagram.com/mystudio"
                  value={instagramUrl}
                  onChange={(e) => setInstagramUrl(e.target.value)}
                  dir="ltr"
                />
                {fieldError("instagramUrl") && (
                  <p className="text-xs text-red-500">{fieldError("instagramUrl")}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="reviewsUrl">קישור לביקורות</Label>
                <Input
                  id="reviewsUrl"
                  name="reviewsUrl"
                  type="text"
                  placeholder="https://g.page/... או TripAdvisor"
                  value={reviewsUrl}
                  onChange={(e) => setReviewsUrl(e.target.value)}
                  dir="ltr"
                />
                <p className="text-xs text-muted-foreground">גוגל ביזנס, TripAdvisor וכד&#39;</p>
                {fieldError("reviewsUrl") && (
                  <p className="text-xs text-red-500">{fieldError("reviewsUrl")}</p>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ── Tab: תשלומים ואינטגרציות ── */}
        <TabsContent value="integrations">
          <div className="mt-4 rounded-2xl bg-white/80 shadow-sm border border-muted/30 p-5 space-y-6">
            {/* Payment URL */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium">קישור לתשלום</h3>
              <p className="text-xs text-muted-foreground">
                קישור לדף תשלום חיצוני (Morning, bit, PayBox וכד&#39;)
              </p>
              <div className="space-y-1.5">
                <Label htmlFor="paymentUrl">קישור לדף תשלום</Label>
                <Input
                  id="paymentUrl"
                  name="paymentUrl"
                  type="text"
                  placeholder="https://meshulam.co.il/..."
                  value={paymentUrl}
                  onChange={(e) => setPaymentUrl(e.target.value)}
                  dir="ltr"
                />
                {fieldError("paymentUrl") && (
                  <p className="text-xs text-red-500">{fieldError("paymentUrl")}</p>
                )}
              </div>
            </div>

            <div className="h-px bg-muted/30" />

            {/* Invite Channel */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium">הגדרות הזמנות</h3>
              <p className="text-xs text-muted-foreground">כיצד לשלוח הזמנות ללקוחות מהמערכת</p>
              <div className="space-y-1.5">
                <Label htmlFor="inviteChannelSelect">שלח הזמנות באמצעות</Label>
                <select
                  id="inviteChannelSelect"
                  value={inviteChannel}
                  onChange={(e) => setInviteChannel(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="both">מייל + וואטסאפ</option>
                  <option value="email">מייל בלבד</option>
                  <option value="whatsapp">וואטסאפ בלבד</option>
                </select>
              </div>
            </div>

            <div className="h-px bg-muted/30" />

            {/* Google Calendar */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Google Calendar</h3>
              <p className="text-xs text-muted-foreground">
                חיבור לגוגל קלנדר יסנכרן אירועי סדנאות אוטומטית
              </p>
              <div className="flex items-center gap-3">
                {googleCalendarConnected ? (
                  <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700">
                    <span>מחובר לגוגל קלנדר</span>
                  </div>
                ) : (
                  <Link
                    href="/api/auth/google/connect"
                    className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-xs hover:bg-muted transition-colors"
                  >
                    חבר Google Calendar
                  </Link>
                )}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end pt-4">
        <Button
          type="submit"
          disabled={isPending}
          className="w-full sm:w-auto bg-[var(--studio-primary,hsl(var(--primary)))] text-white hover:opacity-90 hover:bg-[var(--studio-primary,hsl(var(--primary)))]"
        >
          {isPending ? "שומר..." : "שמור הגדרות"}
        </Button>
      </div>
    </form>
  );
}
