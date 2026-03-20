import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "כניסה" };

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-sm">
        {/* Logo / Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Atnachta</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            ניהול סטודיו — כניסה למערכת
          </p>
        </div>

        <LoginForm />
      </div>
    </div>
  );
}
