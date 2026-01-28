import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useQuery } from '@apollo/client';
import { GET_CONFIRMER_STATS } from '../graphql/queries/statsQueries';
import { ConfirmerStatsSkeleton } from './ConfirmerStatsSkeleton';

const CONFIRMATION_STATS_MOCK = [
    { name: 'مؤكدة', value: 78, color: '#4F46E5' },
    { name: 'ملغاة', value: 15, color: '#E11D48' },
    { name: 'مؤجلة', value: 7, color: '#D97706' },
];

const DELIVERY_STATS_MOCK = [
    { name: 'تم التسليم', value: 65, color: '#059669' },
    { name: 'قيد التوصيل', value: 20, color: '#4F46E5' },
    { name: 'مرتجع', value: 15, color: '#E11D48' },
];

export const ConfirmerStatsView: React.FC = () => {
    // ...
    const { data: statsData, loading } = useQuery(GET_CONFIRMER_STATS, {
        fetchPolicy: 'network-only' // Ensure fresh data
    });

    if (loading) return <ConfirmerStatsSkeleton />;

    const stats = statsData?.confirmerStats || {};

    // Logic & Data Processing
    // Mapping Backend Data to UI Structure

    // 1. Commission & Rules
    const commissionPrice = stats.commissionPrice || 150;

    // 2. Counts
    const deliveredCount = stats.deliveredCount || 0;
    const postponedCount = stats.postponedCount || 0;

    // 3. Rates
    const confirmationRate = stats.confirmationRate || 0;
    const deliveryRate = stats.deliveryRate || 0;

    // 4. Financials
    const totalEarnings = stats.totalEarnings ?? 0;

    // 5. Pie Charts Data & Logic
    const confirmedCountVal = stats.confirmationBreakdown?.confirmed || 0;

    // Derive Total Orders for "Out of Total" calculation
    // We try to reverse engineer from rate, or sum up if rate invalid
    let totalOrdersEstimate = 0;
    if (stats.confirmationRate > 0 && confirmedCountVal > 0) {
        totalOrdersEstimate = Math.round(confirmedCountVal / (stats.confirmationRate / 100));
    } else {
        // Fallback: Sum of available parts + maybe a buffer? 
        // Better to just sum known parts if rate is missing
        totalOrdersEstimate = (stats.confirmationBreakdown?.confirmed || 0) +
            (stats.confirmationBreakdown?.cancelled || 0) +
            (stats.confirmationBreakdown?.postponed || 0);
    }

    const calcPct = (val: number, total: number) => {
        if (!total || total === 0) return 0;
        return parseFloat(((val / total) * 100).toFixed(1));
    };

    // 1) Confirmation Charts (Base: Total Orders)
    // We use counts for the Pie to show relative distribution of these 3 statuses
    // But we display the % of TOTAL in the label
    // 1) Confirmation Charts (Base: Total Orders)
    const confirmationStatsRaw = stats.confirmationBreakdown ? [
        {
            name: 'مؤكدة',
            count: stats.confirmationBreakdown.confirmed || 0,
            value: calcPct(stats.confirmationBreakdown.confirmed || 0, totalOrdersEstimate),
            color: '#4F46E5'
        },
        {
            name: 'ملغاة',
            count: stats.confirmationBreakdown.cancelled || 0,
            value: calcPct(stats.confirmationBreakdown.cancelled || 0, totalOrdersEstimate),
            color: '#E11D48'
        },
        {
            name: 'مؤجلة',
            count: stats.confirmationBreakdown.postponed || 0,
            value: calcPct(stats.confirmationBreakdown.postponed || 0, totalOrdersEstimate),
            color: '#D97706'
        },
    ] : CONFIRMATION_STATS_MOCK;

    // Calculate 'Other' for Pie Chart visual accuracy (so 50% looks like 50%)
    const confirmationTotalPct = (confirmationStatsRaw as any[]).reduce((acc, curr) => acc + (curr.value || 0), 0);
    // Only add 'Other' if we are using real data (not mock)
    const confirmationChartData = stats.confirmationBreakdown ? [
        ...confirmationStatsRaw,
        { name: 'أخرى', value: Math.max(0, 100 - confirmationTotalPct), color: '#F1F5F9', hidden: true }
    ] : CONFIRMATION_STATS_MOCK;


    // 2) Delivery Charts (Base: Confirmed Orders)
    const deliveryStatsRaw = stats.deliveryBreakdown ? [
        {
            name: 'تم التسليم',
            count: stats.deliveryBreakdown.delivered || 0,
            value: calcPct(stats.deliveryBreakdown.delivered || 0, confirmedCountVal),
            color: '#059669'
        },
        {
            name: 'قيد التوصيل',
            count: stats.deliveryBreakdown.delivering || 0,
            value: calcPct(stats.deliveryBreakdown.delivering || 0, confirmedCountVal),
            color: '#4F46E5'
        },
        {
            name: 'مرتجع',
            count: stats.deliveryBreakdown.returned || 0,
            value: calcPct(stats.deliveryBreakdown.returned || 0, confirmedCountVal),
            color: '#E11D48'
        },
    ] : DELIVERY_STATS_MOCK;

    // Calculate 'Other' for Pie Chart visual accuracy
    const deliveryTotalPct = (deliveryStatsRaw as any[]).reduce((acc, curr) => acc + (curr.value || 0), 0);
    const deliveryChartData = stats.deliveryBreakdown ? [
        ...deliveryStatsRaw,
        { name: 'أخرى', value: Math.max(0, 100 - deliveryTotalPct), color: '#F1F5F9', hidden: true }
    ] : DELIVERY_STATS_MOCK;

    // 6. Invoices
    const invoices = stats.invoices || [];


    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-20 max-w-[1400px] mx-auto text-right">

            {/* 1. Page Header */}
            <div className="flex justify-between items-center border-b border-slate-200 pb-4">
                <div>
                    <h2 className="text-xl font-extrabold text-slate-900">ملخص الأداء والمالية</h2>
                    <p className="text-xs text-slate-500 font-bold mt-1">متابعة دقيقة لمعدلات الإنجاز والأرباح المحققة</p>
                </div>
                <div className="bg-indigo-50 text-indigo-700 px-4 py-1.5 rounded-lg border border-indigo-100 text-[10px] font-black">
                    سعر العمولة: {commissionPrice} دج
                </div>
            </div>

            {/* 2. Top Financial Cards (The Three Cards) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Card 1: Confirmation Rate */}
                <div className="bg-white border border-slate-200 p-6 rounded-lg shadow-sm flex flex-col justify-between h-36">
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">معدل التأكيد</span>
                        <div className="w-8 h-8 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center">
                            <i className="fa-solid fa-check-double text-xs"></i>
                        </div>
                    </div>
                    <div>
                        <h3 className="text-3xl font-black text-slate-900">{confirmationRate}%</h3>
                        <p className="text-[10px] font-bold text-slate-400 mt-1">نسبة الطلبات المؤكدة من الإجمالي</p>
                    </div>
                </div>

                {/* Card 2: Delivery Rate */}
                <div className="bg-white border border-slate-200 p-6 rounded-lg shadow-sm flex flex-col justify-between h-36">
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">معدل التوصيل</span>
                        <div className="w-8 h-8 rounded bg-emerald-50 text-emerald-600 flex items-center justify-center">
                            <i className="fa-solid fa-truck-fast text-xs"></i>
                        </div>
                    </div>
                    <div>
                        <h3 className="text-3xl font-black text-slate-900">{deliveryRate}%</h3>
                        <p className="text-[10px] font-bold text-slate-400 mt-1">نسبة النجاح في التسليم الفعلي</p>
                    </div>
                </div>

                {/* Card 3: Earnings (Delivered x Commission) */}
                <div className="bg-slate-900 text-white p-6 rounded-lg shadow-xl shadow-slate-200 flex flex-col justify-between h-36 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500"></div>
                    <div className="flex justify-between items-center relative z-10">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">أرباح التوصيل ({deliveredCount} طلبية)</span>
                        <i className="fa-solid fa-money-bill-trend-up text-indigo-400 opacity-60"></i>
                    </div>
                    <div className="relative z-10">
                        <h3 className="text-3xl font-black">{totalEarnings.toLocaleString()} <span className="text-sm font-normal opacity-50">دج</span></h3>
                        <p className="text-[9px] font-bold text-indigo-300 mt-1 italic">المبلغ الصافي بناءً على التسليمات</p>
                    </div>
                </div>
            </div>

            {/* 3. Performance Alerts */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {postponedCount > 0 && (
                    <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg flex items-center gap-4">
                        <div className="w-10 h-10 rounded bg-amber-500 text-white flex items-center justify-center shrink-0">
                            <i className="fa-solid fa-hourglass-start"></i>
                        </div>
                        <div>
                            <p className="text-xs font-black text-amber-900">تنبيه: {postponedCount} طلبية مؤجلة</p>
                            <p className="text-[10px] text-amber-700 font-bold">يرجى متابعة الطلبات المؤجلة لرفع نسبة التأكيد.</p>
                        </div>
                    </div>
                )}

                {confirmationRate < 80 && (
                    <div className="bg-rose-50 border border-rose-200 p-4 rounded-lg flex items-center gap-4">
                        <div className="w-10 h-10 rounded bg-rose-500 text-white flex items-center justify-center shrink-0">
                            <i className="fa-solid fa-triangle-exclamation"></i>
                        </div>
                        <div>
                            <p className="text-xs font-black text-rose-900">معدل التأكيد منخفض</p>
                            <p className="text-[10px] text-rose-700 font-bold">المعدل الحالي ({confirmationRate}%) تحت الحد المطلوب.</p>
                        </div>
                    </div>
                )}

                {deliveryRate < 65 && (
                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg flex items-center gap-4">
                        <div className="w-10 h-10 rounded bg-slate-400 text-white flex items-center justify-center shrink-0">
                            <i className="fa-solid fa-chart-line-down"></i>
                        </div>
                        <div>
                            <p className="text-xs font-black text-slate-900">انخفاض في جودة التوصيل</p>
                            <p className="text-[10px] text-slate-500 font-bold">يؤثر هذا الانخفاض مباشرة على عمولاتك المالية.</p>
                        </div>
                    </div>
                )}
            </div>

            {/* 4. Status Breakdown (Pie Charts) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white border border-slate-200 p-6 rounded-lg shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                        <h4 className="text-sm font-black text-slate-800">تحليل الحالات (التأكيد)</h4>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">نتائج الاتصال</span>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                        <div className="flex-1 space-y-2 w-full">
                            {confirmationStatsRaw.map(s => (
                                <div key={s.name} className="flex items-center justify-between bg-slate-50 px-3 py-1.5 rounded border border-slate-100">
                                    <div className="flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.color }}></span>
                                        <span className="text-[10px] font-black text-slate-600">{s.name}</span>
                                    </div>
                                    <span className="text-[11px] font-black" style={{ color: s.color }}>{s.value}%</span>
                                </div>
                            ))}
                        </div>
                        <div className="w-36 h-36 shrink-0 relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={confirmationChartData} innerRadius={45} outerRadius={65} paddingAngle={2} dataKey="value">
                                        {confirmationChartData.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <span className="text-lg font-black text-slate-800">{confirmationRate}%</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white border border-slate-200 p-6 rounded-lg shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                        <h4 className="text-sm font-black text-slate-800">حالات التتبع في الميدان</h4>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">معدل التسليم</span>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                        <div className="flex-1 space-y-2 w-full">
                            {deliveryStatsRaw.map(s => (
                                <div key={s.name} className="flex items-center justify-between bg-slate-50 px-3 py-1.5 rounded border border-slate-100">
                                    <div className="flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.color }}></span>
                                        <span className="text-[10px] font-black text-slate-600">{s.name}</span>
                                    </div>
                                    <span className="text-[11px] font-black" style={{ color: s.color }}>{s.value}%</span>
                                </div>
                            ))}
                        </div>
                        <div className="w-36 h-36 shrink-0 relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={deliveryChartData} innerRadius={45} outerRadius={65} paddingAngle={2} dataKey="value">
                                        {deliveryChartData.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <span className="text-lg font-black text-emerald-600">{deliveryRate}%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 5. Payments History */}
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                    <h4 className="text-sm font-black text-slate-800">تاريخ تسوية الفواتير</h4>
                    <div className="flex items-center gap-2">
                        <span className="text-[9px] font-bold text-slate-400">الإجمالي المسدد: {invoices.reduce((acc: number, curr: any) => acc + (curr.total || 0), 0).toLocaleString()} دج</span>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-right">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="py-3 px-6 text-[9px] font-black text-slate-400 uppercase tracking-widest">المعرف</th>
                                <th className="py-3 px-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">التاريخ</th>
                                <th className="py-3 px-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">المبلغ</th>
                                <th className="py-3 px-6 text-[9px] font-black text-slate-400 uppercase tracking-widest text-left">ملاحظة</th>
                                <th className="py-3 px-6 text-[9px] font-black text-slate-400 uppercase tracking-widest text-left">الحالة</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {invoices.length > 0 ? invoices.map((inv: any) => (
                                <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="py-3.5 px-6">
                                        <span className="text-[11px] font-black text-indigo-600 tracking-tight">#{inv.id.substring(inv.id.length - 6).toUpperCase()}</span>
                                    </td>
                                    <td className="py-3.5 px-4 text-center">
                                        <span className="text-[10px] font-bold text-slate-500">
                                            {inv.date ? new Date(inv.date).toLocaleDateString('ar-DZ') : '-'}
                                        </span>
                                    </td>
                                    <td className="py-3.5 px-4 text-center">
                                        <span className="text-[11px] font-black text-slate-900">{inv.total?.toLocaleString()} دج</span>
                                    </td>
                                    <td className="py-3.5 px-6 text-left">
                                        <span className="text-[10px] font-bold text-slate-400 truncate max-w-[150px] block" title={inv.note}>
                                            {inv.note || '-'}
                                        </span>
                                    </td>
                                    <td className="py-3.5 px-6 text-left">
                                        <span className="px-2 py-0.5 rounded text-[9px] font-black border bg-emerald-50 text-emerald-600 border-emerald-100">
                                            مدفوعة
                                        </span>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={5} className="py-8 text-center text-[10px] font-bold text-slate-400">لا توجد فواتير سابقة</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
};
