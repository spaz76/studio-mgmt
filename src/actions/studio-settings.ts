"use server";

import { prisma } from "@/lib/prisma";
import { getStudioId } from "@/lib/studio";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import * as settingsService from "@/services/studio-settings";

/** Auto-prefix https:// if user typed a URL without protocol */
function autoPrefix(val: string | null): string | null {
  if (!val || val.trim() === "") return null;
  const trimmed = val.trim();
  if (/^https?:\/\//.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

const SettingsSchema = z.object({
  name: z.string().min(1, "שם הסטודיו הוא שדה חובה"),
  publicName: z.string().min(1, "שם ציבורי הוא שדה חובה"),
  logoUrl: z.string().optional().nullable(),
  primaryColor: z.string().optional().nullable(),
  secondaryColor: z.string().optional().nullable(),
  fontFamily: z.string().optional().nullable(),
  fontSize: z.enum(["small", "medium", "large"]).default("medium"),
  contactEmail: z.string().email("כתובת מייל לא תקינה").optional().nullable().or(z.literal("")),
  contactPhone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  phoneNumber: z.string().optional().nullable(),
  whatsappNumber: z.string().optional().nullable(),
  websiteUrl: z.string().optional().nullable(),
  facebookUrl: z.string().optional().nullable(),
  instagramUrl: z.string().optional().nullable(),
  reviewsUrl: z.string().optional().nullable(),
  hasOwnWebsite: z.boolean().default(false),
  paymentUrl: z.string().optional().nullable(),
  inviteChannel: z.enum(["email", "whatsapp", "both"]).default("both"),
});

export type SettingsFormState = {
  errors?: Record<string, string[]>;
  message?: string;
  success?: boolean;
};

export async function updateSettings(
  _prev: SettingsFormState,
  formData: FormData
): Promise<SettingsFormState> {
  const studioId = await getStudioId();

  const raw = {
    name: formData.get("name") as string,
    publicName: formData.get("publicName") as string,
    logoUrl: (formData.get("logoUrl") as string) || null,
    primaryColor: (formData.get("primaryColor") as string) || null,
    secondaryColor: (formData.get("secondaryColor") as string) || null,
    fontFamily: (formData.get("fontFamily") as string) || null,
    fontSize: (formData.get("fontSize") as string) || "medium",
    contactEmail: (formData.get("contactEmail") as string) || null,
    contactPhone: (formData.get("contactPhone") as string) || null,
    address: (formData.get("address") as string) || null,
    phoneNumber: (formData.get("phoneNumber") as string) || null,
    whatsappNumber: (formData.get("whatsappNumber") as string) || null,
    websiteUrl: autoPrefix(formData.get("websiteUrl") as string),
    facebookUrl: autoPrefix(formData.get("facebookUrl") as string),
    instagramUrl: autoPrefix(formData.get("instagramUrl") as string),
    reviewsUrl: autoPrefix(formData.get("reviewsUrl") as string),
    hasOwnWebsite: formData.get("hasOwnWebsite") === "true",
    paymentUrl: autoPrefix(formData.get("paymentUrl") as string),
    inviteChannel: (formData.get("inviteChannel") as string) || "both",
  };

  const parsed = SettingsSchema.safeParse(raw);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  // Normalize empty email to null
  const data = {
    ...parsed.data,
    contactEmail: parsed.data.contactEmail === "" ? null : parsed.data.contactEmail,
  };

  await settingsService.updateStudioSettings(prisma, studioId, data);
  revalidatePath("/settings");
  return { success: true, message: "ההגדרות נשמרו בהצלחה" };
}
