"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { deleteTemplate } from "@/actions/workshop-templates";
import { Trash2 } from "lucide-react";

export function DeleteTemplateButton({
  id,
  name,
}: {
  id: string;
  name: string;
}) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm(`למחוק את תבנית "${name}"?`)) return;
    startTransition(() => deleteTemplate(id));
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="w-full text-destructive hover:text-destructive"
      onClick={handleDelete}
      disabled={isPending}
    >
      <Trash2 className="h-3.5 w-3.5 ml-1" />
      {isPending ? "מוחק..." : "מחק"}
    </Button>
  );
}
