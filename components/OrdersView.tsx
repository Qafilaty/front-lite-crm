
import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { Order, OrderItem } from '../types';
import { Package, CheckCircle, Clock, XCircle, Search, Filter, Download, Plus, ShoppingBag, User, Phone, MapPin, Building2, Home, Trash2, X, Save, Edit3 } from 'lucide-react';
import DeleteConfirmationModal from './common/DeleteConfirmationModal';
import toast from 'react-hot-toast';

interface OrdersViewProps {
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  onCreateOrder?: (orderData: any) => Promise<boolean>;
  onDeleteOrder?: (id: string) => Promise<boolean>;
}

const OrdersView: React.FC<OrdersViewProps> = ({
  orders,
  setOrders,
  onCreateOrder,
  onDeleteOrder
}) => {
  // --- States ---
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Delete States
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // New Order Form State
  const initialOrderState = {
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    state: '',
    commune: '', // municipality
    deliveryType: 'home', // 'home' | 'stopdesk'
    items: [] as OrderItem[],
    note: ''
  };
  const [newOrder, setNewOrder] = useState(initialOrderState);

  // Helper for status styles
  const getStatusStyle = (status: Order['status']) => {
    switch (status) {
      case 'delivered': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'shipped': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'pending': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'cancelled': return 'bg-rose-50 text-rose-600 border-rose-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  const getStatusLabel = (status: Order['status']) => {
    switch (status) {
      case 'delivered': return 'تم التوصيل';
      case 'shipped': return 'تم الشحن';
      case 'pending': return 'جاري المعالجة';
      case 'cancelled': return 'تم الإلغاء';
      default: return status;
    }
  };

  // --- Handlers ---
  const openCreateModal = () => {
    setNewOrder(initialOrderState);
    setIsCreateModalOpen(true);
  };

  const handleAddItem = () => {
    setNewOrder({
      ...newOrder,
      items: [...newOrder.items, { name: '', variant: '', quantity: 1, price: 0 }]
    });
  };

  const updateItem = (index: number, field: keyof OrderItem, value: any) => {
    const updatedItems = [...newOrder.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setNewOrder({ ...newOrder, items: updatedItems });
  };

  const removeItem = (index: number) => {
    const updatedItems = newOrder.items.filter((_, i) => i !== index);
    setNewOrder({ ...newOrder, items: updatedItems });
  };

  const handleSubmitOrder = async () => {
    if (!newOrder.firstName || !newOrder.lastName || !newOrder.phone || newOrder.items.length === 0) {
      toast.error('يرجى ملء جميع البيانات الإجبارية وإضافة منتج واحد على الأقل');
      return;
    }

    const orderData = {
      fullName: `${newOrder.firstName} ${newOrder.lastName}`,
      phone: newOrder.phone,
      address: newOrder.address,
      municipality: newOrder.commune, // Assuming API expects this or similar
      wilaya: newOrder.state, // Map 'state' to 'wilaya' if needed
      deliveryType: newOrder.deliveryType,
      note: newOrder.note,
      products: newOrder.items.map(item => ({
        name: item.name,
        qty: item.quantity,
        price: item.price,
        variant: item.variant // If supported
      }))
    };

    if (onCreateOrder) {
      const toastId = toast.loading('جاري إنشاء الطلب...');
      const success = await onCreateOrder(orderData);
      if (success) {
        toast.success('تم إنشاء الطلب بنجاح', { id: toastId });
        setIsCreateModalOpen(false);
      } else {
        toast.error('فشل إنشاء الطلب', { id: toastId });
      }
    } else {
      toast.success('تمت العملية (تجريبي)');
      setIsCreateModalOpen(false);
    }
  };

  const confirmDelete = (id: string) => {
    setOrderToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const executeDelete = async () => {
    if (!orderToDelete) return;
    setIsDeleting(true);

    let success = true;
    if (onDeleteOrder) {
      success = await onDeleteOrder(orderToDelete);
    }

    setIsDeleting(false);

    if (success) {
      toast.success('تم حذف الطلب بنجاح');
      setIsDeleteModalOpen(false);
      setOrderToDelete(null);
    } else {
      toast.error('فشل حذف الطلب');
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-800 tracking-tight">قائمة الطلبات</h2>
          <p className="text-slate-400 text-[11px] font-bold uppercase tracking-tighter">متابعة دقيقة لطلبات العملاء وحالات الشحن</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-all text-[10px] font-black uppercase">
            <Filter className="w-3.5 h-3.5" /> تصفية
          </button>
          <button className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 text-[10px] font-black uppercase"
            onClick={openCreateModal}
          >
            <Plus className="w-3.5 h-3.5" /> إضافة طلب
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">المعرف</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">العميل</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">المنتج</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">القيمة</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">الحالة</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">التاريخ</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50/50 transition-all group">
                  <td className="px-6 py-4 font-black text-indigo-600 text-[11px] tracking-widest uppercase">#{order.id}</td>
                  <td className="px-6 py-4 text-[12px] text-slate-800 font-black">{order.customer}</td>
                  <td className="px-6 py-4 text-[11px] text-slate-500 font-medium">{order.product}</td>
                  <td className="px-6 py-4 text-[11px] font-black text-slate-800">{order.amount} ر.س</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black border uppercase tracking-tighter ${getStatusStyle(order.status)}`}>
                      {getStatusLabel(order.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[10px] text-slate-400 font-bold">{order.date}</td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => confirmDelete(order.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400 text-xs font-bold">لا توجد طلبات لعرضها</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Order Modal */}
      {isCreateModalOpen && (
        <React.Fragment>
          {typeof document !== 'undefined' && ReactDOM.createPortal(
            <div className="fixed inset-0 z-[100] grid place-items-center overflow-y-auto py-10 px-4">
              <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" onClick={() => setIsCreateModalOpen(false)}></div>
              <div className="relative z-10 bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col my-auto max-h-none">

                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
                      <ShoppingBag className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">إضافة طلب جديد</h4>
                      <p className="text-[10px] font-bold text-slate-400 mt-0.5">أدخل بيانات العميل والمنتجات لإنشاء طلب</p>
                    </div>
                  </div>
                  <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-rose-500 transition-colors"><X className="w-6 h-6" /></button>
                </div>

                <div className="p-8 overflow-y-auto custom-scrollbar space-y-8">

                  {/* Customer Info */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                      <User className="w-4 h-4 text-indigo-500" />
                      <h5 className="text-xs font-black text-slate-700 uppercase tracking-wider">بيانات العميل</h5>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">الاسم الأول *</label>
                        <input
                          type="text"
                          value={newOrder.firstName}
                          onChange={e => setNewOrder({ ...newOrder, firstName: e.target.value })}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:border-indigo-500 outline-none transition-all"
                          placeholder="الاسم الأول..."
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">ي. الاسم العائلي *</label>
                        <input
                          type="text"
                          value={newOrder.lastName}
                          onChange={e => setNewOrder({ ...newOrder, lastName: e.target.value })}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:border-indigo-500 outline-none transition-all"
                          placeholder="اللقب..."
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">رقم الهاتف *</label>
                        <div className="relative">
                          <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                          <input
                            type="tel"
                            value={newOrder.phone}
                            onChange={e => setNewOrder({ ...newOrder, phone: e.target.value })}
                            className="w-full pr-10 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:border-indigo-500 outline-none transition-all font-mono"
                            placeholder="05..."
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Address Info */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                      <MapPin className="w-4 h-4 text-indigo-500" />
                      <h5 className="text-xs font-black text-slate-700 uppercase tracking-wider">العنوان والشحن</h5>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">الولاية</label>
                        <input
                          type="text"
                          value={newOrder.state}
                          onChange={e => setNewOrder({ ...newOrder, state: e.target.value })}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:border-indigo-500 outline-none transition-all"
                          placeholder="اختر الولاية..."
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">البلدية</label>
                        <input
                          type="text"
                          value={newOrder.commune}
                          onChange={e => setNewOrder({ ...newOrder, commune: e.target.value })}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:border-indigo-500 outline-none transition-all"
                          placeholder="البلدية..."
                        />
                      </div>
                      <div className="md:col-span-2 space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">العنوان التفصيلي</label>
                        <input
                          type="text"
                          value={newOrder.address}
                          onChange={e => setNewOrder({ ...newOrder, address: e.target.value })}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:border-indigo-500 outline-none transition-all"
                          placeholder="الحي، رقم المنزل..."
                        />
                      </div>
                    </div>

                    {/* Delivery Type */}
                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <button
                        type="button"
                        onClick={() => setNewOrder({ ...newOrder, deliveryType: 'home' })}
                        className={`flex flex-col items-center justify-center gap-2 py-4 rounded-xl border-2 transition-all ${newOrder.deliveryType === 'home' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200'}`}
                      >
                        <Home className="w-5 h-5" />
                        <span className="text-[10px] font-black uppercase">توصيل للمنزل</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewOrder({ ...newOrder, deliveryType: 'stopdesk' })}
                        className={`flex flex-col items-center justify-center gap-2 py-4 rounded-xl border-2 transition-all ${newOrder.deliveryType === 'stopdesk' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200'}`}
                      >
                        <Building2 className="w-5 h-5" />
                        <span className="text-[10px] font-black uppercase">استلام من المكتب (StopDesk)</span>
                      </button>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-indigo-500" />
                        <h5 className="text-xs font-black text-slate-700 uppercase tracking-wider">المنتجات *</h5>
                      </div>
                      <button
                        onClick={handleAddItem}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase hover:bg-indigo-100 transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" /> إضافة منتج
                      </button>
                    </div>

                    {newOrder.items.length === 0 ? (
                      <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        <p className="text-slate-400 text-xs font-bold">لم تتم إضافة أي منتجات بعد</p>
                        <button onClick={handleAddItem} className="mt-2 text-indigo-600 text-xs font-black hover:underline">إضافة منتج الآن</button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {newOrder.items.map((item, idx) => (
                          <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100 relative group animate-in slide-in-from-right-2">
                            <div className="md:col-span-4">
                              <input
                                placeholder="اسم المنتج"
                                value={item.name}
                                onChange={e => updateItem(idx, 'name', e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold outline-none focus:border-indigo-500 transition-all"
                              />
                            </div>
                            <div className="md:col-span-3">
                              <input
                                placeholder="SKU / المتغير"
                                value={item.variant}
                                onChange={e => updateItem(idx, 'variant', e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold outline-none focus:border-indigo-500 transition-all"
                              />
                            </div>
                            <div className="md:col-span-2">
                              <input
                                type="number"
                                placeholder="الكمية"
                                value={item.quantity}
                                onChange={e => updateItem(idx, 'quantity', Number(e.target.value))}
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold outline-none focus:border-indigo-500 transition-all text-center"
                              />
                            </div>
                            <div className="md:col-span-2">
                              <input
                                type="number"
                                placeholder="السعر"
                                value={item.price}
                                onChange={e => updateItem(idx, 'price', Number(e.target.value))}
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold outline-none focus:border-indigo-500 transition-all text-center text-indigo-600"
                              />
                            </div>
                            <div className="md:col-span-1 flex items-center justify-center">
                              <button
                                onClick={() => removeItem(idx)}
                                className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Note */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">ملاحظات إضافية</label>
                    <textarea
                      value={newOrder.note}
                      onChange={e => setNewOrder({ ...newOrder, note: e.target.value })}
                      className="w-full h-20 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:border-indigo-500 outline-none transition-all resize-none"
                      placeholder="أي تفاصيل أخرى..."
                    />
                  </div>

                </div>

                {/* Footer */}
                <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-4">
                  <button
                    onClick={() => setIsCreateModalOpen(false)}
                    className="flex-1 py-4 bg-white border border-slate-200 text-slate-600 rounded-xl font-black text-xs uppercase hover:bg-slate-100 transition-all"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={handleSubmitOrder}
                    className="flex-1 py-4 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all"
                  >
                    <Save className="w-4 h-4" /> إنشاء الطلب
                  </button>
                </div>

              </div>
            </div>,
            document.body
          )}
        </React.Fragment>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={executeDelete}
        title="حذف الطلب"
        description="هل أنت متأكد من أنك تريد حذف هذا الطلب؟ لا يمكن التراجع عن هذا الإجراء."
        isDeleting={isDeleting}
      />

    </div>
  );
};

export default OrdersView;
