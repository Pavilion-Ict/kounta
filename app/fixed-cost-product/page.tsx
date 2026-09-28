import FixedCostProductDashboard from "@/components/FixedCostProductDashboard";
import { createClient } from "@/utils/supabase/server";
import { getCatalogue, getStockLogs } from "@/app/actions/fixed-cost-product";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function FixedCostProductPage() {
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

  // Fetch ledger entries for the current organization
  const { data: entries, error: entriesError } = await supabase
    .from("publishing_ledger")
    .select("*")
    .eq('organization_id', orgId)
    .order("created_at", { ascending: false });

  if (entriesError) {
    console.error("Error fetching publishing ledger:", entriesError);
  }

  // Fetch catalogue and stock logs using the new server actions
  const [catalogueItems, stockLogs] = await Promise.all([
    getCatalogue(orgId),
    getStockLogs(orgId)
  ]);

  // Convert catalogue list to map
  const catalogueMap = catalogueItems.reduce((acc, item) => {
    acc[item.service_name] = { cop: item.cop_rate };
    return acc;
  }, {} as Record<string, { cop: number }>);
  
  // If catalogue is empty (first run before migration), provide defaults
  const finalCatalogue = Object.keys(catalogueMap).length > 0 ? catalogueMap : {
    "Printing":         { cop: 380 },
    "Soft Binding":     { cop: 150 },
    "Hard Binding":     { cop: 429 },
    "Binding - Stitch": { cop: 250 },
    "Embossing":        { cop: 120 },
    "Lamination":       { cop: 90  },
    "Editing":          { cop: 500 },
    "Pantry":           { cop: 200 },
    "Scanning":         { cop: 60  },
    "Photocopying":     { cop: 10  },
    "Custom":           { cop: 0   }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
        </div>
      </header>
      
      <main className="py-8">
        <FixedCostProductDashboard 
          initialRows={entries || []} 
          initialCatalogue={finalCatalogue} 
          initialStockLogs={stockLogs || []} 
        />
      </main>
    </div>
  );
}
