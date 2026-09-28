import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

export const dynamic = 'force-dynamic';

import Link from "next/link";
import IncomeExpenseLedger from "@/components/IncomeExpenseLedger";

export default async function IncomeExpensePage() {
  const supabase = await createClient();
  const cookieStore = await cookies();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  let orgId = cookieStore.get('current_org_id')?.value;
  if (!orgId) {
    const { data: membership } = await supabase
      .from('memberships')
      .select('organization_id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .limit(1)
      .single();
    if (!membership) redirect('/onboarding');
    orgId = membership.organization_id;
  }
  if (!orgId) redirect('/onboarding');

  // Fetch Expenses and Income in parallel!
  const [expenseRes, incomeRes] = await Promise.all([
    supabase
      .from("company_expenses")
      .select("*")
      .eq('organization_id', orgId)
      .order("created_at", { ascending: false }),
    supabase
      .from("company_income")
      .select("*")
      .eq('organization_id', orgId)
      .order("created_at", { ascending: false })
  ]);

  if (expenseRes.error) console.error("Error fetching expenses:", expenseRes.error);
  if (incomeRes.error) console.error("Error fetching income:", incomeRes.error);

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
          initialExpenses={expenseRes.data || []}
          initialIncome={incomeRes.data || []}
        />
      </div>
    </div>
  );
}
