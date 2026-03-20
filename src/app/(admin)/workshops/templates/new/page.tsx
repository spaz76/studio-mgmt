import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createTemplate } from "@/actions/workshop-templates";
import { TemplateForm } from "../TemplateForm";

export const metadata = { title: "תבנית חדשה" };

export default function NewTemplatePage() {
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">תבנית חדשה</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">פרטי התבנית</CardTitle>
        </CardHeader>
        <CardContent>
          <TemplateForm action={createTemplate} submitLabel="צור תבנית" />
        </CardContent>
      </Card>
    </div>
  );
}
