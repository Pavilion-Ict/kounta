import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";

export const dynamic = 'force-dynamic';

import Link from "next/link";
import IncomeExpenseLedger from "@/components/IncomeExpenseLedger";

export default async function IncomeExpensePage() {


  // Fetch Expenses
  const { data: expenseEntries, error: expenseError } = await supabase
    .from("company_expenses")
    .select("*")
    .order("created_at", { ascending: false });

  if (expenseError) console.error("Error fetching expenses:", expenseError);

  // Fetch Income
  const { data: incomeEntries, error: incomeError } = await supabase
    .from("company_income")
    .select("*")
    .order("created_at", { ascending: false });

  if (incomeError) console.error("Error fetching income:", incomeError);

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 sm:p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-10 bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100/50 backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <Link href="/" className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center text-gray-600 transition-colors">
              &larr;
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-800 tracking-tight">Additional Income & Expenses</h1>
              <p className="text-gray-500 mt-1 font-medium">Manage all company-wide expenses and other income sources.</p>
            </div>
          </div>

        </div>

        <IncomeExpenseLedger 
          initialExpenses={expenseEntries || []}
          initialIncome={incomeEntries || []}
        />
      </div>
    </div>
  );
}
