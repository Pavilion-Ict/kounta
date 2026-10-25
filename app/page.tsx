import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import DashboardView from "@/components/dashboard/DashboardView";
import type { DashboardData } from "@/components/dashboard/DashboardView";

export const dynamic = "force-dynamic";

async function getDashboardData(user: any, orgId: string): Promise<DashboardData> {
  const supabase = await createClient();

  // Date ranges
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const startOfWeek = new Date(now.setHours(0, 0, 0, 0));
  startOfWeek.setDate(diff);
  const startStr = startOfWeek.toISOString().split("T")[0];

  const startOfPrevWeek = new Date(startOfWeek);
  startOfPrevWeek.setDate(startOfPrevWeek.getDate() - 7);
  const startPrevStr = startOfPrevWeek.toISOString().split("T")[0];

  const endOfPrevWeek = new Date(startOfWeek);
  endOfPrevWeek.setDate(endOfPrevWeek.getDate() - 1);
  const endPrevStr = endOfPrevWeek.toISOString().split("T")[0];

  // Fire ALL queries in parallel
  const [
    catRes,
    pubSalesRes,
    pubSalesNullRes,
    digSalesRes,
    digSalesNullRes,
    digCopRes,
    digCopNullRes,
    expRes,
    expNullRes,
    incRes,
    incNullRes,
  ] = await Promise.all([
    supabase
      .from("publishing_catalogue")
      .select("*")
      .eq("organization_id", orgId),
    supabase
      .from("publishing_ledger")
      .select("*")
      .eq("organization_id", orgId)
      .gte("entry_date", startPrevStr),
    supabase
      .from("publishing_ledger")
      .select("*")
      .eq("organization_id", orgId)
      .is("entry_date", null)
      .gte("created_at", startPrevStr),
    supabase
      .from("digital_prints_ledger")
      .select("*")
      .eq("organization_id", orgId)
      .gte("entry_date", startPrevStr),
    supabase
      .from("digital_prints_ledger")
      .select("*")
      .eq("organization_id", orgId)
      .is("entry_date", null)
      .gte("created_at", startPrevStr),
    supabase
      .from("digital_prints_cop")
      .select("*")
      .eq("organization_id", orgId)
      .gte("entry_date", startPrevStr),
    supabase
      .from("digital_prints_cop")
      .select("*")
      .eq("organization_id", orgId)
      .is("entry_date", null)
      .gte("created_at", startPrevStr),
    supabase
      .from("company_expenses")
      .select("*")
      .eq("organization_id", orgId)
      .gte("entry_date", startPrevStr),
    supabase
      .from("company_expenses")
      .select("*")
      .eq("organization_id", orgId)
      .is("entry_date", null)
      .gte("created_at", startPrevStr),
    supabase
      .from("company_income")
      .select("*")
      .eq("organization_id", orgId)
      .gte("entry_date", startPrevStr),
    supabase
      .from("company_income")
      .select("*")
      .eq("organization_id", orgId)
      .is("entry_date", null)
      .gte("created_at", startPrevStr),
  ]);

  const catMap = (catRes.data || []).reduce(
    (acc: any, c: any) => ({ ...acc, [c.service_name]: c.cop_rate }),
    {}
  );

  let totalRev = 0,
    totalCop = 0,
    totalExp = 0,
    totalInc = 0;
  let prevRev = 0,
    prevCop = 0,
    prevExp = 0,
    prevInc = 0;

  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const chartData = days.map((d) => ({ name: d, Revenue: 0, Expenses: 0 }));

  const getDayIndex = (dateStr: string) => {
    const d = new Date(dateStr);
    const dayIndex = d.getDay();
    return dayIndex === 0 ? 6 : dayIndex - 1;
  };

  // Collect recent records for the activity feed
  const recentRecords: DashboardData["recentRecords"] = [];
  // Collect expense categories
  const expCategoryMap: Record<string, number> = {};

  // Process Publishing Ledger
  [...(pubSalesRes.data || []), ...(pubSalesNullRes.data || [])].forEach(
    (s) => {
      const dStr = s.entry_date || s.created_at.split("T")[0];
      const rev = Number(s.price || 0);
      const cop = (catMap[s.description] || 0) * (Number(s.qty) || 0);
      const exp = Number(s.expenses || 0);

      if (dStr >= startStr) {
        totalRev += rev;
        totalCop += cop;
        totalExp += exp;
        const idx = getDayIndex(dStr);
        if (idx >= 0 && idx < 7) {
          chartData[idx].Revenue += rev;
          chartData[idx].Expenses += exp;
        }
        if (rev > 0) {
          recentRecords.push({
            id: s.id,
            description: s.description || "Publishing sale",
            date: dStr,
            amount: rev,
            type: "income",
          });
        }
      } else if (dStr >= startPrevStr && dStr <= endPrevStr) {
        prevRev += rev;
        prevCop += cop;
        prevExp += exp;
      }
    }
  );

  // Process Digital Prints Ledger
  [...(digSalesRes.data || []), ...(digSalesNullRes.data || [])].forEach(
    (s) => {
      const dStr = s.entry_date || s.created_at.split("T")[0];
      const rev = Number(s.price || 0);
      const exp = Number(s.expenses || 0);

      if (dStr >= startStr) {
        totalRev += rev;
        totalExp += exp;
        const idx = getDayIndex(dStr);
        if (idx >= 0 && idx < 7) {
          chartData[idx].Revenue += rev;
          chartData[idx].Expenses += exp;
        }
        if (rev > 0) {
          recentRecords.push({
            id: s.id,
            description: s.description || "Digital print sale",
            date: dStr,
            amount: rev,
            type: "income",
          });
        }
      } else if (dStr >= startPrevStr && dStr <= endPrevStr) {
        prevRev += rev;
        prevExp += exp;
      }
    }
  );

  // Process Digital Prints COP
  [...(digCopRes.data || []), ...(digCopNullRes.data || [])].forEach((c) => {
    const dStr = c.entry_date || c.created_at.split("T")[0];
    const amt = Number(c.amount || 0);
    if (dStr >= startStr) totalCop += amt;
    else if (dStr >= startPrevStr && dStr <= endPrevStr) prevCop += amt;
  });

  // Process Company Expenses
  [...(expRes.data || []), ...(expNullRes.data || [])].forEach((e) => {
    const dStr = e.entry_date || e.created_at.split("T")[0];
    const amt = Number(e.amount || 0);
    if (dStr >= startStr) {
      totalExp += amt;
      const idx = getDayIndex(dStr);
      if (idx >= 0 && idx < 7) chartData[idx].Expenses += amt;
      // Track category
      const cat = e.category || e.description || "Other";
      expCategoryMap[cat] = (expCategoryMap[cat] || 0) + amt;
      recentRecords.push({
        id: e.id,
        description: e.description || "Expense",
        date: dStr,
        amount: amt,
        type: "expense",
      });
    } else if (dStr >= startPrevStr && dStr <= endPrevStr) prevExp += amt;
  });

  // Process Company Income
  [...(incRes.data || []), ...(incNullRes.data || [])].forEach((e) => {
    const dStr = e.entry_date || e.created_at.split("T")[0];
    const amt = Number(e.amount || 0);
    if (dStr >= startStr) {
      totalInc += amt;
      const idx = getDayIndex(dStr);
      if (idx >= 0 && idx < 7) chartData[idx].Revenue += amt;
      recentRecords.push({
        id: e.id,
        description: e.description || "Income",
        date: dStr,
        amount: amt,
        type: "income",
      });
    } else if (dStr >= startPrevStr && dStr <= endPrevStr) prevInc += amt;
  });

  // Sort recent records by date descending, take top 8
  recentRecords.sort((a, b) => b.date.localeCompare(a.date));
  const topRecords = recentRecords.slice(0, 8);

  // Build expense categories, sorted desc, top 5
  const expenseCategories = Object.entries(expCategoryMap)
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  return {
    totalRev,
    totalCop,
    totalExp,
    totalInc,
    prevRev,
    prevCop,
    prevExp,
    prevInc,
    startStr,
    chartData,
    recentRecords: topRecords,
    expenseCategories,
  };
}

export default async function AdminPage() {
  const supabase = await createClient();
  const cookieStore = await cookies();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  let orgId = cookieStore.get("current_org_id")?.value;
  if (!orgId) {
    const { data: membership } = await supabase
      .from("memberships")
      .select("organization_id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .limit(1)
      .single();
    if (!membership) redirect('/onboarding');
    orgId = membership.organization_id;
  }
  if (!orgId) redirect('/onboarding');

  const data = await getDashboardData(user, orgId);

  return <DashboardView data={data} />;
}