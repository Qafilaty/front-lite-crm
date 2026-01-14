
import React, { useEffect, useState, useMemo } from 'react';
import { Stats, Order, Product, OrderStatus, SubscriptionTier } from '../types';
import { 
  TrendingUp, CheckCircle2, Truck, Package, Users, 
  ArrowUpRight, ArrowDownRight, Sparkles, AlertTriangle,
  PieChart as PieIcon, BarChart3, Rocket, Crown, Zap, ShieldAlert, ArrowRight
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell
} from 'recharts';
import { getSmartInsights } from '../services/geminiService';
import { statusLabels, statusColors } from './OrderConfirmationView';

interface DashboardViewProps {
  stats: Stats;
  orders: Order[];
  inventory: Product[];
  subscriptionTier: SubscriptionTier;
  onUpgrade: () => void;
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#64748b', '#8b5cf6', '#06b6d4', '#f43f5e'];

const StatCard: React.FC<{ label: string; value: string | number; icon: any; color: string; trend?: { val: string, up: boolean }; unit?: string }> = ({ label, value, icon: Icon, color, trend, unit }) => (
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
      <h3 className="text-2xl font-black text-slate-800 mt-1 tracking-tighter">{value}{unit && <span className="text-xs mr-1 opacity-50">{unit}</span>}</h3>
    </div>
  </div>
);

const SubscriptionBanner: React.FC<{ tier: SubscriptionTier, onUpgrade: () => void }> = ({ tier, onUpgrade }) => {
  switch (tier) {
    case SubscriptionTier.NONE:
      return (
        <div className="bg-gradient-to-r from-rose-600 to-orange-500 rounded-[2.5rem] p-6 md:p-8 text-white relative overflow-hidden shadow-2xl shadow-rose-500/20 mb-6 animate-in slide-in-from-top duration-500">
           <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
           <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                 <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shrink-0">
                    <ShieldAlert className="w-8 h-8 text-white" />
                 </div>
                 <div className="text-center md:text-right">
                    <h3 className="text-xl font-black tracking-tight">تنبيه: حسابك غير مفعل حالياً</h3>
                    <p className="text-white/80 text-xs font-bold mt-1 uppercase tracking-widest">قم بتفعيل اشتراكك الآن للوصول إلى كافة ميزات النظام وتجنب توقف الخدمات</p>
                 </div>
              </div>
              <button onClick={onUpgrade} className="px-8 py-4 bg-white text-rose-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-rose-50 transition-all shadow-xl flex items-center gap-2">
                 فعل حسابك الآن <ArrowRight className="w-4 h-4" />
              </button>
           </div>
        </div>
      );
    case SubscriptionTier.PAY_AS_YOU_GO:
      return (
        <div className="bg-gradient-to-r from-indigo-600 to-blue-500 rounded-[2.5rem] p-6 md:p-8 text-white relative overflow-hidden shadow-2xl shadow-indigo-500/20 mb-6 animate-in slide-in-from-top duration-500">
           <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
           <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                 <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shrink-0">
                    <Rocket className="w-8 h-8 text-white animate-bounce" />
                 </div>
                 <div className="text-center md:text-right">
                    <h3 className="text-xl font-black tracking-tight">أهلاً بك! أنت حالياً في خطة <span className="text-amber-300">"الدفع حسب الطلب"</span></h3>
                    <p className="text-white/80 text-xs font-bold mt-1 uppercase tracking-widest">هل زادت مبيعاتك؟ وفر أكثر بالترقية إلى الخطة الاحترافية بـ 2400 دج فقط</p>
                 </div>
              </div>
              <button onClick={onUpgrade} className="px-8 py-4 bg-indigo-900/50 backdrop-blur-md text-white border border-white/20 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-900 transition-all flex items-center gap-2">
                 عرض خيارات الترقية <ArrowRight className="w-4 h-4" />
              </button>
           </div>
        </div>
      );
    case SubscriptionTier.PRO:
      return (
        <div className="bg-gradient-to-r from-purple-700 to-indigo-600 rounded-[2.5rem] p-6 md:p-8 text-white relative overflow-hidden shadow-2xl shadow-purple-500/20 mb-6 animate-in slide-in-from-top duration-500">
           <div className="absolute top-1/2 left-0 -translate-y-1/2 w-96 h-20 bg-white/5 rotate-12 blur-2xl"></div>
           <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                 <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shrink-0">
                    <Zap className="w-8 h-8 text-amber-300 fill-current" />
                 </div>
                 <div className="text-center md:text-right">
                    <h3 className="text-xl font-black tracking-tight">أداء عالي! خطتك <span className="text-emerald-400">"الاحترافية"</span> نشطة</h3>
                    <p className="text-white/80 text-xs font-bold mt-1 uppercase tracking-widest">استخدم الـ API والـ Webhooks لربط نظامك الخاص عبر الترقية لخطة الربط المتقدم</p>
                 </div>
              </div>
              <button onClick={onUpgrade} className="px-8 py-4 bg-white text-purple-700 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-purple-50 transition-all shadow-xl flex items-center gap-2">
                 ترقية للربط المتقدم <Crown className="w-4 h-4" />
              </button>
           </div>
        </div>
      );
    case SubscriptionTier.PREMIUM:
      return (
        <div className="bg-slate-900 rounded-[2.5rem] p-6 md:p-8 text-white relative overflow-hidden shadow-2xl shadow-slate-900/40 mb-6 animate-in slide-in-from-top duration-500 border border-slate-800">
           <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/20 via-transparent to-transparent"></div>
           <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                 <div className="w-16 h-16 bg-amber-500/20 border border-amber-500/30 rounded-2xl flex items-center justify-center shrink-0">
                    <Crown className="w-8 h-8 text-amber-500 fill-current" />
                 </div>
                 <div className="text-center md:text-right">
                    <h3 className="text-xl font-black tracking-tight">أنت في <span className="text-amber-500">خطة الربط المتقدم</span> - القوة الكاملة بين يديك</h3>
                    <p className="text-slate-400 text-xs font-bold mt-1 uppercase tracking-widest">كل ميزات النظام والـ API والـ Webhooks مفعلة. عمل ممتاز!</p>
                 </div>
              </div>
              <div className="flex items-center gap-3">
                 <div className="px-6 py-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                    <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1">حالة الربط</p>
                    <div className="flex items-center gap-2">
                       <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                       <span className="text-xs font-black text-white">API متصل</span>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      );
    default: return null;
  }
};

const DashboardView: React.FC<DashboardViewProps> = ({ stats, orders, inventory, subscriptionTier, onUpgrade }) => {
  const [insight, setInsight] = useState<string>('جاري تحليل البيانات...');

  // 1. حساب معدلات التأكيد والتوصيل
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

  // 2. تحليل أداء المستخدمين
  const userPerformance = useMemo(() => {
    const perf: Record<string, { name: string, confirmed: number, delivered: number, others: number, total: number }> = {};
    
    orders.forEach(order => {
      const lastUser = order.history && order.history.length > 0 
        ? order.history[order.history.length - 1].user 
        : 'نظام آلي';
      
      if (!perf[lastUser]) perf[lastUser] = { name: lastUser, confirmed: 0, delivered: 0, others: 0, total: 0 };
      
      perf[lastUser].total += 1;
      if (['confirmed'].includes(order.status)) perf[lastUser].confirmed += 1;
      if (['delivered', 'paid'].includes(order.status)) perf[lastUser].delivered += 1;
      if (!['confirmed', 'delivered', 'paid'].includes(order.status)) perf[lastUser].others += 1;
    });

    return Object.values(perf).sort((a, b) => b.confirmed - a.confirmed);
  }, [orders]);

  // 3. بيانات الـ Pie Chart للحالات
  const pieData = useMemo(() => {
    const statusCounts = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.keys(statusCounts).map(key => ({
      name: statusLabels[key as OrderStatus] || key,
      value: statusCounts[key]
    })).sort((a, b) => b.value - a.value);
  }, [orders]);

  // 4. تنبيهات المخزون
  const stockAlerts = useMemo(() => 
    inventory.filter(p => p.stock < 10).sort((a, b) => a.stock - b.stock)
  , [inventory]);

  useEffect(() => {
    const fetchInsights = async () => {
      const result = await getSmartInsights({ stats, metrics, lowStock: stockAlerts });
      setInsight(result || "تعذر الحصول على تحليلات.");
    };
    fetchInsights();
  }, [stats, metrics, stockAlerts]);

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">نظرة عامة</h2>
          <p className="text-slate-400 text-[11px] font-bold mt-1 uppercase tracking-widest">إحصائيات الأداء اللوجستي لفريقك</p>
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-sm">
           <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
           <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">مباشر الآن</span>
        </div>
      </div>

      {/* Subscription Banner */}
      <SubscriptionBanner tier={subscriptionTier} onUpgrade={onUpgrade} />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard label="إجمالي الطلبيات" value={orders.length} unit="طلب" icon={Package} color="bg-indigo-50 text-indigo-600" trend={{ val: '+12%', up: true }} />
        <StatCard label="معدل التأكيد" value={metrics.confRate} unit="%" icon={CheckCircle2} color="bg-emerald-50 text-emerald-600" trend={{ val: 'جيد', up: true }} />
        <StatCard label="معدل التوصيل" value={metrics.delivRate} unit="%" icon={Truck} color="bg-blue-50 text-blue-600" trend={{ val: '-1.5%', up: false }} />
        <StatCard label="المبيعات الإجمالية" value={stats.revenue.toLocaleString()} unit="دج" icon={TrendingUp} color="bg-amber-50 text-amber-600" trend={{ val: '+8%', up: true }} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Distribution Pie Chart - Main Focus */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col">
           <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600"><PieIcon className="w-5 h-5" /></div>
              <h3 className="font-black text-slate-800 text-[11px] uppercase tracking-widest">توزيع الحالات</h3>
           </div>
           <div className="h-[250px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                    {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
           </div>
           <div className="mt-6 grid grid-cols-2 gap-y-3 gap-x-4">
              {pieData.slice(0, 6).map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                  <span className="text-[10px] font-black text-slate-500 truncate">{item.name} ({item.value})</span>
                </div>
              ))}
           </div>
        </div>

        {/* Order Trend Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-indigo-600"><BarChart3 className="w-5 h-5" /></div>
               <h3 className="font-black text-slate-800 text-[11px] uppercase tracking-widest">نمو الطلبيات (آخر 7 أيام)</h3>
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={[
                { name: 'السبت', total: 45 }, { name: 'الأحد', total: 52 }, { name: 'الإثنين', total: 48 },
                { name: 'الثلاثاء', total: 61 }, { name: 'الأربعاء', total: 55 }, { name: 'الخميس', total: 67 }, { name: 'الجمعة', total: 72 },
              ]}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} fontWeight="bold" />
                <YAxis stroke="#94a3b8" fontSize={10} fontWeight="bold" />
                <Tooltip />
                <Area type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorTotal)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Performance Table */}
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
           <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-2xl bg-white shadow-sm flex items-center justify-center text-indigo-600"><Users className="w-5 h-5" /></div>
                 <h3 className="font-black text-slate-800 text-[11px] uppercase tracking-widest">أداء فريق العمل</h3>
              </div>
           </div>
           <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead className="bg-slate-50/50">
                  <tr className="text-slate-400 border-b border-slate-100">
                    <th className="px-8 py-4 text-[9px] font-black uppercase tracking-widest">الموظف</th>
                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-center">المؤكدة</th>
                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-center">الموصلة</th>
                    <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-center">أخرى</th>
                    <th className="px-8 py-4 text-[9px] font-black uppercase tracking-widest text-center">النسبة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                   {userPerformance.map((user, i) => (
                     <tr key={i} className="hover:bg-slate-50/50 transition-all group">
                       <td className="px-8 py-4">
                         <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-[10px] font-black">{user.name.charAt(0)}</div>
                            <span className="text-xs font-black text-slate-800">{user.name}</span>
                         </div>
                       </td>
                       <td className="px-6 py-4 text-center font-black text-emerald-600 text-xs">{user.confirmed}</td>
                       <td className="px-6 py-4 text-center font-black text-blue-600 text-xs">{user.delivered}</td>
                       <td className="px-6 py-4 text-center font-black text-slate-400 text-xs">{user.others}</td>
                       <td className="px-8 py-4">
                          <div className="flex items-center justify-center gap-3">
                             <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden hidden sm:block">
                                <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${(user.confirmed / (user.total || 1)) * 100}%` }}></div>
                             </div>
                             <span className="text-[10px] font-black text-slate-500 whitespace-nowrap">{((user.confirmed / (user.total || 1)) * 100).toFixed(0)}%</span>
                          </div>
                       </td>
                     </tr>
                   ))}
                </tbody>
              </table>
           </div>
        </div>

        {/* Stock Alerts - Focus on Alerts Only */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col">
           <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600"><AlertTriangle className="w-5 h-5" /></div>
              <h3 className="font-black text-slate-800 text-[11px] uppercase tracking-widest">تنبيهات المخزون</h3>
           </div>
           
           <div className="space-y-4 flex-1 overflow-y-auto max-h-[400px] custom-scrollbar pr-2">
              {stockAlerts.map((product, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-rose-50/30 rounded-2xl border border-rose-100/50 group hover:bg-rose-50 transition-all">
                   <div className="space-y-1">
                      <p className="text-xs font-black text-slate-800">{product.name}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{product.sku}</p>
                   </div>
                   <div className="text-left">
                      <span className="text-[10px] font-black text-rose-600 bg-white px-3 py-1.5 rounded-xl border border-rose-100 shadow-sm">
                        باقي {product.stock}
                      </span>
                   </div>
                </div>
              ))}
              {stockAlerts.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 text-center space-y-3">
                   <CheckCircle2 className="w-10 h-10 text-emerald-200" />
                   <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">المخزون مكتمل ولا توجد نواقص</p>
                </div>
              )}
           </div>

           {/* Gemini Insights Section */}
           <div className="mt-8 bg-slate-900 p-6 rounded-[1.5rem] text-white relative overflow-hidden">
              <div className="relative z-10 space-y-3">
                 <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">توصيات ذكية</span>
                 </div>
                 <p className="text-[11px] leading-relaxed text-slate-300 italic font-medium">"{insight}"</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
