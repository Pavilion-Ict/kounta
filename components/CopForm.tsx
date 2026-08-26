"use client";

import { useState } from "react";
import { addCopEntry } from "@/app/actions/ledger";

export default function CopForm({ tableName }: { tableName: string }) {
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [item, setItem] = useState("");
  const [note, setNote] = useState("");
  const [amount, setAmount] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await addCopEntry(tableName, {
        entryDate,
        item,
        note,
        amount: parseFloat(amount),
      });
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
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <span className="text-brand-yellow text-xl">⚡</span> Add Production Cost (COP)
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
          <input
            type="date"
            required
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900"
            value={entryDate}
            onChange={(e) => setEntryDate(e.target.value)}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cost Item</label>
          <input
            type="text"
            required
            placeholder="e.g. Transportation, Paper"
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900"
            value={item}
            onChange={(e) => setItem(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Note (Optional)</label>
          <input
            type="text"
            placeholder="Additional details..."
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₦)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            required
            placeholder="0.00"
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900"
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
          className="px-6 py-2.5 bg-brand-yellow text-gray-900 rounded-xl font-bold shadow-md hover:bg-yellow-400 focus:ring-2 focus:ring-offset-2 focus:ring-brand-yellow disabled:opacity-50 transition-all duration-200"
        >
          {loading ? "Saving..." : "Add Cost Item"}
        </button>
      </div>
    </form>
  );
}
