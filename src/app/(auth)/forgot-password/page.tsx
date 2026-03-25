import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "שכחתי סיסמה" };

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Studio-Labs</h1>
          <p className="text-muted-foreground mt-1 text-sm">פחות ניהול, יותר יצירה.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>שכחת סיסמה?</CardTitle>
            <CardDescription>צרו קשר ונאפס לכם את הסיסמה</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              כרגע איפוס סיסמה מתבצע ידנית. שלחו לנו הודעה עם כתובת האימייל שלכם ונאפס את הסיסמה בהקדם.
            </p>
            <a
              href="https://wa.me/972000000000?text=היי, אשמח לאיפוס סיסמה עבור Studio-Labs"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors"
            >
              💬 שלח לנו בוואטסאפ
            </a>
            <p className="text-center text-sm text-muted-foreground">
              <Link href="/login" className="font-medium underline underline-offset-4">
                חזרה לכניסה
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
