import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation } from '@apollo/client';
import {
  Users,
  UserMinus,
  UserCheck,
  ArrowUp,
  ArrowDown,
  Plus,
  Trash2,
  Package,
  RefreshCcw,
  Search,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { GET_ALL_STAFF_QUEUE } from '../graphql/queries/staffQueueQueries';
import { GET_ALL_USERS, GET_ALL_PRODUCTS } from '../graphql/queries';
import {
  UPDATE_BLOCKED_USERS_STAFF_QUEUE,
  UPDATE_ORDER_USERS_STAFF_QUEUE,
  UPDATE_PRODUCT_ASSIGNMENTS_STAFF_QUEUE
} from '../graphql/mutations/staffQueueMutations';
import { LoadingSpinner, ErrorMessage, Button } from './common';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const StaffQueueManager: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<'new' | 'abandoned' | 'assignments'>('new');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignmentSearchTerm, setAssignmentSearchTerm] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Queries
  const { data: queueData, loading: queueLoading, error: queueError, refetch: refetchQueue } = useQuery(GET_ALL_STAFF_QUEUE);
  const { data: usersData } = useQuery(GET_ALL_USERS);
  const { data: productsData } = useQuery(GET_ALL_PRODUCTS);

  // Mutations
  const [updateBlocked] = useMutation(UPDATE_BLOCKED_USERS_STAFF_QUEUE);
  const [updateOrder] = useMutation(UPDATE_ORDER_USERS_STAFF_QUEUE);
  const [updateAssignments] = useMutation(UPDATE_PRODUCT_ASSIGNMENTS_STAFF_QUEUE);

  const staffQueue = queueData?.allStaffQueue;
  const users = staffWagesUsers(usersData?.allUser || []);
  const products = productsData?.allProduct?.data || [];

  function staffWagesUsers(all: any[]) {
    return all.filter(u => u.role === 'confirmed');
  }

  // Pre-fill products when a user is selected
  useEffect(() => {
    if (selectedUserId && staffQueue?.productAssignments) {
      const assigned = staffQueue.productAssignments
        .filter((a: any) => a.user.id === selectedUserId)
        .map((a: any) => a.product.id);
      setSelectedProductIds(assigned);
    } else {
      setSelectedProductIds([]);
    }
  }, [selectedUserId, staffQueue?.productAssignments]);

  const handleToggleBlock = async (idUser: string, currentlyBlocked: boolean) => {
    try {
      const { data } = await updateBlocked({
        variables: { idUser, blocked: !currentlyBlocked }
      });
      if (data?.updateBlockedUsersStaffQueue?.status) {
        toast.success(currentlyBlocked ? t('staff_queue.toast.activate') : t('staff_queue.toast.block'));
        refetchQueue();
      }
    } catch (err) {
      toast.error(t('staff_queue.toast.error_update'));
    }
  };

  const handleMove = async (index: number, direction: 'up' | 'down', type: 'new' | 'abandoned') => {
    const list = [...(type === 'new' ? staffQueue?.users : staffQueue?.usersAbandoned)];
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === list.length - 1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const temp = list[index];
    list[index] = list[newIndex];
    list[newIndex] = temp;

    const content = list.map((item, idx) => ({
      id: item.id,
      order: idx + 1
    }));

    try {
      const { data } = await updateOrder({
        variables: { content }
      });
      if (data?.updateOrderUsersStaffQueue?.status) {
        refetchQueue();
      }
    } catch (err) {
      toast.error(t('staff_queue.toast.error_reorder'));
    }
  };

  const handleBulkAssign = async () => {
    if (!selectedUserId) {
      toast.error(t('staff_queue.toast.select_staff'));
      return;
    }

    setIsSaving(true);

    try {
      // 1. Keep assignments for OTHER users
      const otherUserAssignments = (staffQueue?.productAssignments || [])
        .filter((a: any) => a.user.id !== selectedUserId)
        .map((a: any) => ({
          idProduct: a.product.id,
          idUser: a.user.id
        }));

      // 2. Add current selections for THIS user
      const currentUserAssignments = selectedProductIds.map(productId => ({
        idProduct: productId,
        idUser: selectedUserId
      }));

      // 3. Prevent assigning a product to multiple users if needed (for simplicity, we focus on User-first UX)
      // Actually, we'll just allow it or rely on the fact that we're replacing THIS user's list.
      // But if a product was already assigned to User B and now User A selects it, it should ideally move.
      // Let's filter out chosen products from other users to avoid duplicates.
      const finalAssignments = [
        ...otherUserAssignments.filter(a => !selectedProductIds.includes(a.idProduct)),
        ...currentUserAssignments
      ];

      const { data } = await updateAssignments({
        variables: { content: finalAssignments }
      });

      if (data?.updateProductAssignmentsStaffQueue?.status) {
        toast.success(t('staff_queue.toast.update_success'));
        setShowAssignModal(false);
        refetchQueue();
      }
    } catch (err) {
      toast.error(t('staff_queue.toast.error_save'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveAssignment = async (idProduct: string) => {
    const newAssignments = staffQueue?.productAssignments
      ?.filter((a: any) => a.product.id !== idProduct)
      ?.map((a: any) => ({
        idProduct: a.product.id,
        idUser: a.user.id
      })) || [];

    try {
      const { data } = await updateAssignments({
        variables: { content: newAssignments }
      });
      if (data?.updateProductAssignmentsStaffQueue?.status) {
        toast.success(t('staff_queue.toast.delete_success'));
        refetchQueue();
      }
    } catch (err) {
      toast.error(t('staff_queue.toast.error_delete'));
    }
  };

  if (queueLoading) return <div className="flex justify-center p-20"><LoadingSpinner /></div>;
  if (queueError) return <ErrorMessage message={t('staff_queue.error_load')} />;

  const currentUsers = activeTab === 'new' ? staffQueue?.users : staffQueue?.usersAbandoned;

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto p-4 md:p-6" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100/50">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight">{t('staff_queue.title')}</h1>
            <p className="text-slate-400 text-[11px] font-bold uppercase tracking-wider mt-0.5">{t('staff_queue.subtitle')}</p>
          </div>
        </div>
        <div className="flex bg-slate-100/80 p-1.5 rounded-xl border border-slate-200/50">
          <button
            onClick={() => setActiveTab('new')}
            className={`px-5 py-2.5 rounded-lg text-xs font-black transition-all flex items-center gap-2 ${activeTab === 'new' ? 'bg-white text-indigo-600 shadow-md ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Users className="w-4 h-4" /> {t('staff_queue.tabs.new')}
          </button>
          <button
            onClick={() => setActiveTab('abandoned')}
            className={`px-5 py-2.5 rounded-lg text-xs font-black transition-all flex items-center gap-2 ${activeTab === 'abandoned' ? 'bg-white text-rose-600 shadow-md ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <AlertCircle className="w-4 h-4" /> {t('staff_queue.tabs.abandoned')}
          </button>
          <button
            onClick={() => setActiveTab('assignments')}
            className={`px-5 py-2.5 rounded-lg text-xs font-black transition-all flex items-center gap-2 ${activeTab === 'assignments' ? 'bg-white text-amber-600 shadow-md ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Package className="w-4 h-4" /> {t('staff_queue.tabs.assignments')}
          </button>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/20 overflow-hidden min-h-[500px]">
        {activeTab !== 'assignments' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] w-16 text-center">{t('staff_queue.table.order')}</th>
                  <th className={`px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ${i18n.language === 'ar' ? 'text-right' : 'text-left'}`}>{t('staff_queue.table.staff')}</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">{t('staff_queue.table.processing')}</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">{t('staff_queue.table.status')}</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">{t('staff_queue.table.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {currentUsers?.map((qUser: any, index: number) => (
                  <tr key={qUser.id} className={`group hover:bg-slate-50/70 transition-all duration-200 ${qUser.blocked ? 'opacity-60 bg-slate-50/30' : ''}`}>
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-center">
                        <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-black ${index === 0 ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-slate-100 text-slate-500'}`}>
                          {index + 1}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs shadow-sm ${qUser.blocked ? 'bg-slate-200 text-slate-400' : 'bg-gradient-to-br from-indigo-500 to-blue-600 text-white'}`}>
                          {qUser.user?.name?.charAt(0)}
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-[13px] font-black text-slate-800 leading-none">{qUser.user?.name}</p>
                          <p className="text-[10px] font-bold text-slate-400 tracking-tight">{qUser.user?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-600 rounded-lg text-[11px] font-black border border-amber-100">
                        <Package className="w-3 h-3" /> {qUser.numberNewOrder || 0} {t('common.order')}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <button
                        onClick={() => handleToggleBlock(qUser.user.id, qUser.blocked)}
                        className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-xl text-[10px] font-black border transition-all duration-300 ${qUser.blocked
                          ? 'bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100'
                          : 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100'}`}
                      >
                        {qUser.blocked ? <UserMinus className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                        {qUser.blocked ? t('staff_queue.status.blocked') : t('staff_queue.status.active')}
                      </button>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleMove(index, 'up', activeTab)}
                          disabled={index === 0}
                          className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 hover:border-indigo-500 hover:text-indigo-600 transition-all disabled:opacity-20 disabled:hover:border-slate-200 disabled:hover:text-slate-400 shadow-sm"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleMove(index, 'down', activeTab)}
                          disabled={index === currentUsers.length - 1}
                          className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 hover:border-indigo-500 hover:text-indigo-600 transition-all disabled:opacity-20 disabled:hover:border-slate-200 disabled:hover:text-slate-400 shadow-sm"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="space-y-1">
                <h3 className="text-[14px] font-black text-slate-800">{t('staff_queue.assignments.title')}</h3>
                <p className="text-slate-400 text-[10px] font-bold">{t('staff_queue.assignments.subtitle')}</p>
              </div>
              <button
                onClick={() => {
                  setSelectedUserId('');
                  setSelectedProductIds([]);
                  setShowAssignModal(true);
                }}
                className="flex items-center gap-2.5 px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 text-[11px] font-black uppercase"
              >
                <Plus className="w-4 h-4" /> {t('staff_queue.assignments.add')}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {staffQueue.productAssignments?.length > 0 ? (
                staffQueue.productAssignments.map((assign: any) => (
                  <div key={assign.id} className="group bg-slate-50/50 border border-slate-100 rounded-2xl p-5 hover:border-indigo-200 hover:bg-white hover:shadow-xl hover:shadow-slate-100 transition-all duration-300 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-slate-100/30 rounded-bl-[60px] -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm border border-slate-100 group-hover:border-indigo-50 group-hover:text-indigo-600 transition-colors">
                          <Package className="w-5 h-5" />
                        </div>
                        <div className="space-y-0.5">
                          <h4 className="text-[13px] font-black text-slate-800 leading-tight truncate max-w-[150px]">{assign.product?.name}</h4>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-bold bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded tracking-tighter">SKU: {assign.product?.sku}</span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveAssignment(assign.product.id)}
                        className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('staff_queue.assignments.assigned_to')}</span>
                      <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-100 shadow-sm">
                        <div className="w-5 h-5 bg-indigo-600 text-white rounded-md flex items-center justify-center text-[8px] font-black uppercase">{assign.user?.name?.charAt(0)}</div>
                        <span className="text-[11px] font-black text-slate-700">{assign.user?.name}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-16 flex flex-col items-center justify-center bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-slate-200 mb-4 shadow-sm">
                    <AlertCircle className="w-8 h-8" />
                  </div>
                  <p className="text-slate-400 text-xs font-black">{t('staff_queue.assignments.empty')}</p>
                  <button
                    onClick={() => {
                      setSelectedUserId('');
                      setSelectedProductIds([]);
                      setShowAssignModal(true);
                    }}
                    className="mt-4 text-indigo-600 text-[10px] font-black border-b border-indigo-200 pb-0.5 hover:border-indigo-600 transition-all uppercase tracking-widest"
                  >
                    {t('staff_queue.assignments.start')}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modern Assignment Modal - Redesigned for Bulk Selection */}
      {showAssignModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setShowAssignModal(false)} />
          <div className="relative bg-white w-full max-w-4xl rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
              <div>
                <h2 className="text-xl font-black text-slate-800">{t('staff_queue.modal.title')}</h2>
                <p className="text-slate-400 text-[11px] font-bold mt-1">{t('staff_queue.modal.desc')}</p>
              </div>
              <button onClick={() => setShowAssignModal(false)} className="w-12 h-12 flex items-center justify-center bg-white text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all border border-slate-100 shadow-sm">
                <Trash2 className="w-5 h-5 rotate-45" />
              </button>
            </div>

            <div className="flex flex-row overflow-hidden h-[550px]">
              {/* Right Side: Staff Selection (Vertical) */}
              <div className={`w-80 border-slate-100 flex flex-col bg-slate-50/50 h-full ${i18n.language === 'ar' ? 'border-l' : 'border-r'}`}>
                <div className="p-6 border-b border-slate-100/50 bg-white/50 flex-shrink-0">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">{t('staff_queue.modal.step1')}</label>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin scrollbar-thumb-slate-200 hover:scrollbar-thumb-slate-300">
                  {users.map(u => (
                    <button
                      key={u.id}
                      onClick={() => setSelectedUserId(u.id)}
                      className={`w-full flex items-center gap-4 px-3 py-2 rounded-xl border transition-all duration-300 relative group ${selectedUserId === u.id
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-200 z-10'
                        : 'bg-white border-slate-100 text-slate-600 hover:border-indigo-200 hover:bg-white hover:shadow-lg shadow-slate-100/50'}`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-[11px] font-black uppercase transition-colors ${selectedUserId === u.id ? 'bg-white/20' : 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100'}`}>{u.name.charAt(0)}</div>
                      <div className={i18n.language === 'ar' ? 'text-right' : 'text-left'}>
                        <p className="text-[14px] font-black leading-tight">{u.name}</p>
                        <p className={`text-[9px] font-bold mt-0.5 ${selectedUserId === u.id ? 'text-indigo-100' : 'text-slate-400'}`}>{u.role === 'admin' ? t('users.roles.admin') : t('users.roles.confirmed')}</p>
                      </div>
                      {selectedUserId === u.id && (
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      )}
                    </button>
                  ))}
                  {/* Extra padding to ensure bottom items are reachable */}
                  <div className="h-4" />
                </div>
              </div>

              {/* Left Side: Product Selection */}
              <div className={`flex-1 flex flex-col gap-6 p-8 overflow-hidden h-full transition-all duration-500 ${!selectedUserId ? 'opacity-30 pointer-events-none grayscale' : ''}`}>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 flex-shrink-0">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">{t('staff_queue.modal.step2')}</label>
                    <p className="text-[10px] font-bold text-slate-400">{t('staff_queue.modal.step2_desc')}</p>
                  </div>
                  <div className="relative w-full md:w-80">
                    <Search className={`absolute ${i18n.language === 'ar' ? 'right-3.5' : 'left-3.5'} top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400`} />
                    <input
                      type="text"
                      placeholder={t('staff_queue.modal.search_placeholder')}
                      value={assignmentSearchTerm}
                      onChange={(e) => setAssignmentSearchTerm(e.target.value)}
                      className={`w-full ${i18n.language === 'ar' ? 'pr-11 pl-4' : 'pl-11 pr-4'} py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-[12px] font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all`}
                    />
                  </div>
                </div>

                <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 overflow-y-auto pr-1 pb-4 scrollbar-thin scrollbar-thumb-slate-200 hover:scrollbar-thumb-slate-300">
                  {products
                    .filter(p =>
                      p.name.toLowerCase().includes(assignmentSearchTerm.toLowerCase()) ||
                      p.sku?.toLowerCase()?.includes(assignmentSearchTerm.toLowerCase())
                    )
                    .map(product => {
                      const isSelected = selectedProductIds.includes(product.id);
                      const assignedToOther = staffQueue.productAssignments?.find((a: any) => a.product.id === product.id && a.user.id !== selectedUserId);

                      return (
                        <div
                          key={product.id}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedProductIds(prev => prev.filter(id => id !== product.id));
                            } else {
                              setSelectedProductIds(prev => [...prev, product.id]);
                            }
                          }}
                          className={`px-3 py-2 rounded-xl border transition-all cursor-pointer group flex items-center justify-between ${isSelected
                            ? 'bg-indigo-50/50 border-indigo-200 ring-2 ring-indigo-500/5'
                            : 'bg-white border-slate-100 hover:border-slate-200 hover:shadow-xl hover:shadow-slate-100'}`}
                        >
                          <div className="flex items-center gap-4">
                            {/* Custom Checkbox */}
                            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-300 ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-slate-200 bg-white group-hover:border-indigo-300'}`}>
                              {isSelected && <CheckCircle2 className="w-3 h-3 text-white" />}
                            </div>
                            <div className="space-y-1">
                              <p className="text-[13px] font-black text-slate-800 leading-tight">{product.name}</p>
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] font-black text-slate-400 opacity-70">SKU: {product.sku}</span>
                                {assignedToOther && (
                                  <span className="text-[8px] font-black bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full border border-amber-100/50 animate-in fade-in zoom-in-95">{t('staff_queue.modal.assigned_to_other', { name: assignedToOther.user.name })}</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100/50 group-hover:bg-white group-hover:scale-110 group-hover:shadow-sm transition-all duration-300">
                            <Package className={`w-5 h-5 transition-colors ${isSelected ? 'text-indigo-600' : 'text-slate-400 group-hover:text-indigo-500'}`} />
                          </div>
                        </div>
                      );
                    })
                  }
                  {/* Extra padding to ensure bottom items are reachable */}
                  <div className="h-4 col-span-full" />
                </div>
              </div>
            </div>


            {/* Footer with Save Button */}
            <div className="p-8 bg-slate-50 flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <p className="text-[11px] leading-relaxed">
                  <span className={`font-black text-slate-700 ${i18n.language === 'ar' ? 'ml-1' : 'mr-1'}`}>{t('staff_queue.modal.warning_title')}:</span>
                  <span className="font-bold text-slate-500 dark:text-slate-400">{t('staff_queue.modal.warning_desc')}</span>
                </p>
              </div>
              <div className="flex gap-3 w-full md:w-auto">
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="flex-1 md:px-8 py-3.5 bg-white border border-slate-200 text-slate-500 rounded-2xl text-[12px] font-black hover:bg-slate-50 transition-all uppercase tracking-widest"
                >
                  {t('common.cancel')}
                </button>
                <button
                  disabled={!selectedUserId || isSaving}
                  onClick={handleBulkAssign}
                  className={`flex-1 md:px-8 py-2.5 bg-indigo-600 text-white rounded-2xl text-[12px] font-black shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50 disabled:grayscale`}
                >
                  {isSaving ? <LoadingSpinner size="24" /> : <CheckCircle2 className="w-5 h-5" />}
                  {t('orders.details.save_changes')}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default StaffQueueManager;

