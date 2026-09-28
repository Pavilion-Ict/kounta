import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

type StatCardProps = {
  label: string;
  value: string;
  delta?: number | null;
  deltaLabel?: string;
};

export function StatCard({ label, value, delta = null, deltaLabel = "vs last week" }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-gray-900 tabular-nums">
        {value}
      </p>
      <div className="mt-2 flex items-center gap-1.5 text-xs">
        {delta === null || delta === 0 ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 font-medium text-gray-600">
            <Minus className="h-3 w-3" /> No change
          </span>
        ) : delta > 0 ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700">
            <ArrowUpRight className="h-3 w-3" /> +{delta.toFixed(1)}%
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 font-medium text-rose-700">
            <ArrowDownRight className="h-3 w-3" /> {delta.toFixed(1)}%
          </span>
        )}
        <span className="text-gray-400">{deltaLabel}</span>
      </div>
    </div>
  );
}
