"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle, Copy, Check } from "lucide-react";

interface ProductShareButtonsProps {
  productId: string;
  productName: string;
}

export function ProductShareButtons({ productId, productName }: ProductShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  function handleWhatsApp() {
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}/products/${productId}`
        : `/products/${productId}`;
    const text = `${productName}\n${url}`;
    window.open(
      `https://wa.me/?text=${encodeURIComponent(text)}`,
      "_blank"
    );
  }

  async function handleCopyLink() {
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}/products/${productId}`
        : `/products/${productId}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleWhatsApp}
        className="gap-1.5 text-green-600 border-green-200 hover:bg-green-50"
        type="button"
      >
        <MessageCircle className="h-4 w-4" />
        שתף בוואטסאפ
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={handleCopyLink}
        className="gap-1.5"
        type="button"
      >
        {copied ? (
          <>
            <Check className="h-4 w-4 text-green-600" />
            הקישור הועתק
          </>
        ) : (
          <>
            <Copy className="h-4 w-4" />
            העתק לינק
          </>
        )}
      </Button>
    </div>
  );
}
