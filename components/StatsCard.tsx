import React from 'react';
import { LucideIcon, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

export interface StatCardProps {
    label: string;
    value: string | number;
    change: string;
    changeType: 'positive' | 'negative' | 'neutral';
    icon: LucideIcon;
    iconBg: string; // Tailwind class string, e.g. "bg-emerald-50 text-emerald-500"
    unit?: string;
}

export const StatsCard: React.FC<StatCardProps> = ({ label, value, change, changeType, icon: Icon, iconBg, unit }) => {
    return (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-2xl ${iconBg} flex items-center justify-center text-xl`}>
                    <Icon className="w-6 h-6" />
                </div>
                <div className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 ${changeType === 'positive' ? 'bg-emerald-50 text-emerald-600' :
                        changeType === 'negative' ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-500'
                    }`}>
                    <span>{change}</span>
                    {changeType === 'positive' && <ArrowUpRight className="w-3 h-3" />}
                    {changeType === 'negative' && <ArrowDownRight className="w-3 h-3" />}
                    {changeType === 'neutral' && <Minus className="w-3 h-3" />}
                </div>
            </div>
            <div>
                <p className="text-xs text-slate-500 font-medium mb-1">{label}</p>
                <div className="flex items-baseline gap-1">
                    <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{value}</h3>
                    {unit && <span className="text-xs font-bold text-slate-400">{unit}</span>}
                </div>
            </div>
        </div>
    );
};
