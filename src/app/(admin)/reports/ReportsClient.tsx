"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type {
  WorkshopStatusReport,
  RevenueReport,
  LowStockReport,
  CustomersReport,
} from "@/services/reports";

// ─── CSV Helper ────────────────────────────────────────────────────────────

function generateCSV(headers: string[], rows: (string | number)[][]): string {
  const escape = (v: string | number) => {
    const s = String(v);
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  const lines = [headers.map(escape).join(",")];
  for (const row of rows) {
    lines.push(row.map(escape).join(","));
  }
  return lines.join("\n");
}

function downloadCSV(filename: string, csv: string) {
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Status labels ─────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  draft: "טיוטה",
  open: "פתוח",
  pending_minimum: "ממתין למינימום",
  confirmed: "מאושר",
  full: "מלא",
  cancelled: "בוטל",
  postponed: "נדחה",
  completed: "הושלם",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "#94a3b8",
  open: "#22c55e",
  pending_minimum: "#f59e0b",
  confirmed: "#3b82f6",
  full: "#8b5cf6",
  cancelled: "#ef4444",
  postponed: "#f97316",
  completed: "#10b981",
};

// ─── Props ─────────────────────────────────────────────────────────────────

interface Props {
  workshopStatus: WorkshopStatusReport;
  revenue: RevenueReport;
  lowStock: LowStockReport;
  customers: CustomersReport;
}

// ─── Tab 1: Workshop Status ────────────────────────────────────────────────

function WorkshopStatusTab({ data }: { data: WorkshopStatusReport }) {
  const entries = Object.entries(data.byStatus).sort((a, b) => b[1] - a[1]);
  const maxCount = Math.max(...entries.map(([, v]) => v), 1);

  function handleExport() {
    const csv = generateCSV(
      ["סטטוס", "כמות"],
      entries.map(([status, count]) => [STATUS_LABELS[status] ?? status, count])
    );
    downloadCSV("workshop-status.csv", csv);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">סטטוס סדנאות</h2>
        <button
          onClick={handleExport}
          className="text-sm px-3 py-1.5 border rounded-md hover:bg-muted transition-colors"
        >
          ייצוא CSV
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border p-4 text-center">
          <p className="text-sm text-muted-foreground">תפוסה ממוצעת</p>
          <p className="text-3xl font-bold text-blue-600">{data.avgOccupancy}%</p>
        </div>
        <div className="rounded-lg border p-4 text-center">
          <p className="text-sm text-muted-foreground">שיעור ביטולים</p>
          <p className="text-3xl font-bold text-red-500">{data.cancellationRate}%</p>
        </div>
      </div>

      {/* Bar chart */}
      {entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">אין נתונים</p>
      ) : (
        <div className="space-y-3">
          {entries.map(([status, count]) => {
            const pct = Math.round((count / maxCount) * 100);
            const color = STATUS_COLORS[status] ?? "#94a3b8";
            return (
              <div key={status} className="flex items-center gap-3">
                <span className="w-36 shrink-0 text-sm text-right">
                  {STATUS_LABELS[status] ?? status}
                </span>
                <div className="flex-1 bg-muted rounded-full h-6 overflow-hidden">
                  <div
                    className="h-full rounded-full flex items-center px-2 transition-all duration-500"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: color,
                      minWidth: "2rem",
                    }}
                  >
                    <span className="text-xs text-white font-medium">{count}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Tab 2: Revenue ────────────────────────────────────────────────────────

function RevenueTab({ data }: { data: RevenueReport }) {
  const maxAmount = Math.max(...data.monthly.map((m) => m.amount), 1);

  function handleExport() {
    const csv = generateCSV(
      ["חודש", "שנה", "הכנסה (₪)"],
      data.monthly.map((m) => [m.month, m.year, m.amount])
    );
    downloadCSV("revenue.csv", csv);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">הכנסות</h2>
        <button
          onClick={handleExport}
          className="text-sm px-3 py-1.5 border rounded-md hover:bg-muted transition-colors"
        >
          ייצוא CSV
        </button>
      </div>

      {/* Total */}
      <div className="rounded-lg border p-4 text-center bg-green-50">
        <p className="text-sm text-muted-foreground">סה&quot;כ שנתי</p>
        <p className="text-3xl font-bold text-green-700">
          ₪{data.total.toLocaleString("he-IL")}
        </p>
      </div>

      {/* Monthly bars */}
      <div className="space-y-2">
        {data.monthly.map((m) => {
          const pct = Math.round((m.amount / maxAmount) * 100);
          return (
            <div key={`${m.year}-${m.month}`} className="flex items-center gap-3">
              <span className="w-28 shrink-0 text-sm text-right text-muted-foreground">
                {m.month}
              </span>
              <div className="flex-1 bg-muted rounded-full h-5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-green-500 transition-all duration-500"
                  style={{ width: `${Math.max(pct, m.amount > 0 ? 3 : 0)}%` }}
                />
              </div>
              <span className="w-24 shrink-0 text-sm font-medium">
                {m.amount > 0 ? `₪${m.amount.toLocaleString("he-IL")}` : "—"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Tab 3: Low Stock ──────────────────────────────────────────────────────

function LowStockTab({ data }: { data: LowStockReport }) {
  // Restock cost estimate for product variants
  const restockCost = data.products.reduce((sum, v) => {
    const needed = Math.max(0, v.lowStockThreshold - v.stockQuantity + 1);
    return sum + needed * Number(v.price);
  }, 0);

  function handleExport() {
    const matRows = data.materials.map((m) => [
      "חומר",
      m.name,
      Number(m.stockQuantity),
      Number(m.lowStockThreshold),
      m.unit,
    ]);
    const prodRows = data.products.map((v) => [
      "מוצר",
      v.product.name,
      v.stockQuantity,
      v.lowStockThreshold,
      v.name,
    ]);
    const csv = generateCSV(
      ["סוג", "שם", "מלאי נוכחי", "סף מינימום", "יחידה / גרסה"],
      [...matRows, ...prodRows]
    );
    downloadCSV("low-stock.csv", csv);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">מלאי נמוך</h2>
        <button
          onClick={handleExport}
          className="text-sm px-3 py-1.5 border rounded-md hover:bg-muted transition-colors"
        >
          ייצוא CSV
        </button>
      </div>

      {/* Materials */}
      <div>
        <h3 className="text-base font-medium mb-2">חומרים</h3>
        {data.materials.length === 0 ? (
          <p className="text-sm text-muted-foreground">אין חומרים במלאי נמוך</p>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="px-3 py-2 text-right font-medium">שם</th>
                  <th className="px-3 py-2 text-right font-medium">מלאי נוכחי</th>
                  <th className="px-3 py-2 text-right font-medium">סף מינימום</th>
                  <th className="px-3 py-2 text-right font-medium">יחידה</th>
                </tr>
              </thead>
              <tbody>
                {data.materials.map((m) => (
                  <tr key={m.id} className="border-t">
                    <td className="px-3 py-2">{m.name}</td>
                    <td className="px-3 py-2 text-orange-600 font-medium">
                      {Number(m.stockQuantity).toFixed(1)}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {Number(m.lowStockThreshold).toFixed(1)}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">{m.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Product variants */}
      <div>
        <h3 className="text-base font-medium mb-2">מוצרים</h3>
        {data.products.length === 0 ? (
          <p className="text-sm text-muted-foreground">אין מוצרים במלאי נמוך</p>
        ) : (
          <>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-3 py-2 text-right font-medium">מוצר</th>
                    <th className="px-3 py-2 text-right font-medium">גרסה</th>
                    <th className="px-3 py-2 text-right font-medium">מלאי נוכחי</th>
                    <th className="px-3 py-2 text-right font-medium">סף מינימום</th>
                  </tr>
                </thead>
                <tbody>
                  {data.products.map((v) => (
                    <tr key={v.id} className="border-t">
                      <td className="px-3 py-2">{v.product.name}</td>
                      <td className="px-3 py-2 text-muted-foreground">{v.name}</td>
                      <td className="px-3 py-2 text-orange-600 font-medium">
                        {v.stockQuantity}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {v.lowStockThreshold}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {restockCost > 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                עלות מילוי מלאי משוערת:{" "}
                <span className="font-medium text-foreground">
                  ₪{Math.round(restockCost).toLocaleString("he-IL")}
                </span>
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Tab 4: Customers ──────────────────────────────────────────────────────

function CustomersTab({ data }: { data: CustomersReport }) {
  const total = data.returning + data.oneTime;
  const returningPct = total > 0 ? Math.round((data.returning / total) * 100) : 0;
  const oneTimePct = total > 0 ? Math.round((data.oneTime / total) * 100) : 0;

  function handleExport() {
    const csv = generateCSV(
      ["דירוג", "שם", "כמות הזמנות", 'סה"כ שילם (₪)'],
      data.top10.map((c, i) => [i + 1, c.name, c.bookingCount, c.totalPaid])
    );
    downloadCSV("customers.csv", csv);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">לקוחות</h2>
        <button
          onClick={handleExport}
          className="text-sm px-3 py-1.5 border rounded-md hover:bg-muted transition-colors"
        >
          ייצוא CSV
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">חוזרים</p>
          <p className="text-2xl font-bold text-blue-600">{data.returning}</p>
          <p className="text-xs text-muted-foreground">{returningPct}%</p>
        </div>
        <div className="rounded-lg border p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">חד-פעמיים</p>
          <p className="text-2xl font-bold text-orange-500">{data.oneTime}</p>
          <p className="text-xs text-muted-foreground">{oneTimePct}%</p>
        </div>
        <div className="rounded-lg border p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">חדשים החודש</p>
          <p className="text-2xl font-bold text-green-600">{data.newThisMonth}</p>
        </div>
      </div>

      {/* Visual breakdown */}
      {total > 0 && (
        <div className="flex items-center gap-4">
          {/* Simple horizontal stacked bar */}
          <div className="flex-1 h-6 rounded-full overflow-hidden flex">
            <div
              className="bg-blue-500 h-full transition-all duration-500"
              style={{ width: `${returningPct}%` }}
            />
            <div
              className="bg-orange-400 h-full transition-all duration-500"
              style={{ width: `${oneTimePct}%` }}
            />
          </div>
          <div className="space-y-1 text-sm shrink-0">
            <div className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded-full bg-blue-500" />
              <span>חוזרים {returningPct}%</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded-full bg-orange-400" />
              <span>חד-פעמיים {oneTimePct}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Top 10 table */}
      <div>
        <h3 className="text-base font-medium mb-2">10 לקוחות מובילים</h3>
        {data.top10.length === 0 ? (
          <p className="text-sm text-muted-foreground">אין נתונים</p>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="px-3 py-2 text-right font-medium">#</th>
                  <th className="px-3 py-2 text-right font-medium">שם</th>
                  <th className="px-3 py-2 text-right font-medium">הזמנות</th>
                  <th className="px-3 py-2 text-right font-medium">שילם</th>
                </tr>
              </thead>
              <tbody>
                {data.top10.map((c, i) => (
                  <tr key={`${c.name}-${i}`} className="border-t">
                    <td className="px-3 py-2 text-muted-foreground">{i + 1}</td>
                    <td className="px-3 py-2 font-medium">{c.name}</td>
                    <td className="px-3 py-2">{c.bookingCount}</td>
                    <td className="px-3 py-2 text-green-700">
                      {c.totalPaid > 0
                        ? `₪${c.totalPaid.toLocaleString("he-IL")}`
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────

export function ReportsClient({
  workshopStatus,
  revenue,
  lowStock,
  customers,
}: Props) {
  return (
    <Tabs defaultValue="workshops" dir="rtl">
      <TabsList className="mb-4 flex-wrap h-auto gap-1">
        <TabsTrigger value="workshops">סטטוס סדנאות</TabsTrigger>
        <TabsTrigger value="revenue">הכנסות</TabsTrigger>
        <TabsTrigger value="stock">מלאי נמוך</TabsTrigger>
        <TabsTrigger value="customers">לקוחות</TabsTrigger>
      </TabsList>

      <TabsContent value="workshops">
        <WorkshopStatusTab data={workshopStatus} />
      </TabsContent>
      <TabsContent value="revenue">
        <RevenueTab data={revenue} />
      </TabsContent>
      <TabsContent value="stock">
        <LowStockTab data={lowStock} />
      </TabsContent>
      <TabsContent value="customers">
        <CustomersTab data={customers} />
      </TabsContent>
    </Tabs>
  );
}
