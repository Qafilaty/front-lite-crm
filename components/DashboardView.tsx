import React, { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { Stats, Order, Product, OrderStatus, SubscriptionTier, User } from '../types';
import {
  TrendingUp, Truck, Package, CheckCircle2,
  Sparkles, LineChart, Wallet, Star,
  HelpCircle, Download,
  Banknote, TrendingDown, Minus, AlertTriangle
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';

import { statusLabels } from '../constants/statusConstants';
import { StatsCard } from './StatsCard';
import { ModernSelect, StatsSkeleton, DateRangeSelector, DateRange } from './common';

interface DashboardViewProps {
  stats: Stats;
  orders: Order[];
  inventory: Product[];
  subscriptionTier: SubscriptionTier;
  onUpgrade: () => void;
  isLoading?: boolean;
  backendStats?: any;
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  idConfirmer?: string | null;
  onIdConfirmerChange?: (id: string | null) => void;
  teamMembers?: User[];
}

const DashboardView: React.FC<DashboardViewProps> = ({ 
  stats, orders, inventory, subscriptionTier, onUpgrade, isLoading = false, 
  backendStats, dateRange, onDateRangeChange,
  idConfirmer, onIdConfirmerChange, teamMembers = []
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();

  // 1. Calculate Metrics (Prefer backendStats if available)
  const metrics = useMemo(() => {
    if (backendStats) {
      return {
        confRate: backendStats.confirmationRate?.toFixed(1) || '0.0',
        delivRate: backendStats.deliveryRate?.toFixed(1) || '0.0',
        confirmedCount: backendStats.confirmedCount || 0,
        deliveredCount: backendStats.deliveredCount || 0,
        revenueGrowth: backendStats.revenueGrowth || 0,
        ordersGrowth: backendStats.ordersGrowth || 0,
        deliveryRateGrowth: backendStats.deliveryRateGrowth || 0,
        confirmationRateGrowth: backendStats.confirmationRateGrowth || 0
      };
    }

    // Fallback to client-side calculation (Legacy)
    const total = orders.length || 1;
    const confirmed = orders.filter(o => ['confirmed', 'delivered', 'paid', 'en_preparation', 'ramasse', 'sorti_livraison'].includes(o.status)).length;
    const delivered = orders.filter(o => ['delivered', 'paid'].includes(o.status)).length;

    return {
      confRate: ((confirmed / total) * 100).toFixed(1),
      delivRate: ((delivered / total) * 100).toFixed(1),
      confirmedCount: confirmed,
      deliveredCount: delivered,
      revenueGrowth: 0,
      ordersGrowth: 0,
      deliveryRateGrowth: 0,
      confirmationRateGrowth: 0
    };
  }, [orders, backendStats]);

  // 2. Prepare Chart Data (Last 7 Days)
  const areaData = useMemo(() => {
    if (backendStats?.salesGrowth) {
      return backendStats.salesGrowth;
    }

    const days = [
      t('common.days.sun'),
      t('common.days.mon'),
      t('common.days.tue'),
      t('common.days.wed'),
      t('common.days.thu'),
      t('common.days.fri'),
      t('common.days.sat')
    ];
    const today = new Date();
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dayName = days[d.getDay()];
      const dateStr = d.toISOString().split('T')[0];

      const count = orders.filter(o => {
        if (!o.createdAt) return false;
        const created = new Date(o.createdAt);
        if (isNaN(created.getTime())) return false;
        return created.toISOString().startsWith(dateStr);
      }).length;

      result.push({ name: d.getDate().toString(), total: count });
    }
    return result;
  }, [orders, backendStats]);

  // 3. Prepare Bar Chart Data (Status Distribution)
  const barData = useMemo(() => {
    if (backendStats?.statusDistribution) {
      return backendStats.statusDistribution;
    }

    const counts: Record<string, number> = {};
    orders.forEach(o => {
      if (!o.status) return;

      let label = 'Unknown';
      if (typeof o.status === 'string') {
        label = statusLabels[o.status] || o.status;
      } else if (typeof o.status === 'object') {
        label = o.status.nameAR ||
          (o.status.id && statusLabels[o.status.id]) ||
          o.status.nameEN ||
          o.status.nameFR ||
          'Unknown';
      }

      counts[label] = (counts[label] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, orders]) => ({ name, orders }))
      .sort((a, b) => b.orders - a.orders)
      .slice(0, 7);
  }, [orders, backendStats]);

  if (isLoading) {
    return <StatsSkeleton />;
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* Dashboard Header with Help Trigger */}
      <section className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse"></span>
          <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-widest">{t('dashboard.live_now')}</span>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 relative z-20">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">{t('dashboard.overview')}</h1>
          <div className="flex items-center gap-3">
             <DateRangeSelector 
              value={dateRange}
              onChange={onDateRangeChange}
            />

            {/* Team Member Filter (for Supervisors/Admins) */}
            {(user?.role === 'supervisor' || user?.role === 'admin') && teamMembers.length > 0 && (
              <div className="min-w-[180px]">
                <ModernSelect
                  options={[
                    { value: '', label: t('order_stats.filter_team') },
                    ...teamMembers.map(m => ({ value: m.id, label: m.name }))
                  ]}
                  value={idConfirmer || ''}
                  onChange={(val) => onIdConfirmerChange?.(val || null)}
                />
              </div>
            )}
            <button
              className="flex items-center gap-2 text-indigo-600 bg-indigo-50 px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-100 transition-all border border-indigo-100 shadow-sm"
            >
              <HelpCircle className="w-5 h-5" />
              <span className="hidden sm:inline">{t('dashboard.how_it_works')}</span>
            </button>
          </div>
        </div>
      </section>

      {/* Performance & Sales Section */}
      <section id="performance-section" className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <div className="flex flex-col lg:flex-row gap-8 items-center">

          {/* Left Side: Performance Stats & Recommendations */}
          <div className="flex-1 w-full space-y-8 order-2 lg:order-1">
            <div className="text-right">
              <h2 className="text-2xl font-black text-slate-900">{t('dashboard.realtime_performance')}</h2>
              <p className="text-xs text-slate-400 font-bold mt-1">{t('dashboard.live_stats_desc')}</p>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-400">{t('dashboard.conf_rate')}</span>
                  <span className="text-2xl font-black text-slate-900">{metrics.confRate}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#5850EC] rounded-full transition-all duration-1000" style={{ width: `${metrics.confRate}%` }}></div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-400">{t('dashboard.deliv_rate')}</span>
                  <span className="text-2xl font-black text-slate-900">{metrics.delivRate}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{ width: `${metrics.delivRate}%` }}></div>
                </div>
              </div>
            </div>

            {/* Dynamic Rate Alerts */}
            <div className="space-y-4">
              {/* Confirmation Rate Alert */}
              {(() => {
                const conf = parseFloat(metrics.confRate);
                let message = t('dashboard.messages.conf_good');
                let Icon = CheckCircle2;
                let colorClass = 'text-emerald-600 bg-emerald-50 border-emerald-100';

                if (conf < 30) {
                  message = t('dashboard.messages.conf_low');
                  Icon = AlertTriangle;
                  colorClass = 'text-rose-600 bg-rose-50 border-rose-100';
                } else if (conf >= 30 && conf < 50) {
                  message = t('dashboard.messages.conf_unstable');
                  Icon = AlertTriangle;
                  colorClass = 'text-amber-600 bg-amber-50 border-amber-100';
                } else if (conf >= 50 && conf < 70) {
                  message = t('dashboard.messages.conf_stable');
                  Icon = CheckCircle2;
                  colorClass = 'text-blue-600 bg-blue-50 border-blue-100';
                } else {
                  message = t('dashboard.messages.conf_excellent');
                }

                return (
                  <div className={`rounded-2xl p-4 border flex items-center gap-4 ${colorClass}`}>
                    <div className={`w-10 h-10 rounded-xl bg-white/60 shadow-sm flex items-center justify-center shrink-0`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black opacity-70 uppercase tracking-wider mb-0.5">{t('dashboard.conf_alert')}</p>
                      <p className="text-xs font-bold leading-relaxed">{message}</p>
                    </div>
                  </div>
                );
              })()}

              {/* Delivery Rate Alert */}
              {(() => {
                const deliv = parseFloat(metrics.delivRate);
                let message = t('dashboard.messages.deliv_good');
                let Icon = Truck;
                let colorClass = 'text-emerald-600 bg-emerald-50 border-emerald-100';

                if (deliv < 30) {
                  message = t('dashboard.messages.deliv_low');
                  Icon = AlertTriangle;
                  colorClass = 'text-rose-600 bg-rose-50 border-rose-100';
                } else if (deliv >= 30 && deliv < 50) {
                  message = t('dashboard.messages.deliv_unstable');
                  Icon = AlertTriangle;
                  colorClass = 'text-amber-600 bg-amber-50 border-amber-100';
                } else if (deliv >= 50 && deliv < 70) {
                  message = t('dashboard.messages.deliv_stable');
                  Icon = CheckCircle2;
                  colorClass = 'text-blue-600 bg-blue-50 border-blue-100';
                } else {
                  message = t('dashboard.messages.deliv_excellent');
                }

                return (
                  <div className={`rounded-2xl p-4 border flex items-center gap-4 ${colorClass}`}>
                    <div className={`w-10 h-10 rounded-xl bg-white/60 shadow-sm flex items-center justify-center shrink-0`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black opacity-70 uppercase tracking-wider mb-0.5">{t('dashboard.deliv_alert')}</p>
                      <p className="text-xs font-bold leading-relaxed">{message}</p>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Right Side: Sales Card */}
          <div className="w-full lg:w-[380px] order-1 lg:order-2">
            <div className="relative overflow-hidden rounded-2xl bg-[#5850EC] p-7 text-white shadow-xl shadow-indigo-100 group transition-transform hover:scale-[1.01]">
              {/* Decorative Elements */}
              <div className="absolute top-0 left-0 w-24 h-24 bg-white/10 rounded-br-[1.5rem] -ml-4 -mt-4"></div>

              <div className="relative z-10 space-y-10">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-md">
                    <LineChart className="w-4 h-4" />
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-md shadow-lg">
                    <Wallet className="w-6 h-6" />
                  </div>
                </div>

                <div className="text-center space-y-2">
                  <p className="text-xs font-bold text-indigo-100/80 tracking-widest uppercase">{t('dashboard.total_revenue')}</p>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-4xl lg:text-5xl font-black tracking-tighter">{stats.revenue.toLocaleString()}</span>
                    <span className="text-base font-bold text-indigo-200">{t('common.currency')}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <div className="flex items-center gap-2 text-indigo-100">

                  </div>
                  <div className="flex items-center gap-2 bg-emerald-500/90 text-white px-3 py-1.5 rounded-lg text-[10px] font-black">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                    {t('dashboard.live_updates')}
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
          label={t('dashboard.revenue_growth')}
          value={stats.revenue.toLocaleString()}
          change={`${metrics.revenueGrowth > 0 ? '+' : ''}${metrics.revenueGrowth}%`}
          changeType={metrics.revenueGrowth >= 0 ? "positive" : "negative"}
          icon={Banknote}
          iconBg="bg-amber-50 text-amber-500"
          unit={t('common.currency')}
        />
        <StatsCard
          label={t('dashboard.deliv_rate')}
          value={`${metrics.delivRate}%`}
          change={`${metrics.deliveryRateGrowth > 0 ? '+' : ''}${metrics.deliveryRateGrowth}%`}
          changeType={metrics.deliveryRateGrowth >= 0 ? "positive" : "negative"}
          icon={Truck}
          iconBg="bg-blue-50 text-blue-500"
        />
        <StatsCard
          label={t('dashboard.conf_rate')}
          value={`${metrics.confRate}%`}
          change={`${metrics.confirmationRateGrowth > 0 ? '+' : ''}${metrics.confirmationRateGrowth}%`}
          changeType={metrics.confirmationRateGrowth >= 0 ? "positive" : "negative"}
          icon={CheckCircle2}
          iconBg="bg-emerald-50 text-emerald-500"
        />
        <StatsCard
          label={t('dashboard.orders_growth')}
          value={orders.length > 0 ? orders.length : (backendStats?.totalOrders || 0)} // Use backend totalOrders if available
          change={`${metrics.ordersGrowth > 0 ? '+' : ''}${metrics.ordersGrowth}%`}
          changeType={metrics.ordersGrowth >= 0 ? "positive" : "negative"}
          icon={Package}
          iconBg="bg-indigo-50 text-indigo-500"
        />
      </section>

      {/* Charts Row */}
      <section className="grid grid-cols-1 lg:grid-cols-1 gap-8">
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between mb-8 px-2">
            <div>
              <h3 className="text-xl font-black text-slate-900">{t('dashboard.orders_chart')}</h3>
              <p className="text-xs text-slate-400 font-bold">{t('dashboard.weekly_performance')}</p>
            </div>
            {/* Date range is controlled globally by the selector in the header */}
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
        {/* 
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center justify-between mb-8 px-2">
            <div>
              <h3 className="text-xl font-black text-slate-900">{t('dashboard.delivery_status_chart')}</h3>
              <p className="text-xs text-slate-400 font-bold">{t('dashboard.status_distribution')}</p>
            </div>
            <div className="flex gap-2">
              <button className="w-10 h-10 flex items-center justify-center rounded-lg bg-slate-50 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-all border border-slate-100">
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
        </div> */}
      </section>
    </div>
  );
};

export default DashboardView;
