"use client";

import { useTransition, useActionState, useState } from "react";
import type { Task } from "@/generated/prisma";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createTask, toggleTask, deleteTask, updateTaskStatus } from "@/actions/tasks";
import { Plus, Trash2, Check, AlertTriangle, ArrowDown, Minus, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  tasks: Task[];
}

const STATUS_LABELS: Record<string, string> = {
  NEW: "חדשה",
  IN_PROGRESS: "בביצוע",
  DONE: "הושלמה",
};

const STATUS_COLORS: Record<string, string> = {
  NEW: "bg-blue-100 text-blue-700",
  IN_PROGRESS: "bg-yellow-100 text-yellow-700",
  DONE: "bg-green-100 text-green-700",
};

function UrgencyIcon({ urgency }: { urgency: string }) {
  if (urgency === "HIGH") return <AlertTriangle className="h-3.5 w-3.5 text-red-500 shrink-0" />;
  if (urgency === "LOW") return <ArrowDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />;
  return <Minus className="h-3.5 w-3.5 text-muted-foreground shrink-0" />;
}

export function TasksPanel({ tasks }: Props) {
  const [state, action] = useActionState(createTask, {});
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  function handleToggle(id: string, completed: boolean) {
    startTransition(() => toggleTask(id, !completed));
  }

  function handleDelete(id: string) {
    startTransition(() => deleteTask(id));
  }

  function handleStatusChange(id: string, status: "NEW" | "IN_PROGRESS" | "DONE") {
    startTransition(() => updateTaskStatus(id, status));
  }

  const active = tasks.filter((t) => !t.completed);
  const done = tasks.filter((t) => t.completed);

  // Sort active: HIGH urgency first, then by dueDate
  const sortedActive = [...active].sort((a, b) => {
    const urgencyOrder = { HIGH: 0, NORMAL: 1, LOW: 2 };
    const ua = urgencyOrder[(a.urgency as keyof typeof urgencyOrder) ?? "NORMAL"] ?? 1;
    const ub = urgencyOrder[(b.urgency as keyof typeof urgencyOrder) ?? "NORMAL"] ?? 1;
    if (ua !== ub) return ua - ub;
    if (a.dueDate && b.dueDate) return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    return 0;
  });

  return (
    <div className="space-y-3">
      {/* Add task */}
      {showForm ? (
        <form action={action} className="space-y-2">
          <Input
            name="title"
            placeholder="כותרת המשימה..."
            autoFocus
            required
          />
          <div className="flex gap-2">
            <Input name="dueDate" type="date" className="flex-1" />
            <Button type="submit" size="sm">הוסף</Button>
            <Button type="button" size="sm" variant="outline" onClick={() => { setShowForm(false); setShowAdvanced(false); }}>ביטול</Button>
          </div>
          <button
            type="button"
            className="text-xs text-muted-foreground hover:text-foreground"
            onClick={() => setShowAdvanced((v) => !v)}
          >
            {showAdvanced ? "▲ פחות אפשרויות" : "▼ אפשרויות נוספות"}
          </button>
          {showAdvanced && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">סטטוס</label>
                <select name="status" className="w-full rounded-md border border-input bg-background px-2 py-1 text-xs">
                  <option value="NEW">חדשה</option>
                  <option value="IN_PROGRESS">בביצוע</option>
                  <option value="DONE">הושלמה</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">דחיפות</label>
                <select name="urgency" className="w-full rounded-md border border-input bg-background px-2 py-1 text-xs">
                  <option value="NORMAL">רגילה</option>
                  <option value="HIGH">גבוהה</option>
                  <option value="LOW">נמוכה</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-xs text-muted-foreground block mb-1">תאריך תזכורת</label>
                <Input name="reminderDate" type="date" className="text-xs h-7" />
              </div>
            </div>
          )}
          {state.errors?.title && (
            <p className="text-xs text-destructive">{state.errors.title[0]}</p>
          )}
        </form>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => setShowForm(true)}
        >
          <Plus className="h-4 w-4 ml-1" />
          משימה חדשה
        </Button>
      )}

      {active.length === 0 && done.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          אין משימות פתוחות 🎉
        </p>
      )}

      {/* Active tasks */}
      <ul className="space-y-1">
        {sortedActive.map((t) => (
          <li
            key={t.id}
            className="flex items-start gap-2 group rounded-md px-2 py-1.5 hover:bg-muted/50"
          >
            <button
              onClick={() => handleToggle(t.id, t.completed)}
              disabled={isPending}
              className="h-5 w-5 rounded-full border-2 border-muted-foreground shrink-0 hover:border-primary flex items-center justify-center mt-0.5"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <UrgencyIcon urgency={(t.urgency as string) ?? "NORMAL"} />
                <p className="text-sm truncate">{t.title}</p>
                <span className={cn("text-xs px-1.5 py-0.5 rounded-full font-medium", STATUS_COLORS[(t.status as string) ?? "NEW"])}>
                  {STATUS_LABELS[(t.status as string) ?? "NEW"]}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                {t.dueDate && (
                  <p className="text-xs text-muted-foreground">
                    פגישה: {new Intl.DateTimeFormat("he-IL", { day: "numeric", month: "short" }).format(new Date(t.dueDate))}
                  </p>
                )}
                {t.reminderDate && (
                  <p className="text-xs text-muted-foreground flex items-center gap-0.5">
                    <Bell className="h-3 w-3" />
                    {new Intl.DateTimeFormat("he-IL", { day: "numeric", month: "short" }).format(new Date(t.reminderDate))}
                  </p>
                )}
              </div>
              {/* Status quick-change */}
              {(t.status as string) !== "DONE" && (
                <div className="mt-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {(t.status as string) === "NEW" && (
                    <button
                      onClick={() => handleStatusChange(t.id, "IN_PROGRESS")}
                      disabled={isPending}
                      className="text-xs text-yellow-600 hover:underline"
                    >
                      התחל
                    </button>
                  )}
                  {(t.status as string) === "IN_PROGRESS" && (
                    <button
                      onClick={() => handleStatusChange(t.id, "DONE")}
                      disabled={isPending}
                      className="text-xs text-green-600 hover:underline"
                    >
                      סיים
                    </button>
                  )}
                </div>
              )}
            </div>
            <button
              onClick={() => handleDelete(t.id)}
              disabled={isPending}
              className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-muted text-muted-foreground hover:text-destructive mt-0.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </li>
        ))}
      </ul>

      {/* Completed tasks (collapsed) */}
      {done.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">הושלמו ({done.length})</p>
          <ul className="space-y-1">
            {done.slice(0, 3).map((t) => (
              <li
                key={t.id}
                className="flex items-center gap-2 group rounded-md px-2 py-1.5 hover:bg-muted/50 opacity-50"
              >
                <button
                  onClick={() => handleToggle(t.id, t.completed)}
                  disabled={isPending}
                  className="h-5 w-5 rounded-full border-2 border-green-500 bg-green-500 shrink-0 flex items-center justify-center"
                >
                  <Check className="h-3 w-3 text-white" />
                </button>
                <p className={cn("text-sm flex-1 truncate line-through")}>{t.title}</p>
                <button
                  onClick={() => handleDelete(t.id)}
                  disabled={isPending}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-muted text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
