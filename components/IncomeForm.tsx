"use client";

import { useState } from "react";
import { addIncome } from "@/app/actions/expenses";
import { ArrowUpCircle } from "lucide-react";

export default function IncomeForm({ path }: { path: string }) {
  const [loading, setLoading] = useState(false);

  const inputClass = "block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-colors";
  const selectClass = "block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-colors appearance-none";
  const labelClass = "block text-xs font-medium text-gray-500 mb-1.5";

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    setLoading(true);
    try {
      await addIncome(data, path);
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      alert("Failed to add income");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col h-full">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
        <span className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center"><ArrowUpCircle className="w-3.5 h-3.5 text-emerald-600" /></span>
        <h2 className="text-base font-semibold text-gray-800">Add income</h2>
      </div>

      <div className="space-y-4 flex-grow">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Date</label>
            <input name="entry_date" type="date" required className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Amount (₦)</label>
            <input name="amount" type="number" step="0.01" required className={inputClass} placeholder="e.g. 5000" />
          </div>
        </div>

        <div>
          <label className={labelClass}>Source</label>
          <input name="source" type="text" required className={inputClass} placeholder="e.g. Spiral Binding Machine Sale" />
        </div>

        <div>
          <label className={labelClass}>Description</label>
          <input name="description" type="text" className={inputClass} placeholder="Optional details" />
        </div>
      </div>

      <button type="submit" disabled={loading} className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm py-2.5 px-4 rounded-lg transition-colors shadow-sm disabled:opacity-50">
        {loading ? "Saving..." : "Save Income"}
      </button>
    </form>
  );
}
