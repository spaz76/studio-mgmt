// Google Calendar Sync Service
// Requires: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET env vars

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_CALENDAR_API = "https://www.googleapis.com/calendar/v3";

export function getGoogleAuthUrl(studioId: string) {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID || "",
    redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/google/callback`,
    response_type: "code",
    scope: "https://www.googleapis.com/auth/calendar",
    access_type: "offline",
    prompt: "consent",
    state: studioId,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeCodeForTokens(code: string) {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID || "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
      redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/google/callback`,
      grant_type: "authorization_code",
    }),
  });
  return res.json() as Promise<{
    access_token?: string;
    refresh_token?: string;
    error?: string;
  }>;
}

export async function createCalendarEvent(
  accessToken: string,
  calendarId: string,
  event: {
    title: string;
    description?: string | null;
    startsAt: Date;
    endsAt: Date;
    location?: string | null;
  }
) {
  const res = await fetch(
    `${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        summary: event.title,
        description: event.description || "",
        location: event.location || "",
        start: { dateTime: event.startsAt.toISOString() },
        end: { dateTime: event.endsAt.toISOString() },
      }),
    }
  );
  return res.json() as Promise<{ id?: string; error?: unknown }>;
}

export async function updateCalendarEvent(
  accessToken: string,
  calendarId: string,
  googleEventId: string,
  event: {
    title: string;
    description?: string | null;
    startsAt: Date;
    endsAt: Date;
    location?: string | null;
  }
) {
  const res = await fetch(
    `${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events/${googleEventId}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        summary: event.title,
        description: event.description || "",
        location: event.location || "",
        start: { dateTime: event.startsAt.toISOString() },
        end: { dateTime: event.endsAt.toISOString() },
      }),
    }
  );
  return res.json() as Promise<{ id?: string; error?: unknown }>;
}

export async function deleteCalendarEvent(
  accessToken: string,
  calendarId: string,
  googleEventId: string
) {
  await fetch(
    `${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events/${googleEventId}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
}
