"use server";

import { prisma } from "@/lib/prisma";
import { getStudioId } from "@/lib/studio";
import { revalidatePath } from "next/cache";
import * as suppliersService from "@/services/suppliers";
import { redirect } from "next/navigation";

export async function createSupplierAction(formData: FormData) {
  const studioId = await getStudioId();
  const name = (formData.get("name") as string)?.trim();
  if (!name) return { error: "שם הוא שדה חובה" };

  const supplier = await suppliersService.createSupplier(prisma, studioId, {
    name,
    email: (formData.get("email") as string) || null,
    phone: (formData.get("phone") as string) || null,
    website: (formData.get("website") as string) || null,
    notes: (formData.get("notes") as string) || null,
  });

  // Create contacts if provided
  const contactsRaw = formData.get("contacts") as string;
  if (contactsRaw) {
    const contacts: Array<{ name: string; role: string; phone: string; extension: string; email: string }> =
      JSON.parse(contactsRaw);
    for (const ct of contacts) {
      if (ct.name?.trim()) {
        await suppliersService.addSupplierContact(prisma, supplier.id, {
          name: ct.name.trim(),
          role: ct.role || null,
          phone: ct.phone || null,
          extension: ct.extension || null,
          email: ct.email || null,
        });
      }
    }
  }

  revalidatePath("/suppliers");
  redirect(`/suppliers/${supplier.id}`);
}

export async function updateSupplierAction(id: string, formData: FormData) {
  const studioId = await getStudioId();
  await suppliersService.updateSupplier(prisma, studioId, id, {
    name: (formData.get("name") as string)?.trim(),
    email: (formData.get("email") as string) || null,
    phone: (formData.get("phone") as string) || null,
    website: (formData.get("website") as string) || null,
    notes: (formData.get("notes") as string) || null,
  });
  revalidatePath(`/suppliers/${id}`);
  revalidatePath("/suppliers");
}

export async function addSupplierContactAction(supplierId: string, formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  if (!name) return { error: "שם הוא שדה חובה" };

  await suppliersService.addSupplierContact(prisma, supplierId, {
    name,
    role: (formData.get("role") as string) || null,
    phone: (formData.get("phone") as string) || null,
    extension: (formData.get("extension") as string) || null,
    email: (formData.get("email") as string) || null,
  });

  revalidatePath(`/suppliers/${supplierId}`);
}

export async function deleteSupplierContactAction(supplierId: string, contactId: string) {
  await suppliersService.deleteSupplierContact(prisma, contactId);
  revalidatePath(`/suppliers/${supplierId}`);
}
