import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Transaction } from '../types';
import {
   Plus, Search, ArrowUpCircle, ArrowDownCircle,
   ChevronRight, ChevronLeft, DollarSign, Calendar,
   Save, X, PlusCircle, Trash2, Tag, Wallet, History, Filter, TrendingUp, TrendingDown,
   Loader2
} from 'lucide-react';
import { financialTransactionService } from '../services/apiService';
import { ModernSelect } from './common';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import TableSkeleton from './common/TableSkeleton';

const FinancesView: React.FC = () => {
   const { user } = useAuth();
   const [transactions, setTransactions] = useState<Transaction[]>([]);
   const [loading, setLoading] = useState(true);
   const [activeTab, setActiveTab] = useState<'all' | 'income' | 'expense'>('all');
   const [searchTerm, setSearchTerm] = useState('');
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [currentPage, setCurrentPage] = useState(1);
   const itemsPerPage = 12;

   const [pagination, setPagination] = useState({
      limit: 50,
      page: 1,
      total: 0
   });

   const fetchTransactions = async () => {
      try {
         if (!user?.company?.id) return;
         setLoading(true);

         const result = await financialTransactionService.getAllFinancialTransactions({
            pagination: { limit: 1000, page: 1 } // Fetch all for now for client-side filtering/stats
         });

         if (result.success) {
            // Map backend data to frontend Transaction type
            const mappedTransactions: Transaction[] = result.financialTransactions.map((t: any) => ({
               id: t.id,
               type: t.type,
               category: t.category,
               amount: t.amount,
               date: t.createdAt ? new Date(t.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
               note: t.note || '',
               user: t.createdBy?.name || 'مستخدم'
            }));
            setTransactions(mappedTransactions);
         } else {
            toast.error('فشل في جلب العمليات المالية');
         }
      } catch (error) {
         console.error(error);
         toast.error('حدث خطأ غير متوقع');
      } finally {
         setLoading(false);
      }
   };

   useEffect(() => {
      if (user?.company?.id) {
         fetchTransactions();
      }
   }, [user]);

   // حساب الإحصائيات السريعة للبطاقات
   const financeStats = useMemo(() => {
      const income = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
      const expense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
      const balance = income - expense;
      return { income, expense, balance };
   }, [transactions]);

   const [newTransaction, setNewTransaction] = useState<{
      type: 'income' | 'expense';
      category: string;
      amount: number;
      note: string;
   }>({
      type: 'income',
      category: 'مبيعات',
      amount: 0,
      note: ''
   });

   const [errors, setErrors] = useState<Record<string, string>>({});

   const filteredTransactions = transactions.filter(t => {
      const matchesSearch = t.note.toLowerCase().includes(searchTerm.toLowerCase()) ||
         t.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTab = activeTab === 'all' || t.type === activeTab;
      return matchesSearch && matchesTab;
   }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

   const paginatedTransactions = filteredTransactions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
   const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);

   const [isSubmitting, setIsSubmitting] = useState(false);
   const [isDeleting, setIsDeleting] = useState(false);

   const handleBlur = (field: string, value: any) => {
      const newErrors = { ...errors };
      delete newErrors[field];

      if (field === 'amount') {
         if (!value || Number(value) <= 0) newErrors.amount = 'يرجى إدخال مبلغ صحيح (أكبر من 0)';
      }
      else if (field === 'category') {
         if (!value) newErrors.category = 'يرجى اختيار التصنيف';
      }
      else if (field === 'note') {
         if (!value) newErrors.note = 'يرجى كتابة ملاحظة توضيحية';
      }

      setErrors(newErrors);
   };

   const handleAddTransaction = async () => {
      const newErrors: Record<string, string> = {};

      if (!newTransaction.amount || newTransaction.amount <= 0) {
         newErrors.amount = 'يرجى إدخال مبلغ صحيح (أكبر من 0)';
      }
      if (!newTransaction.category) {
         newErrors.category = 'يرجى اختيار التصنيف';
      }
      if (!newTransaction.note) {
         newErrors.note = 'يرجى كتابة ملاحظة توضيحية';
      }

      if (Object.keys(newErrors).length > 0) {
         setErrors(newErrors);
         toast.error('يرجى التحقق من الحقول');
         return;
      }

      setErrors({});

      setIsSubmitting(true);
      try {
         if (!user?.company?.id) {
            toast.error('لم يتم العثور على بيانات الشركة');
            return;
         }

         const payload = {
            ...newTransaction
         };

         const result = await financialTransactionService.createFinancialTransaction(payload);

         if (result.success) {
            toast.success('تم إضافة العملية بنجاح');
            setIsModalOpen(false);
            setNewTransaction({ type: 'income', category: 'مبيعات', amount: 0, note: '' });
            await fetchTransactions(); // Refresh list
         } else {
            toast.error('فشل حفظ العملية');
         }
      } catch (error) {
         console.error(error);
         toast.error('حدث خطأ أثناء الحفظ');
      } finally {
         setIsSubmitting(false);
      }
   };

   const [deleteId, setDeleteId] = useState<string | null>(null);

   const confirmDelete = async () => {
      if (!deleteId) return;
      setIsDeleting(true);
      try {
         const result = await financialTransactionService.deleteFinancialTransaction(deleteId);
         if (result.success) {
            toast.success('تم حذف العملية بنجاح');
            setTransactions(prev => prev.filter(t => t.id !== deleteId));
            setDeleteId(null);
         } else {
            toast.error('فشل حذف العملية');
         }
      } catch (error) {
         console.error(error);
         toast.error('حدث خطأ أثناء الحذف');
      } finally {
         setIsDeleting(false);
      }
   };



   const deleteTransaction = (id: string) => {
      setDeleteId(id);
   };



   return (
      <div className="space-y-6 animate-in fade-in duration-700 pb-20 no-scrollbar">
         {/* Header Section */}
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
               <h2 className="text-2xl font-black text-slate-800 tracking-tight">إدارة العمليات والتدفقات المالية</h2>
               <p className="text-slate-400 text-[11px] font-bold uppercase mt-1 tracking-widest">تتبع شامل للمداخيل والمصاريف التشغيلية</p>
            </div>
            <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-3 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-600/20 active:scale-95 transition-all">
               <PlusCircle className="w-5 h-5" /> إضافة عملية جديدة
            </button>
         </div>

         {/* Finance Stats Cards */}
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5">
               <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-sm shrink-0">
                  <TrendingUp className="w-7 h-7" />
               </div>
               <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">إجمالي المداخيل</p>
                  <h3 className="text-xl font-black text-slate-800 mt-0.5">{financeStats.income.toLocaleString()} <span className="text-[10px]">دج</span></h3>
                  <p className="text-[9px] font-bold text-emerald-600 mt-1 uppercase tracking-tighter">تدفقات واردة</p>
               </div>
            </div>
            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5">
               <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shadow-sm shrink-0">
                  <TrendingDown className="w-7 h-7" />
               </div>
               <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">إجمالي المصروفات</p>
                  <h3 className="text-xl font-black text-slate-800 mt-0.5">{financeStats.expense.toLocaleString()} <span className="text-[10px]">دج</span></h3>
                  <p className="text-[9px] font-bold text-rose-600 mt-1 uppercase tracking-tighter">تكاليف تشغيلية</p>
               </div>
            </div>
            <div className="bg-slate-900 p-6 rounded-[2rem] shadow-xl text-white flex items-center gap-5">
               <div className="w-14 h-14 rounded-2xl bg-white/10 text-indigo-400 flex items-center justify-center shadow-sm shrink-0 border border-white/5">
                  <Wallet className="w-7 h-7" />
               </div>
               <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">صافي السيولة</p>
                  <h3 className="text-xl font-black text-white mt-0.5 font-mono tracking-tighter">{financeStats.balance.toLocaleString()} <span className="text-[10px]">دج</span></h3>
                  <p className="text-[9px] font-bold text-indigo-400 mt-1 uppercase tracking-tighter">الرصيد المتوفر</p>
               </div>
            </div>
         </div>

         {/* Main Table Content */}
         <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
            {loading && transactions.length === 0 ? (
               <div className="p-6">
                  <TableSkeleton columns={5} rows={8} />
               </div>
            ) : (
               <>
                  <div className="p-6 border-b border-slate-100 flex flex-col lg:flex-row items-center justify-between gap-6 bg-slate-50/30">
                     <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 w-full lg:w-fit shadow-sm">
                        <button onClick={() => { setActiveTab('all'); setCurrentPage(1); }} className={`flex-1 lg:px-8 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'all' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>الكل</button>
                        <button onClick={() => { setActiveTab('income'); setCurrentPage(1); }} className={`flex-1 lg:px-8 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'income' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>المداخيل</button>
                        <button onClick={() => { setActiveTab('expense'); setCurrentPage(1); }} className={`flex-1 lg:px-8 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'expense' ? 'bg-rose-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>المصروفات</button>
                     </div>

                     <div className="relative w-full max-w-md">
                        <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input type="text" placeholder="البحث عن ملاحظة، فئة أو مبلغ..." value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }} className="w-full pr-12 pl-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-[11px] font-bold outline-none focus:border-indigo-500 transition-all shadow-sm" />
                     </div>
                  </div>

                  <div className="overflow-x-auto no-scrollbar">
                     <table className="w-full text-right border-collapse">
                        <thead>
                           <tr className="bg-slate-50/50 text-slate-400 border-b border-slate-200">
                              <th className="px-8 py-5 text-[9px] font-black uppercase tracking-[0.2em]">البيان</th>
                              <th className="px-6 py-5 text-[9px] font-black uppercase tracking-[0.2em] text-center">تاريخ العملية</th>
                              <th className="px-6 py-5 text-[9px] font-black uppercase tracking-[0.2em] text-center">التصنيف</th>
                              <th className="px-6 py-5 text-[9px] font-black uppercase tracking-[0.2em] text-center">المبلغ</th>
                              <th className="px-8 py-5 text-center">إجراء</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                           {paginatedTransactions.map((trx) => (
                              <tr key={trx.id} className="hover:bg-slate-50 transition-all group">
                                 <td className="px-8 py-6">
                                    <div className="flex items-center gap-4">
                                       <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 ${trx.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                          {trx.type === 'income' ? <PlusCircle className="w-5 h-5" /> : <X className="w-5 h-5" />}
                                       </div>
                                       <div>
                                          <p className="text-sm font-black text-slate-800 leading-none">{trx.note}</p>
                                          <p className="text-[9px] text-slate-400 font-bold mt-2 uppercase tracking-tighter">المرجع: #{trx.id} • {trx.user}</p>
                                       </div>
                                    </div>
                                 </td>
                                 <td className="px-6 py-6 text-center text-[10px] font-black text-slate-500">{trx.date}</td>
                                 <td className="px-6 py-6 text-center">
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-600 rounded-xl text-[9px] font-black border border-slate-200 uppercase tracking-widest">
                                       {trx.category}
                                    </span>
                                 </td>
                                 <td className="px-6 py-6 text-center">
                                    <span className={`text-base font-black font-mono tracking-tighter ${trx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                       {trx.type === 'income' ? '+' : '-'} {trx.amount.toLocaleString()} <span className="text-[10px] opacity-40">دج</span>
                                    </span>
                                 </td>
                                 <td className="px-8 py-6 text-center">
                                    <button onClick={() => deleteTransaction(trx.id)} className="p-3 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all">
                                       <Trash2 className="w-4 h-4" />
                                    </button>
                                 </td>
                              </tr>
                           ))}
                           {paginatedTransactions.length === 0 && (
                              <tr>
                                 <td colSpan={5} className="py-8 text-center text-slate-400 text-xs font-bold">لابتوجد بيانات لعرضها</td>
                              </tr>
                           )}
                        </tbody>
                     </table>
                  </div>
               </>
            )}
         </div>

         {isModalOpen && createPortal(
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[99999] flex items-center justify-center p-4">
               <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 flex flex-col max-h-[90vh]">
                  <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white"><Plus className="w-6 h-6" /></div>
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest leading-none">إضافة حركة مالية</h3>
                     </div>
                     <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-rose-500 p-2 hover:bg-rose-50 rounded-xl transition-all"><X className="w-6 h-6" /></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-8 space-y-6 no-scrollbar">
                     <div className="flex p-1.5 bg-slate-100 rounded-2xl">
                        <button onClick={() => setNewTransaction({ ...newTransaction, type: 'income' })} className={`flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2 ${newTransaction.type === 'income' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}>
                           <PlusCircle className="w-4 h-4" /> مداخيل
                        </button>
                        <button onClick={() => setNewTransaction({ ...newTransaction, type: 'expense' })} className={`flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2 ${newTransaction.type === 'expense' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-400'}`}>
                           <X className="w-4 h-4" /> مصروفات
                        </button>
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">القيمة (دج)</label>
                        <input
                           type="number"
                           value={newTransaction.amount}
                           onChange={e => {
                              setNewTransaction({ ...newTransaction, amount: Number(e.target.value) });
                              if (errors.amount) setErrors({ ...errors, amount: '' });
                           }}
                           onBlur={(e) => handleBlur('amount', e.target.value)}
                           className={`w-full px-5 py-4 bg-slate-50 border rounded-2xl text-sm font-black text-slate-800 focus:bg-white outline-none focus:border-indigo-400 transition-all ${errors.amount ? 'border-red-500 focus:border-red-500 bg-red-50' : 'border-slate-200'}`}
                        />
                        {errors.amount && <p className="text-red-500 text-[9px] font-bold px-1">{errors.amount}</p>}
                     </div>

                     <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">التصنيف</label>
                        <div className={errors.category ? "rounded-xl border border-red-500" : ""}>
                           <ModernSelect
                              value={newTransaction.category}
                              onChange={(val) => {
                                 setNewTransaction({ ...newTransaction, category: val });
                                 if (errors.category) setErrors({ ...errors, category: '' });
                              }}
                              options={newTransaction.type === 'income' ? [
                                 { value: "مبيعات", label: "مبيعات" },
                                 { value: "استرداد", label: "استرداد" },
                                 { value: "أخرى", label: "أخرى" }
                              ] : [
                                 { value: "رواتب", label: "رواتب" },
                                 { value: "شحن", label: "شحن" },
                                 { value: "تسويق", label: "تسويق" },
                                 { value: "أخرى", label: "أخرى" }
                              ]}
                           />
                        </div>
                        {errors.category && <p className="text-red-500 text-[9px] font-bold px-1">{errors.category}</p>}
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">ملاحظة</label>
                        <textarea
                           value={newTransaction.note}
                           onChange={e => {
                              setNewTransaction({ ...newTransaction, note: e.target.value });
                              if (errors.note) setErrors({ ...errors, note: '' });
                           }}
                           onBlur={(e) => handleBlur('note', e.target.value)}
                           className={`w-full h-24 px-5 py-4 bg-slate-50 border rounded-2xl text-xs font-bold outline-none focus:bg-white focus:border-indigo-400 transition-all resize-none ${errors.note ? 'border-red-500 focus:border-red-500 bg-red-50' : 'border-slate-200'}`}
                        />
                        {errors.note && <p className="text-red-500 text-[9px] font-bold px-1">{errors.note}</p>}
                     </div>
                  </div>
                  <div className="p-8 border-t border-slate-100 bg-white">
                     <button
                        onClick={handleAddTransaction}
                        disabled={isSubmitting}
                        className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-[11px] uppercase shadow-2xl shadow-indigo-600/30 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
                     >
                        {isSubmitting ? (
                           <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                           <>حفظ الحركة <Save className="w-4 h-4" /></>
                        )}
                     </button>
                  </div>
               </div>
            </div>, document.body
         )}

         {/* Delete Confirmation Modal */}
         {deleteId && createPortal(
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[99999] flex items-center justify-center p-4">
               <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200">
                  <div className="p-8 text-center">
                     <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-sm">
                        <Trash2 className="w-10 h-10" />
                     </div>
                     <h3 className="text-xl font-black text-slate-800 mb-2">حذف المعاملة؟</h3>
                     <p className="text-xs font-bold text-slate-500 leading-relaxed mb-8">
                        هل أنت متأكد من حذف هذه المعاملة المالية؟<br />
                        لا يمكن التراجع عن هذا الإجراء
                     </p>

                     <div className="flex gap-3">
                        <button disabled={isDeleting} onClick={() => setDeleteId(null)} className="flex-1 py-4 border border-slate-200 text-slate-400 rounded-2xl font-black text-[11px] uppercase hover:bg-slate-50 transition-all disabled:opacity-50">
                           إلغاء
                        </button>
                        <button disabled={isDeleting} onClick={confirmDelete} className="flex-1 py-4 bg-rose-600 text-white rounded-2xl font-black text-[11px] uppercase shadow-xl shadow-rose-600/20 hover:bg-rose-700 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                           {isDeleting ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                           ) : (
                              'نعم، حذف'
                           )}
                        </button>
                     </div>
                  </div>
               </div>
            </div>, document.body
         )}
      </div>
   );
};

export default FinancesView;
