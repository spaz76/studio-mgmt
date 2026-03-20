import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = { title: "לוח בקרה" };

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">לוח בקרה</h1>
      <p className="text-muted-foreground">
        ברוכים הבאים, {session.user.name ?? session.user.email}
      </p>
    </div>
  );
}
