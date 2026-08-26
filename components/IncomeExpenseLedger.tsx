"use client";

import { useState, useMemo } from "react";
import ExpenseForm from "./ExpenseForm";
import IncomeForm from "./IncomeForm";
import { deleteExpense, deleteIncome } from "@/app/actions/expenses";

export default function IncomeExpenseLedger({ 
  initialExpenses = [],
  initialIncome = []
}: { 
  initialExpenses?: any[];
  initialIncome?: any[];
}) {
  const [dateFilter, setDateFilter] = useState("");
  
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);
  const [incomeToDelete, setIncomeToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredExpenses = useMemo(() => {
    return initialExpenses.filter((entry) => {
      if (dateFilter) {
        const entryDate = (entry.entry_date ? new Date(entry.entry_date) : new Date(entry.created_at)).toISOString().split('T')[0];
        if (entryDate !== dateFilter) return false;
      }
      return true;
    });
  }, [initialExpenses, dateFilter]);

  const filteredIncome = useMemo(() => {
    return initialIncome.filter((entry) => {
      if (dateFilter) {
        const entryDate = (entry.entry_date ? new Date(entry.entry_date) : new Date(entry.created_at)).toISOString().split('T')[0];
        if (entryDate !== dateFilter) return false;
      }
      return true;
    });
  }, [initialIncome, dateFilter]);

  const totalExp = filteredExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const totalInc = filteredIncome.reduce((sum, e) => sum + Number(e.amount), 0);
  
  const pathName = "/income-expenses";

  return (
    <div className="relative">
      
      {/* Delete Modal */}
      {(expenseToDelete || incomeToDelete) && (
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
                    setExpenseToDelete(null);
                    setIncomeToDelete(null);
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
                      if (expenseToDelete) await deleteExpense(expenseToDelete, pathName);
                      if (incomeToDelete) await deleteIncome(incomeToDelete, pathName);
                      setExpenseToDelete(null);
                      setIncomeToDelete(null);
                    } catch (error) {
                      alert("Failed to delete entry");
                    } finally {
                      setIsDeleting(false);
                    }
                  }}
                  className="flex-1 py-2.5 px-4 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-white border-l-4 border-orange-400 p-5 rounded-2xl shadow-sm flex flex-col justify-center">
          <h3 className="text-gray-500 font-bold text-xs tracking-wider uppercase mb-1">Total Expenses</h3>
          <p className="text-2xl font-bold text-orange-500">₦{totalExp.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-white border-l-4 border-green-500 p-5 rounded-2xl shadow-sm flex flex-col justify-center">
          <h3 className="text-gray-500 font-bold text-xs tracking-wider uppercase mb-1">Total Income</h3>
          <p className="text-2xl font-bold text-green-600">₦{totalInc.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
        </div>
      </div>

      {/* Forms */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
        <ExpenseForm path={pathName} />
        <IncomeForm path={pathName} />
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <input 
            type="date" 
            value={dateFilter} 
            onChange={(e) => setDateFilter(e.target.value)} 
            className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary text-gray-700 bg-gray-50"
          />
          {dateFilter && (
            <button onClick={() => setDateFilter("")} className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-sm font-medium transition-colors">
              Clear Date
            </button>
          )}
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-xl shadow-sm border border-orange-200 overflow-hidden mb-8">
        <div className="bg-orange-50 px-6 py-3 border-b border-orange-200 flex justify-between items-center">
          <h3 className="font-bold text-orange-800 uppercase tracking-wider text-xs">Expenses</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Amount (₦)</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredExpenses.length > 0 ? (
                filteredExpenses.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="font-bold text-gray-900 block">
                        {entry.entry_date ? new Date(entry.entry_date).toLocaleDateString() : new Date(entry.created_at).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{entry.category || "—"}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{entry.description}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-orange-500">
                      ₦{Number(entry.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      <button onClick={() => setExpenseToDelete(entry.id)} className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-bold shadow-sm hover:bg-red-100">
                        🗑️ Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">
                    No expenses recorded.
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 border-t-2 border-gray-200">
                <td colSpan={3} className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Total Expenses</td>
                <td className="px-6 py-4 text-right font-bold text-orange-500 text-lg">₦{totalExp.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Income Table */}
      <div className="bg-white rounded-xl shadow-sm border border-green-200 overflow-hidden mb-8">
        <div className="bg-green-50 px-6 py-3 border-b border-green-200 flex justify-between items-center">
          <h3 className="font-bold text-green-800 uppercase tracking-wider text-xs">Other Income</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Source</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Amount (₦)</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredIncome.length > 0 ? (
                filteredIncome.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="font-bold text-gray-900 block">
                        {entry.entry_date ? new Date(entry.entry_date).toLocaleDateString() : new Date(entry.created_at).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{entry.source}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{entry.description || "—"}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-green-600">
                      ₦{Number(entry.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
               
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      <button onClick={() => setIncomeToDelete(entry.id)} className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-bold shadow-sm hover:bg-red-100">
                        🗑️ Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">
                    No other income recorded.
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 border-t-2 border-gray-200">
                <td colSpan={3} className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Total Income</td>
                <td className="px-6 py-4 text-right font-bold text-green-600 text-lg">₦{totalInc.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

    </div>
  );
}
