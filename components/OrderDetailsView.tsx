
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Order, OrderLog, OrderItem, OrderStatus } from '../types';
import {
  ArrowRight, Save, X, History,
  User, Phone, MapPin, ShoppingBag, PlusCircle, Trash2, Plus, Clock, Truck, Home, Building2, Store, Check,
  CheckCircle2, RefreshCcw, Map
} from 'lucide-react';
import { statusLabels, statusColors } from './OrderConfirmationView';
import DeleteConfirmationModal from './common/DeleteConfirmationModal';
import toast from 'react-hot-toast';

interface OrderDetailsViewProps {
  order: Order;
  onBack: () => void;
  onUpdate: (updatedOrder: Order) => void;
  onDelete?: (id: string) => Promise<boolean>;
  readOnly?: boolean;
  trackingMode?: boolean;
}

const OrderDetailsView: React.FC<OrderDetailsViewProps> = ({
  order, onBack, onUpdate, onDelete, readOnly = false, trackingMode = false
}) => {
  const [editedOrder, setEditedOrder] = useState<Order>({ ...order });
  const [isAddLogOpen, setIsAddLogOpen] = useState(false);
  const [newLog, setNewLog] = useState<{ status: OrderStatus; note: string }>({ status: order.status, note: '' });

  // Delete States
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const confirmationStatuses: OrderStatus[] = [
    'confirmed', 'message_sent', 'postponed', 'failed_01', 'failed_02',
    'failed_03', 'failed_04', 'failed_05', 'duplicate', 'wrong_number',
    'wrong_order', 'out_of_stock', 'cancelled'
  ];

  const trackingStatuses: OrderStatus[] = [
    'en_preparation', 'ramasse', 'sorti_livraison', 'delivered', 'annule',
    'tentative_01', 'tentative_02', 'tentative_03', 'reporte_01',
    'wrong_number', 'client_absent', 'wrong_address', 'retour_vendeur',
    'retourne_vendeur', 'paid'
  ];

  const statusesToDisplay = trackingMode ? trackingStatuses : confirmationStatuses;

  // Recalculate total amount whenever items or shipping cost change
  useEffect(() => {
    const totalItemsPrice = editedOrder.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    setEditedOrder(prev => ({
      ...prev,
      amount: totalItemsPrice + (Number(prev.shippingCost) || 0)
    }));
  }, [editedOrder.items, editedOrder.shippingCost]);

  const handleSave = () => {
    if (readOnly) return;
    onUpdate({ ...editedOrder, updatedAt: new Date().toLocaleString('ar-SA') });
    alert('تم حفظ كافة البيانات بنجاح');
  };

  const executeDelete = async () => {
    if (!onDelete) return;
    setIsDeleting(true);
    const success = await onDelete(order.id);
    setIsDeleting(false);

    if (success) {
      toast.success('تم حذف الطلب بنجاح');
      onBack(); // Go back to list
    } else {
      toast.error('فشل حذف الطلب');
      setIsDeleteModalOpen(false);
    }
  };

  const addStatusUpdate = () => {
    const now = new Date().toLocaleString('ar-SA');
    const log: OrderLog = {
      status: newLog.status,
      date: now,
      note: newLog.note || `تغيير الحالة لـ: ${statusLabels[newLog.status]}`,
      user: 'أحمد محمد'
    };
    const updated = { ...editedOrder, status: newLog.status, lastStatusDate: now, history: [...(editedOrder.history || []), log], updatedAt: now };
    setEditedOrder(updated);
    onUpdate(updated);
    setIsAddLogOpen(false);
    setNewLog({ status: updated.status, note: '' });
  };

  const updateItem = (index: number, field: keyof OrderItem, value: any) => {
    if (readOnly) return;
    const newItems = [...editedOrder.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setEditedOrder({ ...editedOrder, items: newItems });
  };

  const removeItem = (index: number) => {
    if (readOnly) return;
    const newItems = editedOrder.items.filter((_, i) => i !== index);
    setEditedOrder({ ...editedOrder, items: newItems });
  };

  const addItem = () => {
    if (readOnly) return;
    const newItem: OrderItem = { name: '', variant: '', quantity: 1, price: 0 };
    setEditedOrder({ ...editedOrder, items: [...editedOrder.items, newItem] });
  };

  const currentColors = statusColors[editedOrder.status] || statusColors.default;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300 pb-20">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 sm:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-400 hover:text-indigo-600 transition-all border border-slate-100"><ArrowRight className="w-6 h-6" /></button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-black text-slate-800">الطلب <span className="text-indigo-600">#{order.id}</span></h2>
              <span className={`px-3 py-1 rounded-xl text-[10px] font-black border uppercase ${currentColors.bg} ${currentColors.text} ${currentColors.border}`}>
                {statusLabels[editedOrder.status]}
              </span>
            </div>
            <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{editedOrder.storeName}</p>
          </div>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          {!readOnly && onDelete && (
            <button onClick={() => setIsDeleteModalOpen(true)} className="px-4 py-4 bg-rose-50 text-rose-600 rounded-2xl font-black text-[11px] hover:bg-rose-100 transition-all uppercase flex items-center justify-center gap-2 border border-rose-100">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          {!readOnly && (
            <button onClick={handleSave} className="flex-1 px-8 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black text-[11px] hover:bg-slate-50 transition-all uppercase flex items-center justify-center gap-2">
              <Save className="w-4 h-4" /> حفظ البيانات
            </button>
          )}
          <button onClick={() => setIsAddLogOpen(true)} className="flex-1 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[11px] shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all uppercase flex items-center justify-center gap-2">
            <RefreshCcw className="w-4 h-4" /> تحديث الحالة
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Info Card */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
            <div className="flex items-center gap-3 border-b border-slate-50 pb-5">
              <User className="w-5 h-5 text-indigo-500" />
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">معلومات العميل والشحن</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">اسم العميل</label>
                <input
                  disabled={readOnly}
                  value={editedOrder.customer}
                  onChange={e => setEditedOrder({ ...editedOrder, customer: e.target.value })}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all disabled:opacity-70"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">رقم الهاتف</label>
                <div className="relative">
                  <Phone className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <input
                    disabled={readOnly}
                    value={editedOrder.phone}
                    onChange={e => setEditedOrder({ ...editedOrder, phone: e.target.value })}
                    className="w-full pr-12 pl-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all disabled:opacity-70"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">الولاية</label>
                <input
                  disabled={readOnly}
                  value={editedOrder.state}
                  onChange={e => setEditedOrder({ ...editedOrder, state: e.target.value })}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all disabled:opacity-70"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">البلدية</label>
                <input
                  disabled={readOnly}
                  value={editedOrder.municipality}
                  onChange={e => setEditedOrder({ ...editedOrder, municipality: e.target.value })}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all disabled:opacity-70"
                />
              </div>
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">العنوان التفصيلي</label>
                <textarea
                  disabled={readOnly}
                  value={editedOrder.address}
                  onChange={e => setEditedOrder({ ...editedOrder, address: e.target.value })}
                  className="w-full h-24 px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all disabled:opacity-70 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button
                disabled={readOnly}
                onClick={() => setEditedOrder({ ...editedOrder, deliveryType: 'home' })}
                className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl border-2 transition-all ${editedOrder.deliveryType === 'home' ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-slate-50 bg-slate-50 text-slate-400'}`}
              >
                <Home className="w-5 h-5" />
                <span className="text-[11px] font-black uppercase tracking-widest">توصيل للمنزل</span>
              </button>
              <button
                disabled={readOnly}
                onClick={() => setEditedOrder({ ...editedOrder, deliveryType: 'office' })}
                className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl border-2 transition-all ${editedOrder.deliveryType === 'office' ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-slate-50 bg-slate-50 text-slate-400'}`}
              >
                <Building2 className="w-5 h-5" />
                <span className="text-[11px] font-black uppercase tracking-widest">توصيل للمكتب</span>
              </button>
            </div>
          </div>

          {/* Items / Cart Management Card */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-50 pb-5">
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-5 h-5 text-indigo-500" />
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">سلة المشتريات</h3>
              </div>
              {!readOnly && (
                <button onClick={addItem} className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase hover:bg-indigo-100 transition-all">
                  <PlusCircle className="w-4 h-4" /> إضافة منتج
                </button>
              )}
            </div>

            <div className="space-y-4">
              {editedOrder.items.map((item, idx) => (
                <div key={idx} className="bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100 grid grid-cols-1 md:grid-cols-12 gap-4 items-center animate-in slide-in-from-right-4">
                  <div className="md:col-span-5">
                    <input
                      disabled={readOnly}
                      value={item.name}
                      onChange={e => updateItem(idx, 'name', e.target.value)}
                      placeholder="اسم المنتج..."
                      className="w-full bg-white border border-slate-200 px-4 py-3 rounded-xl text-xs font-bold"
                    />
                  </div>
                  <div className="md:col-span-3">
                    <input
                      disabled={readOnly}
                      value={item.variant}
                      onChange={e => updateItem(idx, 'variant', e.target.value)}
                      placeholder="اللون/المقاس..."
                      className="w-full bg-white border border-slate-200 px-4 py-3 rounded-xl text-[10px] font-bold"
                    />
                  </div>
                  <div className="md:col-span-2 flex items-center gap-2">
                    <span className="text-[9px] font-black text-slate-400">الكمية:</span>
                    <input
                      disabled={readOnly}
                      type="number"
                      value={item.quantity}
                      onChange={e => updateItem(idx, 'quantity', parseInt(e.target.value) || 0)}
                      className="w-16 bg-white border border-slate-200 px-2 py-3 rounded-xl text-xs font-bold text-center"
                    />
                  </div>
                  <div className="md:col-span-1">
                    <input
                      disabled={readOnly}
                      type="number"
                      value={item.price}
                      onChange={e => updateItem(idx, 'price', parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border border-slate-200 px-2 py-3 rounded-xl text-xs font-bold text-indigo-600 text-center"
                    />
                  </div>
                  {!readOnly && (
                    <div className="md:col-span-1 flex justify-center">
                      <button onClick={() => removeItem(idx)} className="p-2 text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {editedOrder.items.length === 0 && (
                <div className="py-12 text-center text-slate-300 italic text-xs">سلة المشتريات فارغة</div>
              )}
            </div>

            <div className="pt-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">سعر التوصيل</label>
                <input
                  disabled={readOnly}
                  type="number"
                  value={editedOrder.shippingCost}
                  onChange={e => setEditedOrder({ ...editedOrder, shippingCost: parseFloat(e.target.value) || 0 })}
                  className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-indigo-600"
                />
              </div>
              <div className="md:col-span-2 flex flex-col justify-center items-end">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">المجموع النهائي (DZD)</p>
                <p className="text-3xl font-black text-slate-800 font-mono tracking-tighter">{editedOrder.amount} <span className="text-[10px]">دج</span></p>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col h-full max-h-[800px]">
            <div className="p-6 border-b border-slate-50 bg-slate-50/50 flex items-center gap-3">
              <History className="w-5 h-5 text-indigo-500" />
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">تاريخ الحالات</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {editedOrder.history?.length === 0 && <p className="text-center py-10 text-[10px] text-slate-300 font-bold uppercase">لا يوجد سجل حركات بعد</p>}
              {editedOrder.history?.map((log, idx) => {
                const logColors = statusColors[log.status] || statusColors.default;
                return (
                  <div key={idx} className="bg-slate-50/60 rounded-[1.5rem] p-5 border border-slate-100 space-y-2 relative">
                    <div className="flex justify-between items-start">
                      <span className={`text-[8px] font-black px-2.5 py-1 rounded-lg border uppercase tracking-widest ${logColors.bg} ${logColors.text} ${logColors.border}`}>{statusLabels[log.status]}</span>
                      <span className="text-[8px] font-bold text-slate-400 font-mono">{log.date}</span>
                    </div>
                    <p className="text-[11px] font-bold text-slate-600 leading-relaxed">{log.note}</p>
                    <div className="flex items-center gap-1.5 pt-1">
                      <div className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center text-[7px] font-black text-slate-500">أ</div>
                      <span className="text-[8px] font-black text-slate-400 uppercase">{log.user}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={executeDelete}
        title="حذف الطلب"
        description="هل أنت متأكد من أنك تريد حذف هذا الطلب؟ لا يمكن التراجع عن هذا الإجراء."
        isDeleting={isDeleting}
      />

      {/* Status Modal */}
      {isAddLogOpen && (
        <React.Fragment>
          {typeof document !== 'undefined' && ReactDOM.createPortal(
            <div className="fixed inset-0 z-[250] grid place-items-center overflow-y-auto py-10 px-4">
              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity" onClick={() => setIsAddLogOpen(false)}></div>
              <div className="relative z-10 bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col my-auto">
                <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white"><CheckCircle2 className="w-5 h-5" /></div>
                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">تحديث الحالة</h4>
                  </div>
                  <button onClick={() => setIsAddLogOpen(false)} className="text-slate-400 hover:text-rose-500"><X className="w-8 h-8" /></button>
                </div>

                <div className="p-10 space-y-8">
                  <div className="space-y-4">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">اختر الحالة</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {statusesToDisplay.map(statusKey => {
                        const colors = statusColors[statusKey] || statusColors.default;
                        const isSelected = newLog.status === statusKey;
                        return (
                          <button
                            key={statusKey}
                            onClick={() => setNewLog({ ...newLog, status: statusKey })}
                            className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 text-center group h-full
                          ${isSelected ? `border-indigo-600 ${colors.bg} ring-4 ring-indigo-500/10` : `border-slate-50 bg-slate-50 ${colors.hover}`} `}
                          >
                            <div className={`w-3 h-3 rounded-full border shadow-sm ${colors.bg} ${colors.border}`}></div>
                            <span className={`text-[10px] font-black uppercase tracking-tight leading-tight ${colors.text}`}>{statusLabels[statusKey]}</span>
                            {isSelected && <div className="absolute top-1 left-1 bg-indigo-600 rounded-full p-0.5 shadow-sm"><Check className="w-2.5 h-2.5 text-white" /></div>}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">الملاحظة</label>
                    <textarea
                      value={newLog.note}
                      onChange={e => setNewLog({ ...newLog, note: e.target.value })}
                      placeholder="اكتب ملاحظة التغيير..."
                      className="w-full h-32 px-5 py-4 bg-slate-50 border border-slate-200 rounded-[1.5rem] text-xs font-bold outline-none resize-none focus:border-indigo-500 transition-all shadow-inner"
                    />
                  </div>
                </div>

                <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
                  <button onClick={() => setIsAddLogOpen(false)} className="flex-1 py-5 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black text-[11px] uppercase tracking-widest">إلغاء</button>
                  <button onClick={addStatusUpdate} className="flex-1 py-5 bg-indigo-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-indigo-600/30">حفظ الحالة الجديدة</button>
                </div>
              </div>
            </div>,
            document.body
          )}
        </React.Fragment>
      )}
    </div>
  );
};

export default OrderDetailsView;
