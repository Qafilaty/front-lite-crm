import React, { useState, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { useQuery, useMutation } from '@apollo/client';
import { Order, OrderLog, OrderItem, OrderStatus, StatusOrderObject } from '../types';
import {
  ArrowRight, Save, X, History,
  User, Phone, MapPin, ShoppingBag, PlusCircle, Trash2, Plus, Clock, Truck, Home, Building2, Store, Check,
  CheckCircle2, RefreshCcw, Map, Loader2, Copy, AlertCircle
} from 'lucide-react';
import { statusLabels, statusColors } from '../constants/statusConstants'; // Still used as fallback for colors if not provided by DB
import { deliveryCompanyService } from '../services/apiService';
import { DeliveryCompany } from '../types';
import DeleteConfirmationModal from './common/DeleteConfirmationModal';
import toast from 'react-hot-toast';
import { GET_CURRENT_USER, GET_ALL_STATUS_COMPANY } from '../graphql/queries';
import { GET_ALL_WILAYAS } from '../graphql/queries/wilayasQueries';
import { UPDATE_ORDER, CHANGE_STATUS_ORDER } from '../graphql/mutations/orderMutations';
import { ModernSelect } from './common';

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
  const [editedOrder, setEditedOrder] = useState<Order>(() => ({
    ...order,
    customer: order.customer || order.fullName || '',
    state: typeof order.state === 'object' && order.state !== null ? (order.state as any).name : order.state,
    city: typeof order.city === 'object' && order.city !== null ? (order.city as any).name : order.city,
  }));
  const [isAddLogOpen, setIsAddLogOpen] = useState(false);

  // Use status object or ID directly
  const [newLog, setNewLog] = useState<{ status: OrderStatus | StatusOrderObject | null; note: string }>({
    status: typeof order.status === 'object' ? order.status : null,
    note: ''
  });

  // Delete States
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Send to Delivery States
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
  const [deliveryCompanies, setDeliveryCompanies] = useState<DeliveryCompany[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [isSendingToDelivery, setIsSendingToDelivery] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [successTrackingCode, setSuccessTrackingCode] = useState<string | null>(null);
  const [successCompanyName, setSuccessCompanyName] = useState<string | null>(null);

  const { data: userData } = useQuery(GET_CURRENT_USER);
  const idCompany = userData?.currentUser?.company?.id;
  const idUser = userData?.currentUser?.id;

  const { data: statusData } = useQuery(GET_ALL_STATUS_COMPANY, {
    skip: !idCompany
  });

  const { data: wilayasData } = useQuery(GET_ALL_WILAYAS);

  const [updateOrder, { loading: isUpdating }] = useMutation(UPDATE_ORDER);
  const [changeStatusOrder, { loading: isStatusUpdating }] = useMutation(CHANGE_STATUS_ORDER);

  // Derive statuses from backend data or fall back to defaults
  const confirmationStatuses = useMemo(() => {
    if (!statusData?.allStatusCompany) return ['pending', 'confirmed', 'cancelled']; // Fallback
    const group = statusData.allStatusCompany.find((g: any) => g.group === 'Confirmation Group');
    return group?.listStatus || [];
  }, [statusData]);

  const trackingStatuses = useMemo(() => {
    if (!statusData?.allStatusCompany) return [];
    const group = statusData.allStatusCompany.find((g: any) =>
      g.group === 'Tracking Group' ||
      g.group?.toLowerCase().trim() === 'tracking group' ||
      g.group?.toLowerCase().includes('tracking')
    );
    return group?.listStatus || [];
  }, [statusData]);

  const statusMap = useMemo(() => {
    if (!statusData?.allStatusCompany) return statusLabels;
    const map: Record<string, string> = {};
    statusData.allStatusCompany.forEach((group: any) => {
      group.listStatus.forEach((s: any) => {
        map[s.nameEN] = s.nameAR;
      });
    });
    return { ...statusLabels, ...map };
  }, [statusData]);

  const statusesToDisplay = trackingMode ? trackingStatuses : confirmationStatuses;

  // Recalculate total amount whenever items or shipping cost change
  useEffect(() => {
    const items = editedOrder.items || [];
    const totalItemsPrice = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    setEditedOrder(prev => ({
      ...prev,
      amount: totalItemsPrice + (Number(prev.shippingCost) || 0)
    }));
  }, [editedOrder.items, editedOrder.shippingCost]);

  const isDirty = JSON.stringify(order) !== JSON.stringify(editedOrder);

  const handleSave = async () => {
    if (readOnly) return;
    try {
      const content = {
        fullName: editedOrder.customer,
        phone: editedOrder.phone,
        state: { name: typeof editedOrder.state === 'string' ? editedOrder.state : (editedOrder.state as any).name }, // Handle state safely
        city: editedOrder.city,
        address: editedOrder.address,
        deliveryType: editedOrder.deliveryType,
        deliveryPrice: editedOrder.shippingCost,
        totalPrice: editedOrder.amount - (editedOrder.discount || 0),
        note: editedOrder.notes,
        discount: editedOrder.discount,
        // Map items
        products: editedOrder.items.map(item => ({
          name: item.name,
          price: Number(item.price),
          quantity: Number(item.quantity)
        }))
      };

      await updateOrder({
        variables: {
          id: order.id,
          content
        }
      });

      toast.success('تم حفظ التغييرات بنجاح');
      onUpdate({ ...editedOrder, updatedAt: new Date().toLocaleString('ar-SA') });
    } catch (error: any) {
      console.error(error);
      toast.error('حدث خطأ أثناء الحفظ');
    }
  };

  const addStatusUpdate = async () => {
    if (!newLog.status) return;

    // Use ID if available (DB status), otherwise fallback to name/key
    const statusValue = (typeof newLog.status === 'object' && newLog.status !== null)
      ? newLog.status.id
      : newLog.status;

    try {
      await changeStatusOrder({
        variables: {
          id: order.id,
          content: {
            status: statusValue,
            note: newLog.note,
            idUser: idUser
          }
        }
      });

      toast.success('تم تحديث الحالة بنجاح');

      // Optimistic update
      const now = new Date().toLocaleString('en-GB'); // Standard numerals
      const log: OrderLog = {
        status: newLog.status,
        date: now,
        note: newLog.note || `تغيير الحالة`,
        user: userData?.currentUser?.name || 'مستخدم'
      };

      // Update local state, keeping the structure consistent
      const statusKey = getStatusKey(newLog.status);
      const isDelivery = trackingStatuses.includes(statusKey);

      const updatedConfirmation = isDelivery ? (editedOrder.confirmationTimeLine || []) : [...(editedOrder.confirmationTimeLine || []), log];
      const updatedDelivery = isDelivery ? [...(editedOrder.deliveryTimeLine || []), log] : (editedOrder.deliveryTimeLine || []);

      const updated = {
        ...editedOrder,
        status: newLog.status, // Update main status
        lastStatusDate: now,
        history: [...(editedOrder.history || []), log],
        confirmationTimeLine: updatedConfirmation,
        deliveryTimeLine: updatedDelivery,
        updatedAt: now
      };

      setEditedOrder(updated);
      onUpdate(updated);
      setIsAddLogOpen(false);
      setNewLog({ status: updated.status, note: '' });

    } catch (error: any) {
      console.error(error);
      toast.error('حدث خطأ أثناء تحديث الحالة');
    }
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

  const updateItem = (index: number, field: keyof OrderItem, value: any) => {
    if (readOnly) return;
    const newItems = [...editedOrder.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setEditedOrder({ ...editedOrder, items: newItems });
  };

  const removeItem = (index: number) => {
    if (readOnly) return;
    const items = [...editedOrder.items];
    items.splice(index, 1);
    setEditedOrder({ ...editedOrder, items });
  };

  const addItem = () => {
    if (readOnly) return;
    const newItem: OrderItem = { name: '', variant: '', quantity: 1, price: 0 };
    setEditedOrder({ ...editedOrder, items: [...editedOrder.items, newItem] });
  };

  // Helper to extract status key (nameEN or string)
  const getStatusKey = (s: any): string => {
    if (typeof s === 'object' && s !== null) return s.nameEN || 'pending';
    return s || 'pending';
  };

  // Helper to extract status label (nameAR or mapped string)
  const getStatusLabel = (s: any): string => {
    if (typeof s === 'object' && s !== null) return s.nameAR || s.nameEN || 'pending';
    return statusMap[s] || s || 'pending';
  };

  // Helper to get status color (dynamic or fallback)
  const getStatusStyle = (s: any) => {
    if (typeof s === 'object' && s !== null && s.color) {
      return {
        backgroundColor: `${s.color}15`, // 15 is hex opacity ~8%
        color: s.color,
        borderColor: `${s.color}30` // 30 is hex opacity ~19%
      };
    }
    const key = getStatusKey(s);
    return null; // Return null to signal usage of Tailwind classes instead
  };

  const statusKey = getStatusKey(editedOrder.status);
  const statusStyle = getStatusStyle(editedOrder.status);
  const fallbackColors = statusColors[statusKey] || statusColors.default;



  // Delivery Handlers
  const openDeliveryModal = async () => {
    setIsDeliveryModalOpen(true);

    if (deliveryCompanies.length === 0 && idCompany) {
      setLoadingCompanies(true);
      try {
        const result = await deliveryCompanyService.getAllDeliveryCompanies();
        if (result.success && result.deliveryCompanies) {
          setDeliveryCompanies(result.deliveryCompanies);
        }
      } catch (err) {
        console.error("Error fetching companies", err);
        toast.error("فشل تحميل شركات التوصيل");
      } finally {
        setLoadingCompanies(false);
      }
    }
  };

  const handleSendToDelivery = async () => {
    if (!selectedCompanyId || !idCompany) return;

    setIsSendingToDelivery(true);
    const result = await deliveryCompanyService.addOrderToDeliveryCompany(
      selectedCompanyId,
      [order.id]
    );

    setIsSendingToDelivery(false);

    if (result.success && result.data?.successOrder?.length > 0) {
      const successOrder = result.data.successOrder[0];
      const tracking = successOrder.deliveryCompany?.trackingCode || 'Unknown';
      const companyName = deliveryCompanies.find(c => c.id === selectedCompanyId)?.name || 'الشركة';

      setSuccessTrackingCode(tracking);
      setSuccessCompanyName(companyName);
      setIsDeliveryModalOpen(false);
      setIsSuccessModalOpen(true);

      toast.success('تم إرسال الطلب بنجاح');

      // Update local order tracking if needed, 
      // but ideally we should trigger a refresh or update local state
    } else {
      toast.error('فشل إرسال الطلب');
    }
  };

  const copyTracking = () => {
    if (successTrackingCode) {
      navigator.clipboard.writeText(successTrackingCode);
      toast.success('تم نسخ كود التتبع');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300 pb-20">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 sm:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-400 hover:text-indigo-600 transition-all border border-slate-100"><ArrowRight className="w-6 h-6" /></button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-black text-slate-800">الطلب <span className="text-indigo-600">#{order.numberOrder || order.id?.slice(-8)}</span></h2>
              <span
                className={`px-3 py-1 rounded-xl text-[10px] font-black border uppercase ${!statusStyle ? `${fallbackColors.bg} ${fallbackColors.text} ${fallbackColors.border}` : ''}`}
                style={statusStyle ? { backgroundColor: statusStyle.backgroundColor, color: statusStyle.color, borderColor: statusStyle.borderColor } : {}}
              >
                {getStatusLabel(editedOrder.status)}
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
            <button
              onClick={handleSave}
              disabled={!isDirty || isUpdating}
              className={`flex-1 px-8 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black text-[11px] transition-all uppercase flex items-center justify-center gap-2 ${!isDirty || isUpdating ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-50'}`}
            >
              {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isUpdating ? 'جاري الحفظ...' : 'حفظ البيانات'}
            </button>
          )}
          <button onClick={() => { setIsAddLogOpen(true); }} className="flex-1 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[11px] shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all uppercase flex items-center justify-center gap-2">
            <RefreshCcw className="w-4 h-4" /> تحديث الحالة
          </button>
          {!readOnly && !order.deliveryCompany?.trackingCode && (
            <button
              onClick={openDeliveryModal}
              className="flex-1 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-[11px] shadow-xl shadow-slate-900/20 hover:bg-slate-800 transition-all uppercase flex items-center justify-center gap-2"
            >
              <Truck className="w-4 h-4" /> إرسال للتوصيل
            </button>
          )}
        </div>
      </div>

      {order.deliveryCompany?.trackingCode && (
        <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 animate-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-3xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm overflow-hidden">
              {order.deliveryCompany?.deliveryCompany?.availableDeliveryCompany?.logo ? (
                <img
                  src={`${import.meta.env.VITE_Images_Url}/${order.deliveryCompany.deliveryCompany.availableDeliveryCompany.logo}`}
                  alt={order.deliveryCompany?.deliveryCompany?.name || "Delivery Company"}
                  className="w-full h-full object-contain p-2"
                />
              ) : (
                <Truck className="w-8 h-8" />
              )}
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">يتم التوصيل عبر</p>
              <h3 className="text-xl font-black text-slate-800">{order.deliveryCompany?.deliveryCompany?.name || 'شركة التوصيل'}</h3>
              <div className="flex items-center gap-2 mt-2">
                <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider ${order.deliveryCompany.status ? 'bg-slate-100 text-slate-500' : 'bg-emerald-100 text-emerald-600'}`}>
                  {order.deliveryCompany.status || 'جاري التوصيل'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2 w-full md:w-auto">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">كود التتبع</p>
            <div onClick={() => {
              navigator.clipboard.writeText(order.deliveryCompany?.trackingCode || '');
              toast.success('تم نسخ كود التتبع');
            }} className="group cursor-pointer flex items-center gap-4 bg-slate-50 border border-slate-200 hover:border-indigo-200 hover:bg-slate-100 transition-all pr-5 pl-2 py-3 rounded-2xl w-full md:min-w-[300px] justify-between">
              <span className="font-mono text-lg font-bold text-slate-700 tracking-wider">{order.deliveryCompany?.trackingCode}</span>
              <span className="w-10 h-10 flex items-center justify-center rounded-xl bg-white shadow-sm text-slate-400 group-hover:text-indigo-600 transition-colors">
                <Copy className="w-5 h-5" />
              </span>
            </div>
          </div>
        </div>
      )}

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
                <ModernSelect
                  disabled={readOnly}
                  value={(() => {
                    const currentVal = typeof editedOrder.state === 'object' && editedOrder.state !== null
                      ? (editedOrder.state as any).name
                      : editedOrder.state;
                    return currentVal || '';
                  })()}
                  onChange={(val) => {
                    setEditedOrder({ ...editedOrder, state: val, city: '' });
                  }}
                  options={[
                    { value: '', label: 'اختر الولاية' },
                    ...(wilayasData?.allWilayas?.map((w: any) => ({
                      value: w.name,
                      label: `${w.code} - ${w.name} / ${w.arName || w.name}`
                    })) || [])
                  ]}
                  placeholder="اختر الولاية"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">البلدية</label>
                <ModernSelect
                  disabled={readOnly || !editedOrder.state}
                  value={(() => {
                    let savedMunc = typeof editedOrder.city === 'object' && editedOrder.city !== null
                      ? (editedOrder.city as any).name
                      : editedOrder.city;
                    savedMunc = (savedMunc || '').trim();
                    return savedMunc;
                  })()}
                  onChange={(val) => setEditedOrder({ ...editedOrder, city: val })}
                  options={[
                    { value: '', label: 'اختر البلدية' },
                    ...(() => {
                      const currentStateName = typeof editedOrder.state === 'object' && editedOrder.state !== null
                        ? (editedOrder.state as any).name
                        : editedOrder.state;

                      if (!currentStateName) return [];

                      const wilaya = wilayasData?.allWilayas?.find((w: any) =>
                        w.name?.toLowerCase() === currentStateName.toLowerCase() ||
                        w.code == currentStateName
                      );

                      return wilaya?.communes?.map((c: any) => ({
                        value: c.name,
                        label: c.name + (c.arName ? ` - ${c.arName}` : '')
                      })) || [];
                    })()
                  ]}
                  placeholder="اختر البلدية"
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
              {editedOrder.items?.map((item, idx) => (
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
              {editedOrder.items?.length === 0 && (
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
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">الخصم (Discount)</label>
                <input
                  disabled={readOnly}
                  type="number"
                  value={editedOrder.discount || 0}
                  onChange={e => setEditedOrder({ ...editedOrder, discount: parseFloat(e.target.value) || 0 })}
                  className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-rose-500"
                />
              </div>
              <div className="md:col-span-1 flex flex-col justify-center items-end">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">المجموع النهائي (DZD)</p>
                <p className="text-3xl font-black text-slate-800 font-mono tracking-tighter">
                  {(editedOrder.amount - (editedOrder.discount || 0)).toLocaleString()} <span className="text-[10px]">دج</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Order Meta Card */}
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-6 space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
              <Clock className="w-5 h-5 text-indigo-500" />
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">معلومات الطلب</h3>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">تاريخ الإنشاء</p>
                <p className="text-xs font-bold text-slate-700 dir-ltr">{new Date(editedOrder.createdAt).toLocaleString('ar-DZ')}</p>
              </div>

              {editedOrder.duplicatePhone && (
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex items-center gap-2 text-amber-600">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-[10px] font-black">رقم هاتف مكرر</span>
                </div>
              )}

              <div className="space-y-1.5 pt-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">ملاحظة داخلية</label>
                <textarea
                  disabled={readOnly}
                  value={editedOrder.notes || ''}
                  onChange={e => setEditedOrder({ ...editedOrder, notes: e.target.value })}
                  className="w-full h-24 px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all resize-none"
                  placeholder="ملاحظات حول الطلب..."
                />
              </div>
            </div>
          </div>
          {/* Confirmation Timeline */}
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col max-h-[400px]">
            <div className="p-6 border-b border-slate-50 bg-slate-50/50 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-indigo-500" />
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">تاريخ التأكيد</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {(!editedOrder.confirmationTimeLine || editedOrder.confirmationTimeLine.length === 0) && <p className="text-center py-10 text-[10px] text-slate-300 font-bold uppercase">لا يوجد سجل تأكيد بعد</p>}
              {editedOrder.confirmationTimeLine?.map((log, idx) => {
                const logStyle = getStatusStyle(log.status);
                const logKey = getStatusKey(log.status);
                const logColors = statusColors[logKey] || statusColors.default;

                return (
                  <div key={idx} className="bg-slate-50/60 rounded-[1.5rem] p-5 border border-slate-100 space-y-2 relative">
                    <div className="flex justify-between items-start">
                      <span
                        className={`text-[8px] font-black px-2.5 py-1 rounded-lg border uppercase tracking-widest ${!logStyle ? `${logColors.bg} ${logColors.text} ${logColors.border}` : ''}`}
                        style={logStyle ? { backgroundColor: logStyle.backgroundColor, color: logStyle.color, borderColor: logStyle.borderColor } : {}}
                      >
                        {getStatusLabel(log.status)}
                      </span>
                      <span className="text-[8px] font-bold text-slate-400 font-mono" dir="ltr">{log.date}</span>
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

          {/* Delivery Timeline */}
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col max-h-[400px]">
            <div className="p-6 border-b border-slate-50 bg-slate-50/50 flex items-center gap-3">
              <Truck className="w-5 h-5 text-indigo-500" />
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">تتبع التوصيل</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {(!editedOrder.deliveryTimeLine || editedOrder.deliveryTimeLine.length === 0) && <p className="text-center py-10 text-[10px] text-slate-300 font-bold uppercase">لا يوجد سجل توصيل بعد</p>}
              {editedOrder.deliveryTimeLine?.map((log, idx) => {
                const logStyle = getStatusStyle(log.status);
                const logKey = getStatusKey(log.status);
                const logColors = statusColors[logKey] || statusColors.default;

                return (
                  <div key={idx} className="bg-slate-50/60 rounded-[1.5rem] p-5 border border-slate-100 space-y-2 relative">
                    <div className="flex justify-between items-start">
                      <span
                        className={`text-[8px] font-black px-2.5 py-1 rounded-lg border uppercase tracking-widest ${!logStyle ? `${logColors.bg} ${logColors.text} ${logColors.border}` : ''}`}
                        style={logStyle ? { backgroundColor: logStyle.backgroundColor, color: logStyle.color, borderColor: logStyle.borderColor } : {}}
                      >
                        {getStatusLabel(log.status)}
                      </span>
                      <span className="text-[8px] font-bold text-slate-400 font-mono" dir="ltr">{log.date}</span>
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

      {/* Status Modal - 2 Step Process */}
      {isAddLogOpen && (
        <React.Fragment>
          {typeof document !== 'undefined' && ReactDOM.createPortal(
            <div className="fixed inset-0 z-[250] grid place-items-center overflow-y-auto py-10 px-4">
              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity" onClick={() => setIsAddLogOpen(false)}></div>
              <div className="relative z-10 bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col my-auto h-[600px]">
                <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white"><CheckCircle2 className="w-5 h-5" /></div>
                    <div>
                      <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">تحديث الحالة</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mt-0.5">
                        قم بتغيير حالة الطلب وإضافة ملاحظة
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setIsAddLogOpen(false)} className="text-slate-400 hover:text-rose-500"><X className="w-8 h-8" /></button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">الحالة الجديدة</label>
                    <ModernSelect
                      value={(() => {
                        const currentKey = getStatusKey(newLog.status);
                        // Find the full object from statusesToDisplay to ensure we have the correct label
                        const foundStatus = statusesToDisplay.find((s: any) => getStatusKey(s) === currentKey);
                        return foundStatus ? (foundStatus.id || foundStatus.nameEN) : subStatusKey(newLog.status);

                        function subStatusKey(s: any) {
                          if (typeof s === 'object' && s !== null) return s.id; // prefer ID for value
                          return s || '';
                        }
                      })()}
                      onChange={(val) => {
                        // Find the full status object based on the selected value (ID or Name)
                        const selectedStatus = statusesToDisplay.find((s: any) => s.id === val || s.nameEN === val);
                        setNewLog({ ...newLog, status: selectedStatus || val });
                      }}
                      options={statusesToDisplay.map((s: any) => ({
                        value: s.id || s.nameEN, // Use ID if available
                        label: s.nameAR || s.nameEN,
                        color: s.color // Pass color
                      }))}
                      placeholder="اختر الحالة..."
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">ملاحظة (اختياري)</label>
                    <textarea
                      value={newLog.note}
                      onChange={e => setNewLog({ ...newLog, note: e.target.value })}
                      placeholder="اكتب ملاحظة التغيير..."
                      className="w-full min-h-[120px] px-5 py-4 bg-slate-50 border border-slate-200 rounded-[1.5rem] text-xs font-bold outline-none resize-none focus:border-indigo-500 transition-all shadow-inner"
                    />
                  </div>
                </div>

                <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4 shrink-0">
                  <button onClick={() => setIsAddLogOpen(false)} className="flex-1 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-slate-100">إلغاء</button>
                  <button onClick={addStatusUpdate} className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-indigo-600/30 hover:bg-indigo-700">تأكيد التحديث</button>
                </div>
              </div>
            </div>,
            document.body
          )}
        </React.Fragment>
      )}

      {/* Select Delivery Company Modal */}
      {isDeliveryModalOpen && (
        <div className="fixed inset-0 z-[250] grid place-items-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity" onClick={() => setIsDeliveryModalOpen(false)}></div>
          <div className="relative z-10 bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
                  <Truck className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">إرسال للتوصيل</h4>
                  <p className="text-[10px] font-bold text-slate-400 mt-0.5">اختر شركة التوصيل لإسناد الطلب</p>
                </div>
              </div>
              <button onClick={() => setIsDeliveryModalOpen(false)} className="text-slate-400 hover:text-rose-500 transition-colors"><X className="w-6 h-6" /></button>
            </div>

            <div className="p-8">
              {loadingCompanies ? (
                <div className="py-12 flex justify-center">
                  <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                </div>
              ) : deliveryCompanies.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
                  <p className="text-xs font-bold text-slate-500">لا توجد شركات توصيل متاحة</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar">
                  {deliveryCompanies.map(company => (
                    <label key={company.id} className={`flex items-center justify-between p-5 rounded-2xl border-2 cursor-pointer transition-all ${selectedCompanyId === company.id ? 'border-indigo-600 bg-indigo-50/50 ring-4 ring-indigo-500/10' : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'}`}>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-white border border-slate-100 flex items-center justify-center overflow-hidden">
                          {company.logo ? <img src={company.logo} alt={company.name} className="w-full h-full object-contain p-2" /> : <Truck className="w-6 h-6 text-slate-300" />}
                        </div>
                        <span className="font-black text-sm text-slate-700">{company.name}</span>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${selectedCompanyId === company.id ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300 bg-white'}`}>
                        {selectedCompanyId === company.id && <Check className="w-4 h-4 text-white" />}
                      </div>
                      <input
                        type="radio"
                        name="deliveryCompany"
                        value={company.id}
                        checked={selectedCompanyId === company.id}
                        onChange={() => setSelectedCompanyId(company.id)}
                        className="hidden"
                      />
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
              <button onClick={() => setIsDeliveryModalOpen(false)} className="flex-1 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-slate-100 transition-all">إلغاء</button>
              <button
                onClick={handleSendToDelivery}
                disabled={!selectedCompanyId || isSendingToDelivery}
                className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-indigo-600/30 hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                {isSendingToDelivery ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Truck className="w-4 h-4" /> إرسال الطلب</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {isSuccessModalOpen && (
        <div className="fixed inset-0 z-[300] grid place-items-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity" onClick={() => setIsSuccessModalOpen(false)}></div>
          <div className="relative z-10 bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-emerald-500 py-10 flex flex-col items-center justify-center text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
              <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mb-5 ring-4 ring-white/10 shadow-lg">
                <CheckCircle2 className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-white font-black text-2xl tracking-tight">تم الإرسال بنجاح!</h3>
              <p className="text-emerald-100 text-xs font-bold mt-2 uppercase tracking-widest">تم إسناد الطلب لشركة {successCompanyName}</p>
            </div>

            <div className="p-10">
              <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center group relative hover:border-indigo-300 transition-colors">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">كود التتبع / Tracking Code</p>
                <div className="flex items-center justify-center gap-3">
                  <h2 className="text-3xl font-black text-slate-800 tracking-wider font-mono select-all cursor-pointer" onClick={copyTracking}>{successTrackingCode}</h2>
                  <button onClick={copyTracking} className="text-slate-400 hover:text-indigo-600 transition-colors p-2 rounded-xl hover:bg-indigo-50"><Copy className="w-5 h-5" /></button>
                </div>
              </div>

              <button
                onClick={() => setIsSuccessModalOpen(false)}
                className="w-full mt-8 py-5 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-slate-900/10 hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
              >
                موافق، إغلاق النافذة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetailsView;
