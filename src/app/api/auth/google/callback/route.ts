import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exchangeCodeForTokens } from "@/services/googleCalendarSync";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const studioId = searchParams.get("state");
  const error = searchParams.get("error");

  if (error || !code || !studioId) {
    return NextResponse.redirect(new URL("/settings?tab=integrations&error=1", req.url));
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    if (!tokens.access_token) {
      return NextResponse.redirect(new URL("/settings?tab=integrations&error=1", req.url));
    }

    await prisma.studioIntegration.upsert({
      where: { studioId_provider: { studioId, provider: "google_calendar" } },
      create: {
        studioId,
        provider: "google_calendar",
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || null,
        calendarId: "primary",
        enabled: true,
      },
      update: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || null,
        enabled: true,
      },
    });

    return NextResponse.redirect(new URL("/settings?tab=integrations&connected=1", req.url));
  } catch {
    return NextResponse.redirect(new URL("/settings?tab=integrations&error=1", req.url));
  }
}
