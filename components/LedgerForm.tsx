"use client";

import { useState } from "react";
import { addLedgerEntry } from "@/app/actions/ledger";
import { useOrganization } from "@/components/providers/OrganizationProvider";
import { FileText } from "lucide-react";

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
      }, currentOrg.id);
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
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
      <h3 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <span className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center"><FileText className="w-3.5 h-3.5 text-emerald-600" /></span>
        Add new record
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
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
          <label className={labelClass}>Client Name</label>
          <input
            type="text"
            required
            list={`clients-${tableName}`}
            className={inputClass}
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
          <label className={labelClass}>Service Description</label>
          <input
            type="text"
            required
            className={inputClass}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div>
          <label className={labelClass}>Qty</label>
          <input
            type="number"
            min="1"
            required
            className={inputClass}
            value={qty}
            onChange={(e) => setQty(e.target.value)}
          />
        </div>
        
        <div>
          <label className={labelClass}>Price (₦)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            required
            className={inputClass}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>
        
        <div>
          <label className={labelClass}>Balance (₦)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            required
            className={inputClass}
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
          />
        </div>

        <div>
          <label className={labelClass}>Payment Method</label>
          <select
            className={selectClass}
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
          <label className={labelClass}>Delivery Method</label>
          <select
            className={selectClass}
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
          <label className={labelClass}>Note (Optional)</label>
          <input
            type="text"
            className={inputClass}
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
          className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-semibold text-sm shadow-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "Saving..." : "Add Record"}
        </button>
      </div>
    </form>
  );
}
