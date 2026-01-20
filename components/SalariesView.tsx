import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { User, Payout } from '../types';
import {
  Wallet, TrendingUp, Users, CheckCircle2, ChevronLeft,
  Search, Eye, Printer, X, CreditCard, DollarSign,
  History, FileText, Package, Globe, Building, Check,
  ChevronRight, Filter, AlertCircle, Calendar, ArrowUpRight,
  ClipboardCheck, Sparkles, LayoutList, ArrowRight, ListOrdered, Trophy,
  Loader2
} from 'lucide-react';
import { salaryService, userService, orderService } from '../services/apiService';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

interface SalariesViewProps { }

const SalariesView: React.FC<SalariesViewProps> = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'due' | 'history'>('due');
  const [loading, setLoading] = useState(true);

  const [users, setUsers] = useState<User[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserForPayout, setSelectedUserForPayout] = useState<User | null>(null);

  // Stats for Orders List Modal
  const [selectedUserForOrders, setSelectedUserForOrders] = useState<User | null>(null);
  const [userOrders, setUserOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersTotal, setOrdersTotal] = useState(0);
  const ordersPerPage = 10;

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchData = async () => {
    try {
      const companyId = user?.company?.id;

      if (!companyId) return;
      setLoading(true);

      // 1. Fetch Users
      const usersResult = await userService.getAllUsers(companyId);
      if (usersResult.success) {
        // Filter for confirmed users (employees)
        // Adjust role check if needed, e.g. includes or strict equality
        setUsers(usersResult.users.filter((u: any) => u.role === 'confirmed' || u.role === 'user'));
      }

      // 2. Fetch Payouts (History)
      // We fetch a large limit to allow clientside stats calculation (Best Performer)
      const salariesResult = await salaryService.getAllSalaries(companyId, { pagination: { limit: 1000, page: 1 } });
      if (salariesResult.success) {
        setPayouts(salariesResult.salaries);
      }

    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("فشل في جلب البيانات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.company?.id) {
      fetchData();
    }
  }, [activeTab, user]);

  // حساب البيانات الإجمالية للبطاقات
  const summaryStats = useMemo(() => {
    const totalPaid = payouts.reduce((acc, p) => acc + (p.total || p.amount || 0), 0);

    // Calculate total pending from all users current counters
    const totalPending = users.reduce((acc, user) => {
      const count = user.numberDeliveredOrder || 0;
      const price = user.orderPrice || 0;
      return acc + (count * price);
    }, 0);

    const performanceMap: Record<string, number> = {};

    // Add history counts
    payouts.forEach(p => {
      const uName = p.user?.name || 'مجهول';
      performanceMap[uName] = (performanceMap[uName] || 0) + (p.ordersCount || 0);
    });

    // Add current pending counts
    users.forEach(u => {
      const uName = u.name;
      performanceMap[uName] = (performanceMap[uName] || 0) + (u.numberDeliveredOrder || 0);
    });

    const sortedPerformers = Object.entries(performanceMap).sort((a, b) => b[1] - a[1]);
    const bestConfirmer = sortedPerformers.length > 0
      ? { name: sortedPerformers[0][0], count: sortedPerformers[0][1] }
      : { name: 'لا يوجد', count: 0 };

    return { totalPaid, totalPending, bestConfirmer };
  }, [payouts, users]);

  // Calculate Due Salaries per User using Counters
  const salariesData = useMemo(() => {
    return users.map(user => {
      const deliveredCount = user.numberDeliveredOrder || 0;
      const orderPrice = user.orderPrice || 0;
      const unpaidAmount = deliveredCount * orderPrice;

      return {
        user,
        deliveredCount,
        orderPrice,
        unpaidAmount
      };
    }).filter(item => item.user.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => b.unpaidAmount - a.unpaidAmount);
  }, [users, searchTerm]);

  const filteredPayouts = useMemo(() => {
    return payouts.filter(p => (p.user?.name || '').toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [payouts, searchTerm]);

  // Handle Logic for Payment Processing
  const handleProcessPayment = async (userId: string) => {
    // @ts-ignore
    const data = salariesData.find(d => d.user.id === userId);

    if (!data || data.unpaidAmount === 0) {
      toast.error("لا يوجد مبلغ مستحق للصرف");
      return;
    }

    // Confirmation handled by modal UI

    try {
      const companyId = user?.company?.id;

      // 1. Create Salary Record
      const salaryPayload = {
        ordersCount: data.deliveredCount,
        orderPrice: data.orderPrice,
        total: data.unpaidAmount,
        note: `صرف مستحقات لـ ${data.deliveredCount} طلب (سعر الطلب: ${data.orderPrice})`,
        userId: data.user.id,
        idCompany: companyId,
        date: new Date().toISOString()
      };

      const createResult = await salaryService.createSalary(salaryPayload);

      if (createResult.success) {
        toast.success('تم صرف المستحقات وتصفير العداد بنجاح');
        setSelectedUserForPayout(null);
        fetchData(); // Refresh data to show 0 due
      } else {
        toast.error('فشل إنشاء سجل الراتب');
      }
    } catch (error) {
      console.error(error);
      toast.error('حدث خطأ أثناء المعالجة');
    }
  };

  const fetchEmployeeOrders = async (userId: string, page: number) => {
    setLoadingOrders(true);
    try {
      const companyId = user?.company?.id;
      if (!companyId) return;

      const result = await orderService.getAllOrders(companyId, {
        advancedFilter: { idConfirmed: userId },
        pagination: { limit: ordersPerPage, page: page }
      });

      if (result.success) {
        setUserOrders(result.orders);
        setOrdersTotal(result.total || 0);
      } else {
        toast.error("فشل في جلب قائمة الطلبات");
      }
    } catch (error) {
      console.error(error);
      toast.error("حدث خطأ غير متوقع");
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleShowOrders = (userData: User) => {
    setSelectedUserForOrders(userData);
    setOrdersPage(1);
    setUserOrders([]);
    fetchEmployeeOrders(userData.id, 1);
  };

  const handlePageChangeOrders = (newPage: number) => {
    if (!selectedUserForOrders) return;
    setOrdersPage(newPage);
    fetchEmployeeOrders(selectedUserForOrders.id, newPage);
  };

  // @ts-ignore
  const paginatedData = activeTab === 'due'
    // @ts-ignore
    ? salariesData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
    : filteredPayouts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const totalPages = Math.ceil((activeTab === 'due' ? (salariesData.length || 0) : filteredPayouts.length) / itemsPerPage);

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-20 no-scrollbar">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">رواتب وعمولات الموظفين</h2>
          <p className="text-slate-400 text-xs font-bold uppercase mt-1 tracking-widest">إدارة العمولات بناءً على الطلبات الموصلة</p>
        </div>

        <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
          <button onClick={() => { setActiveTab('due'); setCurrentPage(1); }} className={`px-8 py-3 rounded-xl text-[11px] font-black uppercase transition-all flex items-center gap-2 ${activeTab === 'due' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>
            <Wallet className="w-4 h-4" /> المستحقات الحالية
          </button>
          <button onClick={() => { setActiveTab('history'); setCurrentPage(1); }} className={`px-8 py-3 rounded-xl text-[11px] font-black uppercase transition-all flex items-center gap-2 ${activeTab === 'history' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>
            <History className="w-4 h-4" /> سجل المدفوعات
          </button>
        </div>
      </div>

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-sm shrink-0">
            <DollarSign className="w-7 h-7" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">إجمالي المصروف</p>
            <h3 className="text-xl font-black text-slate-800 mt-0.5">{summaryStats.totalPaid.toLocaleString()} <span className="text-[10px]">دج</span></h3>
            <p className="text-[9px] font-bold text-emerald-600 mt-1 uppercase tracking-tighter">مدفوعات مؤرشفة</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-sm shrink-0">
            <AlertCircle className="w-7 h-7" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">عمولات معلقة</p>
            <h3 className="text-xl font-black text-slate-800 mt-0.5">{summaryStats.totalPending.toLocaleString()} <span className="text-[10px]">دج</span></h3>
            <p className="text-[9px] font-bold text-amber-600 mt-1 uppercase tracking-tighter">بانتظار الصرف</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-sm shrink-0">
            <Trophy className="w-7 h-7" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">الأفضل أداءً</p>
            <h3 className="text-xl font-black text-slate-800 mt-0.5 truncate max-w-[150px]">{summaryStats.bestConfirmer.name}</h3>
            <p className="text-[9px] font-bold text-indigo-600 mt-1 uppercase tracking-tighter">
              {summaryStats.bestConfirmer.count > 0 ? (
                <span className="bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">
                  {summaryStats.bestConfirmer.count.toLocaleString()} طلب ناجح
                </span>
              ) : 'بناءً على عدد الطلبات'}
            </p>
          </div>
        </div>
      </div>

      {/* Main Table Content */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/30">
          <div className="relative w-full max-w-sm">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="بحث باسم الموظف..." value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }} className="w-full pr-12 pl-5 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm" />
          </div>
        </div>

        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-slate-400 border-b border-slate-200">
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em]">{activeTab === 'due' ? 'الموظف' : 'رقم الراتب'}</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-center">الكمية</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-center">سعر الطلب</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-center">إجمالي المستحق</th>
                {activeTab === 'history' && <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-center">التاريخ</th>}
                <th className="px-8 py-5 text-center">الإجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedData.map((data: any) => (
                <tr key={data.id || data.user?.id} className="hover:bg-slate-50 transition-all group">
                  <td className="px-8 py-5">
                    {activeTab === 'due' ? (
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-lg">{data.user.name.charAt(0)}</div>
                        <div>
                          <p className="text-sm font-black text-slate-800 leading-none">{data.user.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold mt-1.5 uppercase italic">{data.user.email}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-600 font-black text-sm shadow-sm"><FileText className="w-5 h-5" /></div>
                        <div>
                          <span className="font-mono text-xs font-black text-indigo-600 tracking-widest">#{data.id.substring(data.id.length - 6)}</span>
                          <p className="text-[10px] text-slate-400 font-bold mt-1.5 uppercase">{data.user?.name}</p>
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className="text-xs font-black text-slate-700">{(activeTab === 'due' ? data.deliveredCount : data.ordersCount).toLocaleString()} طلب</span>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className="text-xs font-black text-slate-400">{(activeTab === 'due' ? data.orderPrice : data.orderPrice).toLocaleString()} دج</span>
                  </td>
                  <td className="px-6 py-5 text-center font-black text-indigo-600 font-mono">{(activeTab === 'due' ? data.unpaidAmount : (data.total || data.amount)).toLocaleString()} دج</td>
                  {activeTab === 'history' && (
                    <td className="px-6 py-5 text-center text-[10px] font-black text-slate-500">{new Date(data.date).toLocaleDateString('ar-SA')}</td>
                  )}
                  <td className="px-8 py-5 text-center">
                    {activeTab === 'due' ? (
                      <button onClick={() => setSelectedUserForPayout(data.user)} className="px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
                        صرف العمولات
                      </button>
                    ) : (
                      <div className="text-[10px] font-bold text-emerald-500">تم الدفع</div>
                    )}
                  </td>
                </tr>
              ))}
              {paginatedData.length === 0 && (
                <tr>
                  <td colSpan={activeTab === 'history' ? 6 : 5} className="py-8 text-center text-slate-400 text-xs font-bold">لابتوجد بيانات لعرضها</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-center items-center gap-4">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 disabled:opacity-30"><ChevronRight className="w-5 h-5" /></button>
            <div className="flex items-center gap-2">
              {[...Array(totalPages)].map((_, i) => (
                <button key={i} onClick={() => setCurrentPage(i + 1)} className={`w-10 h-10 rounded-xl text-[11px] font-black transition-all ${currentPage === i + 1 ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-white text-slate-400 border border-slate-200'}`}>{i + 1}</button>
              ))}
            </div>
            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 disabled:opacity-30"><ChevronLeft className="w-5 h-5" /></button>
          </div>
        )}
      </div>

      {selectedUserForPayout && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[99999] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[85vh] border border-slate-200">
            <div className="px-8 py-6 border-b border-slate-200 flex justify-between items-center bg-white shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-600/20"><DollarSign className="w-7 h-7" /></div>
                <div>
                  <h4 className="text-base font-black text-slate-800 tracking-tight leading-none">تأكيد صرف المستحقات</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-2 tracking-widest">{selectedUserForPayout.name}</p>
                </div>
              </div>
              <button onClick={() => setSelectedUserForPayout(null)} className="text-slate-400 hover:text-rose-500 p-3 rounded-2xl hover:bg-rose-50"><X className="w-6 h-6" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar bg-slate-50/20">
              <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-8 rounded-[2rem] text-white shadow-2xl shadow-indigo-600/30 flex flex-col items-center text-center">
                <p className="text-[10px] font-black text-indigo-200 uppercase tracking-[0.3em] mb-3">إجمالي مبلغ العمولة</p>
                <h3 className="text-4xl font-black font-mono tracking-tighter">
                  {/* @ts-ignore */}
                  {salariesData.find(d => d.user.id === selectedUserForPayout.id)?.unpaidAmount.toLocaleString()} <span className="text-sm opacity-60">دج</span>
                </h3>
                <div className="flex items-center gap-3 mt-6 text-[11px] font-black bg-white/10 px-6 py-2 rounded-2xl border border-white/10">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  {/* @ts-ignore */}
                  <span>تأكيد {salariesData.find(d => d.user.id === selectedUserForPayout.id)?.deliveredCount} طلب ناجح</span>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 text-amber-700">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p className="text-xs font-bold leading-relaxed">
                  تنبيه: عند تأكيد هذه العملية، سيتم إنشاء سجل دفع جديد وسيتم
                  <span className="font-black underline mx-1">تصفير عداد الطلبات الموصلة</span>
                  للموظف تلقائياً.
                </p>
              </div>

              <button
                onClick={() => handleShowOrders(selectedUserForPayout)}
                className="w-full py-3 bg-white border border-slate-200 text-slate-500 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-slate-50 hover:text-indigo-600 transition-all flex items-center justify-center gap-2"
              >
                <LayoutList className="w-4 h-4" /> استعراض قائمة الطلبات المؤكدة ({
                  // @ts-ignore
                  salariesData.find(d => d.user.id === selectedUserForPayout.id)?.deliveredCount || 0
                })
              </button>

            </div>

            <div className="p-8 border-t border-slate-200 bg-white shrink-0 flex gap-4">
              <button onClick={() => setSelectedUserForPayout(null)} className="flex-1 py-4 border border-slate-200 text-slate-400 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-slate-50 transition-all">إلغاء</button>
              <button onClick={() => handleProcessPayment(selectedUserForPayout.id)} className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black text-[12px] uppercase tracking-widest shadow-2xl shadow-indigo-600/30 hover:bg-indigo-700 transition-all active:scale-[0.98] flex items-center justify-center gap-3">
                تأكيد وتصفير العداد <Check className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>, document.body
      )}

      {selectedUserForOrders && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[99999] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col h-[85vh] border border-slate-200">
            <div className="px-8 py-6 border-b border-slate-200 flex justify-between items-center bg-white shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-sm"><LayoutList className="w-6 h-6" /></div>
                <div>
                  <h4 className="text-base font-black text-slate-800 tracking-tight leading-none">سجل الطلبات المؤكدة</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-2 tracking-widest">{selectedUserForOrders.name} - الصفحة {ordersPage}</p>
                </div>
              </div>
              <button onClick={() => setSelectedUserForOrders(null)} className="text-slate-400 hover:text-rose-500 p-3 rounded-2xl hover:bg-rose-50"><X className="w-6 h-6" /></button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar bg-slate-50/30 relative">
              {loadingOrders ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                </div>
              ) : userOrders.length > 0 ? (
                <div className="min-h-full flex flex-col">
                  <table className="w-full text-right border-collapse flex-1">
                    <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10 shadow-sm">
                      <tr>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">رقم الطلب</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">العميل</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">الحالة</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">التاريخ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {userOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 text-xs font-black text-indigo-600 font-mono">
                            {order.numberOrder || order.id?.substring(0, 8)}
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-xs font-bold text-slate-700">{order.fullName}</p>
                            <p className="text-[10px] text-slate-400">{order.phone}</p>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className="px-2.5 py-1 rounded-lg text-[10px] font-black"
                              style={{
                                backgroundColor: (order.status?.color || '#cbd5e1') + '20',
                                color: order.status?.color || '#64748b'
                              }}
                            >
                              {order.status?.nameAR || 'غير محدد'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-[10px] font-bold text-slate-400">
                            {new Date(order.createdAt).toLocaleDateString('ar-SA')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Pagination Stats inside Modal */}
                  {Math.ceil(ordersTotal / ordersPerPage) > 1 && (
                    <div className="p-4 bg-white border-t border-slate-200 flex justify-center items-center gap-4 sticky bottom-0 z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                      <button
                        disabled={ordersPage === 1}
                        onClick={() => handlePageChangeOrders(ordersPage - 1)}
                        className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-400 hover:text-indigo-600 disabled:opacity-30 disabled:hover:text-slate-400"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                      <span className="text-[10px] font-black text-slate-400">
                        صفحة {ordersPage} من {Math.ceil(ordersTotal / ordersPerPage)}
                      </span>
                      <button
                        disabled={ordersPage === Math.ceil(ordersTotal / ordersPerPage)}
                        onClick={() => handlePageChangeOrders(ordersPage + 1)}
                        className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-400 hover:text-indigo-600 disabled:opacity-30 disabled:hover:text-slate-400"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                    </div>
                  )}

                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <Package className="w-12 h-12 mb-4 opacity-20" />
                  <p className="text-xs font-bold">لا توجد طلبات مؤكدة لهذا الموظف</p>
                </div>
              )}
            </div>
          </div>
        </div>, document.body
      )}

    </div>
  );
};

export default SalariesView;
