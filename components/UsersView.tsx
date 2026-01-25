import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { User } from '../types';
import { UserPlus, Shield, Lock, Unlock, Mail, Clock, Trash2, Edit2, Check, X, UserCog, Search, ChevronRight, ChevronLeft, Coins, ShoppingBag, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import TableSkeleton from './common/TableSkeleton';
import DeleteConfirmationModal from './common/DeleteConfirmationModal';
import { PaginationControl } from './common';

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

  const [newUser, setNewUser] = useState<{ name: string; email: string; phone: string; role: 'admin' | 'confirmed'; password: string; orderPrice?: number }>({
    name: '',
    email: '',
    phone: '',
    role: 'confirmed',
    password: '',
    orderPrice: 0
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!newUser.name) newErrors.name = 'الاسم مطلوب';
    if (!newUser.email) newErrors.email = 'البريد مطلوب';
    if (!newUser.phone) newErrors.phone = 'الهاتف مطلوب';

    // Basic Email Validation
    if (newUser.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newUser.email)) {
      newErrors.email = 'بريد إلكتروني غير صالح';
    }
    // Basic Phone Validation
    if (newUser.phone && !/^(0)(5|6|7)[0-9]{8}$/.test(newUser.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'رقم الهاتف غير صالح (10 أرقام)';
    }
    if (!newUser.password || newUser.password.length < 6) {
      newErrors.password = 'كلمة المرور قصيرة (6 أحرف على الأقل)';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error('يرجى التحقق من الحقول');
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
        orderPrice: newUser.role === 'confirmed' ? Number(newUser.orderPrice) : 0
      });

      if (success) {
        setShowModal(false);
        setNewUser({ name: '', email: '', phone: '', role: 'confirmed', password: '', orderPrice: 0 });
        toast.success('تم إضافة المستخدم بنجاح!');
      } else {
        toast.error('فشلت عملية الإضافة');
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
      if (!value) newErrors.name = 'الاسم مطلوب';
    }
    else if (field === 'email') {
      if (!value) newErrors.email = 'البريد مطلوب';
      else if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(value)) newErrors.email = 'بريد إلكتروني غير صالح';
    }
    else if (field === 'phone') {
      if (!value) newErrors.phone = 'الهاتف مطلوب';
      else if (!/^(0)(5|6|7)[0-9]{8}$/.test(value.replace(/\\s/g, ''))) newErrors.phone = 'رقم الهاتف غير صالح (10 أرقام)';
    }
    else if (field === 'password' && modalMode === 'add') {
      if (!value || value.length < 6) newErrors.password = 'كلمة المرور قصيرة (6 أحرف على الأقل)';
    }

    setErrors(newErrors);
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    const newErrors: Record<string, string> = {};

    if (!editingUser.name) newErrors.name = 'الاسم مطلوب';
    if (!editingUser.email) newErrors.email = 'البريد مطلوب';
    if (!editingUser.phone) newErrors.phone = 'الهاتف مطلوب';

    // Basic Email Validation
    if (editingUser.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editingUser.email)) {
      newErrors.email = 'بريد إلكتروني غير صالح';
    }
    // Basic Phone Validation
    if (editingUser.phone && !/^(0)(5|6|7)[0-9]{8}$/.test(editingUser.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'رقم الهاتف غير صالح (10 أرقام)';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error('يرجى التحقق من الحقول');
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
        orderPrice: editingUser.role === 'confirmed' ? Number(editingUser.orderPrice) : 0
      };

      // Only include password if it's not empty (meaning user wants to change it)
      if (editingUser.password && editingUser.password.trim() !== '') {
        payload.password = editingUser.password;
      }

      const success = await onUpdate(editingUser.id, payload);

      if (success) {
        setShowModal(false);
        setEditingUser(null);
        toast.success('تم تحديث المستخدم بنجاح!');
      } else {
        toast.error('فشلت عملية التحديث');
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
      orderPrice: user.orderPrice || 0
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
      toast.success('تم حذف المستخدم بنجاح');
    } else {
      toast.error('فشلت عملية الحذف');
    }
  };

  const toggleOrderLock = async (userId: string, currentActivation: boolean) => {
    setTogglingId(userId);
    try {
      const success = await onToggleActivation(userId, !currentActivation);
      if (!success) {
        toast.error('فشلت عملية تغيير الحالة');
      }
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-800 tracking-tight">إدارة المستخدمين</h2>
          <p className="text-slate-400 text-[11px] font-bold uppercase tracking-tighter">التحكم في أعضاء الفريق والصلاحيات</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-60">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="بحث بالاسم أو البريد..."
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
            إضافة عضو
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        {isLoading ? (
          <div className="p-6">
            <TableSkeleton columns={7} rows={8} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">العضو</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">الصلاحية</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">عمولة التأكيد</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">الطلبات المؤكدة</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">حالة العمل</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">التاريخ</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {paginatedUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-all group">
                    <td className="px-6 py-3.5">
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
                    <td className="px-6 py-3.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black border uppercase tracking-widest ${user.role === 'admin' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'}`}>
                        {user.role === 'admin' ? 'مدير' : 'مؤكد'}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      {user.role === 'confirmed' ? (
                        <div className="flex items-center gap-1 text-slate-700 font-black text-[11px]">
                          <Coins className="w-3.5 h-3.5 text-amber-500" />
                          <span>{user.orderPrice || 0} د.ج</span>
                        </div>
                      ) : (
                        <span className="text-slate-300 text-[10px]">-</span>
                      )}
                    </td>
                    <td className="px-6 py-3.5">
                      {user.role === 'confirmed' ? (
                        <div className="flex items-center gap-1 text-slate-700 font-black text-[11px]">
                          <ShoppingBag className="w-3.5 h-3.5 text-indigo-500" />
                          <span>{user.numberDeliveredOrder || 0}</span>
                        </div>
                      ) : (
                        <span className="text-slate-300 text-[10px]">-</span>
                      )}
                    </td>
                    <td className="px-6 py-3.5">
                      {user.role === 'confirmed' ? (
                        <button
                          onClick={() => toggleOrderLock(user.id, user.activation || false)}
                          disabled={togglingId === user.id}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black border transition-all ${user.activation === false ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                            } ${togglingId === user.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {togglingId === user.id ? (
                            <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            user.activation === false ? 'مغلقة' : 'مفتوحة'
                          )}
                        </button>
                      ) : (
                        <span className="text-[9px] text-slate-300 font-bold uppercase">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-[10px] text-slate-500 font-bold">
                      {user.joinedDate}
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center justify-center gap-2">
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
                    {modalMode === 'add' ? 'إضافة مستخدم' : 'تعديل مستخدم'}
                  </h3>
                  <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-rose-500"><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={modalMode === 'add' ? handleAddUser : handleEditUser} className="p-6 grid grid-cols-2 gap-4">

                  {/* Row 1: Name and Phone */}
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">الاسم</label>
                    <input
                      value={modalMode === 'add' ? newUser.name : editingUser?.name || ''}
                      onChange={(e) => {
                        if (modalMode === 'add') setNewUser({ ...newUser, name: e.target.value });
                        else setEditingUser({ ...editingUser, name: e.target.value });
                        if (errors.name) setErrors({ ...errors, name: '' });
                      }}
                      onBlur={(e) => handleBlur('name', e.target.value)}
                      className={`w-full px-4 py-2.5 bg-slate-50 border rounded-lg text-xs font-bold transition-colors ${errors.name ? 'border-red-500 focus:border-red-500 bg-red-50' : 'border-slate-200 focus:border-indigo-500'}`}
                      placeholder="أحمد..."
                    />
                    {errors.name && <p className="text-red-500 text-[9px] font-bold px-1">{errors.name}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">الهاتف</label>
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
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">البريد</label>
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
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">{modalMode === 'add' ? 'كلمة المرور' : 'تغيير كلمة المرور'}</label>
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
                      placeholder={modalMode === 'add' ? "كلمة المرور..." : "اتركها فارغة للإبقاء على الحالية"}
                    />
                    {errors.password && <p className="text-red-500 text-[9px] font-bold px-1">{errors.password}</p>}
                  </div>

                  {/* Row 3: Role (Enabled for both Add and Edit) */}
                  <div className="space-y-1.5 col-span-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">النوع</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => modalMode === 'add' ? setNewUser({ ...newUser, role: 'confirmed' }) : setEditingUser({ ...editingUser, role: 'confirmed' })}
                        className={`py-2 px-3 rounded-lg border-2 text-[10px] font-black transition-all ${(modalMode === 'add' ? newUser.role : editingUser?.role) === 'confirmed' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-50 bg-slate-50 text-slate-400'}`}
                      >
                        مؤكد
                      </button>
                      <button
                        type="button"
                        onClick={() => modalMode === 'add' ? setNewUser({ ...newUser, role: 'admin' }) : setEditingUser({ ...editingUser, role: 'admin' })}
                        className={`py-2 px-3 rounded-lg border-2 text-[10px] font-black transition-all ${(modalMode === 'add' ? newUser.role : editingUser?.role) === 'admin' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-50 bg-slate-50 text-slate-400'}`}
                      >
                        أدمن
                      </button>
                    </div>
                  </div>

                  {/* Conditional Commission Field - Row 4 */}
                  {((modalMode === 'add' && newUser.role === 'confirmed') || (modalMode === 'edit' && editingUser?.role === 'confirmed')) && (
                    <div className="space-y-1.5 animate-in slide-in-from-top-2 col-span-2">
                      <label className="text-[9px] font-black text-amber-600 uppercase tracking-widest px-1 flex items-center gap-1">
                        <Coins className="w-3 h-3" /> عمولة التأكيد (د.ج)
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
                    {modalMode === 'add' ? 'إنشاء الحساب' : 'حفظ التغييرات'}
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
        title="حذف المستخدم"
        description="هل أنت متأكد من أنك تريد حذف هذا المستخدم؟ لا يمكن التراجع عن هذا الإجراء."
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default UsersView;
