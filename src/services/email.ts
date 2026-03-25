/**
 * Email service — sends emails via Gmail API using the studio's Google OAuth tokens.
 * Falls back silently (logs warning) if tokens are missing.
 */

import { prisma } from "@/lib/prisma";
import { google } from "googleapis";

export async function sendEmail(
  studioId: string,
  to: string,
  subject: string,
  htmlBody: string
): Promise<void> {
  const integration = await prisma.studioIntegration.findUnique({
    where: {
      studioId_provider: { studioId, provider: "google_calendar" },
    },
  });

  if (!integration?.accessToken) {
    console.warn(`[email] No Google OAuth tokens for studio ${studioId} — skipping email to ${to}`);
    return;
  }

  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );

    oauth2Client.setCredentials({
      access_token: integration.accessToken,
      refresh_token: integration.refreshToken ?? undefined,
    });

    // Auto-refresh expired token and persist new tokens
    oauth2Client.on("tokens", async (tokens) => {
      if (tokens.access_token) {
        await prisma.studioIntegration.update({
          where: { studioId_provider: { studioId, provider: "google_calendar" } },
          data: {
            accessToken: tokens.access_token,
            ...(tokens.refresh_token && { refreshToken: tokens.refresh_token }),
          },
        });
      }
    });

    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    const message = [
      `To: ${to}`,
      `Subject: =?UTF-8?B?${Buffer.from(subject).toString("base64")}?=`,
      "MIME-Version: 1.0",
      "Content-Type: text/html; charset=UTF-8",
      "",
      htmlBody,
    ].join("\r\n");

    const encoded = Buffer.from(message)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    await gmail.users.messages.send({
      userId: "me",
      requestBody: { raw: encoded },
    });
  } catch (err) {
    console.warn(`[email] Failed to send email to ${to}:`, err);
  }
}

export function buildEventInviteEmail({
  studioName,
  logoUrl,
  primaryColor,
  eventTitle,
  eventDescription,
  eventDay,
  eventDate,
  eventTime,
  price,
  registrationUrl,
}: {
  studioName: string;
  logoUrl?: string | null;
  primaryColor?: string | null;
  eventTitle: string;
  eventDescription?: string | null;
  eventDay: string;
  eventDate: string;
  eventTime: string;
  price: number;
  registrationUrl: string;
}): string {
  const color = primaryColor ?? "#6366f1";

  return `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>הזמנה ל${eventTitle}</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'Segoe UI',Tahoma,Arial,sans-serif;direction:rtl;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:${color};padding:28px 32px;text-align:center;">
              ${logoUrl
                ? `<img src="${logoUrl}" alt="${studioName}" style="height:52px;max-width:200px;object-fit:contain;margin-bottom:12px;display:block;margin-left:auto;margin-right:auto;" />`
                : ""}
              <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:700;">${studioName}</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <h2 style="margin:0 0 8px;font-size:20px;color:#1a1a1a;">הוזמנת ל${eventTitle}!</h2>
              ${eventDescription
                ? `<p style="margin:0 0 24px;color:#555;font-size:15px;line-height:1.6;">${eventDescription}</p>`
                : ""}

              <!-- Date cells -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td width="33%" style="text-align:center;background:#f8f8f8;border-radius:8px;padding:14px 8px;margin-left:4px;">
                    <div style="font-size:12px;color:#888;margin-bottom:4px;">יום</div>
                    <div style="font-size:16px;font-weight:700;color:#1a1a1a;">${eventDay}</div>
                  </td>
                  <td width="4px"></td>
                  <td width="33%" style="text-align:center;background:#f8f8f8;border-radius:8px;padding:14px 8px;">
                    <div style="font-size:12px;color:#888;margin-bottom:4px;">תאריך</div>
                    <div style="font-size:16px;font-weight:700;color:#1a1a1a;">${eventDate}</div>
                  </td>
                  <td width="4px"></td>
                  <td width="33%" style="text-align:center;background:#f8f8f8;border-radius:8px;padding:14px 8px;">
                    <div style="font-size:12px;color:#888;margin-bottom:4px;">שעה</div>
                    <div style="font-size:16px;font-weight:700;color:#1a1a1a;">${eventTime}</div>
                  </td>
                </tr>
              </table>

              ${price > 0
                ? `<p style="margin:0 0 24px;font-size:15px;color:#555;">מחיר: <strong>₪${price.toFixed(0)}</strong> למשתתף</p>`
                : ""}

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${registrationUrl}"
                       style="display:inline-block;background:${color};color:#ffffff;text-decoration:none;font-size:16px;font-weight:700;padding:14px 36px;border-radius:8px;">
                      אשר את הרשמתי
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:16px 32px;border-top:1px solid #f0f0f0;text-align:center;">
              <p style="margin:0;font-size:12px;color:#aaa;">${studioName}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
