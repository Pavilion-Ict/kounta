"use client";

import { useState, useMemo } from "react";
import ExpenseForm from "./ExpenseForm";
import IncomeForm from "./IncomeForm";
import { deleteExpense, deleteIncome } from "@/app/actions/expenses";
import { StatCard } from "@/components/dashboard/stat-card";
import { formatCurrency } from "@/lib/format";
import { Trash2, FileText, ArrowDownCircle, ArrowUpCircle, Calendar, X } from "lucide-react";
import { useOrganization } from "@/components/providers/OrganizationProvider";

export default function IncomeExpenseLedger({ 
  initialExpenses = [],
  initialIncome = []
}: { 
  initialExpenses?: any[];
  initialIncome?: any[];
}) {
  const { isOwner } = useOrganization();
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
  const inputClass = "block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-colors";

  return (
    <div className="relative">
      
      {/* Delete Modal */}
      {(expenseToDelete || incomeToDelete) && (
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
      <div className="grid grid-cols-2 gap-4 mb-8">
        <StatCard label="Total expenses" value={formatCurrency(totalExp)} />
        <StatCard label="Total income" value={formatCurrency(totalInc)} />
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
            className={inputClass}
          />
          {dateFilter && (
            <button onClick={() => setDateFilter("")} className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-sm font-medium transition-colors">
              Clear Date
            </button>
          )}
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
        <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 flex justify-between items-center">
          <h3 className="font-bold text-gray-900 text-xs font-medium">Expenses</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3.5 text-left text-xs font-medium text-gray-500">Date</th>
                <th className="px-4 py-3.5 text-left text-xs font-medium text-gray-500">Category</th>
                <th className="px-4 py-3.5 text-left text-xs font-medium text-gray-500">Description</th>
                <th className="px-4 py-3.5 text-right text-xs font-medium text-gray-500">Amount</th>
                <th className="px-4 py-3.5 text-center text-xs font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredExpenses.length > 0 ? (
                filteredExpenses.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-4 py-3.5 whitespace-nowrap text-sm text-gray-500">
                      <span className="font-bold text-gray-900 block">
                        {entry.entry_date ? new Date(entry.entry_date).toLocaleDateString() : new Date(entry.created_at).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-sm font-medium text-gray-900">{entry.category || "—"}</td>
                    <td className="px-4 py-3.5 text-sm text-gray-600">{entry.description}</td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-sm text-right font-bold text-gray-900 tabular-nums">
                      {formatCurrency(Number(entry.amount))}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-sm text-center">
                      {isOwner && (
                        <button onClick={() => setExpenseToDelete(entry.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <FileText className="w-8 h-8 mb-2 opacity-50" />
                      <p>No expenses recorded.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 border-t-2 border-gray-200">
                <td colSpan={3} className="px-4 py-3.5 text-right text-xs font-medium text-gray-500">Total Expenses</td>
                <td className="px-4 py-3.5 text-right font-bold text-gray-900 text-lg tabular-nums">{formatCurrency(totalExp)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Income Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
        <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 flex justify-between items-center">
          <h3 className="font-bold text-gray-900 text-xs font-medium">Other income</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3.5 text-left text-xs font-medium text-gray-500">Date</th>
                <th className="px-4 py-3.5 text-left text-xs font-medium text-gray-500">Source</th>
                <th className="px-4 py-3.5 text-left text-xs font-medium text-gray-500">Description</th>
                <th className="px-4 py-3.5 text-right text-xs font-medium text-gray-500">Amount</th>
                <th className="px-4 py-3.5 text-center text-xs font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredIncome.length > 0 ? (
                filteredIncome.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-4 py-3.5 whitespace-nowrap text-sm text-gray-500">
                      <span className="font-bold text-gray-900 block">
                        {entry.entry_date ? new Date(entry.entry_date).toLocaleDateString() : new Date(entry.created_at).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-sm font-medium text-gray-900">{entry.source}</td>
                    <td className="px-4 py-3.5 text-sm text-gray-600">{entry.description || "—"}</td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-sm text-right font-bold text-gray-900 tabular-nums">
                      {formatCurrency(Number(entry.amount))}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-sm text-center">
                      {isOwner && (
                        <button onClick={() => setIncomeToDelete(entry.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <FileText className="w-8 h-8 mb-2 opacity-50" />
                      <p>No other income recorded.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 border-t-2 border-gray-200">
                <td colSpan={3} className="px-4 py-3.5 text-right text-xs font-medium text-gray-500">Total Income</td>
                <td className="px-4 py-3.5 text-right font-bold text-gray-900 text-lg tabular-nums">{formatCurrency(totalInc)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

    </div>
  );
}
