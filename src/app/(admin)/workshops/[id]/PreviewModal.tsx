"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Eye } from "lucide-react";

interface Props {
  studioSlug: string;
  eventId: string;
}

export function PreviewModal({ studioSlug, eventId }: Props) {
  const [open, setOpen] = useState(false);
  const publicUrl = `/s/${studioSlug}/event/${eventId}`;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className={buttonVariants({ variant: "outline", size: "sm" })}>
        <Eye className="h-4 w-4 ml-1" />
        תצוגה מקדימה
      </DialogTrigger>
      <DialogContent className="max-w-lg h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-4 py-3 border-b shrink-0">
          <DialogTitle className="text-sm">תצוגה מקדימה — דף ציבורי</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-hidden">
          <iframe
            src={publicUrl}
            className="w-full h-full border-0"
            title="תצוגה מקדימה"
          />
        </div>
        <div className="px-4 py-3 border-t shrink-0 flex justify-between items-center">
          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline"
          >
            פתח בטאב חדש ↗
          </a>
          <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
            סגור
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
