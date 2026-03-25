/**
 * Studio settings service — pure business logic, no Next.js dependencies.
 */

import type { PrismaClient } from "@/generated/prisma";

export interface UpdateStudioSettingsInput {
  // Identity
  name?: string;
  publicName?: string;
  // Visual
  logoUrl?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  fontFamily?: string | null;
  fontSize?: string | null;
  // Contact
  contactEmail?: string | null;
  contactPhone?: string | null;
  address?: string | null;
  phoneNumber?: string | null;
  whatsappNumber?: string | null;
  // Links
  websiteUrl?: string | null;
  facebookUrl?: string | null;
  instagramUrl?: string | null;
  reviewsUrl?: string | null;
  hasOwnWebsite?: boolean;
  // Payment
  paymentUrl?: string | null;
  // Invite
  inviteChannel?: string | null;
}

export async function getStudio(prisma: PrismaClient, studioId: string) {
  return prisma.studio.findUnique({ where: { id: studioId } });
}

export async function updateStudioSettings(
  prisma: PrismaClient,
  studioId: string,
  input: UpdateStudioSettingsInput
) {
  return prisma.studio.update({
    where: { id: studioId },
    data: input,
  });
}
