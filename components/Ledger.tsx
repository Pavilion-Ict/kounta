import { supabase } from "@/lib/supabase";
import LedgerDashboard from "./LedgerDashboard";

export default async function Ledger({ tableName, title }: { tableName: string; title: string }) {
  // Fetch ledger entries
  const { data: entries, error: entriesError } = await supabase
    .from(tableName)
    .select("*")
    .order("created_at", { ascending: false });

  if (entriesError) {
    console.error("Error fetching ledger:", entriesError);
  }

  // Fetch COP entries
  const copTableName = tableName.replace('_ledger', '_cop');
  const { data: copEntries, error: copError } = await supabase
    .from(copTableName)
    .select("*")
    .order("created_at", { ascending: false });

  if (copError) {
    console.error("Error fetching COP:", copError);
  }

  return (
    <LedgerDashboard 
      tableName={tableName} 
      title={title} 
      initialEntries={entries || []} 
      initialCopEntries={copEntries || []} 
    />
  );
}
