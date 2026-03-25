"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const RegisterSchema = z
  .object({
    name: z.string().min(2, "שם מלא חייב להכיל לפחות 2 תווים"),
    email: z.string().email("כתובת אימייל לא תקינה"),
    password: z.string().min(6, "סיסמה חייבת להכיל לפחות 6 תווים"),
    confirmPassword: z.string(),
    studioName: z.string().min(2, "שם הסטודיו חייב להכיל לפחות 2 תווים"),
    slug: z
      .string()
      .min(2, "מזהה הסטודיו חייב להכיל לפחות 2 תווים")
      .regex(/^[a-z0-9-]+$/, "מזהה יכול להכיל רק אותיות קטנות באנגלית, מספרים ומקפים"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "הסיסמאות אינן תואמות",
    path: ["confirmPassword"],
  });

export type RegisterFormState = {
  errors?: Record<string, string[]>;
  message?: string;
  success?: boolean;
  userId?: string;
};

export async function registerUser(
  _prev: RegisterFormState,
  formData: FormData
): Promise<RegisterFormState> {
  const raw = {
    name: (formData.get("name") as string) ?? "",
    email: (formData.get("email") as string) ?? "",
    password: (formData.get("password") as string) ?? "",
    confirmPassword: (formData.get("confirmPassword") as string) ?? "",
    studioName: (formData.get("studioName") as string) ?? "",
    slug: (formData.get("slug") as string) ?? "",
  };

  const parsed = RegisterSchema.safeParse(raw);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const { name, email, password, studioName, slug } = parsed.data;

  // Check email uniqueness
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return { errors: { email: ["כתובת האימייל כבר בשימוש"] } };
  }

  // Check slug uniqueness
  const existingStudio = await prisma.studio.findUnique({ where: { slug } });
  if (existingStudio) {
    return { errors: { slug: ["מזהה הסטודיו כבר בשימוש"] } };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  // Create user, studio, and membership in a transaction
  const user = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        name,
        email,
        passwordHash,
      },
    });

    const studio = await tx.studio.create({
      data: {
        name: studioName,
        publicName: studioName,
        slug,
      },
    });

    await tx.studioMember.create({
      data: {
        userId: newUser.id,
        studioId: studio.id,
        role: "OWNER",
        isActive: true,
        joinedAt: new Date(),
      },
    });

    return newUser;
  });

  return { success: true, userId: user.id };
}
