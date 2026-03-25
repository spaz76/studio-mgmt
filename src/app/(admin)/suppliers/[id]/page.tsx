import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getStudioId } from "@/lib/studio";
import { getSupplierById } from "@/services/suppliers";
import { updateSupplierAction } from "@/actions/suppliers";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChevronRight, Globe, Mail, Phone, Package } from "lucide-react";
import { ContactsSection } from "./ContactsSection";
import { EditSupplierForm } from "./EditSupplierForm";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supplier = await prisma.supplier.findUnique({
    where: { id },
    select: { name: true },
  });
  return { title: supplier?.name ?? "ספק" };
}

export default async function SupplierDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const studioId = await getStudioId();
  const supplier = await getSupplierById(prisma, studioId, id);

  if (!supplier) notFound();

  const updateAction = updateSupplierAction.bind(null, id);

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/suppliers" className="hover:text-foreground">
          ספקים
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">{supplier.name}</span>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">{supplier.name}</h1>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
          {supplier.phone && (
            <span className="flex items-center gap-1">
              <Phone className="h-3.5 w-3.5" />
              {supplier.phone}
            </span>
          )}
          {supplier.email && (
            <span className="flex items-center gap-1">
              <Mail className="h-3.5 w-3.5" />
              {supplier.email}
            </span>
          )}
          {supplier.website && (
            <a
              href={supplier.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-foreground"
            >
              <Globe className="h-3.5 w-3.5" />
              {supplier.website}
            </a>
          )}
        </div>
        {supplier.notes && (
          <p className="text-sm text-muted-foreground mt-2 border rounded-md px-3 py-2 bg-muted/30">
            {supplier.notes}
          </p>
        )}
      </div>

      {/* Linked materials */}
      {supplier.materialSuppliers.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              חומרים קשורים
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {supplier.materialSuppliers.map((ms) => (
                <div
                  key={ms.id}
                  className="flex items-center justify-between px-4 py-3"
                >
                  <Link
                    href={`/materials/${ms.material.id}`}
                    className="text-sm hover:underline font-medium"
                  >
                    {ms.material.name}
                  </Link>
                  {ms.pricePerUnit != null && (
                    <span className="text-xs text-muted-foreground">
                      ₪{Number(ms.pricePerUnit).toFixed(2)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contacts */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">אנשי קשר</CardTitle>
        </CardHeader>
        <CardContent>
          <ContactsSection supplierId={supplier.id} contacts={supplier.contacts} />
        </CardContent>
      </Card>

      {/* Edit form */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">עריכת פרטי הספק</CardTitle>
        </CardHeader>
        <CardContent>
          <EditSupplierForm supplier={supplier} action={updateAction} />
        </CardContent>
      </Card>

      <div>
        <Link
          href="/suppliers"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← חזרה לספקים
        </Link>
      </div>
    </div>
  );
}
