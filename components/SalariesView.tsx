import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { User, Payout } from '../types';
import {
  Wallet, TrendingUp, Users, CheckCircle2, ChevronLeft,
  Search, Eye, Printer, X, CreditCard, DollarSign,
  History, FileText, Package, Globe, Building, Check,
  ChevronRight, Filter, AlertCircle, Calendar, ArrowUpRight,
  ClipboardCheck, Sparkles, LayoutList, ArrowRight, ListOrdered, Trophy,
  Loader2, CheckSquare, Square
} from 'lucide-react';
import TableSkeleton from './common/TableSkeleton';
import { PaginationControl, DeleteConfirmationModal } from './common';
import { salaryService, userService, orderService } from '../services/apiService';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { Trash2 } from 'lucide-react';

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
  const [ordersPerPage, setOrdersPerPage] = useState(10);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Selection Logic for Payout
  const [isPayoutMode, setIsPayoutMode] = useState(false);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);

  // Delete Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [salaryToDelete, setSalaryToDelete] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const companyId = user?.company?.id;

      if (!companyId) return;
      setLoading(true);

      // 1. Fetch Users
      const usersResult = await userService.getAllUsers();
      if (usersResult.success) {
        // Filter for confirmed users (employees)
        // Adjust role check if needed, e.g. includes or strict equality
        setUsers(usersResult.users.filter((u: any) => u.role === 'confirmed' || u.role === 'user'));
      }

      // 2. Fetch Payouts (History)
      // We fetch a large limit to allow clientside stats calculation (Best Performer)
      const salariesResult = await salaryService.getAllSalaries({ pagination: { limit: 1000, page: 1 } });
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
  }, [user]);

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

  const [isProcessing, setIsProcessing] = useState(false);

  // Handle Logic for Payment Processing
  const handleProcessPayment = async () => {
    if (!selectedUserForOrders) return;
    const userId = selectedUserForOrders.id;

    // Calculate totals from selected orders
    const selectedOrders = userOrders.filter(o => selectedOrderIds.includes(o.id));
    // If not all loaded, we might need a safer way, but we only select from loaded. 
    // Wait, selection across pages is hard. Let's assume selection from CURRENT functionality is required.
    // Ideally we pass just IDs and backend calculates? But we need to show total on Frontend.
    // For now, let's assume we pay based on IDs.

    // We need to know the 'orderPrice' for the user to calculate total.
    // @ts-ignore
    const userSalaryData = salariesData.find(d => d.user.id === userId);
    const orderPrice = userSalaryData?.orderPrice || 0;

    const count = selectedOrderIds.length;
    const amount = count * orderPrice;

    if (count === 0) {
      toast.error("يرجى تحديد طلب واحد على الأقل");
      return;
    }

    setIsProcessing(true);
    try {
      // 1. Create Salary Record
      const salaryPayload = {
        ordersCount: count,
        orderPrice: orderPrice,
        total: amount,
        note: `صرف مستحقات لـ ${count} طلب (سعر الطلب: ${orderPrice})`,
        userId: userId,
        idsOrder: selectedOrderIds,
        date: new Date().toISOString()
      };

      const createResult = await salaryService.createSalary(salaryPayload);

      if (createResult.success) {
        toast.success('تم صرف المستحقات وتصفير العداد بنجاح');
        setSelectedUserForOrders(null);
        fetchData(); // Refresh data to show 0 due
      } else {
        toast.error('فشل إنشاء سجل الراتب');
      }
    } catch (error) {
      console.error(error);
      toast.error('حدث خطأ أثناء المعالجة');
    } finally {
      setIsProcessing(false);
    }
  };

  const fetchEmployeeOrders = async (userId: string, page: number, mode: boolean = isPayoutMode) => {
    setLoadingOrders(true);
    try {
      const companyId = user?.company?.id;
      if (!companyId) return;

      const filter = mode
        ? { idConfirmed: userId, isDelivered: true, "commissions.0": { $exists: false } }
        : { idConfirmed: userId, isDelivered: true };

      const result = await orderService.getAllOrders({
        advancedFilter: filter,
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



  const handleDeleteClick = (id: string) => {
    setSalaryToDelete(id);
    setDeleteModalOpen(true);
  };

  const confirmDeleteSalary = async () => {
    if (!salaryToDelete) return;

    setLoading(true); // Or separate deleting state if preferred to not block whole table
    try {
      const result = await salaryService.deleteSalary(salaryToDelete);
      if (result.success) {
        toast.success("تم حذف الراتب بنجاح");
        fetchData();
        setDeleteModalOpen(false);
        setSalaryToDelete(null);
      } else {
        toast.error("فشل في حذف الراتب");
      }
    } catch (error) {
      console.error(error);
      toast.error("حدث خطأ ما");
    } finally {
      setLoading(false);
    }
  };



  const handleShowOrders = (userData: User, payoutMode: boolean = false) => {
    setSelectedUserForOrders(userData);
    setIsPayoutMode(payoutMode);
    setSelectedOrderIds([]); // Reset selection
    setOrdersPage(1);
    setUserOrders([]);
    // We need to set the state first before fetching? 
    // Fetch relies on isPayoutMode state? NO, fetchEmployeeOrders uses the param or state.
    // But `fetchEmployeeOrders` is defined outside. It reads `isPayoutMode` from closure?
    // Closure capture might be stale if called immediately.
    // Better to pass mode to fetch function.

    // Slight Refactor: pass mode to fetch
    fetchEmployeeOrders(userData.id, 1, payoutMode);
  };


  const handlePageChangeOrders = (newPage: number) => {
    if (!selectedUserForOrders) return;
    setOrdersPage(newPage);
    fetchEmployeeOrders(selectedUserForOrders.id, newPage);
  };

  // Re-fetch when orders limit changes
  const handleOrderLimitChange = (newLimit: number) => {
    setOrdersPerPage(newLimit);
    setOrdersPage(1);
    if (selectedUserForOrders) {
      // We need to fetch immediately with new limit
      // fetchEmployeeOrders uses state ordersPerPage which might not be updated yet?
      // Actually useState update is async.
      // Better to just update state and let useEffect handle it if we had one, or call fetch with new limit.
      // Since fetch uses the state variable, we should ideally pass the limit to fetch function.
      // Let's modify fetchEmployeeOrders signature or just call it after timeout?
      // Cleaner: modify fetchEmployeeOrders to accept limit override
    }
    // Actually, standard pattern: useEffect on ordersPerPage?
    // But fetchEmployeeOrders is called manually.
    // Let's just use effect for selectedUserForOrders + page + limit?
  };

  useEffect(() => {
    if (selectedUserForOrders) {
      fetchEmployeeOrders(selectedUserForOrders.id, ordersPage);
    }
  }, [ordersPerPage]);

  // @ts-ignore
  const paginatedData = activeTab === 'due'
    // @ts-ignore
    ? salariesData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
    : filteredPayouts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const totalPages = Math.ceil((activeTab === 'due' ? (salariesData.length || 0) : filteredPayouts.length) / itemsPerPage);



  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-20 no-scrollbar">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">رواتب وعمولات الموظفين</h2>
          <p className="text-slate-400 text-xs font-bold uppercase mt-1 tracking-widest">إدارة العمولات بناءً على الطلبات الموصلة</p>
        </div>

        <div className="flex bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm">
          <button onClick={() => { setActiveTab('due'); setCurrentPage(1); }} className={`px-8 py-3 rounded-lg text-[11px] font-black uppercase transition-all flex items-center gap-2 ${activeTab === 'due' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>
            <Wallet className="w-4 h-4" /> المستحقات الحالية
          </button>
          <button onClick={() => { setActiveTab('history'); setCurrentPage(1); }} className={`px-8 py-3 rounded-lg text-[11px] font-black uppercase transition-all flex items-center gap-2 ${activeTab === 'history' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>
            <History className="w-4 h-4" /> سجل المدفوعات
          </button>
        </div>
      </div>

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-sm shrink-0">
            <DollarSign className="w-7 h-7" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">إجمالي المصروف</p>
            <h3 className="text-xl font-black text-slate-800 mt-0.5">{summaryStats.totalPaid.toLocaleString()} <span className="text-[10px]">دج</span></h3>
            <p className="text-[9px] font-bold text-emerald-600 mt-1 uppercase tracking-tighter">مدفوعات مؤرشفة</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-sm shrink-0">
            <AlertCircle className="w-7 h-7" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">عمولات معلقة</p>
            <h3 className="text-xl font-black text-slate-800 mt-0.5">{summaryStats.totalPending.toLocaleString()} <span className="text-[10px]">دج</span></h3>
            <p className="text-[9px] font-bold text-amber-600 mt-1 uppercase tracking-tighter">بانتظار الصرف</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-sm shrink-0">
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
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/30">
          <div className="relative w-full max-w-sm">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="بحث باسم الموظف..." value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }} className="w-full pr-12 pl-5 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm" />
          </div>
        </div>

        <div className="overflow-x-auto no-scrollbar">
          {loading && users.length === 0 ? (
            <div className="p-6">
              <TableSkeleton columns={6} rows={8} />
            </div>
          ) : (
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 border-b border-slate-200">
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em]">{activeTab === 'due' ? 'الموظف' : 'رقم الراتب'}</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-center">الكمية</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-center">سعر الطلب</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-center">إجمالي المستحق</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-center">الحالة</th>
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
                          <div className="w-11 h-11 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-lg">{data.user.name.charAt(0)}</div>
                          <div>
                            <p className="text-sm font-black text-slate-800 leading-none">{data.user.name}</p>
                            <p className="text-[10px] text-slate-400 font-bold mt-1.5 uppercase italic">{data.user.email}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-4">
                          <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 font-black text-sm shadow-sm"><FileText className="w-5 h-5" /></div>
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
                    <td className="px-6 py-5 text-center">
                      {activeTab === 'due' ? (
                        <span className="text-[10px] font-bold text-amber-500 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-100">بانتظار الصرف</span>
                      ) : (
                        <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100">مدفوعة</span>
                      )}
                    </td>
                    {activeTab === 'history' && (
                      <td className="px-6 py-5 text-center text-[10px] font-black text-slate-500">{new Date(data.date).toLocaleDateString('ar')}</td>
                    )}
                    <td className="px-8 py-5 text-center">
                      {activeTab === 'due' ? (
                        <div className="flex gap-2 justify-center">
                          <button onClick={() => handleShowOrders(data.user, true)} className="px-6 py-3 bg-indigo-600 text-white border border-indigo-600 rounded-lg text-[10px] font-black uppercase hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2">
                            <DollarSign className="w-3 h-3" /> صرف العمولات
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleDeleteClick(data.id)}
                            className="w-8 h-8 flex items-center justify-center rounded-md text-rose-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                            title="حذف السجل"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {paginatedData.length === 0 && (
                  <tr>
                    <td colSpan={activeTab === 'history' ? 7 : 6} className="py-8 text-center text-slate-400 text-xs font-bold">لابتوجد بيانات لعرضها</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {
          totalPages > 1 && (
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-center items-center gap-4">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="p-2.5 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 disabled:opacity-30"><ChevronRight className="w-5 h-5" /></button>
              <div className="flex items-center gap-2">
                {[...Array(totalPages)].map((_, i) => (
                  <button key={i} onClick={() => setCurrentPage(i + 1)} className={`w-10 h-10 rounded-lg text-[11px] font-black transition-all ${currentPage === i + 1 ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-white text-slate-400 border border-slate-200'}`}>{i + 1}</button>
                ))}
              </div>
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="p-2.5 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 disabled:opacity-30"><ChevronLeft className="w-5 h-5" /></button>
            </div>
          )
        }
      </div >


      {selectedUserForOrders && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[99999] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col h-[85vh] border border-slate-200">
            <div className="px-8 py-6 border-b border-slate-200 flex justify-between items-center bg-white shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-sm"><LayoutList className="w-6 h-6" /></div>
                <div>
                  <h4 className="text-base font-black text-slate-800 tracking-tight leading-none">{isPayoutMode ? 'اختيار الطلبات للصرف' : 'سجل الطلبات المؤكدة'}</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-2 tracking-widest">{selectedUserForOrders.name} - الصفحة {ordersPage}</p>
                </div>
              </div>
              <button onClick={() => setSelectedUserForOrders(null)} className="text-slate-400 hover:text-rose-500 p-3 rounded-xl hover:bg-rose-50"><X className="w-6 h-6" /></button>
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
                        {isPayoutMode && (
                          <th className="px-6 py-4 w-16">
                            <button
                              onClick={() => {
                                // Select All logic for CURRENT page
                                const allIds = userOrders.map(o => o.id);
                                const allSelected = allIds.every(id => selectedOrderIds.includes(id));
                                if (allSelected) {
                                  setSelectedOrderIds(prev => prev.filter(id => !allIds.includes(id)));
                                } else {
                                  setSelectedOrderIds(prev => [...prev.filter(id => !allIds.includes(id)), ...allIds]);
                                }
                              }}
                              className="w-5 h-5 rounded-md border-2 border-slate-300 flex items-center justify-center text-indigo-600 hover:border-indigo-600 transition-colors"
                            >
                              {/* Check if all visible are selected */
                                userOrders.every(o => selectedOrderIds.includes(o.id)) && <CheckSquare className="w-4 h-4" />
                              }
                            </button>
                          </th>
                        )}
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">رقم الطلب</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">العميل</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">الحالة</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">التاريخ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {userOrders.map((order) => {
                        const isSelected = selectedOrderIds.includes(order.id);
                        return (
                          <tr key={order.id}
                            onClick={() => {
                              if (!isPayoutMode) return;
                              if (isSelected) {
                                setSelectedOrderIds(prev => prev.filter(id => id !== order.id));
                              } else {
                                setSelectedOrderIds(prev => [...prev, order.id]);
                              }
                            }}
                            className={`hover:bg-slate-50/50 transition-colors cursor-pointer ${isSelected ? 'bg-indigo-50/50' : ''}`}
                          >
                            {isPayoutMode && (
                              <td className="px-6 py-4">
                                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${isSelected ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-200 bg-white'}`}>
                                  {isSelected && <Check className="w-3 h-3" />}
                                </div>
                              </td>
                            )}
                            <td className="px-6 py-4 text-xs font-black text-indigo-600 font-mono">
                              {order.numberOrder || order.id?.substring(0, 8)}
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-xs font-bold text-slate-700">{order.fullName}</p>
                              <p className="text-[10px] text-slate-400">{order.phone}</p>
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className="px-2.5 py-1 rounded-md text-[10px] font-black"
                                style={{
                                  backgroundColor: (order.status?.color || '#cbd5e1') + '20',
                                  color: order.status?.color || '#64748b'
                                }}
                              >
                                {order.status?.nameAR || 'غير محدد'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-[10px] font-bold text-slate-400">
                              {new Date(order.createdAt).toLocaleDateString('ar')}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>

                  {/* Pagination Stats inside Modal */}
                  <div className="sticky bottom-0 z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] bg-slate-50 border-t border-slate-200">
                    <div className="flex flex-col">
                      <PaginationControl
                        currentPage={ordersPage}
                        totalPages={Math.ceil(ordersTotal / ordersPerPage)}
                        onPageChange={handlePageChangeOrders}
                        limit={ordersPerPage}
                        onLimitChange={setOrdersPerPage}
                        totalItems={ordersTotal}
                        isLoading={loadingOrders}
                      />

                      {isPayoutMode && (
                        <div className="px-8 py-4 border-t border-slate-200 bg-white flex justify-between items-center gap-6">
                          <div className="flex items-center gap-6">
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">عدد الطلبات المختارة</p>
                              <p className="text-lg font-black text-slate-800">{selectedOrderIds.length} <span className="text-xs text-slate-400">طلب</span></p>
                            </div>
                            <div className="h-8 w-px bg-slate-100"></div>
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">المبلغ الإجمالي</p>
                              {/* Need to get orderPrice from context. salariesData might not be efficient to search. But we have selectedUserForOrders. 
                                   We can find it in salariesData or assume we have it. 
                                   salariesData available in scope. 
                               */}
                              <p className="text-lg font-black text-indigo-600 font-mono">
                                {(() => {
                                  // @ts-ignore
                                  const userSalaryData = salariesData.find(d => d.user.id === selectedUserForOrders.id);
                                  const price = userSalaryData?.orderPrice || 0;
                                  return (selectedOrderIds.length * price).toLocaleString();
                                })()} <span className="text-xs text-indigo-400">دج</span>
                              </p>
                            </div>
                          </div>

                          <button
                            onClick={handleProcessPayment}
                            disabled={selectedOrderIds.length === 0 || isProcessing}
                            className="px-8 py-4 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20 disabled:opacity-50 disabled:shadow-none flex items-center gap-3">
                            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <DollarSign className="w-4 h-4" />}
                            تأكيد وصرف ({selectedOrderIds.length})
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <Package className="w-12 h-12 mb-4 opacity-20" />
                  <p className="text-xs font-bold">لا توجد طلبات {isPayoutMode ? 'مستحقة للدفع' : 'مؤكدة'}</p>
                </div>
              )}
            </div>
          </div>
        </div>, document.body
      )}

      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => { setDeleteModalOpen(false); setSalaryToDelete(null); }}
        onConfirm={confirmDeleteSalary}
        title="حذف سجل الراتب"
        description='هل أنت متأكد من حذف هذا السجل؟ سيتم إعادة جميع الطلبات المرتبطة به إلى حالة "غير مدفوعة" ويمكنك دفعها لاحقاً.'
        isDeleting={loading}
      />

    </div>
  );
};

export default SalariesView;
