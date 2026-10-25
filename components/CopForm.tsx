"use client";

import { useState } from "react";
import { addCopEntry } from "@/app/actions/ledger";
import { useOrganization } from "@/components/providers/OrganizationProvider";
import { Zap } from "lucide-react";

export default function CopForm({ tableName }: { tableName: string }) {
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [item, setItem] = useState("");
  const [note, setNote] = useState("");
  const [amount, setAmount] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { currentOrg } = useOrganization();

  const inputClass = "block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-colors";
  const selectClass = "block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-colors appearance-none";
  const labelClass = "block text-xs font-medium text-gray-500 mb-1.5";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!currentOrg) throw new Error("No organization selected");
      await addCopEntry(tableName, {
        entryDate,
        item,
        note,
        amount: parseFloat(amount),
      }, currentOrg.id);
      // Reset form
      setEntryDate(new Date().toISOString().split('T')[0]);
      setItem("");
      setNote("");
      setAmount("");
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
      <h3 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <span className="w-6 h-6 rounded-lg bg-amber-50 flex items-center justify-center"><Zap className="w-3.5 h-3.5 text-amber-600" /></span>
        Add production cost
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div>
          <label className={labelClass}>Date</label>
          <input
            type="date"
            required
            className={inputClass}
            value={entryDate}
            onChange={(e) => setEntryDate(e.target.value)}
          />
        </div>
        
        <div>
          <label className={labelClass}>Cost Item</label>
          <input
            type="text"
            required
            placeholder="e.g. Transportation, Paper"
            className={inputClass}
            value={item}
            onChange={(e) => setItem(e.target.value)}
          />
        </div>

        <div>
          <label className={labelClass}>Note (Optional)</label>
          <input
            type="text"
            placeholder="Additional details..."
            className={inputClass}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <div>
          <label className={labelClass}>Amount (₦)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            required
            placeholder="0.00"
            className={inputClass}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
      </div>

      <div className="flex justify-between items-center mt-6">
        {error ? <p className="text-red-500 text-sm font-medium">{error}</p> : <div />}
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-semibold text-sm shadow-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "Saving..." : "Add Cost Item"}
        </button>
      </div>
    </form>
  );
}
