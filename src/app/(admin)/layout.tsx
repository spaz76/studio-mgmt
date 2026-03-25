import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AdminShell } from "@/components/layout/AdminShell";
import { prisma } from "@/lib/prisma";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Inject studio brand colors as CSS custom properties + fetch studio info
  const studioId = session.user.memberships?.[0]?.studioId;
  let brandStyle = "";
  let studioName = session.user.memberships?.[0]?.studioName ?? "";
  let studioLogoUrl: string | null = null;

  if (studioId) {
    const studio = await prisma.studio.findUnique({
      where: { id: studioId },
      select: { primaryColor: true, secondaryColor: true, name: true, logoUrl: true },
    });
    if (studio) {
      const primary = studio.primaryColor ?? "#6366f1";
      const secondary = studio.secondaryColor ?? "#f59e0b";
      brandStyle = `--studio-primary:${primary};--studio-secondary:${secondary};`;
      studioName = studio.name ?? studioName;
      studioLogoUrl = studio.logoUrl ?? null;
    }
  }

  return (
    <>
      {brandStyle && (
        <style>{`:root{${brandStyle}}`}</style>
      )}
      <AdminShell studioName={studioName} studioLogoUrl={studioLogoUrl}>
        {children}
      </AdminShell>
    </>
  );
}
