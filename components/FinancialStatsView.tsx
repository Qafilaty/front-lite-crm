
import React, { useMemo } from 'react';
import { Transaction } from '../types';
import { 
  TrendingUp, TrendingDown, PieChart as PieIcon,
  Wallet, ArrowUpRight, ArrowDownRight, BarChart4,
  Calendar, Info
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';

interface FinancialStatsViewProps {
  transactions: Transaction[];
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const FinancialStatsView: React.FC<FinancialStatsViewProps> = ({ transactions }) => {
  const totals = useMemo(() => {
    const income = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const expense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    return { income, expense, balance: income - expense };
  }, [transactions]);

  const expenseDistribution = useMemo(() => {
    const categories: Record<string, number> = {};
    transactions.filter(t => t.type === 'expense').forEach(t => {
      categories[t.category] = (categories[t.category] || 0) + t.amount;
    });
    
    return Object.keys(categories).map(cat => ({
      name: cat,
      value: categories[cat]
    })).sort((a, b) => b.value - a.value);
  }, [transactions]);

  const chartData = useMemo(() => {
    // محاكاة بيانات الأسبوع الأخير
    return [
      { name: 'السبت', income: 12000, expense: 4500 },
      { name: 'الأحد', income: 15000, expense: 3200 },
      { name: 'الإثنين', income: 18000, expense: 6000 },
      { name: 'الثلاثاء', income: 14000, expense: 2800 },
      { name: 'الأربعاء', income: 22000, expense: 7500 },
      { name: 'الخميس', income: 19000, expense: 4000 },
      { name: 'الجمعة', income: 25000, expense: 5000 },
    ];
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-20 no-scrollbar">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h2 className="text-2xl font-black text-slate-800 tracking-tight">التحليلات والإحصائيات المالية</h2>
           <p className="text-slate-400 text-[11px] font-bold uppercase mt-1 tracking-widest">مراقبة الأداء المالي وصافي الأرباح بدقة</p>
        </div>
      </div>

      {/* KPI Cards Section */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
         <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col gap-4 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full -mr-16 -mt-16 blur-2xl opacity-50"></div>
            <div className="flex items-center justify-between relative z-10">
               <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><TrendingUp className="w-6 h-6" /></div>
               <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase"><ArrowUpRight className="w-3.5 h-3.5" /> +12%</div>
            </div>
            <div className="relative z-10">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">إجمالي المداخيل</p>
               <h3 className="text-2xl font-black text-slate-800 mt-1 font-mono tracking-tighter">{totals.income.toLocaleString()} <span className="text-xs opacity-40">دج</span></h3>
            </div>
         </div>

         <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col gap-4 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-full -mr-16 -mt-16 blur-2xl opacity-50"></div>
            <div className="flex items-center justify-between relative z-10">
               <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center"><TrendingDown className="w-6 h-6" /></div>
               <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-600 text-[9px] font-black uppercase"><ArrowDownRight className="w-3.5 h-3.5" /> -2%</div>
            </div>
            <div className="relative z-10">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">إجمالي المصروفات</p>
               <h3 className="text-2xl font-black text-slate-800 mt-1 font-mono tracking-tighter">{totals.expense.toLocaleString()} <span className="text-xs opacity-40">دج</span></h3>
            </div>
         </div>

         <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl shadow-slate-900/20 flex flex-col gap-4 relative overflow-hidden group">
            <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-indigo-600/10 rounded-full blur-3xl"></div>
            <div className="flex items-center justify-between relative z-10">
               <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md text-indigo-400 flex items-center justify-center border border-white/10 shadow-sm"><Wallet className="w-6 h-6" /></div>
               <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest px-2 py-1 bg-emerald-500/10 rounded-lg">صافي الربح</span>
            </div>
            <div className="relative z-10">
               <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">صافي السيولة النقدية</p>
               <h3 className="text-3xl font-black text-white mt-1 font-mono tracking-tighter">{totals.balance.toLocaleString()} <span className="text-xs opacity-40">دج</span></h3>
            </div>
         </div>
      </div>

      {/* Analytics Visualization Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cash Flow Comparison Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-3">
               <div className="w-11 h-11 rounded-2xl bg-slate-50 flex items-center justify-center text-indigo-600"><BarChart4 className="w-6 h-6" /></div>
               <div>
                  <h3 className="font-black text-slate-800 text-[11px] uppercase tracking-widest leading-none">مقارنة التدفق النقدي</h3>
                  <p className="text-[9px] font-bold text-slate-400 mt-1.5">تحليل المداخيل والمصروفات خلال الـ 7 أيام الأخيرة</p>
               </div>
            </div>
            <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-widest">
               <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div> مداخيل</div>
               <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div> مصروفات</div>
            </div>
          </div>
          <div className="h-[340px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="gradIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="gradExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} fontWeight="bold" />
                <YAxis stroke="#94a3b8" fontSize={10} fontWeight="bold" />
                <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} />
                <Area type="monotone" dataKey="income" stroke="#10b981" strokeWidth={5} fillOpacity={1} fill="url(#gradIncome)" />
                <Area type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={5} fillOpacity={1} fill="url(#gradExpense)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expenses Category Pie Chart */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col">
           <div className="flex items-center gap-3 mb-10">
              <div className="w-11 h-11 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600"><PieIcon className="w-6 h-6" /></div>
              <div>
                 <h3 className="font-black text-slate-800 text-[11px] uppercase tracking-widest leading-none">توزيع المصروفات</h3>
                 <p className="text-[9px] font-bold text-slate-400 mt-1.5">حسب فئات الإنفاق التشغيلية</p>
              </div>
           </div>
           
           <div className="flex-1 min-h-[250px] relative">
              <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                    <Pie data={expenseDistribution} innerRadius={60} outerRadius={90} paddingAngle={8} dataKey="value">
                       {expenseDistribution.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '16px', border: 'none' }} />
                 </PieChart>
              </ResponsiveContainer>
           </div>

           <div className="mt-8 space-y-4 max-h-56 overflow-y-auto no-scrollbar">
              {expenseDistribution.map((item, i) => (
                <div key={i} className="flex justify-between items-center group transition-all">
                   <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{item.name}</span>
                   </div>
                   <span className="text-[11px] font-black text-slate-800 font-mono">
                      {((item.value / totals.expense) * 100).toFixed(0)}%
                   </span>
                </div>
              ))}
              {expenseDistribution.length === 0 && (
                <p className="text-center text-[9px] font-bold text-slate-300 py-10 uppercase tracking-widest">لا توجد مصروفات مسجلة للتحليل</p>
              )}
           </div>

           <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">إجمالي المنصرف</span>
              <span className="text-lg font-black text-rose-600 font-mono tracking-tighter">{totals.expense.toLocaleString()} دج</span>
           </div>
        </div>
      </div>

      {/* Quick Summary Info */}
      <div className="bg-indigo-50 p-6 rounded-[2rem] border border-indigo-100 flex items-center gap-4 animate-in fade-in duration-1000">
         <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white"><Info className="w-5 h-5" /></div>
         <p className="text-[11px] font-bold text-indigo-700 leading-relaxed italic">يتم تحديث هذه الإحصائيات لحظياً بناءً على العمليات المالية المسجلة في سجل النظام. لضمان دقة التقارير، يرجى تسجيل كافة المصروفات التشغيلية والرواتب.</p>
      </div>
    </div>
  );
};

export default FinancialStatsView;
