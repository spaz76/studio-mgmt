import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getGoogleAuthUrl } from "@/services/googleCalendarSync";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  const studioId = session.user.memberships?.[0]?.studioId;
  if (!studioId) return NextResponse.json({ error: "No studio" }, { status: 400 });

  const url = getGoogleAuthUrl(studioId);
  return NextResponse.redirect(url);
}
