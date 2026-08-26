"use server";

import { supabase } from "@/lib/supabase";


export async function getGlobalSummaryData(from: string, to: string) {


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
  const { data: catData } = await supabase.from("publishing_catalogue").select("*");
  const catalogue = (catData || []).reduce((acc: any, c: any) => ({ ...acc, [c.service_name]: { cop: c.cop_rate } }), {});

  for (const { table, copTable } of ledgers) {
    const { data: sales } = await supabase.from(table).select("*").gte('entry_date', from).lte('entry_date', to);
    if (sales) {
      allSales = [...allSales, ...sales.map(s => ({ ...s, ledger: table }))];
    }
    
    if (copTable) {
      const { data: cops } = await supabase.from(copTable).select("*").gte('entry_date', from).lte('entry_date', to);
      if (cops) {
        allCops = [...allCops, ...cops.map(c => ({ ...c, ledger: table }))];
      }
    }
  }

  // Stock logs (publishing)
  const { data: stockLogs } = await supabase.from("publishing_stock").select("*").gte('date', from).lte('date', to);
  if (stockLogs) allStockLogs = stockLogs;

  // Expenses & Income
  const { data: expenses } = await supabase.from("company_expenses").select("*").gte('entry_date', from).lte('entry_date', to);
  if (expenses) allExpenses = expenses;

  const { data: income } = await supabase.from("company_income").select("*").gte('entry_date', from).lte('entry_date', to);
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
