import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { LoginForm } from "./LoginForm";
import { LoginPageHeader } from "./LoginPageHeader";

export const metadata: Metadata = { title: "כניסה" };

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  const showGoogle = !!process.env.GOOGLE_CLIENT_ID;
  const showApple = !!process.env.APPLE_CLIENT_ID;

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-sm">
        <LoginPageHeader />
        <LoginForm showGoogle={showGoogle} showApple={showApple} />
      </div>
    </div>
  );
}
