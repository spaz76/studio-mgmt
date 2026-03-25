"use client";

import { useActionState, useState, useEffect, useRef, startTransition } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { registerUser, type RegisterFormState } from "@/actions/register";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function RegisterForm() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState<RegisterFormState, FormData>(
    registerUser,
    {}
  );

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [studioName, setStudioName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Auto-generate slug from studio name
  useEffect(() => {
    if (!slugManuallyEdited) {
      startTransition(() => setSlug(toSlug(studioName)));
    }
  }, [studioName, slugManuallyEdited]);

  // Keep refs up-to-date so auto-login after registration can read them
  const emailRef = useRef(email);
  const passwordRef = useRef(password);
  useEffect(() => { emailRef.current = email; }, [email]);
  useEffect(() => { passwordRef.current = password; }, [password]);

  // After successful registration, auto-login
  useEffect(() => {
    if (state.success && state.userId) {
      startTransition(() => setIsSigningIn(true));
      signIn("credentials", { email: emailRef.current, password: passwordRef.current, redirect: false }).then((result) => {
        if (!result?.error) {
          router.push("/dashboard");
          router.refresh();
        } else {
          // Fallback to login page if auto-login fails
          router.push("/login");
        }
      });
    }
  }, [state.success, state.userId, router]);

  function fieldError(field: string) {
    return state.errors?.[field]?.[0];
  }

  const loading = isPending || isSigningIn;

  return (
    <Card>
      <CardHeader>
        <CardTitle>יצירת חשבון</CardTitle>
        <CardDescription>מלא את הפרטים כדי להתחיל</CardDescription>
      </CardHeader>
      <CardContent>
        <form id="register-form" action={formAction} className="space-y-4">
          {/* Full name */}
          <div className="space-y-1.5">
            <Label htmlFor="name">שם מלא</Label>
            <Input
              id="name"
              name="name"
              placeholder="ישראל ישראלי"
              required
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            {fieldError("name") && (
              <p className="text-xs text-destructive">{fieldError("name")}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="email">אימייל</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="name@studio.co.il"
              required
              autoComplete="email"
              dir="ltr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {fieldError("email") && (
              <p className="text-xs text-destructive">{fieldError("email")}</p>
            )}
          </div>

          {/* Password */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="password">סיסמה</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="new-password"
                  dir="ltr"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pe-9"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {fieldError("password") && (
                <p className="text-xs text-destructive">{fieldError("password")}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">אימות סיסמה</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="new-password"
                  dir="ltr"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pe-9"
                />
              </div>
              {fieldError("confirmPassword") && (
                <p className="text-xs text-destructive">{fieldError("confirmPassword")}</p>
              )}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">מינימום 6 תווים. אותיות גדולות ומספרים מומלצים אך לא חובה.</p>

          {/* Studio name */}
          <div className="space-y-1.5">
            <Label htmlFor="studioName">שם הסטודיו</Label>
            <Input
              id="studioName"
              name="studioName"
              placeholder="סטודיו שלי"
              required
              value={studioName}
              onChange={(e) => setStudioName(e.target.value)}
            />
            {fieldError("studioName") && (
              <p className="text-xs text-destructive">{fieldError("studioName")}</p>
            )}
          </div>

          {/* Slug */}
          <div className="space-y-1.5">
            <Label htmlFor="slug">מזהה סטודיו (URL)</Label>
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground whitespace-nowrap">studio-labs.app/</span>
              <Input
                id="slug"
                name="slug"
                placeholder="my-studio"
                required
                dir="ltr"
                value={slug}
                onChange={(e) => {
                  setSlug(toSlug(e.target.value));
                  setSlugManuallyEdited(true);
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground">אותיות קטנות, מספרים ומקפים בלבד</p>
            {fieldError("slug") && (
              <p className="text-xs text-destructive">{fieldError("slug")}</p>
            )}
          </div>

          {state.errors && Object.keys(state.errors).length > 0 && !Object.values(state.errors).some(Boolean) === false && (
            <p className="text-sm text-destructive text-center">יש שגיאות בטופס</p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="ms-2 h-4 w-4 animate-spin" />}
            {isSigningIn ? "מתחבר..." : "צור חשבון"}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          יש לך כבר חשבון?{" "}
          <Link href="/login" className="font-medium underline underline-offset-4">
            התחבר
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
