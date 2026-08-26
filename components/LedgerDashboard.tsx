"use client";

import { useState, useMemo } from "react";
import LedgerForm from "./LedgerForm";
import CopForm from "./CopForm";
import SummaryPanel from "./SummaryPanel";
import { generateReceipt, exportLedgerPDF } from "@/lib/pdfUtils";
import { deleteLedgerEntry, deleteCopEntry } from "@/app/actions/ledger";

type Entry = {
  id: string;
  created_at: string;
  entry_date?: string;
  client_name: string;
  description: string;
  qty: number;
  price: number;
  payment_method: string;
  delivery_method: string;
  balance?: number;
  note?: string;
  users: { username: string } | null;
};

type CopEntry = {
  id: string;
  created_at: string;
  entry_date?: string;
  item: string;
  note: string;
  amount: number;
  users: { username: string } | null;
};

const getLocalDate = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function LedgerDashboard({ 
  tableName, 
  title, 
  initialEntries,
  initialCopEntries
}: { 
  tableName: string; 
  title: string; 
  initialEntries: Entry[];
  initialCopEntries: CopEntry[];
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState(getLocalDate());
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [deliveryFilter, setDeliveryFilter] = useState("all");
  const [showSummary, setShowSummary] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<string | null>(null);
  const [copEntryToDelete, setCopEntryToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [selectedEntries, setSelectedEntries] = useState<Set<string>>(new Set());

  const uniqueClientNames = useMemo(() => {
    const names = new Set<string>();
    initialEntries.forEach(e => {
      if (e.client_name) names.add(e.client_name.trim());
    });
    return Array.from(names).sort();
  }, [initialEntries]);

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedEntries);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedEntries(newSet);
  };

  const todayStr = getLocalDate();

  const handlePrevDay = () => {
    if (!dateFilter) return;
    const d = new Date(dateFilter);
    d.setDate(d.getDate() - 1);
    setDateFilter(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    if (!dateFilter) return;
    const d = new Date(dateFilter);
    d.setDate(d.getDate() + 1);
    setDateFilter(d.toISOString().split('T')[0]);
  };

  const filteredEntries = useMemo(() => {
    return initialEntries.filter((entry) => {
      if (paymentFilter !== "all" && entry.payment_method !== paymentFilter) return false;
      if (deliveryFilter !== "all" && entry.delivery_method !== deliveryFilter) return false;

      if (dateFilter) {
        const entryDate = (entry.entry_date ? new Date(entry.entry_date) : new Date(entry.created_at)).toISOString().split('T')[0];
        if (entryDate !== dateFilter) return false;
      }

      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase();
        const searchString = `
          ${entry.client_name} 
          ${entry.description} 
          ${entry.payment_method} 
          ${entry.delivery_method} 
          ${entry.note || ''}
          ${entry.users?.username || ''}
          ${entry.qty}
          ${entry.price}
          ${entry.balance || ''}
          ${entry.entry_date || ''}
          ${new Date(entry.created_at).toLocaleDateString()}
        `.toLowerCase();
        
        if (!searchString.includes(query)) return false;
      }
      return true;
    });
  }, [initialEntries, searchQuery, paymentFilter, deliveryFilter, dateFilter]);

  const filteredCopEntries = useMemo(() => {
    return initialCopEntries.filter((entry) => {
      if (dateFilter) {
        const entryDate = (entry.entry_date ? new Date(entry.entry_date) : new Date(entry.created_at)).toISOString().split('T')[0];
        if (entryDate !== dateFilter) return false;
      }
      return true;
    });
  }, [initialCopEntries, dateFilter]);

  const totalRevenue = filteredEntries.reduce((sum, e) => {
    return title.includes("Digital Prints") 
      ? sum + Number(e.price)
      : sum + (Number(e.qty) * Number(e.price));
  }, 0);
  const totalCop = filteredCopEntries.reduce((sum, e) => sum + Number(e.amount), 0);
  
  const grossProfit = totalRevenue - totalCop;
  // Net profit is handled globally now

  const pathName = `/${tableName.replace('_ledger', '').replace('_', '-')}`;

  const handleExportPDF = () => {
    exportLedgerPDF({
      filteredRows: filteredEntries,
      totalRevenue,
      totalCop,
      copRows: filteredCopEntries,
      filterDate: dateFilter,
      title
    });
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 relative">
      
      {/* Modals */}
      {showSummary && (
        <SummaryPanel 
          rows={initialEntries} 
          copRows={initialCopEntries} 
          onClose={() => setShowSummary(false)} 
          title={title}
        />
      )}

      {(entryToDelete || copEntryToDelete) && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                🗑️
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Entry?</h3>
              <p className="text-sm text-gray-500 mb-6">
                Are you sure you want to permanently delete this record? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button 
                  disabled={isDeleting}
                  onClick={() => {
                    setEntryToDelete(null);
                    setCopEntryToDelete(null);
                  }}
                  className="flex-1 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  disabled={isDeleting}
                  onClick={async () => {
                    setIsDeleting(true);
                    try {
                      if (entryToDelete) await deleteLedgerEntry(tableName, entryToDelete);
                      if (copEntryToDelete) await deleteCopEntry(tableName, copEntryToDelete);
                      setEntryToDelete(null);
                      setCopEntryToDelete(null);
                        } catch (e) {
                      alert("Failed to delete entry");
                    } finally {
                      setIsDeleting(false);
                    }
                  }}
                  className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-6">
        <h1 className="text-3xl font-bold text-gray-800">{title} Sales Ledger</h1>
        <div className="flex flex-wrap items-center gap-3">
          
          <div className="flex items-center bg-white border border-gray-200 rounded-xl shadow-sm h-full min-h-[44px] overflow-hidden">
            <button 
              onClick={handlePrevDay}
              disabled={!dateFilter}
              className="px-3 sm:px-4 py-2 hover:bg-gray-50 border-r border-gray-200 text-gray-500 disabled:opacity-30 disabled:hover:bg-white transition-colors"
              title="Previous Day"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <div className="flex items-center px-3 gap-2">
              <svg className="w-5 h-5 text-gray-400 hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              
              {dateFilter !== todayStr && (
                <button 
                  onClick={() => setDateFilter(todayStr)}
                  className="text-xs font-bold bg-gray-100 hover:bg-gray-200 text-gray-600 px-2 py-1 rounded-md transition-colors"
                >
                  Today
                </button>
              )}

              <input 
                type="date" 
                value={dateFilter} 
                onChange={(e) => setDateFilter(e.target.value)} 
                className="bg-transparent border-none text-sm font-bold focus:ring-0 text-gray-800 outline-none w-auto max-w-[135px] p-0"
              />
              {dateFilter && (
                <button 
                  onClick={() => setDateFilter('')} 
                  className="text-gray-400 hover:text-red-500 font-bold px-1 text-lg leading-none transition-colors"
                  title="View All Dates"
                >
                  ×
                </button>
              )}
            </div>
            <button 
              onClick={handleNextDay}
              disabled={!dateFilter || dateFilter === todayStr}
              className="px-3 sm:px-4 py-2 hover:bg-gray-50 border-l border-gray-200 text-gray-500 disabled:opacity-30 disabled:hover:bg-white transition-colors"
              title="Next Day"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>

          <button onClick={() => setShowSummary(true)} className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-bold shadow-sm hover:bg-gray-50 flex items-center gap-2 h-full min-h-[44px] transition-colors">
            <span>📊</span> Summary
          </button>
          <button onClick={handleExportPDF} className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-sm hover:bg-primary-hover flex items-center gap-2 h-full min-h-[44px]">
            <span>⬇</span> Export PDF
          </button>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border-l-4 border-primary p-5 rounded-2xl shadow-sm flex flex-col justify-center">
          <h3 className="text-gray-500 font-bold text-xs tracking-wider uppercase mb-1">Revenue</h3>
          <p className="text-2xl font-bold text-gray-900">₦{totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-white border-l-4 border-brand-yellow p-5 rounded-2xl shadow-sm flex flex-col justify-center">
          <h3 className="text-gray-500 font-bold text-xs tracking-wider uppercase mb-1">Total COP</h3>
          <p className="text-2xl font-bold text-brand-yellow">₦{totalCop.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className={`bg-white border-l-4 ${grossProfit >= 0 ? 'border-green-500' : 'border-red-500'} p-5 rounded-2xl shadow-sm flex flex-col justify-center`}>
          <h3 className="text-gray-500 font-bold text-xs tracking-wider uppercase mb-1">Gross Profit</h3>
          <p className={`text-2xl font-bold ${grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ₦{grossProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-white border-l-4 border-gray-300 p-5 rounded-2xl shadow-sm flex flex-col justify-center">
          <h3 className="text-gray-500 font-bold text-xs tracking-wider uppercase mb-1">Entries</h3>
          <p className="text-2xl font-bold text-gray-600">{filteredEntries.length}</p>
        </div>
      </div>

      {/* Forms */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
        <LedgerForm tableName={tableName} clientNames={uniqueClientNames} />
        <CopForm tableName={tableName} />
      </div>


      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <div className="w-full md:w-1/3 relative">
          <svg className="w-5 h-5 absolute left-3 top-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input 
            type="text" 
            placeholder="Search all fields..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm text-gray-900"
          />
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)} className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary text-gray-700 bg-gray-50">
            <option value="all">All Payments</option>
            <option value="Transfer">Transfer</option>
            <option value="Cash">Cash</option>
            <option value="POS">POS</option>
            <option value="Cheque">Cheque</option>
            <option value="Credit">Credit</option>
          </select>
          <select value={deliveryFilter} onChange={(e) => setDeliveryFilter(e.target.value)} className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary text-gray-700 bg-gray-50">
            <option value="all">All Deliveries</option>
            <option value="Pick Up">Pick Up</option>
            <option value="Dispatch">Dispatch</option>
            <option value="Express Delivery">Express Delivery</option>
            <option value="Evening Delivery">Evening Delivery</option>
            <option value="Walk-In">Walk-In</option>
          </select>
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8">
        <div className="bg-gray-50 px-6 py-3 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-bold text-gray-700 uppercase tracking-wider text-xs">Sales Records</h3>
          {selectedEntries.size > 0 && (
            <button onClick={() => {
              const rowsToPrint = filteredEntries.filter((e) => selectedEntries.has(e.id));
              generateReceipt(rowsToPrint, title, true); 
            }} className="px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-bold shadow-sm hover:bg-primary-hover">
              🧾 Generate Receipt ({selectedEntries.size})
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-gray-900">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4">
                  <input type="checkbox" onChange={(e) => {
                    if (e.target.checked) setSelectedEntries(new Set(filteredEntries.map((e) => e.id)));
                    else setSelectedEntries(new Set());
                  }} checked={selectedEntries.size === filteredEntries.length && filteredEntries.length > 0} className="rounded text-primary focus:ring-primary" />
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Client Name</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Qty</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Price</th>
                {!title.includes("Digital Prints") && <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Total</th>}
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Balance</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Payment</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Delivery</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Note</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEntries.length > 0 ? (
                filteredEntries.map((entry) => {
                  const total = Number(entry.qty) * Number(entry.price);
                  return (
                    <tr key={entry.id} className={`hover:bg-gray-50 transition-colors ${selectedEntries.has(entry.id) ? 'bg-blue-50/50' : ''}`}>
                      <td className="px-6 py-4">
                        <input type="checkbox" checked={selectedEntries.has(entry.id)} onChange={() => toggleSelection(entry.id)} className="rounded text-primary focus:ring-primary" />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className="font-bold text-gray-900 block">
                          {entry.entry_date ? new Date(entry.entry_date).toLocaleDateString() : new Date(entry.created_at).toLocaleDateString()}
                        </span>
                        <span className="text-xs text-gray-400">
                          Logged: {new Date(entry.created_at).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{entry.client_name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-[200px] truncate">{entry.description}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">{entry.qty}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">₦{Number(entry.price).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                      {!title.includes("Digital Prints") && <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-gray-900">₦{total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-gray-500">₦{Number(entry.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full 
                          ${entry.payment_method === 'Credit' ? 'bg-[#FFF9E5] text-[#FFCC29]' : 
                            entry.payment_method === 'Cash' ? 'bg-[#E5F5FC] text-[#0098DA]' : 
                            entry.payment_method === 'POS' ? 'bg-[#EAEAF4] text-[#3E4095]' : 
                            entry.payment_method === 'Transfer' ? 'bg-green-100 text-green-700' : 
                            'bg-[#FDEBF2] text-[#ED3883]'}`}>
                          {entry.payment_method.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500 capitalize">
                        {entry.delivery_method}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-[150px] truncate" title={entry.note}>
                        {entry.note || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                        <div className="flex justify-center gap-2">
                          <button onClick={() => generateReceipt(entry, title)} className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold shadow-sm hover:bg-gray-200">
                            🧾 Receipt
                          </button>
                          <button 
                            onClick={() => setEntryToDelete(entry.id)} 
                            className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-bold shadow-sm hover:bg-red-100"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-sm text-gray-500">
                    No matching records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* COP Table */}
      <div className="bg-white rounded-xl shadow-sm border border-brand-yellow overflow-hidden">
        <div className="bg-[#FFF9E5] px-6 py-3 border-b border-brand-yellow flex justify-between items-center">
          <h3 className="font-bold text-yellow-800 uppercase tracking-wider text-xs">Production Cost (COP)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Cost Item</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Note</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Amount (₦)</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Admin</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCopEntries.length > 0 ? (
                filteredCopEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="font-bold text-gray-900 block">
                        {entry.entry_date ? new Date(entry.entry_date).toLocaleDateString() : new Date(entry.created_at).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{entry.item}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{entry.note || "—"}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-brand-yellow">
                      ₦{Number(entry.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {entry.users?.username || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      <button 
                        onClick={() => setCopEntryToDelete(entry.id)} 
                        className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-bold shadow-sm hover:bg-red-100"
                      >
                        🗑️ Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
                    No production costs recorded.
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 border-t-2 border-gray-200">
                <td colSpan={3} className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Total COP</td>
                <td className="px-6 py-4 text-right font-bold text-brand-yellow text-lg">₦{totalCop.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
