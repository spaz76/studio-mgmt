import type { PrismaClient } from "@/generated/prisma";

export interface MessageTemplateInput {
  type: string;
  channel: string;
  subject?: string | null;
  body: string;
  isActive?: boolean;
  level?: string;
  templateId?: string | null;
  eventId?: string | null;
}

// Hebrew default templates for studio-level
export const DEFAULT_TEMPLATES: Array<{
  type: string;
  channel: string;
  subject: string;
  body: string;
}> = [
  {
    type: "confirmation",
    channel: "whatsapp",
    subject: "אישור הרשמה",
    body: "שלום {שם_לקוח} 😊\n\nתודה שנרשמת לסדנה *{שם_סדנה}*!\n📅 {תאריך} בשעה {שעה}\n\nנשמח לראות אותך! לכל שאלה ניתן לפנות אלינו.",
  },
  {
    type: "confirmation",
    channel: "email",
    subject: "אישור הרשמה לסדנה — {שם_סדנה}",
    body: "שלום {שם_לקוח},\n\nשמחים לאשר את הרשמתך לסדנה *{שם_סדנה}*.\nתאריך: {תאריך}\nשעה: {שעה}\n\nלכל שאלה נשמח לעמוד לרשותך.",
  },
  {
    type: "reminder",
    channel: "whatsapp",
    subject: "תזכורת לסדנה",
    body: "שלום {שם_לקוח} 👋\n\nרק מזכירים — מחר מתקיימת הסדנה *{שם_סדנה}* בשעה {שעה}.\nמצפים לראותך! 🎨",
  },
  {
    type: "reminder",
    channel: "sms",
    subject: "",
    body: "שלום {שם_לקוח}, תזכורת לסדנה {שם_סדנה} מחר בשעה {שעה}. להתראות!",
  },
  {
    type: "thankyou",
    channel: "whatsapp",
    subject: "תודה שהצטרפת",
    body: "שלום {שם_לקוח} 🌟\n\nתודה שהצטרפת לסדנה *{שם_סדנה}* — היה נהדר!\nנשמח לראותך שוב. {קישור_הרשמה}",
  },
  {
    type: "payment_reminder",
    channel: "whatsapp",
    subject: "תזכורת תשלום",
    body: "שלום {שם_לקוח},\n\nשמנו לב שטרם קיבלנו את התשלום עבור הסדנה *{שם_סדנה}*.\nנשמח אם תוכל/י לסדר זאת בהקדם. תודה! 🙏",
  },
  {
    type: "feedback",
    channel: "whatsapp",
    subject: "נשמח לשמוע ממך",
    body: "שלום {שם_לקוח} 😊\n\nאיך היה? נשמח לשמוע מה דעתך על הסדנה *{שם_סדנה}*.\nכמה מילים יעזרו לנו מאוד! 💬",
  },
];

export async function getMessageTemplates(
  prisma: PrismaClient,
  studioId: string,
  level = "studio"
) {
  return prisma.messageTemplate.findMany({
    where: { studioId, level },
    orderBy: [{ type: "asc" }, { channel: "asc" }],
  });
}

export async function upsertMessageTemplate(
  prisma: PrismaClient,
  studioId: string,
  id: string | null,
  input: MessageTemplateInput
) {
  if (id) {
    return prisma.messageTemplate.update({
      where: { id },
      data: input,
    });
  }
  return prisma.messageTemplate.create({
    data: { studioId, ...input },
  });
}

export async function deleteMessageTemplate(
  prisma: PrismaClient,
  studioId: string,
  id: string
) {
  return prisma.messageTemplate.delete({
    where: { id, studioId },
  });
}

export async function seedDefaultTemplates(
  prisma: PrismaClient,
  studioId: string
) {
  // Only seed if none exist yet for this studio at studio level
  const existing = await prisma.messageTemplate.count({
    where: { studioId, level: "studio" },
  });
  if (existing > 0) return;

  await prisma.messageTemplate.createMany({
    data: DEFAULT_TEMPLATES.map((t) => ({
      studioId,
      level: "studio",
      ...t,
    })),
  });
}
