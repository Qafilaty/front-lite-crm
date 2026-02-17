import React, { useState } from 'react';
import { User } from '../types';
import {
    Package,
    PieChart as PieIcon,
    MapPin, Trophy, UserCheck, ShoppingBag,
    ChevronDown, Activity, Filter, Loader2
} from 'lucide-react';
import {
    Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { GET_ORDER_STATS } from '../graphql/queries/statsQueries';
import { GET_ALL_PRODUCTS } from '../graphql/queries/productQueries';
import { useQuery, useLazyQuery } from '@apollo/client';
import { ModernSelect, StatsSkeleton, OrderStatsSkeleton } from './common';
import { GET_ALL_USERS } from '../graphql/queries';
import { ConfirmerStatsView } from './ConfirmerStatsView';

interface OrderStatsViewProps {
    currentUser: User;
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#475569'];

const OrderStatsView: React.FC<OrderStatsViewProps> = ({ currentUser }) => {

    if (["confirmed", "confirmation"].includes(currentUser?.role)) {
        return <ConfirmerStatsView />;
    }

    const [period, setPeriod] = useState<'all' | 'month' | 'year' | 'week'>('all');
    const [type, setType] = useState<'orders' | 'abandoned'>('orders');

    // Auth logic for initial states
    const isRestricted = !['owner', 'admin'].includes(currentUser.role);
    const initialEmployee = isRestricted ? currentUser.id : '';

    const [idEmployee, setIdEmployee] = useState<string>(initialEmployee);
    const [idProduct, setIdProduct] = useState<string>('');

    // Fetch Stats
    const { data, loading, error } = useQuery(GET_ORDER_STATS, {
        variables: {
            period,
            idEmployee: idEmployee || null,
            idProduct: idProduct || null,
            type
        },
        fetchPolicy: 'cache-and-network'
    });

    // Fetch Products for Filter (Lazy)
    const [getProducts, { data: productsData, loading: productsLoading }] = useLazyQuery(GET_ALL_PRODUCTS, {
        variables: {
            pagination: { page: 1, limit: 100 } // Limit to 100 for dropdown efficiency
        },
        fetchPolicy: 'cache-first'
    });

    const stats = data?.orderStats || {
        kpis: { total: 0, confirmedCount: 0, confirmationRate: 0, shippedCount: 0, deliveredCount: 0, deliveryRate: 0, returnedCount: 0, returnRate: 0 },
        topPerformers: { bestStates: [], bestConfirmers: [], bestProducts: [] },
        confirmationDistribution: [],
        logisticsDistribution: []
    };

    // Lazy load users for filter
    const [getUsers, { data: usersData, loading: usersLoading }] = useLazyQuery(GET_ALL_USERS);
    const allUsers = usersData?.allUser || [];

    const confirmersList = allUsers.filter((u: any) => ['confirmed_orders', 'admin', 'confirmed'].includes(u.role));
    const productsList = productsData?.allProduct?.data || [];


    if (loading && !data) {
        return <OrderStatsSkeleton />;
    }

    if (error) {
        return (
            <div className="w-full p-8 text-center bg-red-50 rounded-2xl text-red-600 font-bold">
                حدث خطأ أثناء جلب الإحصائيات. يرجى المحاولة مرة أخرى.
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-20 no-scrollbar">

            {/* Header & Controls */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-600/20">
                        <Activity className="w-7 h-7" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                            مركز التحليلات
                        </h2>
                        <p className="text-slate-400 text-[10px] font-bold uppercase mt-1 tracking-widest">إحصائيات مباشرة دقيقة</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">

                    {/* Type Buttons */}
                    <div className="bg-white p-1 rounded-xl border border-slate-200 shadow-sm flex order-2 xl:order-1 flex-1 xl:flex-none">
                        {[
                            { id: 'orders', label: 'الطلبات' },
                            { id: 'abandoned', label: 'المتروكة' }
                        ].map((t) => (
                            <button
                                key={t.id}
                                onClick={() => setType(t.id as any)}
                                className={`flex-1 xl:flex-none px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${type === t.id ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-indigo-600'}`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>

                    {/* Period Buttons */}
                    <div className="bg-white p-1 rounded-xl border border-slate-200 shadow-sm flex order-2 xl:order-1 flex-1 xl:flex-none">
                        {[
                            { id: 'all', label: 'الكل' },
                            { id: 'week', label: 'الأسبوع' },
                            { id: 'month', label: 'الشهر' },
                            { id: 'year', label: 'السنة' },
                        ].map((p) => (
                            <button
                                key={p.id}
                                onClick={() => setPeriod(p.id as any)}
                                className={`flex-1 xl:flex-none px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${period === p.id ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-indigo-600'}`}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>

                    {/* Filters */}
                    <div className="flex gap-3 order-1 xl:order-2 w-full xl:w-auto">
                        {/* Employee Filter */}
                        {!isRestricted && (
                            <div className="relative flex-1 xl:w-48">
                                <ModernSelect
                                    value={idEmployee}
                                    onChange={setIdEmployee}
                                    options={[
                                        { value: "", label: "كل الفريق" },
                                        ...confirmersList.map(u => ({ value: u.id, label: u.name }))
                                    ]}
                                    placeholder="كل الفريق"
                                    onOpen={() => getUsers()}
                                    isLoading={usersLoading}
                                />
                            </div>
                        )}

                        {/* Product Filter */}
                        <div className="relative flex-1 xl:w-48">
                            <ModernSelect
                                value={idProduct}
                                onChange={setIdProduct}
                                options={[
                                    { value: "", label: "كل المنتجات" },
                                    ...productsList.map((p: any) => ({ value: p.id, label: p.name }))
                                ]}
                                placeholder="كل المنتجات"
                                onOpen={() => getProducts()}
                                isLoading={productsLoading}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* KPIs Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Confirmation Rate */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center text-center relative overflow-hidden group">
                    <div className="w-28 h-28 relative mb-2">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={[{ v: stats.kpis.confirmationRate }, { v: 100 - stats.kpis.confirmationRate }]} innerRadius={40} outerRadius={50} paddingAngle={0} dataKey="v" startAngle={90} endAngle={450}>
                                    <Cell fill="#6366f1" stroke="none" />
                                    <Cell fill="#f1f5f9" stroke="none" />
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-xl font-black text-slate-800 font-mono leading-none">{stats.kpis.confirmationRate}%</span>
                        </div>
                    </div>
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">تأكيد</h4>
                    <span className="text-[9px] font-bold text-slate-400 mt-1 bg-slate-50 px-2 py-0.5 rounded-lg">{stats.kpis.confirmedCount} طلب</span>
                </div>

                {/* Delivery Rate */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center text-center relative overflow-hidden group">
                    <div className="w-28 h-28 relative mb-2">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={[{ v: stats.kpis.deliveryRate }, { v: 100 - stats.kpis.deliveryRate }]} innerRadius={40} outerRadius={50} paddingAngle={0} dataKey="v" startAngle={90} endAngle={450}>
                                    <Cell fill="#10b981" stroke="none" />
                                    <Cell fill="#f1f5f9" stroke="none" />
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-xl font-black text-slate-800 font-mono leading-none">{stats.kpis.deliveryRate}%</span>
                        </div>
                    </div>
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">توصيل</h4>
                    <span className="text-[9px] font-bold text-slate-400 mt-1 bg-slate-50 px-2 py-0.5 rounded-lg">{stats.kpis.deliveredCount} / {stats.kpis.shippedCount}</span>
                </div>

                {/* Return Rate */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center text-center relative overflow-hidden group">
                    <div className="w-28 h-28 relative mb-2">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={[{ v: stats.kpis.returnRate }, { v: 100 - stats.kpis.returnRate }]} innerRadius={40} outerRadius={50} paddingAngle={0} dataKey="v" startAngle={90} endAngle={450}>
                                    <Cell fill="#ef4444" stroke="none" />
                                    <Cell fill="#f1f5f9" stroke="none" />
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-xl font-black text-slate-800 font-mono leading-none">{stats.kpis.returnRate}%</span>
                        </div>
                    </div>
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">استرجاع</h4>
                    <span className="text-[9px] font-bold text-slate-400 mt-1 bg-slate-50 px-2 py-0.5 rounded-lg">{stats.kpis.returnedCount} / {stats.kpis.shippedCount}</span>
                </div>

                {/* Total Orders */}
                <div className="bg-slate-900 p-8 rounded-2xl shadow-2xl text-white flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-indigo-600/20 rounded-full blur-3xl"></div>
                    <Package className="w-6 h-6 text-indigo-400 mb-6" />
                    <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">إجمالي الطلبات</p>
                        <h3 className="text-3xl font-black font-mono tracking-tighter mt-1">{stats.kpis.total} <span className="text-xs opacity-40">طلب</span></h3>
                    </div>
                </div>
            </div>

            {/* "Best Of" 3-Column Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* 1. Best Confirmers */}
                <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-sm"><Trophy className="w-5 h-5" /></div>
                        <h3 className="font-black text-slate-800 text-[10px] uppercase tracking-widest">نجوم التأكيد</h3>
                    </div>
                    <div className="space-y-6">
                        {stats.topPerformers.bestConfirmers.length > 0 ? stats.topPerformers.bestConfirmers.slice(0, 5).map((c: any, i: number) => (
                            <div key={i} className="flex items-center justify-between group">
                                <div className="flex items-center gap-4">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-[10px] ${i === 0 ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500'}`}>{i + 1}</div>
                                    <p className="text-[11px] font-black text-slate-800 leading-none">{c.name}</p>
                                </div>
                                <div className="text-left"><p className="text-sm font-black text-indigo-600 font-mono">{c.count}</p></div>
                            </div>
                        )) : <p className="text-center text-slate-300 text-xs py-10">لا توجد بيانات</p>}
                    </div>
                </div>

                {/* 2. Best States */}
                <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-sm"><MapPin className="w-5 h-5" /></div>
                        <h3 className="font-black text-slate-800 text-[10px] uppercase tracking-widest">أفضل الولايات</h3>
                    </div>
                    <div className="space-y-6">
                        {stats.topPerformers.bestStates.length > 0 ? stats.topPerformers.bestStates.slice(0, 5).map((s: any, i: number) => (
                            <div key={i} className="space-y-2">
                                <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
                                    <span className="text-slate-500">{s.name}</span>
                                    <span className="text-emerald-600 font-mono">{s.rate}% ({s.total})</span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-50 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${s.rate}%` }}></div>
                                </div>
                            </div>
                        )) : <p className="text-center text-slate-300 text-xs py-10">لا توجد بيانات</p>}
                    </div>
                </div>

                {/* 3. Best Products */}
                <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-sm"><ShoppingBag className="w-5 h-5" /></div>
                        <h3 className="font-black text-slate-800 text-[10px] uppercase tracking-widest">المنتجات الأكثر مبيعاً</h3>
                    </div>
                    <div className="space-y-4">
                        {stats.topPerformers.bestProducts.length > 0 ? stats.topPerformers.bestProducts.slice(0, 5).map((p: any, i: number) => (
                            <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-all group">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="w-8 h-8 shrink-0 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all"><Package className="w-4 h-4" /></div>
                                    <p className="text-[10px] font-black text-slate-700 leading-none truncate">{p.name}</p>
                                </div>
                                <span className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black font-mono shrink-0">{p.qty}</span>
                            </div>
                        )) : <p className="text-center text-slate-300 text-xs py-10">لا توجد بيانات</p>}
                    </div>
                </div>
            </div>

            {/* Status Analysis Circles */}
            <div className="bg-white p-10 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-4 mb-10">
                    <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg"><PieIcon className="w-6 h-6" /></div>
                    <div>
                        <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest leading-none">تحليل تفصيلي لحالات الطلب</h3>
                        <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-tighter">توزيع الحالات حسب دورة الحياة</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

                    {/* Stage A: Confirmation Lifecycle */}
                    <div className="flex flex-col md:flex-row items-center gap-10 bg-slate-50/50 p-8 rounded-2xl border border-slate-100">
                        <div className="w-48 h-48 shrink-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={stats.confirmationDistribution} innerRadius={60} outerRadius={85} paddingAngle={5} dataKey="value" stroke="none">
                                        {stats.confirmationDistribution.map((entry: any, index: number) => <Cell key={index} fill={entry.color || COLORS[index % COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="space-y-4 flex-1 w-full">
                            <h4 className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.2em] border-b border-indigo-100 pb-2">1. دورة حياة التأكيد</h4>
                            <div className="grid grid-cols-1 gap-3">
                                {stats.confirmationDistribution.map((item: any, i: number) => (
                                    <div key={i} className="flex justify-between items-center text-[10px] font-black uppercase">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color || COLORS[i % COLORS.length] }}></div>
                                            <span className="text-slate-500">{item.name}</span>
                                        </div>
                                        <span className="text-slate-800">{item.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Stage B: Logistics Lifecycle */}
                    <div className="flex flex-col md:flex-row items-center gap-10 bg-slate-50/50 p-8 rounded-2xl border border-slate-100">
                        <div className="w-48 h-48 shrink-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={stats.logisticsDistribution} innerRadius={60} outerRadius={85} paddingAngle={5} dataKey="value" stroke="none">
                                        {stats.logisticsDistribution.map((entry: any, index: number) => <Cell key={index} fill={entry.color || COLORS[(index + 3) % COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="space-y-4 flex-1 w-full">
                            <h4 className="text-[11px] font-black text-emerald-600 uppercase tracking-[0.2em] border-b border-emerald-100 pb-2">2. المسار اللوجستي</h4>
                            <div className="grid grid-cols-1 gap-3">
                                {stats.logisticsDistribution.map((item: any, i: number) => (
                                    <div key={i} className="flex justify-between items-center text-[10px] font-black uppercase">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color || COLORS[(i + 3) % COLORS.length] }}></div>
                                            <span className="text-slate-500">{item.name}</span>
                                        </div>
                                        <span className="text-slate-800">{item.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default OrderStatsView;
