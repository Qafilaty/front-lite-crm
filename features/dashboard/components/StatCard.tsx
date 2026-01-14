import React from 'react';
import { LucideIcon } from 'lucide-react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
  trend?: { val: string; up: boolean };
  unit?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ 
  label, 
  value, 
  icon: Icon, 
  color, 
  trend, 
  unit 
}) => (
  <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col gap-4 transition-all hover:shadow-md group">
    <div className="flex items-center justify-between">
      <div className={`p-3 rounded-2xl ${color} shadow-sm group-hover:scale-110 transition-transform`}>
        <Icon className="w-5 h-5" />
      </div>
      {trend && (
        <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black ${trend.up ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
          {trend.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {trend.val}
        </div>
      )}
    </div>
    <div>
      <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{label}</p>
      <h3 className="text-2xl font-black text-slate-800 mt-1 tracking-tighter">
        {value}
        {unit && <span className="text-xs mr-1 opacity-50">{unit}</span>}
      </h3>
    </div>
  </div>
);
