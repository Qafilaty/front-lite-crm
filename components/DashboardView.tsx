import React, { useEffect, useState, useMemo } from 'react';
import { Stats, Order, Product, OrderStatus, SubscriptionTier } from '../types';
import {
  TrendingUp, Truck, Package, CheckCircle2,
  Sparkles, LineChart, Wallet, Star,
  HelpCircle, Download,
  Banknote, TrendingDown, Minus
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';
import { getSmartInsights } from '../services/geminiService';
import { statusLabels } from '../constants/statusConstants';
import { StatsCard } from './StatsCard';
import { ModernSelect } from './common';

interface DashboardViewProps {
  stats: Stats;
  orders: Order[];
  inventory: Product[];
  subscriptionTier: SubscriptionTier;
  onUpgrade: () => void;
  isLoading?: boolean;
}

const DashboardView: React.FC<DashboardViewProps> = ({ stats, orders, inventory, subscriptionTier, onUpgrade, isLoading = false }) => {
  const [insight, setInsight] = useState<string>('جاري تحليل البيانات...');
  const [dateRange, setDateRange] = useState('7days');

  // 1. Calculate Metrics
  const metrics = useMemo(() => {
    const total = orders.length || 1;
    const confirmed = orders.filter(o => ['confirmed', 'delivered', 'paid', 'en_preparation', 'ramasse', 'sorti_livraison'].includes(o.status)).length;
    const delivered = orders.filter(o => ['delivered', 'paid'].includes(o.status)).length;

    return {
      confRate: ((confirmed / total) * 100).toFixed(1),
      delivRate: ((delivered / total) * 100).toFixed(1),
      confirmedCount: confirmed,
      deliveredCount: delivered
    };
  }, [orders]);

  // 2. Prepare Chart Data (Last 7 Days)
  const areaData = useMemo(() => {
    const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const today = new Date();
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dayName = days[d.getDay()];
      const dateStr = d.toISOString().split('T')[0];

      const count = orders.filter(o => {
        if (!o.createdAt) return false;
        // Handle both ISO string and Date object if runtime data varies
        const created = new Date(o.createdAt);
        if (isNaN(created.getTime())) return false;
        return created.toISOString().startsWith(dateStr);
      }).length;

      result.push({ name: dayName, total: count });
    }
    return result;
  }, [orders]);

  // 3. Prepare Bar Chart Data (Status Distribution)
  const barData = useMemo(() => {
    const counts: Record<string, number> = {};
    orders.forEach(o => {
      if (!o.status) return;

      let label = 'Unknown';
      if (typeof o.status === 'string') {
        label = statusLabels[o.status] || o.status;
      } else if (typeof o.status === 'object') {
        // Handle StatusOrderObject: prefer Arabic name, then mapped ID, then English/French names
        label = o.status.nameAR ||
          (o.status.id && statusLabels[o.status.id]) ||
          o.status.nameEN ||
          o.status.nameFR ||
          'Unknown';
      }

      counts[label] = (counts[label] || 0) + 1;
    });
    // Top 7 statuses
    return Object.entries(counts)
      .map(([name, orders]) => ({ name, orders }))
      .sort((a, b) => b.orders - a.orders)
      .slice(0, 7);
  }, [orders]);

  // 4. Stock Alerts Logic (retained for insights generation)
  const stockAlerts = useMemo(() =>
    inventory.filter(p => p.stock < 10).sort((a, b) => a.stock - b.stock)
    , [inventory]);

  // 5. Generate Insights
  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const result = await getSmartInsights({ stats, metrics, lowStock: stockAlerts });
        setInsight(result || "تعذر الحصول على تحليلات.");
      } catch (error) {
        console.warn("Failed to fetch insights:", error);
        setInsight("التحليلات الذكية غير متوفرة حالياً.");
      }
    };
    fetchInsights();
  }, [stats, metrics, stockAlerts]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* Dashboard Header with Help Trigger */}
      <section className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse"></span>
          <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-widest">مباشر الآن</span>
        </div>
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">نظرة عامة</h1>
          <button
            className="flex items-center gap-2 text-indigo-600 bg-indigo-50 px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-100 transition-all border border-indigo-100 shadow-sm"
          >
            <HelpCircle className="w-5 h-5" />
            كيف يعمل؟
          </button>
        </div>
      </section>

      {/* Performance & Sales Section */}
      <section id="performance-section" className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100">
        <div className="flex flex-col lg:flex-row gap-8 items-center">

          {/* Left Side: Performance Stats & Recommendations */}
          <div className="flex-1 w-full space-y-8 order-2 lg:order-1">
            <div className="text-right">
              <h2 className="text-2xl font-black text-slate-900">تحليل الأداء اللحظي</h2>
              <p className="text-xs text-slate-400 font-bold mt-1">إحصائيات المبيعات والتوصيل المباشرة</p>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-400">معدل التأكيد</span>
                  <span className="text-2xl font-black text-slate-900">{metrics.confRate}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#5850EC] rounded-full transition-all duration-1000" style={{ width: `${metrics.confRate}%` }}></div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-400">معدل التوصيل</span>
                  <span className="text-2xl font-black text-slate-900">{metrics.delivRate}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{ width: `${metrics.delivRate}%` }}></div>
                </div>
              </div>
            </div>

            {/* Smart Recommendations Box */}
            <div className="bg-slate-50/50 rounded-3xl p-6 border border-slate-100 flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-white shadow-sm flex items-center justify-center text-indigo-500 shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-indigo-600 mb-1">توجيهات الذكاء الاصطناعي</p>
                <p className="text-sm text-slate-600 font-medium leading-relaxed">
                  {insight}
                </p>
              </div>
            </div>
          </div>

          {/* Right Side: Sales Card */}
          <div className="w-full lg:w-[380px] order-1 lg:order-2">
            <div className="relative overflow-hidden rounded-[2.2rem] bg-[#5850EC] p-7 text-white shadow-xl shadow-indigo-100 group transition-transform hover:scale-[1.01]">
              {/* Decorative Elements */}
              <div className="absolute top-0 left-0 w-24 h-24 bg-white/10 rounded-br-[3rem] -ml-4 -mt-4"></div>

              <div className="relative z-10 space-y-10">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-md">
                    <LineChart className="w-4 h-4" />
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-md shadow-lg">
                    <Wallet className="w-6 h-6" />
                  </div>
                </div>

                <div className="text-center space-y-2">
                  <p className="text-xs font-bold text-indigo-100/80 tracking-widest uppercase">إجمالي المبيعات المحققة</p>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-4xl lg:text-5xl font-black tracking-tighter">{stats.revenue.toLocaleString()}</span>
                    <span className="text-base font-bold text-indigo-200">دج</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <div className="flex items-center gap-2 text-indigo-100">
                    <span className="text-[10px] font-bold opacity-80 uppercase tracking-wider">الأداء: ممتاز</span>
                    <div className="flex gap-0.5">
                      <Star className="w-2.5 h-2.5 text-yellow-400 fill-current" />
                      <Star className="w-2.5 h-2.5 text-yellow-400 fill-current" />
                      <Star className="w-2.5 h-2.5 text-yellow-400 fill-current" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-emerald-500/90 text-white px-3 py-1.5 rounded-xl text-[10px] font-black">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                    LIVE UPDATES
                  </div>
                </div>
              </div>

              {/* Background Accents */}
              <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
            </div>
          </div>

        </div>
      </section>

      {/* Quick Stats Grid */}
      <section id="stats-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          label="المبيعات الإجمالية"
          value={stats.revenue.toLocaleString()}
          change="+8%"
          changeType="positive"
          icon={Banknote}
          iconBg="bg-amber-50 text-amber-500"
          unit="دج"
        />
        <StatsCard
          label="معدل التوصيل"
          value={`${metrics.delivRate}%`}
          change="-1.5%"
          changeType="negative"
          icon={Truck}
          iconBg="bg-blue-50 text-blue-500"
        />
        <StatsCard
          label="معدل التأكيد"
          value={`${metrics.confRate}%`}
          change="جيد"
          changeType="positive"
          icon={CheckCircle2}
          iconBg="bg-emerald-50 text-emerald-500"
        />
        <StatsCard
          label="إجمالي الطلبيات"
          value={orders.length}
          change="+12%"
          changeType="positive"
          icon={Package}
          iconBg="bg-indigo-50 text-indigo-500"
        />
      </section>

      {/* Charts Row */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between mb-8 px-2">
            <div>
              <h3 className="text-xl font-black text-slate-900">نمو الطلبيات</h3>
              <p className="text-xs text-slate-400 font-bold">تتبع الأداء الأسبوعي</p>
            </div>
            {/* Dynamic filtering could be added here */}
            <div className="w-40">
              <ModernSelect
                value={dateRange}
                onChange={setDateRange}
                options={[{ value: '7days', label: 'آخر 7 أيام' }]}
              />
            </div>
          </div>
          <div className="h-72" style={{ minHeight: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={areaData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94A3B8', fontWeight: 600 }} dy={10} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px', textAlign: 'right' }}
                  cursor={{ stroke: '#6366F1', strokeWidth: 2 }}
                />
                <Area type="monotone" dataKey="total" stroke="#6366F1" strokeWidth={4} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between mb-8 px-2">
            <div>
              <h3 className="text-xl font-black text-slate-900">حالات التوصيل</h3>
              <p className="text-xs text-slate-400 font-bold">توزيع الطلبات حسب الحالة</p>
            </div>
            <div className="flex gap-2">
              <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-all border border-slate-100">
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="h-72" style={{ minHeight: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94A3B8', fontWeight: 600 }} dy={10} interval={0} />
                <YAxis hide />
                <Tooltip
                  cursor={{ fill: '#F8FAFC' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', textAlign: 'right' }}
                />
                <Bar dataKey="orders" fill="#818CF8" radius={[8, 8, 0, 0]} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>
    </div>
  );
};

export default DashboardView;
