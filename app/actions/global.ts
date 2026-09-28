"use server";

import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export async function getGlobalSummaryData(from: string, to: string) {
  const supabase = await createClient();
  const cookieStore = await cookies();
  const orgId = cookieStore.get('current_org_id')?.value;

  if (!orgId) {
    throw new Error("No organization selected");
  }

  const ledgers = [
    { table: 'publishing_ledger', copTable: null },
    { table: 'digital_prints_ledger', copTable: 'digital_prints_cop' }
  ];

  let allSales: any[] = [];
  let allCops: any[] = [];
  let allExpenses: any[] = [];
  let allIncome: any[] = [];
  let allStockLogs: any[] = [];

  // Publishing Catalogue
  const { data: catData } = await supabase.from("publishing_catalogue").select("*").eq('organization_id', orgId);
  const catalogue = (catData || []).reduce((acc: any, c: any) => ({ ...acc, [c.service_name]: { cop: c.cop_rate } }), {});

  for (const { table, copTable } of ledgers) {
    const { data: sales } = await supabase.from(table).select("*").eq('organization_id', orgId).gte('entry_date', from).lte('entry_date', to);
    if (sales) {
      allSales = [...allSales, ...sales.map(s => ({ ...s, ledger: table }))];
    }
    
    if (copTable) {
      const { data: cops } = await supabase.from(copTable).select("*").eq('organization_id', orgId).gte('entry_date', from).lte('entry_date', to);
      if (cops) {
        allCops = [...allCops, ...cops.map(c => ({ ...c, ledger: table }))];
      }
    }
  }

  // Stock logs (inventory_record)
  const { data: stockLogs } = await supabase.from("inventory_record").select("*").eq('organization_id', orgId).gte('date', from).lte('date', to);
  if (stockLogs) allStockLogs = stockLogs;

  // Expenses & Income
  const { data: expenses } = await supabase.from("company_expenses").select("*").eq('organization_id', orgId).gte('entry_date', from).lte('entry_date', to);
  if (expenses) allExpenses = expenses;

  const { data: income } = await supabase.from("company_income").select("*").eq('organization_id', orgId).gte('entry_date', from).lte('entry_date', to);
  if (income) allIncome = income;

  // Calculate inline publishing cops and append to allCops
  allSales.forEach(s => {
    if (s.ledger === 'publishing_ledger') {
      const unitCop = (catalogue[s.description] || { cop: 0 }).cop;
      if (unitCop > 0) {
        allCops.push({
          id: `pub-cop-${s.id}`,
          ledger: 'publishing_ledger',
          entry_date: s.entry_date,
          created_at: s.created_at,
          item: `${s.description} (x${s.qty})`,
          note: `Auto-calculated from Publishing`,
          amount: unitCop * (Number(s.qty) || 0)
        });
      }
    }
  });

  return {
    allSales,
    allCops,
    allExpenses,
    allIncome,
    allStockLogs
  };
}
