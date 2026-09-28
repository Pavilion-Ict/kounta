"use client";

import { useState } from "react";
import {
  Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { Download, Inbox, Plus } from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { formatCompactCurrency, formatCurrency } from "@/lib/format";
import { getGlobalSummaryData } from "@/app/actions/global";
import { exportGlobalSummaryPDF } from "@/lib/pdfUtils";

type ChartPoint = { name: string; revenue: number; expenses: number };

export type DashboardData = {
  totalRev: number;
  totalCop: number;
  totalExp: number;
  totalInc: number;
  prevRev: number;
  prevCop: number;
  prevExp: number;
  prevInc: number;
  startStr: string;
  chartData: { name: string; Revenue: number; Expenses: number }[];
  recentRecords: {
    id: string;
    description: string;
    date: string;
    amount: number;
    type: "income" | "expense";
  }[];
  expenseCategories: { name: string; amount: number }[];
};

function getDelta(curr: number, prev: number): number | null {
  if (prev === 0 && curr === 0) return null;
  if (prev === 0) return 100;
  return ((curr - prev) / Math.abs(prev)) * 100;
}

export default function DashboardView({ data }: { data: DashboardData }) {
  const [exportLoading, setExportLoading] = useState(false);
  const [exportFrom, setExportFrom] = useState(data.startStr);
  const [exportTo, setExportTo] = useState(new Date().toISOString().split("T")[0]);
  const [showExport, setShowExport] = useState(false);

  const grossProfit = data.totalRev + data.totalInc - data.totalCop;
  const netProfit = data.totalRev - data.totalCop - data.totalExp + data.totalInc;
  const prevGross = data.prevRev + data.prevInc - data.prevCop;
  const prevNet = data.prevRev - data.prevCop - data.prevExp + data.prevInc;

  const chartData: ChartPoint[] = data.chartData.map((d) => ({
    name: d.name,
    revenue: d.Revenue,
    expenses: d.Expenses,
  }));

  const hasData =
    data.totalRev > 0 ||
    data.totalExp > 0 ||
    data.totalInc > 0 ||
    data.totalCop > 0 ||
    data.recentRecords.length > 0;

  const maxCategory = Math.max(
    ...data.expenseCategories.map((c) => c.amount),
    1
  );

  const handleExport = async () => {
    setExportLoading(true);
    try {
      const res = await getGlobalSummaryData(exportFrom, exportTo);
      const LEDGERS = [
        { key: "publishing_ledger", title: "Fixed Cost Product" },
        { key: "digital_prints_ledger", title: "Non-Fixed Cost Product" },
      ];
      const ledgersData = LEDGERS.map(({ key, title }) => {
        const inRange = res.allSales.filter((r: any) => r.ledger === key);
        const copInRange = res.allCops.filter((r: any) => r.ledger === key);
        const stockLogsInRange =
          key === "publishing_ledger"
            ? (res.allStockLogs || []).filter((s: any) => {
                const d = s.date || s.created_at?.split("T")[0];
                return d >= exportFrom && d <= exportTo;
              })
            : [];
        const byDateMap: Record<string, any[]> = {};
        inRange.forEach((r: any) => {
          const d = r.entry_date || r.created_at.split("T")[0];
          if (!byDateMap[d]) byDateMap[d] = [];
          byDateMap[d].push(r);
        });
        stockLogsInRange.forEach((s: any) => {
          const d = s.date || s.created_at?.split("T")[0];
          if (!byDateMap[d]) byDateMap[d] = [];
        });
        const byDate = Object.entries(byDateMap).sort((a, b) =>
          b[0].localeCompare(a[0])
        );
        let totalRevenue = 0;
        inRange.forEach((r: any) => {
          if (
            key === "publishing_ledger" ||
            key === "digital_prints_ledger"
          ) {
            totalRevenue += Number(r.price || 0);
          } else {
            totalRevenue += Number(r.qty || 1) * Number(r.price || 0);
          }
        });
        const totalCop = copInRange.reduce(
          (s: number, r: any) => s + Number(r.amount),
          0
        );
        return {
          title,
          byDate,
          inRange,
          totalRevenue,
          totalCop,
          netProfit: totalRevenue - totalCop,
          copRows: copInRange,
          stockLogs: stockLogsInRange,
        };
      }).filter(
        (l) =>
          l.inRange.length > 0 || l.copRows.length > 0 || l.stockLogs.length > 0
      );
      if (ledgersData.length === 0) {
        alert("No records found in this date range.");
        return;
      }
      exportGlobalSummaryPDF({
        ledgers: ledgersData,
        allExpenses: res.allExpenses,
        allIncome: res.allIncome,
        from: exportFrom,
        to: exportTo,
      });
    } catch {
      alert("Failed to export global summary");
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6 lg:p-8">
      {/* ── Page header ─────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            Overview
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            This week&apos;s performance since{" "}
            {new Date(data.startStr).toLocaleDateString("en-NG", {
              weekday: "long",
              day: "numeric",
              month: "short",
            })}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowExport(!showExport)}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
          >
            <Download className="h-4 w-4 text-gray-400" />
            Export PDF
          </button>
        </div>
      </div>

      {/* Export panel — slide-down */}
      {showExport && (
        <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm flex flex-col sm:flex-row items-end gap-4">
          <div className="flex-1 flex flex-col sm:flex-row gap-4 w-full">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">From</label>
              <input
                type="date"
                value={exportFrom}
                onChange={(e) => setExportFrom(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">To</label>
              <input
                type="date"
                value={exportTo}
                onChange={(e) => setExportTo(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>
          <button
            onClick={handleExport}
            disabled={exportLoading}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            {exportLoading ? "Exporting..." : "Download"}
          </button>
        </div>
      )}

      {/* ── KPI row: even 4-across grid ─────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total revenue"
          value={formatCurrency(data.totalRev + data.totalInc)}
          delta={getDelta(data.totalRev + data.totalInc, data.prevRev + data.prevInc)}
        />
        <StatCard
          label="Total expenses"
          value={formatCurrency(data.totalExp + data.totalCop)}
          delta={getDelta(data.totalExp + data.totalCop, data.prevExp + data.prevCop)}
        />
        <StatCard
          label="Gross profit"
          value={formatCurrency(grossProfit)}
          delta={getDelta(grossProfit, prevGross)}
        />
        <StatCard
          label="Net profit"
          value={formatCurrency(netProfit)}
          delta={getDelta(netProfit, prevNet)}
        />
      </div>

      {hasData ? (
        <>
          {/* ── Chart + category breakdown ──────────── */}
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm xl:col-span-2">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-gray-900">
                  Revenue vs expenses
                </h2>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" />{" "}
                    Revenue
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />{" "}
                    Expenses
                  </span>
                </div>
              </div>
              <div className="mt-4 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} barGap={4}>
                    <CartesianGrid vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      dy={8}
                      tick={{ fontSize: 12, fill: "#94a3b8" }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      width={64}
                      tick={{ fontSize: 12, fill: "#94a3b8" }}
                      tickFormatter={(v: number) => formatCompactCurrency(v)}
                    />
                    <Tooltip
                      cursor={{ fill: "#f8fafc" }}
                      formatter={(value: number, name: string) => [
                        formatCurrency(value),
                        name,
                      ]}
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid #e5e7eb",
                        fontSize: 12,
                        boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                      }}
                    />
                    <Bar
                      dataKey="revenue"
                      name="Revenue"
                      fill="#6366f1"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={28}
                    />
                    <Bar
                      dataKey="expenses"
                      name="Expenses"
                      fill="#fbbf24"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={28}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Where the money went */}
            <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm">
              <h2 className="text-base font-semibold text-gray-900">
                Where the money went
              </h2>
              <p className="mt-1 text-xs text-gray-500">
                Top expense categories this period
              </p>
              {data.expenseCategories.length > 0 ? (
                <ul className="mt-4 space-y-4">
                  {data.expenseCategories.map((c) => (
                    <li key={c.name}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-gray-700">
                          {c.name}
                        </span>
                        <span className="tabular-nums text-gray-500">
                          {formatCurrency(c.amount)}
                        </span>
                      </div>
                      <div className="mt-1.5 h-1.5 rounded-full bg-gray-100">
                        <div
                          className="h-1.5 rounded-full bg-indigo-500"
                          style={{
                            width: `${(c.amount / maxCategory) * 100}%`,
                          }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-6 text-center text-sm text-gray-400">
                  No expense data yet
                </p>
              )}
            </div>
          </div>

          {/* ── Recent records ──────────────────────── */}
          {data.recentRecords.length > 0 && (
            <div className="rounded-2xl border border-gray-200/80 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                <h2 className="text-base font-semibold text-gray-900">
                  Recent records
                </h2>
              </div>
              <ul className="divide-y divide-gray-100 px-5">
                {data.recentRecords.map((r) => (
                  <li
                    key={r.id}
                    className="flex items-center justify-between py-3.5"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                          r.type === "income"
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {r.type === "income" ? "↑" : "↓"}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {r.description}
                        </p>
                        <p className="text-xs text-gray-500">{r.date}</p>
                      </div>
                    </div>
                    <span
                      className={`text-sm font-semibold tabular-nums ${
                        r.type === "income"
                          ? "text-emerald-600"
                          : "text-gray-900"
                      }`}
                    >
                      {r.type === "income" ? "+" : "−"}
                      {formatCurrency(r.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      ) : (
        /* ── Designed empty state ── */
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <Inbox className="h-6 w-6" />
          </span>
          <h2 className="mt-4 text-base font-semibold text-gray-900">
            No records yet
          </h2>
          <p className="mt-1 max-w-sm text-sm text-gray-500">
            Add your first income or expense and this dashboard will come to
            life with insights.
          </p>
          <a
            href="/income-expenses"
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
          >
            <Plus className="h-4 w-4" /> Add your first record
          </a>
        </div>
      )}
    </div>
  );
}
