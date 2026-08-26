"use client";

import { useState } from "react";
import { addLedgerEntry } from "@/app/actions/ledger";

export default function LedgerForm({ tableName, clientNames = [] }: { tableName: string, clientNames?: string[] }) {
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [clientName, setClientName] = useState("");
  const [description, setDescription] = useState("");
  const [qty, setQty] = useState("1");
  const [price, setPrice] = useState("");
  const [balance, setBalance] = useState("0");
  const [paymentMethod, setPaymentMethod] = useState("Transfer");
  const [deliveryMethod, setDeliveryMethod] = useState("Pick Up");
  const [note, setNote] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await addLedgerEntry(tableName, {
        entryDate,
        clientName,
        description,
        qty: parseInt(qty, 10),
        price: parseFloat(price),
        balance: parseFloat(balance || "0"),
        paymentMethod,
        deliveryMethod,
        note,
      });
      // Reset form
      setEntryDate(new Date().toISOString().split('T')[0]);
      setClientName("");
      setDescription("");
      setQty("1");
      setPrice("");
      setBalance("0");
      setPaymentMethod("Transfer");
      setDeliveryMethod("Pick Up");
      setNote("");
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Add New Record</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Client Name</label>
          <input
            type="text"
            required
            list={`clients-${tableName}`}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
          />
          <datalist id={`clients-${tableName}`}>
            {clientNames.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
        </div>
        
        <div className="sm:col-span-2 lg:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Service Description</label>
          <input
            type="text"
            required
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Qty</label>
          <input
            type="number"
            min="1"
            required
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Price (₦)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            required
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Balance (₦)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            required
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900"
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
          <select
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
          >
            <option value="Transfer">Transfer</option>
            <option value="Cash">Cash</option>
            <option value="POS">POS</option>
            <option value="Cheque">Cheque</option>
            <option value="Credit">Credit</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Method</label>
          <select
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
            value={deliveryMethod}
            onChange={(e) => setDeliveryMethod(e.target.value)}
          >
            <option value="Pick Up">Pick Up</option>
            <option value="Dispatch">Dispatch</option>
            <option value="Express Delivery">Express Delivery</option>
            <option value="Evening Delivery">Evening Delivery</option>
            <option value="Walk-In">Walk-In</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Note (Optional)</label>
          <input
            type="text"
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
      </div>

      <div className="flex justify-between items-center mt-6">
        {error ? <p className="text-red-500 text-sm font-medium">{error}</p> : <div />}
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold shadow-md hover:bg-primary-hover focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 transition-all duration-200"
        >
          {loading ? "Saving..." : "Add Record"}
        </button>
      </div>
    </form>
  );
}
