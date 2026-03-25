import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { RegisterForm } from "./RegisterForm";
import { LoginPageHeader } from "../login/LoginPageHeader";

export const metadata: Metadata = { title: "הרשמה" };

export default async function RegisterPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-sm">
        <LoginPageHeader />
        <RegisterForm />
      </div>
    </div>
  );
}
