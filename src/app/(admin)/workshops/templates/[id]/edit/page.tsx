import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { getStudioId } from "@/lib/studio";
import { updateTemplate } from "@/actions/workshop-templates";
import { TemplateForm } from "../../TemplateForm";
import type { TemplateFormState } from "@/actions/workshop-templates";

export const metadata = { title: "עריכת תבנית" };

export default async function EditTemplatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const studioId = await getStudioId();

  const template = await prisma.workshopTemplate.findFirst({
    where: { id, studioId },
  });

  if (!template) notFound();

  const boundAction = async (
    prev: TemplateFormState,
    formData: FormData
  ) => {
    "use server";
    return updateTemplate(id, prev, formData);
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">עריכת תבנית: {template.name}</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">פרטי התבנית</CardTitle>
        </CardHeader>
        <CardContent>
          <TemplateForm
            action={boundAction}
            initialData={template}
            submitLabel="שמור שינויים"
          />
        </CardContent>
      </Card>
    </div>
  );
}
