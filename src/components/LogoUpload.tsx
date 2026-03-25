"use client";

import { useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, Loader2 } from "lucide-react";
import { compressImage } from "@/lib/compress-image";

interface ExtractedColor {
  hex: string;
  count: number;
}

interface LogoUploadProps {
  value: string;
  onChange: (url: string) => void;
  onColorsExtracted?: (colors: string[]) => void;
}

// Quantize a color channel to reduce palette
function quantize(value: number, step = 32): number {
  return Math.round(value / step) * step;
}

function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
}

// Extract dominant colors from an image element using canvas
function extractColors(img: HTMLImageElement, maxColors = 5): string[] {
  const canvas = document.createElement("canvas");
  const size = 100; // sample at 100x100 for performance
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return [];

  ctx.drawImage(img, 0, 0, size, size);
  const { data } = ctx.getImageData(0, 0, size, size);

  const colorMap = new Map<string, number>();

  for (let i = 0; i < data.length; i += 4) {
    const r = quantize(data[i]);
    const g = quantize(data[i + 1]);
    const b = quantize(data[i + 2]);
    const a = data[i + 3];

    // Skip transparent or near-white/near-black pixels
    if (a < 128) continue;
    if (r > 240 && g > 240 && b > 240) continue; // near white
    if (r < 20 && g < 20 && b < 20) continue; // near black

    const hex = rgbToHex(r, g, b);
    colorMap.set(hex, (colorMap.get(hex) ?? 0) + 1);
  }

  const sorted: ExtractedColor[] = Array.from(colorMap.entries())
    .map(([hex, count]) => ({ hex, count }))
    .sort((a, b) => b.count - a.count);

  // De-duplicate similar colors (distance threshold)
  const result: string[] = [];
  for (const { hex } of sorted) {
    if (result.length >= maxColors) break;
    const [r1, g1, b1] = hexToRgb(hex);
    const isTooSimilar = result.some((existing) => {
      const [r2, g2, b2] = hexToRgb(existing);
      const dist = Math.sqrt(
        Math.pow(r1 - r2, 2) + Math.pow(g1 - g2, 2) + Math.pow(b1 - b2, 2)
      );
      return dist < 60;
    });
    if (!isTooSimilar) result.push(hex);
  }

  return result;
}

function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

export function LogoUpload({ value, onChange, onColorsExtracted }: LogoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [extractedColors, setExtractedColors] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        setError("יש לבחור קובץ תמונה");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError("הקובץ גדול מדי (מקסימום 5MB)");
        return;
      }

      setError(null);
      setIsUploading(true);

      try {
        const formData = new FormData();
        const compressed = await compressImage(file);
        formData.append("file", compressed);

        const res = await fetch("/api/upload", { method: "POST", body: formData });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error ?? "שגיאה בהעלאה");
        }
        const { url } = await res.json();
        onChange(url);

        // Extract colors from uploaded image
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          const colors = extractColors(img);
          setExtractedColors(colors);
          onColorsExtracted?.(colors);
        };
        img.src = url;
      } catch (err) {
        setError(err instanceof Error ? err.message : "שגיאה בהעלאה");
      } finally {
        setIsUploading(false);
      }
    },
    [onChange, onColorsExtracted]
  );

  // Also extract colors when an existing logo URL is loaded
  const handleExistingImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      if (extractedColors.length === 0) {
        const colors = extractColors(e.currentTarget);
        setExtractedColors(colors);
        onColorsExtracted?.(colors);
      }
    },
    [extractedColors, onColorsExtracted]
  );

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function handleRemove() {
    onChange("");
    setExtractedColors([]);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="space-y-3">
      {/* Drop zone / preview */}
      {value ? (
        <div className="relative inline-block">
          <img
            src={value}
            alt="לוגו הסטודיו"
            crossOrigin="anonymous"
            onLoad={handleExistingImageLoad}
            className="h-24 w-auto max-w-[200px] rounded-lg border border-border object-contain bg-muted/30"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute -top-2 -end-2 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-sm hover:opacity-90"
            aria-label="הסר לוגו"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onClick={() => inputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 transition-colors ${
            isDragging
              ? "border-primary bg-primary/5"
              : "border-border bg-muted/20 hover:border-primary/50 hover:bg-muted/40"
          }`}
        >
          {isUploading ? (
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          ) : (
            <Upload className="h-6 w-6 text-muted-foreground" />
          )}
          <div className="text-center">
            <p className="text-sm font-medium">
              {isUploading ? "מעלה..." : "גרור תמונה לכאן"}
            </p>
            <p className="text-xs text-muted-foreground">או לחץ לבחירת קובץ</p>
          </div>
          <p className="text-xs text-muted-foreground">PNG, JPG, SVG עד 5MB</p>
        </div>
      )}

      {/* Change button when logo exists */}
      {value && !isUploading && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="ms-1 h-3.5 w-3.5" />
          החלף לוגו
        </Button>
      )}

      {/* Gallery picker (no capture = opens gallery/files) */}
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
        className="hidden"
        onChange={handleInputChange}
      />

      {/* Explicit upload button for mobile */}
      {!value && !isUploading && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          className="w-full sm:w-auto"
        >
          <Upload className="ms-1 h-3.5 w-3.5" />
          בחר תמונה מהמכשיר
        </Button>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}

      {/* Color swatches extracted from logo */}
      {extractedColors.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground">צבעים שנמצאו בלוגו — לחץ להגדרה:</p>
          <div className="flex gap-2 flex-wrap">
            {extractedColors.map((color) => (
              <ColorSwatch key={color} color={color} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Sub-component: swatch with primary/secondary assignment
function ColorSwatch({ color }: { color: string }) {
  const [showMenu, setShowMenu] = useState(false);

  function applyColor(type: "primary" | "secondary") {
    // Dispatch a custom event that SettingsForm listens to
    window.dispatchEvent(
      new CustomEvent("studio-color-pick", { detail: { color, type } })
    );
    setShowMenu(false);
  }

  return (
    <div className="relative">
      <button
        type="button"
        title={color}
        onClick={() => setShowMenu((v) => !v)}
        className="h-8 w-8 rounded-md border border-border shadow-sm transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ring"
        style={{ backgroundColor: color }}
      />
      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute bottom-full mb-1 end-0 z-20 min-w-[120px] rounded-md border border-border bg-popover shadow-md text-sm overflow-hidden">
            <button
              type="button"
              className="w-full px-3 py-1.5 text-start hover:bg-accent"
              onClick={() => applyColor("primary")}
            >
              צבע ראשי
            </button>
            <button
              type="button"
              className="w-full px-3 py-1.5 text-start hover:bg-accent"
              onClick={() => applyColor("secondary")}
            >
              צבע משני
            </button>
          </div>
        </>
      )}
    </div>
  );
}
