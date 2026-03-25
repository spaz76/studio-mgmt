"use client";

import { useState, useTransition, useActionState } from "react";
import type { MessageTemplate } from "@/generated/prisma";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pencil, Plus, Trash2, X, Eye } from "lucide-react";
import {
  upsertMessageTemplate,
  deleteMessageTemplate,
  seedDefaultTemplatesAction,
} from "@/actions/message-templates";

const TYPE_LABELS: Record<string, string> = {
  confirmation: "אישור הרשמה",
  reminder: "תזכורת",
  thankyou: "תודה",
  payment_reminder: "תזכורת תשלום",
  feedback: "משוב",
};

const CHANNEL_LABELS: Record<string, string> = {
  whatsapp: "WhatsApp",
  sms: "SMS",
  email: "מייל",
};

const CHANNEL_COLORS: Record<string, string> = {
  whatsapp: "bg-green-100 text-green-800",
  sms: "bg-blue-100 text-blue-800",
  email: "bg-purple-100 text-purple-800",
};

const VARIABLES = [
  "{שם_לקוח}",
  "{שם_סדנה}",
  "{תאריך}",
  "{שעה}",
  "{קישור_הרשמה}",
];

function previewBody(body: string) {
  return body
    .replace(/{שם_לקוח}/g, "שרה כהן")
    .replace(/{שם_סדנה}/g, "סדנת קרמיקה")
    .replace(/{תאריך}/g, "ה׳ בניסן תשפ״ה")
    .replace(/{שעה}/g, "18:00")
    .replace(/{קישור_הרשמה}/g, "https://example.com/register");
}

interface TemplateFormProps {
  template?: MessageTemplate | null;
  onClose: () => void;
}

function TemplateForm({ template, onClose }: TemplateFormProps) {
  const [state, action] = useActionState(upsertMessageTemplate, {});
  const [body, setBody] = useState(template?.body ?? "");
  const [showPreview, setShowPreview] = useState(false);

  if (state.success) {
    onClose();
  }

  function insertVariable(v: string) {
    setBody((prev) => prev + v);
  }

  return (
    <form action={action} className="space-y-4">
      {template?.id && <input type="hidden" name="id" value={template.id} />}
      <input type="hidden" name="level" value="studio" />

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>סוג הודעה</Label>
          <Select name="type" defaultValue={template?.type ?? "confirmation"}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(TYPE_LABELS).map(([v, l]) => (
                <SelectItem key={v} value={v}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {state.errors?.type && (
            <p className="text-xs text-destructive">{state.errors.type[0]}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label>ערוץ</Label>
          <Select name="channel" defaultValue={template?.channel ?? "whatsapp"}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(CHANNEL_LABELS).map(([v, l]) => (
                <SelectItem key={v} value={v}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>נושא (למייל בלבד)</Label>
        <Input name="subject" defaultValue={template?.subject ?? ""} placeholder="נושא המייל" />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label>גוף ההודעה</Label>
          <button
            type="button"
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
            onClick={() => setShowPreview((v) => !v)}
          >
            <Eye className="h-3.5 w-3.5" />
            {showPreview ? "ערוך" : "תצוגה מקדימה"}
          </button>
        </div>
        {showPreview ? (
          <div className="min-h-[120px] rounded-md border bg-muted p-3 text-sm whitespace-pre-wrap">
            {previewBody(body)}
          </div>
        ) : (
          <Textarea
            name="body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={5}
            placeholder="תוכן ההודעה..."
          />
        )}
        {state.errors?.body && (
          <p className="text-xs text-destructive">{state.errors.body[0]}</p>
        )}
        <div className="flex flex-wrap gap-1 mt-1">
          {VARIABLES.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => insertVariable(v)}
              className="text-xs px-1.5 py-0.5 rounded bg-muted hover:bg-muted/80 font-mono border"
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {state.message && !state.success && (
        <p className="text-sm text-destructive">{state.message}</p>
      )}

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onClose}>ביטול</Button>
        <Button type="submit">שמור</Button>
      </div>
    </form>
  );
}

interface Props {
  templates: MessageTemplate[];
}

export function MessageTemplatesClient({ templates }: Props) {
  const [editing, setEditing] = useState<MessageTemplate | null | "new">(null);
  const [isPending, startTransition] = useTransition();

  function handleDelete(id: string) {
    if (!confirm("למחוק תבנית זו?")) return;
    startTransition(() => deleteMessageTemplate(id));
  }

  function handleSeed() {
    startTransition(() => seedDefaultTemplatesAction());
  }

  const grouped = templates.reduce(
    (acc, t) => {
      const key = t.type;
      if (!acc[key]) acc[key] = [];
      acc[key].push(t);
      return acc;
    },
    {} as Record<string, MessageTemplate[]>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">תבניות הודעות</h1>
          <p className="text-sm text-muted-foreground mt-1">
            הגדר הודעות אוטומטיות ללקוחות
          </p>
        </div>
        <div className="flex gap-2">
          {templates.length === 0 && (
            <Button variant="outline" onClick={handleSeed} disabled={isPending}>
              טען ברירות מחדל
            </Button>
          )}
          <Button onClick={() => setEditing("new")}>
            <Plus className="h-4 w-4 ml-1" />
            תבנית חדשה
          </Button>
        </div>
      </div>

      {/* New template form */}
      {editing === "new" && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">תבנית חדשה</CardTitle>
              <button onClick={() => setEditing(null)} className="p-1 hover:bg-muted rounded">
                <X className="h-4 w-4" />
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <TemplateForm onClose={() => setEditing(null)} />
          </CardContent>
        </Card>
      )}

      {templates.length === 0 && editing !== "new" && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <p className="mb-3">אין תבניות הודעות עדיין</p>
            <Button variant="outline" onClick={handleSeed} disabled={isPending}>
              טען תבניות ברירת מחדל בעברית
            </Button>
          </CardContent>
        </Card>
      )}

      {Object.entries(TYPE_LABELS).map(([type, typeLabel]) => {
        const group = grouped[type];
        if (!group?.length) return null;
        return (
          <div key={type} className="space-y-2">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              {typeLabel}
            </h2>
            <div className="space-y-2">
              {group.map((t) => (
                <Card key={t.id}>
                  {editing && typeof editing !== "string" && editing.id === t.id ? (
                    <>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">עריכת תבנית</CardTitle>
                          <button onClick={() => setEditing(null)} className="p-1 hover:bg-muted rounded">
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <TemplateForm template={t} onClose={() => setEditing(null)} />
                      </CardContent>
                    </>
                  ) : (
                    <CardContent className="py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full font-medium ${CHANNEL_COLORS[t.channel] ?? "bg-gray-100 text-gray-700"}`}
                            >
                              {CHANNEL_LABELS[t.channel] ?? t.channel}
                            </span>
                            {t.subject && (
                              <span className="text-sm font-medium truncate">{t.subject}</span>
                            )}
                            {!t.isActive && (
                              <Badge variant="outline" className="text-xs">לא פעיל</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2 whitespace-pre-wrap">
                            {t.body}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => setEditing(t)}
                            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(t.id)}
                            disabled={isPending}
                            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
