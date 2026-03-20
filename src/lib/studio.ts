import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

/**
 * Returns the first active studioId for the current session user.
 * Redirects to /login if unauthenticated, throws if no studio found.
 */
export async function getStudioId(): Promise<string> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const membership = session.user.memberships?.[0];
  if (!membership?.studioId) {
    throw new Error("No studio membership found for this user");
  }

  return membership.studioId;
}

export async function getStudioIdAndUser(): Promise<{
  studioId: string;
  userId: string;
}> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const membership = session.user.memberships?.[0];
  if (!membership?.studioId) {
    throw new Error("No studio membership found for this user");
  }

  return { studioId: membership.studioId, userId: session.user.id };
}
