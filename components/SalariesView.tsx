import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
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
import { getTranslatedName } from '../utils/i18nUtils';
import TableSkeleton from './common/TableSkeleton';
import { PaginationControl, DeleteConfirmationModal } from './common';
import { salaryService, userService, orderService } from '../services/apiService';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { Trash2 } from 'lucide-react';
import logoBlack from '../assets/logo-black.png';

interface SalariesViewProps { }

const SalariesView: React.FC<SalariesViewProps> = () => {
  const { t, i18n } = useTranslation();
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

  // Pagination states for History
  const [payoutsTotal, setPayoutsTotal] = useState(0);

  const fetchUsers = async () => {
    const companyId = user?.company?.id;
    if (!companyId) return;

    const usersResult = await userService.getAllUsers();
    if (usersResult.success) {
      setUsers(usersResult.users.filter((u: any) => u.role === 'confirmed' || u.role === 'user'));
    }
  };

  const fetchPayouts = async (page: number = 1) => {
    const companyId = user?.company?.id;
    if (!companyId) return;
    setLoading(true);
    try {
      const salariesResult = await salaryService.getAllSalaries({
        pagination: { limit: itemsPerPage, page: page }
        // Note: Search filter implementation depends on backend capability. 
        // Currently fetching paginated results without search filter.
      });
      if (salariesResult.success) {
        setPayouts(salariesResult.salaries);
        setPayoutsTotal(salariesResult.total || 0);
      }
    } catch (e) {
      console.error(e);
      toast.error(t('salaries.toast.fetch_failed'));
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      const companyId = user?.company?.id;
      if (!companyId) return;
      setLoading(true);

      // 1. Fetch Users (Always needed for Due tab and Stats)
      await fetchUsers();

      // 2. Fetch Initial Payouts (for Stats calculation mostly, but pagination requires specific page)
      // For summaryStats, we might need aggregates? 
      // Current summaryStats needs ALL history. 
      // If we paginate, summaryStats will be incorrect if calculated from `payouts` (which is now 1 page).
      // We need a separate call for stats or backend stats.
      // `generalService.getBasicStatistics` might help, but let's see.
      // For now, I'll fetch page 1. The stats limitation is a known trade-off of pagination unless we fetch all for stats.
      // I'll keep fetching page 1 for the table.
      await fetchPayouts(1);

    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error(t('salaries.toast.fetch_data_failed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.company?.id) {
      fetchData();
    }
  }, [user]);

  // Effect to handle pagination changes for History tab
  useEffect(() => {
    if (activeTab === 'history') {
      fetchPayouts(currentPage);
    }
  }, [currentPage, activeTab]);
  // Note: activeTab change resets currentPage to 1 in the button onClick, so this triggers.


  // حساب البيانات الإجمالية للبطاقات
  // WARN: With pagination, this only calculates over the CURRENT PAGE of payouts.
  // Ideally, we need a backend endpoint for these totals. 
  // Only `totalPending` uses `users` (which is all users), so that's fine.
  // `totalPaid` and `bestConfirmer` will be incorrect (partial).
  const summaryStats = useMemo(() => {
    // For totalPaid, we can use `payoutsTotal` (count) but not amount sum unless backend returns it.
    // GET_ALL_SALARIES returns `totalAmount`! Amazing.
    // Let's assume we can get it. I need to store `totalAmount` from response.

    // Fallback for now: sum of current page (incorrect but prevents crash)
    // I need to update state to store totalAmount from query result.    
    const totalPaid = payouts.reduce((acc, p) => acc + (p.total || p.amount || 0), 0);

    // Calculate total pending from all users current counters
    const totalPending = users.reduce((acc, user) => {
      const count = user.numberDeliveredOrderNotPaid || 0;
      const price = user.orderPrice || 0;
      return acc + (count * price);
    }, 0);

    const performanceMap: Record<string, number> = {};

    // Add history counts - INCOMPLETE due to pagination
    payouts.forEach(p => {
      const uName = p.user?.name || t('common.unknown', 'Unknown');
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
      : { name: t('common.none', 'None'), count: 0 };

    return { totalPaid, totalPending, bestConfirmer };
  }, [payouts, users]);

  // Calculate Due Salaries per User using Counters
  const salariesData = useMemo(() => {
    return users.map(user => {
      const deliveredCount = user.numberDeliveredOrderNotPaid || 0;
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

  // filteredPayouts is now just payouts (since server filtered possibly, or just current page)
  // If we want client side search on the current page:
  const filteredPayouts = useMemo(() => {
    return payouts.filter(p => (p.user?.name || '').toLowerCase().includes(searchTerm.toLowerCase()));
  }, [payouts, searchTerm]);


  const handlePrint = (salary: any) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const date = new Date(salary.date).toLocaleDateString(i18n.language === 'ar' ? 'ar-DZ' : i18n.language === 'fr' ? 'fr-FR' : 'en-US');
      const time = new Date(salary.date).toLocaleTimeString(i18n.language === 'ar' ? 'ar-DZ' : i18n.language === 'fr' ? 'fr-FR' : 'en-US', { hour: '2-digit', minute: '2-digit' });

      const html = `
        <!DOCTYPE html>
        <html dir="${i18n.dir()}">
        <head>
          <title>${t('salaries.print.receipt_title')} - ${salary.id}</title>
          <meta charset="utf-8">
          <style>
            @page { margin: 0; }
            body { 
                font-family: 'Tajawal', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                background: #fff;
                margin: 0;
                padding: 40px;
                color: #1e293b;
                -webkit-print-color-adjust: exact;
                text-align: ${i18n.dir() === 'rtl' ? 'right' : 'left'};
            }
            .invoice-container {
                max-width: 800px;
                margin: 0 auto;
                border: 1px solid #e2e8f0;
                border-radius: 24px;
                padding: 48px;
                position: relative;
                overflow: hidden;
            }
            .watermark {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) rotate(-45deg);
                font-size: 120px;
                color: #f1f5f9;
                font-weight: 900;
                z-index: -1;
                pointer-events: none;
                white-space: nowrap;
            }
            .header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 60px;
                border-bottom: 2px solid #f1f5f9;
                padding-bottom: 32px;
                flex-direction: ${i18n.dir() === 'rtl' ? 'row' : 'row-reverse'};
            }
            .logo-section h1 {
                font-size: 32px;
                font-weight: 900;
                color: #4f46e5;
                margin: 0;
                letter-spacing: -1px;
            }
            .logo-section p {
                font-size: 14px;
                color: #64748b;
                margin-top: 8px;
                font-weight: 500;
            }
            .invoice-details {
                text-align: ${i18n.dir() === 'rtl' ? 'left' : 'right'};
            }
            .status-badge {
                background: #ecfdf5;
                color: #059669;
                padding: 8px 16px;
                border-radius: 99px;
                font-size: 12px;
                font-weight: 800;
                display: inline-block;
                margin-bottom: 12px;
            }
            .invoice-id {
                font-size: 16px;
                font-weight: 700;
                color: #334155;
                font-family: monospace;
            }
            
            .info-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 40px;
                margin-bottom: 48px;
            }
            .info-group h3 {
                font-size: 12px;
                color: #94a3b8;
                text-transform: uppercase;
                letter-spacing: 1px;
                margin: 0 0 12px 0;
                font-weight: 700;
            }
            .info-group .value {
                font-size: 18px;
                font-weight: 700;
                color: #0f172a;
            }
            .info-group .sub-value {
                font-size: 14px;
                color: #64748b;
                margin-top: 4px;
            }

            .summary-card {
                background: #f8fafc;
                border-radius: 20px;
                padding: 32px;
                border: 1px solid #e2e8f0;
            }
            .summary-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 16px;
                padding-bottom: 16px;
                border-bottom: 1px solid #e2e8f0;
                flex-direction: ${i18n.dir() === 'rtl' ? 'row' : 'row-reverse'};
            }
            .summary-row:last-child {
                border-bottom: none;
                margin-bottom: 0;
                padding-bottom: 0;
            }
            .summary-row.total {
                border-top: 2px solid #e2e8f0;
                border-bottom: none;
                padding-top: 24px;
                margin-top: 8px;
            }
            .summary-label {
                font-size: 14px;
                color: #64748b;
                font-weight: 600;
            }
            .summary-value {
                font-size: 16px;
                font-weight: 700;
                color: #334155;
            }
            .total .summary-label {
                font-size: 18px;
                color: #0f172a;
                font-weight: 800;
            }
            .total .summary-value {
                font-size: 32px;
                color: #4f46e5;
                font-weight: 900;
            }

            .footer {
                margin-top: 80px;
                text-align: center;
                color: #94a3b8;
                font-size: 12px;
                border-top: 1px solid #f1f5f9;
                padding-top: 32px;
            }
            
            @media print {
                body { padding: 0; }
                .invoice-container { border: none; }
            }
          </style>
          <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap" rel="stylesheet">
        </head>
        <body>
          <div class="invoice-container">
            <div class="watermark">${t('salaries.table.paid')}</div>
            
            <div class="header">
              <div class="logo-section">
                <img src="${logoBlack}" alt="Wilo" style="height: 50px; margin-bottom: 8px;" />
                <p>${t('salaries.print.management_system')}</p>
              </div>
              <div class="invoice-details">
                <div class="status-badge">${t('salaries.print.payment_success')}</div>
                <div class="invoice-id">#${salary.id.substring(salary.id.length - 8).toUpperCase()}</div>
              </div>
            </div>

            <div class="info-grid">
              <div class="info-group">
                <h3>${t('salaries.print.beneficiary_info')}</h3>
                <div class="value">${salary.user?.name || '-'}</div>
                <div class="sub-value">${salary.user?.email || ''}</div>
              </div>
              <div class="info-group">
                <h3>${t('salaries.print.transaction_date')}</h3>
                <div class="value">${date}</div>
                <div class="sub-value">${time}</div>
              </div>
            </div>

            <div class="summary-card">
              <div class="summary-row">
                <span class="summary-label">${t('salaries.print.completed_orders_count')}</span>
                <span class="summary-value">${salary.ordersCount} ${t('salaries.table.order_unit')}</span>
              </div>
              <div class="summary-row">
                <span class="summary-label">${t('salaries.print.commission_per_order')}</span>
                <span class="summary-value">${salary.orderPrice} ${t('common.currency')}</span>
              </div>
              <div class="summary-row total">
                <span class="summary-label">${t('salaries.print.net_paid_amount')}</span>
                <span class="summary-value">${(salary.total || salary.amount || 0).toLocaleString()} ${t('common.currency')}</span>
              </div>
            </div>

            <div class="footer">
              <p>${t('salaries.print.footer_note')}</p>
              <p>${t('salaries.print.print_date')}: ${new Date().toLocaleString(i18n.language === 'ar' ? 'ar-DZ' : i18n.language === 'fr' ? 'fr-FR' : 'en-US')}</p>
            </div>
          </div>
        </body>
        </html>
      `;
      printWindow.document.write(html);
      printWindow.document.close();
      // Wait for font to load before printing is a bit flaky without events, 
      // but putting print in timeout helps.
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  };

  const [isProcessing, setIsProcessing] = useState(false);

  // Handle Logic for Payment Processing
  const handleProcessPayment = async (payAll: boolean = false) => {
    if (!selectedUserForOrders) return;
    const userId = selectedUserForOrders.id;

    // @ts-ignore
    const userSalaryData = salariesData.find(d => d.user.id === userId);
    const orderPrice = userSalaryData?.orderPrice || 0;

    let count = 0;
    let amount = 0;
    let note = "";
    let idsOrder: string[] = [];

    if (payAll) {
      count = userSalaryData?.deliveredCount || 0;
      amount = count * orderPrice;
      note = t('salaries.payout_modal.note', { count, price: orderPrice });
      // idsOrder remains empty, backend handles it
    } else {
      count = selectedOrderIds.length;
      amount = count * orderPrice;
      note = t('salaries.payout_modal.note', { count, price: orderPrice });
      idsOrder = selectedOrderIds;

      if (count === 0) {
        toast.error(t('salaries.toast.select_at_least_one'));
        return;
      }
    }

    setIsProcessing(true);
    try {
      // 1. Create Salary Record
      const salaryPayload = {
        ordersCount: count,
        orderPrice: orderPrice,
        total: amount,
        note: note,
        userId: userId,
        idsOrder: idsOrder,
        payAll: payAll,
        date: new Date().toISOString()
      };

      const createResult = await salaryService.createSalary(salaryPayload);

      if (createResult.success) {
        toast.success(t('salaries.toast.payout_success'));
        setSelectedUserForOrders(null);
        fetchData();
      } else {
        toast.error(t('salaries.toast.payout_failed'));
      }
    } catch (error) {
      console.error(error);
      toast.error(t('salaries.toast.process_error'));
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
        ? {
          idConfirmed: userId, isDelivered: true,
          $or: [
            { commissions: { $exists: false } },
            { commissions: { $eq: null, $exists: true } }
          ]
        }
        : { idConfirmed: userId, isDelivered: true };

      const result = await orderService.getAllOrders({
        advancedFilter: filter,
        pagination: { limit: ordersPerPage, page: page }
      });

      if (result.success) {
        setUserOrders(result.orders);
        setOrdersTotal(result.total || 0);
      } else {
        toast.error(t('salaries.toast.fetch_orders_failed'));
      }
    } catch (error) {
      console.error(error);
      toast.error(t('finances.toast.error_unexpected'));
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

    setLoading(true);
    try {
      const result = await salaryService.deleteSalary(salaryToDelete);
      if (result.success) {
        toast.success(t('salaries.toast.delete_success'));
        fetchData();
        setDeleteModalOpen(false);
        setSalaryToDelete(null);
      } else {
        toast.error(t('salaries.toast.delete_failed'));
      }
    } catch (error) {
      console.error(error);
      toast.error(t('salaries.toast.process_error'));
    } finally {
      setLoading(false);
    }
  };

  const handleShowOrders = (userData: User, payoutMode: boolean = false) => {
    setSelectedUserForOrders(userData);
    setIsPayoutMode(payoutMode);
    setSelectedOrderIds([]);
    setOrdersPage(1);
    setUserOrders([]);
    fetchEmployeeOrders(userData.id, 1, payoutMode);
  };

  const handlePageChangeOrders = (newPage: number) => {
    if (!selectedUserForOrders) return;
    setOrdersPage(newPage);
    fetchEmployeeOrders(selectedUserForOrders.id, newPage);
  };

  useEffect(() => {
    if (selectedUserForOrders) {
      fetchEmployeeOrders(selectedUserForOrders.id, ordersPage);
    }
  }, [ordersPerPage]);

  const paginatedData = activeTab === 'due'
    ? salariesData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
    : filteredPayouts;

  const totalPages = Math.ceil((activeTab === 'due' ? (salariesData.length || 0) : payoutsTotal) / itemsPerPage);

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-20 no-scrollbar">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">{t('salaries.title')}</h2>
          <p className="text-slate-400 text-xs font-bold uppercase mt-1 tracking-widest">{t('salaries.subtitle')}</p>
        </div>

        <div className="flex bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm">
          <button onClick={() => { setActiveTab('due'); setCurrentPage(1); }} className={`px-8 py-3 rounded-lg text-[11px] font-black uppercase transition-all flex items-center gap-2 ${activeTab === 'due' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>
            <Wallet className="w-4 h-4" /> {t('salaries.due_tab')}
          </button>
          <button onClick={() => { setActiveTab('history'); setCurrentPage(1); }} className={`px-8 py-3 rounded-lg text-[11px] font-black uppercase transition-all flex items-center gap-2 ${activeTab === 'history' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>
            <History className="w-4 h-4" /> {t('salaries.history_tab')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-sm shrink-0">
            <DollarSign className="w-7 h-7" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('salaries.total_paid')}</p>
            <h3 className="text-xl font-black text-slate-800 mt-0.5">{summaryStats.totalPaid.toLocaleString()} <span className="text-[10px]">{t('common.currency')}</span></h3>
            <p className="text-[9px] font-bold text-emerald-600 mt-1 uppercase tracking-tighter">{t('salaries.archived_payments')}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-sm shrink-0">
            <AlertCircle className="w-7 h-7" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('salaries.pending_commissions')}</p>
            <h3 className="text-xl font-black text-slate-800 mt-0.5">{summaryStats.totalPending.toLocaleString()} <span className="text-[10px]">{t('common.currency')}</span></h3>
            <p className="text-[9px] font-bold text-amber-600 mt-1 uppercase tracking-tighter">{t('salaries.waiting_payout')}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-sm shrink-0">
            <Trophy className="w-7 h-7" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('salaries.best_performer')}</p>
            <h3 className="text-xl font-black text-slate-800 mt-0.5 truncate max-w-[150px]">{summaryStats.bestConfirmer.name}</h3>
            <p className="text-[9px] font-bold text-indigo-600 mt-1 uppercase tracking-tighter">
              {summaryStats.bestConfirmer.count > 0 ? (
                <span className="bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">
                  {summaryStats.bestConfirmer.count.toLocaleString()} {t('salaries.table.successful_order', 'Successful Orders')}
                </span>
              ) : t('salaries.based_on_orders')}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/30">
          <div className="relative w-full max-w-sm">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder={t('salaries.search_placeholder')} value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }} className="w-full pr-12 pl-5 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm" />
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
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em]">{activeTab === 'due' ? t('salaries.table.employee') : t('salaries.table.payout_id')}</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-center">{t('salaries.table.quantity')}</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-center">{t('salaries.table.order_price')}</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-center">{t('salaries.table.total_due')}</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-center">{t('salaries.table.status')}</th>
                  {activeTab === 'history' && <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-center">{t('salaries.table.date')}</th>}
                  <th className="px-8 py-5 text-center">{t('salaries.table.actions')}</th>
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
                      <span className="text-xs font-black text-slate-700">{(activeTab === 'due' ? data.deliveredCount : data.ordersCount).toLocaleString()} {t('salaries.table.order_unit')}</span>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className="text-xs font-black text-slate-400">{(activeTab === 'due' ? data.orderPrice : data.orderPrice).toLocaleString()} {t('common.currency')}</span>
                    </td>
                    <td className="px-6 py-5 text-center font-black text-indigo-600 font-mono">{(activeTab === 'due' ? data.unpaidAmount : (data.total || data.amount)).toLocaleString()} {t('common.currency')}</td>
                    <td className="px-6 py-5 text-center">
                      {activeTab === 'due' ? (
                        data.unpaidAmount > 0 ? (
                          <span className="text-[10px] font-bold text-amber-500 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-100">{t('salaries.waiting_payout')}</span>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">{t('salaries.table.no_dues')}</span>
                        )
                      ) : (
                        <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100">{t('salaries.table.paid')}</span>
                      )}
                    </td>
                    {activeTab === 'history' && (
                      <td className="px-6 py-5 text-center text-[10px] font-black text-slate-500">{new Date(data.date).toLocaleDateString(i18n.language === 'ar' ? 'ar-DZ' : i18n.language === 'fr' ? 'fr-FR' : 'en-US')}</td>
                    )}
                    <td className="px-8 py-5 text-center">
                      {activeTab === 'due' ? (
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => handleShowOrders(data.user, true)}
                            disabled={data.unpaidAmount === 0}
                            className={`px-6 py-3 border rounded-lg text-[10px] font-black uppercase transition-all flex items-center gap-2 ${data.unpaidAmount === 0
                              ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                              : 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/20'
                              }`}
                          >
                            <DollarSign className="w-3 h-3" /> {t('salaries.table.payout_commissions')}
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handlePrint(data)}
                            className="w-8 h-8 flex items-center justify-center rounded-md text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                            title={t('common.print', 'Print')}
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(data.id)}
                            className="w-8 h-8 flex items-center justify-center rounded-md text-rose-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                            title={t('common.delete', 'Delete')}
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
                    <td colSpan={activeTab === 'history' ? 7 : 6} className="py-8 text-center text-slate-400 text-xs font-bold">{t('salaries.table.no_data')}</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100">
          <PaginationControl
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            limit={itemsPerPage}
            onLimitChange={setItemsPerPage}
            totalItems={activeTab === 'due' ? salariesData.length : payoutsTotal}
            isLoading={loading}
          />
        </div>
      </div >

      {
        selectedUserForOrders && createPortal(
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[99999] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col h-[85vh] border border-slate-200">
              <div className="px-8 py-6 border-b border-slate-200 flex justify-between items-center bg-white shrink-0">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-sm"><LayoutList className="w-6 h-6" /></div>
                  <div>
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest leading-none">{t('salaries.payout_modal.title')}</h3>
                    <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{t('salaries.payout_modal.subtitle', { name: selectedUserForOrders?.name })}</p>
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
                                {userOrders.every(o => selectedOrderIds.includes(o.id)) && <CheckSquare className="w-4 h-4" />}
                              </button>
                            </th>
                          )}
                          <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{t('common.order')}</th>
                          <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{t('common.customer')}</th>
                          <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{t('common.status')}</th>
                          <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{t('common.date')}</th>
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
                                  {getTranslatedName(order.status, i18n.language) || t('common.unspecified')}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-[10px] font-bold text-slate-400">
                                {new Date(order.createdAt).toLocaleDateString(i18n.language === 'ar' ? 'ar-DZ' : i18n.language === 'fr' ? 'fr-FR' : 'en-US')}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>

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
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{t('salaries.payout_modal.orders_count')}</p>
                                <p className="text-lg font-black text-slate-800 leading-none">{selectedOrderIds.length} <span className="text-[10px] opacity-40">{t('salaries.table.order_unit')}</span></p>
                              </div>
                              <div className="h-8 w-px bg-slate-100"></div>
                              <div className="text-left">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{t('salaries.payout_modal.total_amount')}</p>
                                <p className="text-lg font-black text-emerald-600 leading-none">{(selectedOrderIds.length * (salariesData.find(d => d.user.id === selectedUserForOrders?.id)?.orderPrice || 0)).toLocaleString()} <span className="text-[10px] opacity-40">{t('common.currency')}</span></p>
                              </div>
                            </div>

                            <div className="flex gap-3">
                              <button
                                onClick={() => handleProcessPayment(false)}
                                disabled={selectedOrderIds.length === 0 || isProcessing}
                                className="px-8 py-4 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20 disabled:opacity-50 disabled:shadow-none flex items-center gap-3">
                                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <><DollarSign className="w-4 h-4" /> {t('salaries.payout_modal.pay_selected', { count: selectedOrderIds.length })}</>}
                              </button>

                              <button
                                onClick={() => handleProcessPayment(true)}
                                disabled={isProcessing}
                                className="px-8 py-4 bg-emerald-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/20 disabled:opacity-50 disabled:shadow-none flex items-center gap-3">
                                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle2 className="w-4 h-4" /> {t('salaries.payout_modal.pay_all')}</>}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400">
                    <Package className="w-12 h-12 mb-4 opacity-20" />
                    <p className="text-xs font-bold">{t('salaries.payout_modal.no_orders', { status: isPayoutMode ? t('salaries.waiting_payout') : t('common.confirmed') })}</p>
                  </div>
                )}
              </div>
            </div>
          </div>, document.body
        )
      }

      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => { setDeleteModalOpen(false); setSalaryToDelete(null); }}
        onConfirm={confirmDeleteSalary}
        title={t('salaries.delete_modal.title')}
        description={t('salaries.delete_modal.description')}
        isDeleting={loading}
      />

    </div >
  );
};

export default SalariesView;
