"use client";

import { useState } from "react";
import { addIncome } from "@/app/actions/expenses";

export default function IncomeForm({ path }: { path: string }) {
  const [loading, setLoading] = useState(false);

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
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-sm border border-green-100 flex flex-col h-full">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-green-50">
        
        <h2 className="text-xl font-bold text-gray-800">Add Income</h2>
      </div>

      <div className="space-y-4 flex-grow">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Date</label>
            <input name="entry_date" type="date" required className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Amount (₦)</label>
            <input name="amount" type="number" step="0.01" required className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none" placeholder="e.g. 5000" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Source</label>
          <input name="source" type="text" required className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none" placeholder="e.g. Spiral Binding Machine Sale" />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Description</label>
          <input name="description" type="text" className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none" placeholder="Optional details" />
        </div>
      </div>

      <button type="submit" disabled={loading} className="w-full mt-6 bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50">
        {loading ? "Saving..." : "Save Income"}
      </button>
    </form>
  );
}
