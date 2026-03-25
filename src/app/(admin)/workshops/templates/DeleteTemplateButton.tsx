"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { deleteTemplate } from "@/actions/workshop-templates";
import { Trash2 } from "lucide-react";

export function DeleteTemplateButton({
  id,
  name,
  eventCount,
}: {
  id: string;
  name: string;
  eventCount: number;
}) {
  const [isPending, startTransition] = useTransition();
  const [showDialog, setShowDialog] = useState(false);

  function handleClick() {
    setShowDialog(true);
  }

  function handleConfirm() {
    setShowDialog(false);
    startTransition(() => deleteTemplate(id));
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="w-full text-destructive hover:text-destructive"
        onClick={handleClick}
        disabled={isPending}
      >
        <Trash2 className="h-3.5 w-3.5 ml-1" />
        {isPending ? "מוחק..." : "מחק"}
      </Button>

      {showDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-xl border border-border p-6 max-w-sm w-full space-y-4 shadow-lg">
            <h2 className="text-base font-semibold">מחיקת תבנית</h2>
            {eventCount > 0 ? (
              <p className="text-sm text-muted-foreground">
                לתבנית &quot;{name}&quot; יש <strong>{eventCount} אירועים</strong> מקושרים.
                התבנית תועבר לארכיון ולא תופיע ברשימה. האירועים לא יימחקו.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                לאחר המחיקה תבנית &quot;{name}&quot; תועבר לארכיון ולא תופיע ברשימה.
              </p>
            )}
            <div className="flex gap-3">
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleConfirm}
              >
                {eventCount > 0 ? "העבר לארכיון בכל זאת" : "העבר לארכיון"}
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowDialog(false)}
              >
                ביטול
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
