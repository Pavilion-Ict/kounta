import { redirect } from "next/navigation";
import GlobalExportButton from "@/components/GlobalExportButton";
import DashboardChart from "@/components/DashboardChart";

import { supabase } from "@/lib/supabase";

export const dynamic = 'force-dynamic';

async function getWeeklySummary() {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const startOfWeek = new Date(now.setHours(0,0,0,0));
  startOfWeek.setDate(diff);
  const startStr = startOfWeek.toISOString().split('T')[0];

  const startOfPrevWeek = new Date(startOfWeek);
  startOfPrevWeek.setDate(startOfPrevWeek.getDate() - 7);
  const startPrevStr = startOfPrevWeek.toISOString().split('T')[0];

  const endOfPrevWeek = new Date(startOfWeek);
  endOfPrevWeek.setDate(endOfPrevWeek.getDate() - 1);
  const endPrevStr = endOfPrevWeek.toISOString().split('T')[0];

  const ledgers = [
    { table: 'publishing_ledger', copTable: null },
    { table: 'digital_prints_ledger', copTable: 'digital_prints_cop' }
  ];

  let totalRev = 0; let totalCop = 0; let totalExp = 0; let totalInc = 0;
  let prevRev = 0; let prevCop = 0; let prevExp = 0; let prevInc = 0;

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const chartData = days.map(d => ({ name: d, Revenue: 0, Expenses: 0 }));
  const getDayIndex = (dateStr: string) => {
    const d = new Date(dateStr);
    const dayIndex = d.getDay();
    return dayIndex === 0 ? 6 : dayIndex - 1;
  };

  const { data: catData } = await supabase.from("publishing_catalogue").select("*");
  const catMap = (catData || []).reduce((acc: any, c: any) => ({ ...acc, [c.service_name]: c.cop_rate }), {});

  for (const { table, copTable } of ledgers) {
    const { data: sales } = await supabase.from(table).select("*").gte('entry_date', startPrevStr).order('entry_date');
    const { data: salesNull } = await supabase.from(table).select("*").is('entry_date', null).gte('created_at', startPrevStr);
    const allSales = [...(sales || []), ...(salesNull || [])];

    allSales.forEach(s => {
      const dStr = s.entry_date || s.created_at.split('T')[0];
      let rev = 0;
      let cop = 0;
      let exp = Number(s.expenses || 0);

      if (table === 'publishing_ledger') {
        rev = Number(s.price || 0);
        cop = (catMap[s.description] || 0) * (Number(s.qty) || 0);
      } else if (table === 'digital_prints_ledger') {
        rev = Number(s.price || 0);
      } else {
        rev = (Number(s.qty || 1) * Number(s.price || 0));
      }

      if (dStr >= startStr) {
        totalRev += rev; totalCop += cop; totalExp += exp;
        const idx = getDayIndex(dStr);
        if (idx >= 0 && idx < 7) {
          chartData[idx].Revenue += rev;
          chartData[idx].Expenses += exp;
        }
      } else if (dStr >= startPrevStr && dStr <= endPrevStr) {
        prevRev += rev; prevCop += cop; prevExp += exp;
      }
    });

    if (copTable) {
      const { data: cops } = await supabase.from(copTable).select("*").gte('entry_date', startPrevStr);
      const { data: copsNull } = await supabase.from(copTable).select("*").is('entry_date', null).gte('created_at', startPrevStr);
      
      [...(cops || []), ...(copsNull || [])].forEach(c => {
        const dStr = c.entry_date || c.created_at.split('T')[0];
        const amt = Number(c.amount || 0);
        if (dStr >= startStr) totalCop += amt;
        else if (dStr >= startPrevStr && dStr <= endPrevStr) prevCop += amt;
      });
    }
  }

  const { data: globalExpData } = await supabase.from('company_expenses').select("*").gte('entry_date', startPrevStr);
  const { data: globalExpNull } = await supabase.from('company_expenses').select("*").is('entry_date', null).gte('created_at', startPrevStr);
  [...(globalExpData || []), ...(globalExpNull || [])].forEach(e => {
    const dStr = e.entry_date || e.created_at.split('T')[0];
    const amt = Number(e.amount || 0);
    if (dStr >= startStr) {
      totalExp += amt;
      const idx = getDayIndex(dStr);
      if (idx >= 0 && idx < 7) chartData[idx].Expenses += amt;
    }
    else if (dStr >= startPrevStr && dStr <= endPrevStr) prevExp += amt;
  });

  const { data: globalIncData } = await supabase.from('company_income').select("*").gte('entry_date', startPrevStr);
  const { data: globalIncNull } = await supabase.from('company_income').select("*").is('entry_date', null).gte('created_at', startPrevStr);
  [...(globalIncData || []), ...(globalIncNull || [])].forEach(e => {
    const dStr = e.entry_date || e.created_at.split('T')[0];
    const amt = Number(e.amount || 0);
    if (dStr >= startStr) {
      totalInc += amt;
      const idx = getDayIndex(dStr);
      if (idx >= 0 && idx < 7) chartData[idx].Revenue += amt;
    }
    else if (dStr >= startPrevStr && dStr <= endPrevStr) prevInc += amt;
  });

  return { totalRev, totalCop, totalExp, totalInc, prevRev, prevCop, prevExp, prevInc, startStr, chartData };
}

export default async function AdminPage() {


  const summary = await getWeeklySummary();
  const netProfit = summary.totalRev - summary.totalCop - summary.totalExp + summary.totalInc;
  const grossProfit = summary.totalRev + summary.totalInc - summary.totalCop;

  const prevNetProfit = summary.prevRev - summary.prevCop - summary.prevExp + summary.prevInc;
  const prevGrossProfit = summary.prevRev + summary.prevInc - summary.prevCop;
0
  const getDelta = (curr: number, prev: number) => {
    if (prev === 0) return curr > 0 ? { val: 100, up: true, diff: curr } : { val: 0, up: true, diff: 0 };
    const pct = ((curr - prev) / Math.abs(prev)) * 100;
    return { val: Math.abs(pct), up: pct >= 0, diff: curr - prev };
  };

  const renderTrend = (curr: number, prev: number, invertColors = false) => {
    const delta = getDelta(curr, prev);
    if (delta.diff === 0) return <span className="text-gray-400 text-xs font-medium">— No change from last week</span>;
    const isPositive = delta.up;
    const colorClass = isPositive 
      ? (invertColors ? "text-red-500" : "text-green-500") 
      : (invertColors ? "text-green-500" : "text-red-500");
    const arrow = isPositive ? "↑" : "↓";
    return (
      <span className="text-gray-500 text-xs font-medium flex items-center gap-1 mt-2">
        <span className={`${colorClass} font-bold bg-${colorClass.split('-')[1]}-50 px-1 rounded`}>
          {arrow} {delta.val.toFixed(1)}%
        </span> 
        vs last week
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 sm:p-8 font-sans">
      <div className="max-w-5xl mx-auto">
        {/* <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-6 p-6 sm:p-8 rounded-2xl ">

        </div> */}

        {/* Weekly Summary */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 px-1">This Week's Overview <span className="text-sm font-normal text-gray-500 ml-2">(Since {new Date(summary.startStr).toLocaleDateString()})</span></h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-white border-l-4 border-primary p-5 rounded-2xl shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-gray-600 font-extrabold text-[13px] tracking-wider uppercase mb-1">Total Revenue</h3>
                <p className="text-2xl font-bold text-gray-900">₦{summary.totalRev.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
              </div>
              {renderTrend(summary.totalRev, summary.prevRev)}
            </div>
            <div className="bg-white border-l-4 border-amber-500 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-gray-600 font-extrabold text-[13px] tracking-wider uppercase mb-1">Total COP</h3>
                <p className="text-2xl font-bold text-amber-700">₦{summary.totalCop.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
              </div>
              {renderTrend(summary.totalCop, summary.prevCop, true)}
            </div>
            <div className="bg-white border-l-4 border-orange-400 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-gray-600 font-extrabold text-[13px] tracking-wider uppercase mb-1">Total Expenses</h3>
                <p className="text-2xl font-bold text-orange-500">₦{summary.totalExp.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
              </div>
              {renderTrend(summary.totalExp, summary.prevExp, true)}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={`bg-white border-l-4 ${grossProfit >= 0 ? 'border-green-500' : 'border-red-500'} p-5 rounded-2xl shadow-sm flex flex-col justify-between`}>
              <div>
                <h3 className="text-gray-600 font-extrabold text-[13px] tracking-wider uppercase mb-1">Gross Profit</h3>
                <p className={`text-3xl font-bold ${grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ₦{grossProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
              {renderTrend(grossProfit, prevGrossProfit)}
            </div>
            <div className={`bg-white border-l-4 ${netProfit >= 0 ? 'border-green-500' : 'border-red-500'} p-5 rounded-2xl shadow-sm flex flex-col justify-between`}>
              <div>
                <h3 className="text-gray-600 font-extrabold text-[13px] tracking-wider uppercase mb-1">Net Profit</h3>
                <p className={`text-3xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ₦{netProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
              {renderTrend(netProfit, prevNetProfit)}
            </div>
          </div>
        </div>
        <GlobalExportButton />

        <div className="mb-6 h-[400px]">
          <DashboardChart data={summary.chartData} />
        </div>

      </div>
    </div>
  );
}