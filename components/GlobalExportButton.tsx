"use client";

import { useState } from "react";
import { getGlobalSummaryData } from "@/app/actions/global";
import { exportGlobalSummaryPDF } from "@/lib/pdfUtils";

export default function GlobalExportButton() {
  const TODAY = new Date().toISOString().split('T')[0];
  const [from, setFrom] = useState(TODAY);
  const [to, setTo] = useState(TODAY);
  const [loading, setLoading] = useState(false);

  const LEDGERS = [
    { key: 'publishing_ledger', title: 'Fixed Cost Product' },
    { key: 'digital_prints_ledger', title: 'Non-Fixed Cost Product' },
    { key: 'general_ledger', title: 'General' },
  ];

  const handleExport = async () => {
    setLoading(true);
    try {
      const data = await getGlobalSummaryData(from, to);

      const ledgersData = LEDGERS.map(({ key, title }) => {
        const inRange = data.allSales.filter((r: any) => r.ledger === key);
        const copInRange = data.allCops.filter((r: any) => r.ledger === key);
        const stockLogsInRange = key === 'publishing_ledger'
          ? (data.allStockLogs || []).filter((s: any) => {
              const d = s.date || s.created_at?.split('T')[0];
              return d >= from && d <= to;
            })
          : [];

        const byDateMap: Record<string, any[]> = {};
        inRange.forEach((r: any) => { 
          const d = r.entry_date || r.created_at.split('T')[0];
          if (!byDateMap[d]) byDateMap[d] = []; 
          byDateMap[d].push(r); 
        });
        stockLogsInRange.forEach((s: any) => {
          const d = s.date || s.created_at?.split('T')[0];
          if (!byDateMap[d]) byDateMap[d] = [];
        });
        const byDate = Object.entries(byDateMap).sort((a, b) => b[0].localeCompare(a[0]));

        let totalRevenue = 0;
        inRange.forEach((r: any) => {
          if (key === 'publishing_ledger' || key === 'digital_prints_ledger') {
            totalRevenue += Number(r.price || 0);
          } else {
            totalRevenue += (Number(r.qty || 1) * Number(r.price || 0));
          }
        });

        const totalCop = copInRange.reduce((s: number, r: any) => s + Number(r.amount), 0);
        const grossProfit = totalRevenue - totalCop;

        return {
          title,
          byDate,
          inRange,
          totalRevenue,
          totalCop,
          netProfit: grossProfit,
          copRows: copInRange,
          stockLogs: stockLogsInRange,
        };
      }).filter(l => l.inRange.length > 0 || l.copRows.length > 0 || l.stockLogs.length > 0);

      if (ledgersData.length === 0) {
        alert("No records found in this date range.");
        return;
      }

      exportGlobalSummaryPDF({
        ledgers: ledgersData,
        allExpenses: data.allExpenses,
        allIncome: data.allIncome,
        from,
        to
      });
    } catch (e) {
      alert("Failed to export global summary");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-10 flex flex-col sm:flex-row items-center gap-4">
      <div className="flex-1 flex flex-col sm:flex-row gap-4 items-center w-full">
        <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wider min-w-[max-content]">Global Export</h3>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-xs font-semibold text-gray-500 uppercase">From:</label>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="w-full sm:w-auto px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm" />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-xs font-semibold text-gray-500 uppercase">To:</label>
          <input type="date" value={to} onChange={e => setTo(e.target.value)} className="w-full sm:w-auto px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm" />
        </div>
      </div>
      <button 
        onClick={handleExport} 
        disabled={loading}
        className="w-full sm:w-auto px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-md hover:bg-primary-hover hover:shadow-lg transition-all disabled:opacity-50"
      >
        {loading ? "Exporting..." : "⬇ Export Global Summary PDF"}
      </button>
    </div>
  );
}
