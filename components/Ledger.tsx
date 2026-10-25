import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import LedgerDashboard from "./LedgerDashboard";

export default async function Ledger({ tableName, title }: { tableName: string; title: string }) {
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

  // Fetch ledger entries
  const { data: entries, error: entriesError } = await supabase
    .from(tableName)
    .select("*")
    .eq('organization_id', orgId)
    .order("created_at", { ascending: false });

  if (entriesError) {
    console.error(`Error fetching ${tableName}:`, entriesError);
  }

  // Fetch COP entries
  const copTableName = tableName.replace('_ledger', '_cop');
  const { data: copEntries, error: copError } = await supabase
    .from(copTableName)
    .select("*")
    .eq('organization_id', orgId)
    .order("created_at", { ascending: false });

  if (copError) {
    console.error(`Error fetching ${copTableName}:`, copError);
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
