import React, { useState } from 'react';
import ReactDOM, { createPortal } from 'react-dom';
import { useQuery, useMutation } from '@apollo/client';
import { formatDate, formatCurrency } from '../utils/formatters';
import { User } from '../types';
import { UserPlus, Shield, Lock, Unlock, Mail, Clock, Trash2, Edit2, Check, X, UserCog, Search, ChevronRight, ChevronLeft, Coins, ShoppingBag, AlertTriangle, CheckCircle2, Copy, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import TableSkeleton from './common/TableSkeleton';
import DeleteConfirmationModal from './common/DeleteConfirmationModal';
import { PaginationControl, LoadingSpinner } from './common';
import { GET_ALL_STAFF_QUEUE } from '../graphql/queries/staffQueueQueries';
import { GET_ALL_PRODUCTS } from '../graphql/queries/productQueries';
import { UPDATE_PRODUCT_ASSIGNMENTS_STAFF_QUEUE } from '../graphql/mutations/staffQueueMutations';
import { useTranslation } from 'react-i18next';

interface UsersViewProps {
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  onAdd: (userData: any) => Promise<boolean>;
  onUpdate: (id: string, userData: any) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  onToggleActivation: (id: string, activation: boolean) => Promise<boolean>;
  isLoading?: boolean;
}

const UsersView: React.FC<UsersViewProps> = ({
  users,
  setUsers,
  onAdd,
  onUpdate,
  onDelete,
  onToggleActivation,
  isLoading = false
}) => {
  const { t, i18n } = useTranslation();
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [editingUser, setEditingUser] = useState<any>(null);

  // Delete Modal States
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [newUser, setNewUser] = useState<{ name: string; email: string; phone: string; role: 'admin' | 'confirmed' | 'supervisor'; password: string; orderPrice?: number; teamIds?: string[] }>({
    name: '',
    email: '',
    phone: '',
    role: 'confirmed',
    password: '',
    orderPrice: 0,
    teamIds: []
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Assignment Modal States
  const [assignmentUser, setAssignmentUser] = useState<User | null>(null);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [assignmentSearchTerm, setAssignmentSearchTerm] = useState('');
  const [isSavingAssignments, setIsSavingAssignments] = useState(false);

  // Queries & Mutations
  const { data: queueData, refetch: refetchQueue } = useQuery(GET_ALL_STAFF_QUEUE);
  const { data: productsData } = useQuery(GET_ALL_PRODUCTS);
  const [updateAssignments] = useMutation(UPDATE_PRODUCT_ASSIGNMENTS_STAFF_QUEUE);

  const staffQueue = queueData?.allStaffQueue || {};
  const allProducts = productsData?.allProduct?.data || [];

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!newUser.name) newErrors.name = t('users.errors.name_required');
    if (!newUser.email) newErrors.email = t('users.errors.email_required');
    if (!newUser.phone) newErrors.phone = t('users.errors.phone_required');

    // Basic Email Validation
    if (newUser.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newUser.email)) {
      newErrors.email = t('users.errors.email_invalid');
    }
    // Basic Phone Validation
    if (newUser.phone && !/^(0)(5|6|7)[0-9]{8}$/.test(newUser.phone.replace(/\s/g, ''))) {
      newErrors.phone = t('users.errors.phone_invalid');
    }
    if (!newUser.password || newUser.password.length < 6) {
      newErrors.password = t('users.errors.password_short');
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error(t('users.toasts.validation_error'));
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    try {
      const success = await onAdd({
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        password: newUser.password,
        orderPrice: (newUser.role === 'confirmed' || newUser.role === 'supervisor') ? Number(newUser.orderPrice) : 0,
        teamIds: newUser.role === 'supervisor' ? newUser.teamIds : undefined
      });

      if (success) {
        setShowModal(false);
        setNewUser({ name: '', email: '', phone: '', role: 'confirmed', password: '', orderPrice: 0 });
        toast.success(t('users.toasts.add_success'));
      } else {
        toast.error(t('users.toasts.add_failed'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBlur = (field: string, value: string) => {
    const newErrors = { ...errors };
    // Clear error for this field
    delete newErrors[field];

    if (field === 'name') {
      if (!value) newErrors.name = t('users.errors.name_required');
    }
    else if (field === 'email') {
      if (!value) newErrors.email = t('users.errors.email_required');
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) newErrors.email = t('users.errors.email_invalid');
    }
    else if (field === 'phone') {
      if (!value) newErrors.phone = t('users.errors.phone_required');
      else if (!/^(0)(5|6|7)[0-9]{8}$/.test(value.replace(/\s/g, ''))) newErrors.phone = t('users.errors.phone_invalid');
    }
    else if (field === 'password' && modalMode === 'add') {
      if (!value || value.length < 6) newErrors.password = t('users.errors.password_short');
    }

    setErrors(newErrors);
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    const newErrors: Record<string, string> = {};

    if (!editingUser.name) newErrors.name = t('users.errors.name_required');
    if (!editingUser.email) newErrors.email = t('users.errors.email_required');
    if (!editingUser.phone) newErrors.phone = t('users.errors.phone_required');

    // Basic Email Validation
    if (editingUser.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editingUser.email)) {
      newErrors.email = t('users.errors.email_invalid');
    }
    // Basic Phone Validation
    if (editingUser.phone && !/^(0)(5|6|7)[0-9]{8}$/.test(editingUser.phone.replace(/\s/g, ''))) {
      newErrors.phone = t('users.errors.phone_invalid');
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error(t('users.toasts.validation_error'));
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    try {
      const payload: any = {
        name: editingUser.name,
        email: editingUser.email,
        phone: editingUser.phone,
        role: editingUser.role, // Added role
        orderPrice: (editingUser.role === 'confirmed' || editingUser.role === 'supervisor') ? Number(editingUser.orderPrice) : 0,
        teamIds: editingUser.role === 'supervisor' ? editingUser.teamIds : undefined
      };

      // Only include password if it's not empty (meaning user wants to change it)
      if (editingUser.password && editingUser.password.trim() !== '') {
        payload.password = editingUser.password;
      }

      const success = await onUpdate(editingUser.id, payload);

      if (success) {
        setShowModal(false);
        setEditingUser(null);
        toast.success(t('users.toasts.update_success'));
      } else {
        toast.error(t('users.toasts.update_failed'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (user: User) => {
    setModalMode('edit');
    setEditingUser({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      orderPrice: user.orderPrice || 0,
      teamIds: user.teamIds || []
    });
    setShowModal(true);
  };

  const openAddModal = () => {
    setModalMode('add');
    setEditingUser(null);
    setNewUser({ name: '', email: '', phone: '', role: 'confirmed', password: '', orderPrice: 0 });
    setShowModal(true);
  };

  const confirmDelete = (userId: string) => {
    setUserToDelete(userId);
    setIsDeleteModalOpen(true);
  };

  const executeDelete = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    const success = await onDelete(userToDelete);
    setIsDeleting(false);

    if (success) {
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
      toast.success(t('users.toasts.delete_success'));
    } else {
      toast.error(t('users.toasts.delete_failed'));
    }
  };

  const toggleOrderLock = async (userId: string, currentActivation: boolean) => {
    setTogglingId(userId);
    try {
      const success = await onToggleActivation(userId, !currentActivation);
      if (!success) {
        toast.error(t('users.toasts.status_failed'));
      }
    } finally {
      setTogglingId(null);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText('https://app.wilo.site/login');
    toast.success(t('users.toasts.link_copied'));
  };

  // Assignment Logic
  const openAssignmentModal = (user: User) => {
    setAssignmentUser(user);
    const existing = staffQueue.productAssignments
      ?.filter((a: any) => a.user.id === user.id)
      ?.map((a: any) => a.product.id) || [];
    setSelectedProductIds(existing);
    setAssignmentSearchTerm('');
  };

  const handleSaveAssignments = async () => {
    if (!assignmentUser) return;
    setIsSavingAssignments(true);

    try {
      // 1. Get assignments for OTHER users (Don't filter out products anymore)
      const otherUserAssignments = staffQueue.productAssignments
        ?.filter((a: any) => a.user.id !== assignmentUser.id)
        ?.map((a: any) => ({
          idProduct: a.product.id,
          idUser: a.user.id
        })) || [];

      // 2. Add NEW assignments for THIS user
      const currentUserAssignments = selectedProductIds.map(id => ({
        idProduct: id,
        idUser: assignmentUser.id
      }));

      // 3. Combine them (We allow a product to appear multiple times for different users)
      const finalAssignments = [
        ...otherUserAssignments,
        ...currentUserAssignments
      ];

      const { data } = await updateAssignments({
        variables: {
          content: finalAssignments
        }
      });

      if (data?.updateProductAssignmentsStaffQueue?.status) {
        toast.success(t('users.toasts.assign_success', { name: assignmentUser.name }));
        setAssignmentUser(null);
        await refetchQueue();
      } else {
        toast.error(t('users.toasts.assign_error'));
      }
    } catch (err) {
      console.error(err);
      toast.error(t('users.toasts.assign_error'));
    } finally {
      setIsSavingAssignments(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-800 tracking-tight">{t('sidebar.items.users')}</h2>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-slate-400 text-[11px] font-bold uppercase tracking-tighter">{t('users.subtitle')}</p>
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 px-2 py-1 rounded-md text-[10px] font-bold transition-colors border border-slate-200 hover:border-indigo-100"
              title={t('users.copy_link')}
            >
              <Copy className="w-3 h-3" />
              <span className="font-mono">app.wilo.site/login</span>
            </button>
          </div>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-60">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder={t('users.search_placeholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-9 pl-3 py-2 bg-white border border-slate-200 rounded-lg text-[11px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all shadow-md text-[11px] font-black uppercase whitespace-nowrap"
          >
            <UserPlus className="w-4 h-4" />
            {t('users.add_user')}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        {isLoading ? (
          <div className="p-6">
            <TableSkeleton columns={8} rows={8} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className={`w-full ${i18n.dir() === 'rtl' ? 'text-right' : 'text-left'}`}>
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className={`px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest ${i18n.dir() === 'rtl' ? 'text-right' : 'text-left'}`}>{t('users.table.member')}</th>
                  <th className={`px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest ${i18n.dir() === 'rtl' ? 'text-right' : 'text-left'}`}>{t('users.table.role')}</th>
                  <th className={`px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest ${i18n.dir() === 'rtl' ? 'text-right' : 'text-left'}`}>{t('users.table.commission')}</th>
                  <th className={`px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest ${i18n.dir() === 'rtl' ? 'text-right' : 'text-left'}`}>{t('users.table.unpaid')}</th>
                  <th className={`px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest ${i18n.dir() === 'rtl' ? 'text-right' : 'text-left'}`}>{t('users.table.all_confirmed')}</th>
                  <th className={`px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest ${i18n.dir() === 'rtl' ? 'text-right' : 'text-left'}`}>{t('users.table.status')}</th>
                  <th className={`px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest ${i18n.dir() === 'rtl' ? 'text-right' : 'text-left'}`}>{t('users.table.date')}</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {paginatedUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-all group">
                    <td className={`px-6 py-3.5 ${i18n.dir() === 'rtl' ? 'text-right' : 'text-left'}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-black text-xs shadow-sm ${user.role === 'admin' ? 'bg-indigo-600 text-white' : 'bg-emerald-100 text-emerald-600'
                          }`}>
                          {user.name.charAt(0)}
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-[12px] font-black text-slate-800">{user.name}</p>
                          <p className="text-[10px] font-medium text-slate-400">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className={`px-6 py-3.5 ${i18n.dir() === 'rtl' ? 'text-right' : 'text-left'}`}>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black border uppercase tracking-widest ${user.role === 'admin' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'}`}>
                        {user.role === 'admin' ? t('users.roles.admin') : user.role === 'supervisor' ? t('users.roles.supervisor') : t('users.roles.confirmed')}
                      </span>
                    </td>
                    <td className={`px-6 py-3.5 ${i18n.dir() === 'rtl' ? 'text-right' : 'text-left'}`}>
                      {(user.role === 'confirmed' || user.role === 'supervisor') ? (
                        <div className="flex items-center gap-1 text-slate-700 font-black text-[11px]">
                          <Coins className="w-3.5 h-3.5 text-amber-500" />
                          <span>{formatCurrency(user.orderPrice || 0)}</span>
                        </div>
                      ) : (
                        <span className="text-slate-300 text-[10px]">-</span>
                      )}
                    </td>
                    <td className={`px-6 py-3.5 ${i18n.dir() === 'rtl' ? 'text-right' : 'text-left'}`}>
                      {(user.role === 'confirmed' || user.role === 'supervisor') ? (
                        <div className="flex items-center gap-1 text-slate-700 font-black text-[11px]">
                          <ShoppingBag className="w-3.5 h-3.5 text-amber-500" />
                          <span>{user.numberDeliveredOrderNotPaid || 0}</span>
                        </div>
                      ) : (
                        <span className="text-slate-300 text-[10px]">-</span>
                      )}
                    </td>
                    <td className={`px-6 py-3.5 ${i18n.dir() === 'rtl' ? 'text-right' : 'text-left'}`}>
                      {(user.role === 'confirmed' || user.role === 'supervisor') ? (
                        <div className="flex items-center gap-1 text-slate-700 font-black text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" />
                          <span>{user.numberDeliveredOrder || 0}</span>
                        </div>
                      ) : (
                        <span className="text-slate-300 text-[10px]">-</span>
                      )}
                    </td>
                    <td className={`px-6 py-3.5 ${i18n.dir() === 'rtl' ? 'text-right' : 'text-left'}`}>
                      {(user.role === 'confirmed' || user.role === 'supervisor') ? (
                        <button
                          onClick={() => toggleOrderLock(user.id, user.activation || false)}
                          disabled={togglingId === user.id}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black border transition-all ${user.activation === false ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                            } ${togglingId === user.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {togglingId === user.id ? (
                            <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            user.activation === false ? t('users.status.closed') : t('users.status.open')
                          )}
                        </button>
                      ) : (
                        <span className="text-[9px] text-slate-300 font-bold uppercase">N/A</span>
                      )}
                    </td>
                    <td className={`px-6 py-3.5 text-[10px] text-slate-500 font-bold ${i18n.dir() === 'rtl' ? 'text-right' : 'text-left'}`}>
                      {user.joinedDate}
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center justify-center gap-2">
                        {(user.role === 'confirmed' || user.role === 'supervisor') && (
                          <button
                            onClick={() => openAssignmentModal(user)}
                            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                            title={t('users.modal.assignment_title', { name: user.name })}
                          >
                            <Package className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button onClick={() => openEditModal(user)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-indigo-600 rounded-lg transition-all"><Edit2 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => confirmDelete(user.id)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-rose-600 rounded-lg transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <PaginationControl
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          limit={itemsPerPage}
          onLimitChange={setItemsPerPage}
          totalItems={filteredUsers.length}
        />
      </div>

      {showModal && (
        <React.Fragment>
          {typeof document !== 'undefined' && ReactDOM.createPortal(
            <div className="fixed inset-0 z-[100] grid place-items-center overflow-y-auto py-10 px-4">
              <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setShowModal(false)}></div>
              <div className="relative z-10 bg-white w-full max-w-xl rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col my-auto">
                <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">
                    {modalMode === 'add' ? t('users.modal.add_title') : t('users.modal.edit_title')}
                  </h3>
                  <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-rose-500"><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={modalMode === 'add' ? handleAddUser : handleEditUser} className="p-6 grid grid-cols-2 gap-4">

                  {/* Row 1: Name and Phone */}
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">{t('users.modal.name')}</label>
                    <input
                      value={modalMode === 'add' ? newUser.name : editingUser?.name || ''}
                      onChange={(e) => {
                        if (modalMode === 'add') setNewUser({ ...newUser, name: e.target.value });
                        else setEditingUser({ ...editingUser, name: e.target.value });
                        if (errors.name) setErrors({ ...errors, name: '' });
                      }}
                      onBlur={(e) => handleBlur('name', e.target.value)}
                      className={`w-full px-4 py-2.5 bg-slate-50 border rounded-lg text-xs font-bold transition-colors ${errors.name ? 'border-red-500 focus:border-red-500 bg-red-50' : 'border-slate-200 focus:border-indigo-500'}`}
                      placeholder={t('users.modal.name_placeholder')}
                    />
                    {errors.name && <p className="text-red-500 text-[9px] font-bold px-1">{errors.name}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">{t('users.modal.phone')}</label>
                    <input
                      type="tel"
                      value={modalMode === 'add' ? newUser.phone : editingUser?.phone || ''}
                      onChange={(e) => {
                        if (modalMode === 'add') setNewUser({ ...newUser, phone: e.target.value });
                        else setEditingUser({ ...editingUser, phone: e.target.value });
                        if (errors.phone) setErrors({ ...errors, phone: '' });
                      }}
                      onBlur={(e) => handleBlur('phone', e.target.value)}
                      className={`w-full px-4 py-2.5 bg-slate-50 border rounded-lg text-xs font-bold transition-colors ${errors.phone ? 'border-red-500 focus:border-red-500 bg-red-50' : 'border-slate-200 focus:border-indigo-500'}`}
                      placeholder="05xxxxxxxx"
                    />
                    {errors.phone && <p className="text-red-500 text-[9px] font-bold px-1">{errors.phone}</p>}
                  </div>

                  {/* Row 2: Email and Password */}
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">{t('users.modal.email')}</label>
                    <input
                      type="email"
                      value={modalMode === 'add' ? newUser.email : editingUser?.email || ''}
                      onChange={(e) => {
                        if (modalMode === 'add') setNewUser({ ...newUser, email: e.target.value });
                        else setEditingUser({ ...editingUser, email: e.target.value });
                        if (errors.email) setErrors({ ...errors, email: '' });
                      }}
                      onBlur={(e) => handleBlur('email', e.target.value)}
                      className={`w-full px-4 py-2.5 bg-slate-50 border rounded-lg text-xs font-bold transition-colors ${errors.email ? 'border-red-500 focus:border-red-500 bg-red-50' : 'border-slate-200 focus:border-indigo-500'}`}
                      placeholder="email@example.com"
                    />
                    {errors.email && <p className="text-red-500 text-[9px] font-bold px-1">{errors.email}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">{modalMode === 'add' ? t('users.modal.password') : t('users.modal.password_change')}</label>
                    <input
                      type="password"
                      value={modalMode === 'add' ? newUser.password : editingUser?.password || ''}
                      onChange={(e) => {
                        if (modalMode === 'add') setNewUser({ ...newUser, password: e.target.value });
                        else setEditingUser({ ...editingUser, password: e.target.value });
                        if (errors.password) setErrors({ ...errors, password: '' });
                      }}
                      onBlur={(e) => handleBlur('password', e.target.value)}
                      className={`w-full px-4 py-2.5 bg-slate-50 border rounded-lg text-xs font-bold transition-colors ${errors.password ? 'border-red-500 focus:border-red-500 bg-red-50' : 'border-slate-200 focus:border-indigo-500'}`}
                      placeholder={modalMode === 'add' ? t('users.modal.password') + "..." : t('users.modal.password_placeholder')}
                    />
                    {errors.password && <p className="text-red-500 text-[9px] font-bold px-1">{errors.password}</p>}
                  </div>

                  {/* Row 3: Role (Enabled for both Add and Edit) */}
                  <div className="space-y-1.5 col-span-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">{t('users.modal.type')}</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => modalMode === 'add' ? setNewUser({ ...newUser, role: 'confirmed' }) : setEditingUser({ ...editingUser, role: 'confirmed' })}
                        className={`py-2 px-3 rounded-lg border-2 text-[10px] font-black transition-all ${(modalMode === 'add' ? newUser.role : editingUser?.role) === 'confirmed' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-50 bg-slate-50 text-slate-400'}`}
                      >
                        {t('users.roles.confirmed')}
                      </button>
                      <button
                        type="button"
                        onClick={() => modalMode === 'add' ? setNewUser({ ...newUser, role: 'supervisor' }) : setEditingUser({ ...editingUser, role: 'supervisor' })}
                        className={`py-2 px-3 rounded-lg border-2 text-[10px] font-black transition-all ${(modalMode === 'add' ? newUser.role : editingUser?.role) === 'supervisor' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-50 bg-slate-50 text-slate-400'}`}
                      >
                        {t('users.roles.supervisor')}
                      </button>
                      <button
                        type="button"
                        onClick={() => modalMode === 'add' ? setNewUser({ ...newUser, role: 'admin' }) : setEditingUser({ ...editingUser, role: 'admin' })}
                        className={`py-2 px-3 rounded-lg border-2 text-[10px] font-black transition-all ${(modalMode === 'add' ? newUser.role : editingUser?.role) === 'admin' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-50 bg-slate-50 text-slate-400'}`}
                      >
                        {t('users.roles.admin')}
                      </button>
                    </div>
                  </div>

                  {/* Team Selection Field for Supervisors */}
                  {((modalMode === 'add' && (modalMode === 'add' ? newUser.role : editingUser?.role) === 'supervisor') || (modalMode === 'edit' && editingUser?.role === 'supervisor')) && (
                    <div className="space-y-1.5 animate-in slide-in-from-top-2 col-span-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">{t('users.modal.team_selection_label') || 'Team Selection'}</label>
                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 max-h-40 overflow-y-auto space-y-2">
                        {users
                          .filter(u => u.role === 'confirmed')
                          .map(u => {
                            const isSelected = modalMode === 'add' 
                              ? newUser.teamIds?.includes(u.id)
                              : editingUser?.teamIds?.includes(u.id);
                            
                            return (
                              <label key={u.id} className="flex items-center gap-2 cursor-pointer group">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={(e) => {
                                    const checked = e.target.checked;
                                    if (modalMode === 'add') {
                                      const currentIds = newUser.teamIds || [];
                                      setNewUser({
                                        ...newUser,
                                        teamIds: checked 
                                          ? [...currentIds, u.id]
                                          : currentIds.filter(id => id !== u.id)
                                      });
                                    } else {
                                      const currentIds = editingUser?.teamIds || [];
                                      setEditingUser({
                                        ...editingUser,
                                        teamIds: checked
                                          ? [...currentIds, u.id]
                                          : currentIds.filter(id => id !== u.id)
                                      });
                                    }
                                  }}
                                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <span className="text-xs font-bold text-slate-700 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{u.name}</span>
                              </label>
                            );
                          })
                        }
                      </div>
                    </div>
                  )}

                  {/* Conditional Commission Field - Row 4 */}
                  {((modalMode === 'add' && (newUser.role === 'confirmed' || newUser.role === 'supervisor')) || (modalMode === 'edit' && (editingUser?.role === 'confirmed' || editingUser?.role === 'supervisor'))) && (
                    <div className="space-y-1.5 animate-in slide-in-from-top-2 col-span-2">
                      <label className="text-[9px] font-black text-amber-600 uppercase tracking-widest px-1 flex items-center gap-1">
                        <Coins className="w-3 h-3" /> {t('users.modal.commission_label')}
                      </label>
                      <input
                        type="number"
                        value={modalMode === 'add' ? newUser.orderPrice : editingUser?.orderPrice || 0}
                        onChange={(e) => modalMode === 'add'
                          ? setNewUser({ ...newUser, orderPrice: Number(e.target.value) })
                          : setEditingUser({ ...editingUser, orderPrice: Number(e.target.value) })
                        }
                        className="w-full px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs font-bold text-amber-800 focus:ring-amber-500/20 focus:border-amber-500"
                        placeholder="0.00"
                      />
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 bg-indigo-600 text-white rounded-lg font-black text-xs uppercase shadow-md hover:bg-indigo-700 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 col-span-2"
                  >
                    {isSubmitting && (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    )}
                    {modalMode === 'add' ? t('common.add') : t('common.save')}
                  </button>
                </form>
              </div>
            </div>,
            document.body
          )}
        </React.Fragment>
      )}

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={executeDelete}
        title={t('users.modal.delete_title')}
        description={t('users.modal.delete_desc')}
        isDeleting={isDeleting}
      />

      {/* Assignment Modal */}
      {assignmentUser && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setAssignmentUser(null)}></div>
          <div className="relative z-10 bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center font-black text-sm">
                  {assignmentUser.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">{t('users.modal.assignment_title', { name: assignmentUser.name })}</h3>
                  <p className="text-[10px] font-bold text-slate-400 mt-0.5">{t('users.modal.assignment_subtitle')}</p>
                </div>
              </div>
              <button onClick={() => setAssignmentUser(null)} className="text-slate-400 hover:text-rose-500"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-6 space-y-4 flex-1 flex flex-col overflow-hidden">
               <div className="relative">
                  <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder={t('users.modal.product_search')} 
                    value={assignmentSearchTerm}
                    onChange={(e) => setAssignmentSearchTerm(e.target.value)}
                    className="w-full pr-11 pl-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                  />
               </div>

               <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-slate-200">
                  {allProducts
                    .filter(p => p.name.toLowerCase().includes(assignmentSearchTerm.toLowerCase()) || p.sku?.toLowerCase()?.includes(assignmentSearchTerm.toLowerCase()))
                    .map(product => {
                      const isSelected = selectedProductIds.includes(product.id);
                      // Find all other users assigned to this product
                      const otherAssignments = staffQueue.productAssignments?.filter(
                        (a: any) => a.product.id === product.id && a.user.id !== assignmentUser.id
                      ) || [];
                      const otherNames = otherAssignments.map((a: any) => a.user.name).join('، ');

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
                          className={`p-3.5 rounded-xl border transition-all cursor-pointer group flex items-center justify-between ${isSelected 
                            ? 'bg-indigo-50/50 border-indigo-200 shadow-sm' 
                            : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50/30'}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded flex items-center justify-center transition-all ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-transparent border border-slate-200 group-hover:border-indigo-300'}`}>
                              <Check className="w-3.5 h-3.5" />
                            </div>
                            <div className="space-y-0.5">
                              <p className="text-[11px] font-black text-slate-800 leading-tight">{product.name}</p>
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] font-bold text-slate-400">SKU: {product.sku}</span>
                                {otherNames && (
                                  <span className="text-[8px] font-black bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full border border-amber-100/50">{t('users.modal.assigned_to', { names: otherNames })}</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <Package className={`w-4 h-4 transition-colors ${isSelected ? 'text-indigo-600' : 'text-slate-200 group-hover:text-slate-400'}`} />
                        </div>
                      );
                    })
                  }
               </div>

               <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                    <p className="text-[10px] font-bold text-slate-500">{t('users.modal.assignment_save_warning')}</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setAssignmentUser(null)}
                      className="px-5 py-2 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black hover:bg-slate-200 transition-all uppercase tracking-widest"
                    >
                      {t('common.cancel')}
                    </button>
                    <button 
                      onClick={handleSaveAssignments}
                      disabled={isSavingAssignments}
                      className="px-8 py-2 bg-indigo-600 text-white rounded-lg text-[10px] font-black shadow-md hover:bg-indigo-700 transition-all uppercase tracking-widest flex items-center gap-2 disabled:opacity-50"
                    >
                      {isSavingAssignments ? <LoadingSpinner size="14" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                      {t('common.save')}
                    </button>
                  </div>
               </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default UsersView;
