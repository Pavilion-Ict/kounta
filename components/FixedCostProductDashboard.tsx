"use client";

import { useState, useMemo } from "react";
import SummaryPanel from "./SummaryPanel";
import { generateReceipt, exportPublishingPDF } from "@/lib/pdfUtils";
import { updateCatalogue, saveStockLog, verifyCopPin, deleteCatalogueItem } from "@/app/actions/fixed-cost-product";
import { addLedgerEntry, updateLedgerEntry, deleteLedgerEntry } from "@/app/actions/ledger";
import { useOrganization } from "@/components/providers/OrganizationProvider";
import { StatCard } from "@/components/dashboard/stat-card";
import { formatCurrency } from "@/lib/format";
import { BarChart3, Download, Search, ChevronLeft, ChevronRight, Calendar, X, Package, Settings, FileText, Trash2, Receipt } from "lucide-react";

const getLocalDate = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function FixedCostProductDashboard({ 
  initialRows, 
  initialCatalogue, 
  initialStockLogs,
  title = "Fixed Cost Product"
}: any) {
  const [catalogue, setCatalogue] = useState<any>(initialCatalogue);
  const [stockLogs, setStockLogs] = useState<any[]>(initialStockLogs);
  const { currentOrg } = useOrganization();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState(getLocalDate());
  const [paymentFilter, setPaymentFilter] = useState("all");

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
  const [deliveryFilter, setDeliveryFilter] = useState("all");
  const [showSummary, setShowSummary] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form States
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [clientName, setClientName] = useState("");
  const [service, setService] = useState(Object.keys(catalogue)[0] || "");
  const [qty, setQty] = useState("1");
  const [price, setPrice] = useState("");
  const [balance, setBalance] = useState("0");
  const [expenses, setExpenses] = useState("0");
  const [paymentMethod, setPaymentMethod] = useState("Transfer");
  const [deliveryMethod, setDeliveryMethod] = useState("Pick Up");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  // Stock Form States
  const [stockDate, setStockDate] = useState(new Date().toISOString().split('T')[0]);
  const [openingStock, setOpeningStock] = useState("");
  const [stockNote, setStockNote] = useState("");
  const [closingStock, setClosingStock] = useState("");
  const [stockLoading, setStockLoading] = useState(false);

  // Catalogue Form States
  const [catName, setCatName] = useState("");
  const [catCop, setCatCop] = useState("");
  const [catLoading, setCatLoading] = useState(false);
  const [catPin, setCatPin] = useState("");
  const [catUnlocked, setCatUnlocked] = useState(false);
  const [catError, setCatError] = useState("");
  const [selectedEntries, setSelectedEntries] = useState<Set<string>>(new Set());

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedEntries);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedEntries(newSet);
  };

  const uniqueClientNames = useMemo(() => {
    const names = new Set<string>();
    initialRows.forEach((e: any) => {
      if (e.client_name) names.add(e.client_name.trim());
    });
    return Array.from(names).sort();
  }, [initialRows]);

  const filteredEntries = useMemo(() => {
    return initialRows.filter((entry: any) => {
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
          ${entry.qty}
          ${entry.price}
          ${entry.balance || ''}
        `.toLowerCase();
        
        if (!searchString.includes(query)) return false;
      }
      return true;
    });
  }, [initialRows, searchQuery, paymentFilter, deliveryFilter, dateFilter]);

  const filteredStockLogs = useMemo(() => {
    return initialStockLogs.filter((entry: any) => {
      if (dateFilter) {
        const entryDate = (entry.date ? new Date(entry.date) : new Date(entry.created_at)).toISOString().split('T')[0];
        if (entryDate !== dateFilter) return false;
      }
      return true;
    });
  }, [initialStockLogs, dateFilter]);

  const totals = useMemo(() => {
    let revenue = 0;
    let cop = 0;
    let inlineExp = 0;
    
    filteredEntries.forEach((r: any) => {
      revenue += Number(r.price) || 0;
      inlineExp += Number(r.expenses) || 0;
      const unitCop = (catalogue[r.description] || { cop: 0 }).cop;
      cop += unitCop * (Number(r.qty) || 0);
    });

    return { revenue, cop, exp: inlineExp, inc: 0 };
  }, [filteredEntries, catalogue]);

  const grossProfit = totals.revenue - totals.cop;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!currentOrg) throw new Error("No organization selected");
      await addLedgerEntry("publishing_ledger", {
        entryDate,
        clientName,
        description: service,
        qty: parseInt(qty, 10),
        price: parseFloat(price),
        balance: parseFloat(balance || "0"),
        expenses: parseFloat(expenses || "0"),
        paymentMethod,
        deliveryMethod,
        note,
      }, currentOrg.id);
      
      setEntryDate(new Date().toISOString().split('T')[0]);
      setClientName("");
      setQty("1");
      setPrice("");
      setBalance("0");
      setExpenses("0");
      setPaymentMethod("Transfer");
      setDeliveryMethod("Pick Up");
      setNote("");
    } catch (err: any) {
      alert(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStockLoading(true);
    try {
      if (!currentOrg) throw new Error("No organization selected");
      await saveStockLog({
        date: stockDate,
        opening_stock: openingStock,
        additional_notes: stockNote,
        closing_stock: closingStock
      }, currentOrg.id);
      alert("Stock log saved successfully!");
      setOpeningStock("");
      setStockNote("");
      setClosingStock("");
    } catch (err: any) {
      alert(err.message || "Failed to save stock log");
    } finally {
      setStockLoading(false);
    }
  };

  const unlockCatalogue = async (e: React.FormEvent) => {
    e.preventDefault();
    setCatError("");
    const isValid = await verifyCopPin(catPin);
    if (isValid) {
      setCatUnlocked(true);
    } else {
      setCatError("Incorrect PIN");
    }
  };

  const handleCatalogueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName || !catCop) return;
    setCatLoading(true);
    try {
      if (!currentOrg) throw new Error("No organization selected");
      await updateCatalogue([{ service_name: catName, cop_rate: parseFloat(catCop) }], currentOrg.id);
      setCatalogue((prev: any) => ({ ...prev, [catName]: { cop: parseFloat(catCop) } }));
      setCatName("");
      setCatCop("");
      alert("Catalogue updated!");
    } catch (err: any) {
      alert("Failed to update catalogue");
    } finally {
      setCatLoading(false);
    }
  };

  const handleCatalogueDelete = async (name: string) => {
    if (!confirm(`Are you sure you want to delete ${name} from the catalogue?`)) return;
    try {
      if (!currentOrg) throw new Error("No organization selected");
      await deleteCatalogueItem(name, currentOrg.id);
      setCatalogue((prev: any) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    } catch (e) {
      alert("Failed to delete catalogue item");
    }
  };

  const inputClass = "block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-colors";
  const selectClass = "block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-colors appearance-none";
  const labelClass = "block text-xs font-medium text-gray-500 mb-1.5";

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 relative">
      {/* Modals */}
      {showSummary && (
        <SummaryPanel 
          rows={initialRows} 
          copRows={initialRows.map((r: any) => ({
            amount: (catalogue[r.description]?.cop || 0) * Number(r.qty || 0),
            created_at: r.created_at,
            entry_date: r.entry_date
          }))} 
          stockLogs={initialStockLogs || []}
          onClose={() => setShowSummary(false)} 
          title={title}
        />
      )}

      {(entryToDelete) && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-7 h-7" />
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
                      if (!currentOrg) throw new Error("No organization selected");
                      if (entryToDelete) await deleteLedgerEntry("publishing_ledger", entryToDelete, currentOrg.id);
                      setEntryToDelete(null);
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
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">{title}</h1>
        <div className="flex flex-wrap items-center gap-3">
          
          <div className="flex items-center bg-white border border-gray-200 rounded-xl shadow-sm h-full min-h-[44px] overflow-hidden">
            <button 
              onClick={handlePrevDay}
              disabled={!dateFilter}
              className="px-3 sm:px-4 py-2 hover:bg-gray-50 border-r border-gray-200 text-gray-500 disabled:opacity-30 disabled:hover:bg-white transition-colors"
              title="Previous Day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center px-3 gap-2">
              <Calendar className="w-4 h-4 text-gray-400 hidden sm:block" />
              
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
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button 
              onClick={handleNextDay}
              disabled={!dateFilter || dateFilter === todayStr}
              className="px-3 sm:px-4 py-2 hover:bg-gray-50 border-l border-gray-200 text-gray-500 disabled:opacity-30 disabled:hover:bg-white transition-colors"
              title="Next Day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button onClick={() => setShowSummary(true)} className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-bold shadow-sm hover:bg-gray-50 flex items-center gap-2 h-full min-h-[44px] transition-colors">
            <BarChart3 className="w-4 h-4" /> Summary
          </button>
          <button onClick={() => exportPublishingPDF({
            filteredRows: filteredEntries, catalogue, title,
            totalRevenue: totals.revenue, totalCop: totals.cop, totalExpenses: totals.exp, stockLogs: filteredStockLogs,
            filterDate: searchQuery || paymentFilter !== "all" || deliveryFilter !== "all" || dateFilter ? "Filtered" : ""
          })} className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-sm hover:bg-primary-hover flex items-center gap-2 h-full min-h-[44px]">
            <Download className="w-4 h-4" /> Export PDF
          </button>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Revenue" value={formatCurrency(totals.revenue)} />
        <StatCard label="Cost of production" value={formatCurrency(totals.cop)} />
        <StatCard label="Gross profit" value={formatCurrency(grossProfit)} />
        <StatCard label="Entries" value={String(filteredEntries.length)} deltaLabel="today" />
      </div>

      {/* Forms Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8 items-start">
        {/* Ledger Entry Form (Spans 2 columns) */}
        <div className="xl:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center">
                <FileText className="w-3.5 h-3.5 text-emerald-600" />
              </span>
              Add sales record
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              <div>
                <label className={labelClass}>Date</label>
                <input type="date" required className={inputClass} value={entryDate} onChange={(e) => setEntryDate(e.target.value)} />
              </div>
              
              <div>
                <label className={labelClass}>Client Name</label>
                <input type="text" required list="publishing-clients" className={inputClass} value={clientName} onChange={(e) => setClientName(e.target.value)} />
                <datalist id="publishing-clients">
                  {uniqueClientNames.map((name) => (
                    <option key={name} value={name} />
                  ))}
                </datalist>
              </div>
              
              <div>
                <label className={labelClass}>Service</label>
                <select className={selectClass} value={service} onChange={(e) => setService(e.target.value)}>
                  {Object.keys(catalogue).map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:col-span-3">
                <div>
                  <label className={labelClass}>Qty</label>
                  <input type="number" min="1" required className={inputClass} value={qty} onChange={(e) => setQty(e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Price (₦)</label>
                  <input type="number" step="0.01" min="0" required className={inputClass} value={price} onChange={(e) => setPrice(e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>COP rate / total</label>
                  <div className="flex items-center gap-2 rounded-lg border border-dashed border-gray-200 bg-gray-50/80 px-3 py-2 text-sm">
                    <span className="text-gray-500 tabular-nums">₦{catalogue[service]?.cop || 0}</span>
                    <span className="text-gray-300">/</span>
                    <span className="font-semibold text-gray-900 tabular-nums">{formatCurrency((catalogue[service]?.cop || 0) * (Number(qty) || 0))}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:col-span-3">
                <div>
                  <label className={labelClass}>Balance</label>
                  <input type="number" step="0.01" min="0" required className={inputClass} value={balance} onChange={(e) => setBalance(e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Entry Expenses (₦)</label>
                  <input type="number" step="0.01" min="0" required className={inputClass} value={expenses} onChange={(e) => setExpenses(e.target.value)} />
                </div>
              </div>

              <div>
                <label className={labelClass}>Payment Method</label>
                <select className={selectClass} value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                  {["Transfer", "Cash", "POS", "Cheque", "Credit"].map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>

              <div>
                <label className={labelClass}>Delivery Method</label>
                <select className={selectClass} value={deliveryMethod} onChange={(e) => setDeliveryMethod(e.target.value)}>
                  {["Pick Up", "Dispatch", "Express Delivery", "Evening Delivery", "Walk-In"].map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>

              <div>
                <label className={labelClass}>Note (Optional)</label>
                <input type="text" className={inputClass} value={note} onChange={(e) => setNote(e.target.value)} />
              </div>
            </div>
            <div className="flex justify-end pt-2 border-t border-gray-100 mt-2">
              <button type="submit" disabled={loading} className="px-6 py-2.5 bg-primary text-white font-bold rounded-lg hover:bg-primary-hover shadow-sm">
                {loading ? "Saving..." : "+ Add Entry"}
              </button>
            </div>
          </form>
        </div>

        {/* Side Forms: Stock & Catalogue */}
        <div className="flex flex-col gap-6">
          <form onSubmit={handleStockSubmit} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-md font-semibold text-gray-800 mb-3 border-b border-gray-100 pb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center">
                <Package className="w-3.5 h-3.5 text-indigo-600" />
              </span>
              Daily stock log
            </h3>
            <div className="flex flex-col gap-3">
              <div>
                <label className={labelClass}>Date</label>
                <input type="date" required className={inputClass} value={stockDate} onChange={(e) => setStockDate(e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Opening Stock</label>
                <input type="number" min="0" step="1" className={inputClass} value={openingStock} onChange={(e) => setOpeningStock(e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Additional Notes</label>
                <input type="text" className={inputClass} value={stockNote} onChange={(e) => setStockNote(e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Closing Stock</label>
                <input type="number" min="0" step="1" className={inputClass} value={closingStock} onChange={(e) => setClosingStock(e.target.value)} />
              </div>
              <button type="submit" disabled={stockLoading} className="w-full py-2 mt-1 bg-gray-100 text-gray-800 font-bold text-sm rounded-lg hover:bg-gray-200">
                {stockLoading ? "Saving..." : "Save Stock"}
              </button>
            </div>
          </form>

          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-md font-semibold text-gray-800 mb-3 border-b border-gray-100 pb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-50 flex items-center justify-center">
                <Settings className="w-3.5 h-3.5 text-amber-600" />
              </span>
              Update catalogue
            </h3>
            {!catUnlocked ? (
              <form onSubmit={unlockCatalogue} className="flex flex-col gap-3">
                <div>
                  <label className={labelClass}>Enter Admin PIN</label>
                  <input type="password" placeholder="••••" required className={`${inputClass} text-center font-mono tracking-[0.5em]`} value={catPin} onChange={(e) => { setCatPin(e.target.value); setCatError(""); }} />
                  {catError && <p className="text-red-500 text-xs mt-1">{catError}</p>}
                </div>
                <button type="submit" className="w-full py-2 bg-gray-100 text-gray-800 font-bold text-sm rounded-lg hover:bg-gray-200">Unlock</button>
              </form>
            ) : (
              <>
                <form onSubmit={handleCatalogueSubmit} className="flex flex-col gap-3">
                  <div>
                    <label className={labelClass}>Service Name</label>
                    <input type="text" placeholder="e.g. Printing" required className={inputClass} value={catName} onChange={(e) => setCatName(e.target.value)} />
                  </div>
                  <div>
                    <label className={labelClass}>Unit COP (₦)</label>
                    <input type="number" step="0.01" min="0" required className={inputClass} value={catCop} onChange={(e) => setCatCop(e.target.value)} />
                  </div>
                  <button type="submit" disabled={catLoading} className="w-full py-2 mt-1 bg-brand-yellow text-yellow-900 font-bold text-sm rounded-lg hover:brightness-95">
                    {catLoading ? "Saving..." : "Add / Update"}
                  </button>
                </form>
                <div className="mt-4 pt-4 border-t border-gray-100 max-h-48 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="sticky top-0 bg-white">
                      <tr className="text-gray-500 uppercase">
                        <th className="pb-2">Service</th>
                        <th className="pb-2 text-right">COP</th>
                        <th className="pb-2 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {Object.entries(catalogue).map(([name, data]: any) => (
                        <tr key={name} className="hover:bg-gray-50">
                          <td className="py-2 text-gray-900">{name}</td>
                          <td className="py-2 text-right text-gray-900 font-bold">₦{data.cop}</td>
                          <td className="py-2 text-right">
                            <button onClick={() => handleCatalogueDelete(name)} className="text-red-500 hover:text-red-700">Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <div className="w-full md:w-1/3 relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
          <input type="text" placeholder="Search all fields..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className={`${inputClass} !pl-10`} />
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)} className={selectClass}>
            <option value="all">All Payments</option>
            {["Transfer", "Cash", "POS", "Cheque", "Credit"].map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          <select value={deliveryFilter} onChange={(e) => setDeliveryFilter(e.target.value)} className={selectClass}>
            <option value="all">All Deliveries</option>
            {["Pick Up", "Dispatch", "Express Delivery", "Evening Delivery", "Walk-In"].map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8">
        <div className="bg-gray-50 px-4 py-3.5 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-bold text-gray-700 text-xs">Sales records</h3>
          {selectedEntries.size > 0 && (
            <button onClick={() => {
              const rowsToPrint = filteredEntries.filter((e: any) => selectedEntries.has(e.id));
              generateReceipt(rowsToPrint, title, true); 
            }} className="px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-bold shadow-sm hover:bg-primary-hover flex items-center gap-1.5">
              <Receipt className="w-3.5 h-3.5" /> Generate Receipt ({selectedEntries.size})
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-gray-900">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3.5">
                  <input type="checkbox" onChange={(e) => {
                    if (e.target.checked) setSelectedEntries(new Set(filteredEntries.map((e: any) => e.id)));
                    else setSelectedEntries(new Set());
                  }} checked={selectedEntries.size === filteredEntries.length && filteredEntries.length > 0} className="rounded text-primary focus:ring-primary" />
                </th>
                <th className="px-4 py-3.5 text-left text-xs font-medium text-gray-500">Date</th>
                <th className="px-4 py-3.5 text-left text-xs font-medium text-gray-500">Client Name</th>
                <th className="px-4 py-3.5 text-left text-xs font-medium text-gray-500">Service</th>
                <th className="px-4 py-3.5 text-right text-xs font-medium text-gray-500">Qty</th>
                <th className="px-4 py-3.5 text-right text-xs font-medium text-gray-500">Price</th>
                <th className="px-4 py-3.5 text-right text-xs font-medium text-gray-500">COP</th>
                <th className="px-4 py-3.5 text-center text-xs font-medium text-gray-500">Payment</th>
                <th className="px-4 py-3.5 text-center text-xs font-medium text-gray-500">Delivery</th>
                <th className="px-4 py-3.5 text-right text-xs font-medium text-gray-500">Balance</th>
                <th className="px-4 py-3.5 text-right text-xs font-medium text-gray-500">Expenses</th>
                <th className="px-4 py-3.5 text-left text-xs font-medium text-gray-500">Note</th>
                <th className="px-4 py-3.5 text-center text-xs font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEntries.length > 0 ? (
                filteredEntries.map((entry: any) => {
                  const unitCop = (catalogue[entry.description] || { cop: 0 }).cop;
                  const totalCop = unitCop * (Number(entry.qty) || 0);

                  return (
                    <tr key={entry.id} className={`group hover:bg-gray-50 transition-colors ${selectedEntries.has(entry.id) ? 'bg-blue-50/50' : ''}`}>
                      <td className="px-4 py-3.5">
                        <input type="checkbox" checked={selectedEntries.has(entry.id)} onChange={() => toggleSelection(entry.id)} className="rounded text-primary focus:ring-primary" />
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-sm text-gray-500">
                        <span className="font-bold text-gray-900 block">
                          {entry.entry_date ? new Date(entry.entry_date).toLocaleDateString() : new Date(entry.created_at).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-sm font-medium text-gray-900">{entry.client_name}</td>
                      <td className="px-4 py-3.5 text-sm text-gray-600 max-w-[150px] truncate">{entry.description}</td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-sm text-right text-gray-900">{entry.qty}</td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-sm text-right font-bold text-gray-900 tabular-nums">{formatCurrency(Number(entry.price))}</td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-sm text-right font-bold text-gray-900 tabular-nums">{formatCurrency(totalCop)}</td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-sm text-center">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full 
                          ${entry.payment_method === 'Credit' ? 'bg-[#FFF9E5] text-[#FFCC29]' : 
                            entry.payment_method === 'Cash' ? 'bg-[#E5F5FC] text-[#0098DA]' : 
                            entry.payment_method === 'POS' ? 'bg-[#EAEAF4] text-[#3E4095]' : 
                            entry.payment_method === 'Transfer' ? 'bg-green-100 text-green-700' : 
                            'bg-[#FDEBF2] text-[#ED3883]'}`}>
                          {entry.payment_method}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-sm text-center" style={{textTransform: 'capitalize'}}>{entry.delivery_method}</td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-sm text-right text-gray-900 tabular-nums">{formatCurrency(Number(entry.balance || 0))}</td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-sm text-right font-bold text-gray-900 tabular-nums">{formatCurrency(Number(entry.expenses || 0))}</td>
                      <td className="px-4 py-3.5 text-sm text-gray-500 max-w-[150px] truncate" title={entry.note}>
                        {entry.note || '-'}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-sm">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => generateReceipt(entry, title)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors" title="Generate receipt">
                            <Receipt className="w-4 h-4" />
                          </button>
                          <button onClick={() => setEntryToDelete(entry.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Delete entry">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={13} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <FileText className="w-8 h-8 text-gray-300" />
                      <p className="text-sm font-medium text-gray-500">No records found</p>
                      <p className="text-xs text-gray-400">Try adjusting your filters or add a new entry above</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>



    </div>
  );
}
