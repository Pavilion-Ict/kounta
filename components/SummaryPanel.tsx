"use client";

import { useState, useMemo } from "react";
import { exportSummaryPDF } from "@/lib/pdfUtils";

export default function SummaryPanel({ 
  rows, 
  copRows, 
  stockLogs = [],
  onClose,
  title
}: { 
  rows: any[]; 
  copRows: any[]; 
  stockLogs?: any[];
  onClose: () => void;
  title: string;
}) {
  const TODAY = new Date().toISOString().split('T')[0];
  
  const allDates = [
    ...rows.map(r => r.entry_date || r.created_at.split('T')[0]),
    ...copRows.map(r => r.entry_date || r.created_at.split('T')[0]),
    ...(stockLogs || []).map(r => r.date || r.created_at?.split('T')[0])
  ].filter(Boolean).sort();
  const minDate = allDates[0] || TODAY;
  const maxDate = allDates[allDates.length - 1] || TODAY;
  
  const [from, setFrom] = useState(minDate);
  const [to, setTo] = useState(maxDate);

  const inRange = useMemo(() => {
    return rows.filter(r => {
      const d = r.entry_date || r.created_at.split('T')[0];
      return d >= from && d <= to;
    });
  }, [rows, from, to]);

  const copInRange = useMemo(() => {
    return copRows.filter(r => {
      const d = r.entry_date || r.created_at.split('T')[0];
      return d >= from && d <= to;
    });
  }, [copRows, from, to]);

  const stockInRange = useMemo(() => {
    return (stockLogs || []).filter(s => {
      const d = s.date || s.created_at?.split('T')[0];
      return d >= from && d <= to;
    });
  }, [stockLogs, from, to]);

  const byDate = useMemo(() => {
    const map: Record<string, any[]> = {};
    inRange.forEach(r => { 
      const d = r.entry_date || r.created_at.split('T')[0];
      if (!map[d]) map[d] = []; 
      map[d].push(r); 
    });
    stockInRange.forEach(s => {
      const d = s.date || s.created_at?.split('T')[0];
      if (!map[d]) map[d] = [];
    });
    return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0]));
  }, [inRange, stockInRange]);

  const totalRevenue = inRange.reduce((s, r) => {
    return (title.includes("Publishing") || title.includes("Digital Prints"))
      ? s + Number(r.price) 
      : s + (Number(r.qty) * Number(r.price));
  }, 0);
  const totalCop = copInRange.reduce((s, r) => s + Number(r.amount), 0);
  const grossProfit = totalRevenue - totalCop;

  const handleExport = () => {
    exportSummaryPDF({
      byDate,
      inRange,
      totalRevenue,
      totalCop,
      grossProfit,
      copRows: copInRange,
      stockLogs: stockInRange,
      from,
      to,
      title
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 p-6 flex justify-between items-center z-10 rounded-t-2xl">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{title} Summary Report</h2>
            <p className="text-sm text-gray-500 mt-1">
              {inRange.length} entr{inRange.length !== 1 ? "ies" : "y"} · {new Date(from).toLocaleDateString()} &rarr; {new Date(to).toLocaleDateString()}
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="p-6">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-end gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100 mb-6">
            <div className="w-full sm:w-auto">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">From Date</label>
              <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm" />
            </div>
            <div className="w-full sm:w-auto">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">To Date</label>
              <input type="date" value={to} onChange={e => setTo(e.target.value)} className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm" />
            </div>
            <div className="flex flex-wrap gap-2 w-full sm:w-auto sm:ml-auto mt-2 sm:mt-0">
              <button onClick={() => { setFrom(minDate); setTo(maxDate); }} className="flex-1 sm:flex-none px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">All time</button>
              <button onClick={() => { setFrom(TODAY); setTo(TODAY); }} className="flex-1 sm:flex-none px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">Today</button>
              <button onClick={handleExport} className="w-full sm:w-auto px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold shadow-sm hover:bg-primary-hover">⬇ Export PDF</button>
            </div>
          </div>

          {/* Totals Banner */}
          <div className="flex flex-col md:flex-row rounded-xl overflow-hidden mb-8 border border-gray-100 shadow-sm divide-y md:divide-y-0 md:divide-x divide-gray-100">
            <div className="flex-1 p-4 bg-white">
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Revenue</div>
              <div className="text-2xl font-bold text-primary">₦{totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
            </div>
            <div className="flex-1 p-4 bg-white">
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Total COP</div>
              <div className="text-2xl font-bold text-brand-yellow">₦{totalCop.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
            </div>
            <div className="flex-1 p-4 bg-gray-50 border-l border-gray-100">
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Gross Profit</div>
              <div className={`text-2xl font-bold ${grossProfit >= 0 ? "text-green-600" : "text-red-600"}`}>₦{grossProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
            </div>
          </div>

          {/* By Date Blocks */}
          {byDate.length === 0 && (
            <div className="text-center py-12 text-gray-400 font-medium">No sales or stock records found in this date range.</div>
          )}

          {byDate.map(([date, dRows]) => {
            const isNoMultiply = title.includes("Publishing") || title.includes("Digital Prints");
            const rev = dRows.reduce((s, r) => {
              return isNoMultiply
                ? s + Number(r.price) 
                : s + (Number(r.qty) * Number(r.price));
            }, 0);
            const dayStock = stockInRange.find(s => (s.date || s.created_at?.split('T')[0]) === date);

            return (
              <div key={date} className="mb-6 rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="bg-gray-100 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                  <h3 className="font-bold text-gray-800">{new Date(date).toLocaleDateString()}</h3>
                  <span className="text-sm font-medium text-gray-600">{dRows.length} entries &middot; <span className="font-bold text-gray-900">₦{rev.toLocaleString('en-US', {minimumFractionDigits: 2})}</span></span>
                </div>
                {dRows.length > 0 && (
                  <div className="overflow-x-auto bg-white">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Client</th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Description</th>
                          <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase">Qty</th>
                          <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase">Total (₦)</th>
                          <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase">Payment</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {dRows.map((r) => (
                          <tr key={r.id} className="hover:bg-gray-50">
                            <td className="px-4 py-2.5 text-sm font-medium text-gray-900">{r.client_name}</td>
                            <td className="px-4 py-2.5 text-sm text-gray-600">{r.description}</td>
                            <td className="px-4 py-2.5 text-sm text-right text-gray-900">{r.qty}</td>
                            <td className="px-4 py-2.5 text-sm text-right font-bold text-gray-900">{(isNoMultiply ? Number(r.price) : Number(r.qty) * Number(r.price)).toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                            <td className="px-4 py-2.5 text-sm text-center capitalize text-gray-600">{r.payment_method}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {dayStock && (
                  <div className="bg-amber-50/40 border-t border-amber-200/60 p-4">
                    <div className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <span>📦</span> Daily Stock Log ({new Date(date).toLocaleDateString()})
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                      <div className="bg-white p-2.5 rounded border border-amber-100 shadow-sm">
                        <span className="text-gray-500 font-bold block text-[10px] uppercase mb-1">Opening Stock</span>
                        <p className="text-gray-900 whitespace-pre-wrap">{dayStock.opening_stock || "—"}</p>
                      </div>
                      <div className="bg-white p-2.5 rounded border border-amber-100 shadow-sm">
                        <span className="text-gray-500 font-bold block text-[10px] uppercase mb-1">Additional Notes</span>
                        <p className="text-gray-900 whitespace-pre-wrap">{dayStock.additional_notes || "—"}</p>
                      </div>
                      <div className="bg-white p-2.5 rounded border border-amber-100 shadow-sm">
                        <span className="text-gray-500 font-bold block text-[10px] uppercase mb-1">Closing Stock</span>
                        <p className="text-gray-900 whitespace-pre-wrap">{dayStock.closing_stock || "—"}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* COP Table */}
          {copInRange.length > 0 && (
            <div className="mb-6 rounded-xl border border-brand-yellow overflow-hidden shadow-sm mt-10">
              <div className="bg-[#FFF9E5] px-4 py-3 border-b border-brand-yellow flex justify-between items-center">
                <h3 className="font-bold text-yellow-800">Production Cost (COP) Breakdown</h3>
              </div>
              <div className="overflow-x-auto bg-white">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Cost Item</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Note</th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase">Amount (₦)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {copInRange.map((r) => (
                      <tr key={r.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2.5 text-sm text-gray-600">{new Date(r.entry_date || r.created_at).toLocaleDateString()}</td>
                        <td className="px-4 py-2.5 text-sm font-medium text-gray-900">{r.item}</td>
                        <td className="px-4 py-2.5 text-sm text-gray-600">{r.note}</td>
                        <td className="px-4 py-2.5 text-sm text-right font-bold text-brand-yellow">{Number(r.amount).toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50 border-t-2 border-gray-200">
                      <td colSpan={3} className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase">Total COP</td>
                      <td className="px-4 py-3 text-right font-bold text-brand-yellow text-lg">₦{totalCop.toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
