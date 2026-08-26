"use client";

import React from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';

interface ChartDataPoint {
  name: string;
  Revenue: number;
  Expenses: number;
}

interface DashboardChartProps {
  data: ChartDataPoint[];
}

export default function DashboardChart({ data }: DashboardChartProps) {
  const formatYAxis = (tickItem: number) => {
    if (tickItem === 0) return '0';
    if (tickItem >= 1000000) return `₦${(tickItem / 1000000).toFixed(1)}M`;
    if (tickItem >= 1000) return `₦${(tickItem / 1000).toFixed(0)}k`;
    return `₦${tickItem}`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-md border border-gray-100">
          <p className="font-bold text-gray-800 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm flex justify-between gap-4">
              <span style={{ color: entry.color }} className="font-semibold">{entry.name}:</span>
              <span className="font-bold text-gray-900">₦{entry.value.toLocaleString()}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (!data || data.length === 0) {
    return (
      <div className="h-full min-h-[300px] flex items-center justify-center bg-gray-50 rounded-2xl border border-gray-100">
        <p className="text-gray-400 font-medium">No data available for chart</p>
      </div>
    );
  }

  return (
    <div className="h-full min-h-[300px] w-full bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100">
      <h3 className="text-gray-800 font-bold mb-6">Revenue vs Expenses (This Week)</h3>
      <div className="h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: '#6b7280' }} 
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: '#6b7280' }}
              tickFormatter={formatYAxis}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '13px' }} />
            <Line type="monotone" dataKey="Revenue" stroke="#1e293b" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            <Line type="monotone" dataKey="Expenses" stroke="#f97316" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
