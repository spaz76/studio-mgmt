"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

const FEATURES = [
  "ניהול סדנאות ואירועים עם הרשמה מקוונת",
  "מעקב לקוחות, תשלומים וחובות",
  "ניהול מלאי חומרים ומוצרים",
  "תזכורות ומשימות אוטומטיות",
  "סנכרון ל-Google Calendar",
  "דף ציבורי לסטודיו שלך",
];

export function LoginPageHeader() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mb-8 text-center">
      <h1 className="text-3xl font-bold tracking-tight">Studio-Labs</h1>
      <p className="text-muted-foreground mt-1 text-sm">פחות ניהול, יותר יצירה.</p>
      <p className="text-muted-foreground mt-2 text-sm">
        ניהול סדנאות, לקוחות, מלאי ותשלומים — הכל במקום אחד
      </p>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="mt-1 text-xs text-primary hover:underline flex items-center gap-0.5 mx-auto"
      >
        למידע נוסף
        {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>
      {expanded && (
        <ul className="mt-2 text-xs text-muted-foreground text-right space-y-1 border rounded-md p-3 bg-muted/30">
          {FEATURES.map((f) => (
            <li key={f} className="flex items-center gap-1.5">
              <span className="text-primary">✓</span>
              {f}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
