import React, { useState, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { useQuery, useMutation, useLazyQuery } from '@apollo/client';
import { Order, OrderLog, OrderItem, OrderStatus, StatusOrderObject } from '../types';
import {
  User, Phone, MapPin, ShoppingBag, PlusCircle, Trash2, Plus, Clock, Truck, Home, Building2, Store, Check,
  CheckCircle2, RefreshCcw, Map, Loader2, Copy, AlertCircle, Search,
  ArrowRight,
  Save,
  X,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';
import { statusLabels, statusColors } from '../constants/statusConstants'; // Still used as fallback for colors if not provided by DB
import { deliveryCompanyService } from '../services/apiService';
import { DeliveryCompany } from '../types';
import DeleteConfirmationModal from './common/DeleteConfirmationModal';
import { PostponedModal } from './PostponedModal';
import toast from 'react-hot-toast';
import { GET_CURRENT_USER, GET_ALL_STATUS_COMPANY } from '../graphql/queries';
import { GET_ALL_WILAYAS } from '../graphql/queries/wilayasQueries';
import { UPDATE_ORDER, CHANGE_STATUS_ORDER } from '../graphql/mutations/orderMutations';
import { GET_ALL_PRODUCTS } from '../graphql/queries/productQueries';
import { GET_ALL_DELIVERY_PRICE_COMPANY } from '../graphql/queries/deliveryQueries';
import { GET_ALL_DELIVERY_COMPANIES, GET_DELIVERY_COMPANY_CENTER } from '../graphql/queries/deliveryCompanyQueries';
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
    weight: order.weight || 0,
    deliveryCompanyId: order.deliveryCompany?.deliveryCompany?.id || '',
    deliveryCenterId: order.deliveryCompanyCenter?.id || '', // Using id to match dropdown values
    shippingCost: order.deliveryPrice || 0
  }));
  const [isAddLogOpen, setIsAddLogOpen] = useState(false);

  // Use status object or ID directly
  const [newLog, setNewLog] = useState<{ status: OrderStatus | StatusOrderObject | null; note: string; postponeDate: string }>({
    status: typeof order.status === 'object' ? order.status : null,
    note: '',
    postponeDate: ''
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

  const { data: productsData } = useQuery(GET_ALL_PRODUCTS, {
    variables: { pagination: { limit: 100, page: 1 } }
  });

  const { data: deliveryPricesData } = useQuery(GET_ALL_DELIVERY_PRICE_COMPANY);

  const { data: deliveryCompaniesData } = useQuery(GET_ALL_DELIVERY_COMPANIES);
  const [getCenters, { data: centersData, loading: loadingCenters }] = useLazyQuery(GET_DELIVERY_COMPANY_CENTER);

  // Fetch centers if we have a company and office delivery
  useEffect(() => {
    // Only fetch if office and we have basic info
    if (editedOrder.deliveryType === "inDesk" && editedOrder.state && editedOrder.deliveryCompanyId) {
      const selectedCompany = deliveryCompaniesData?.allDeliveryCompany?.find((c: any) => c.id === editedOrder.deliveryCompanyId);

      // Need state code
      let stateCode = '';
      if (typeof editedOrder.state === 'object' && (editedOrder.state as any).code) {
        stateCode = (editedOrder.state as any).code;
      } else {
        // Try to find code from wilayas
        const found = wilayasData?.allWilayas?.find((w: any) => w.name === editedOrder.state);
        if (found) stateCode = found.code;
      }

      if (stateCode && selectedCompany?.availableDeliveryCompany?.id) {
        getCenters({
          variables: {
            stateCode: stateCode,
            idAvailableDeliveryCompany: selectedCompany.availableDeliveryCompany.id
          }
        });
      }
    }
  }, [editedOrder.deliveryType, editedOrder.state, editedOrder.deliveryCompanyId, deliveryCompaniesData, wilayasData]);

  const getDeliveryPriceForState = (stateName: string) => {
    if (!deliveryPricesData?.allDeliveryPriceCompany?.data) return { home: 0, desk: 0 };

    // Find default pricing or first one
    const pricing = deliveryPricesData.allDeliveryPriceCompany.data.find((d: any) => d.isDefault) ||
      deliveryPricesData.allDeliveryPriceCompany.data[0];

    if (!pricing || !pricing.prices) return { home: 0, desk: 0 };

    // 1. Find Wilaya Object from name to get the Code
    const wilayas = wilayasData?.allWilayas || [];
    const selectedState = wilayas.find((w: any) =>
      w.name?.toLowerCase().trim() === stateName?.toLowerCase().trim() ||
      w.code == stateName
    );

    // 2. Try match pricing by Code first (Most Reliable)
    if (selectedState?.code) {
      const matchByCode = pricing.prices.find((p: any) => parseInt(p.code) === parseInt(selectedState.code));
      if (matchByCode) return { home: matchByCode.home || 0, desk: matchByCode.desk || 0 };
    }

    // 3. Fallback: Try match by Name directly
    const matchByName = pricing.prices.find((p: any) =>
      p.name?.toLowerCase().trim() === stateName?.toLowerCase().trim()
    );

    return {
      home: matchByName?.home || 0,
      desk: matchByName?.desk || 0
    };
  };

  const [focusedProductIndex, setFocusedProductIndex] = useState<number | null>(null);
  const [itemModes, setItemModes] = useState<Record<number, 'select' | 'manual'>>({});
  const [openModeMenuIndex, setOpenModeMenuIndex] = useState<number | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number, left: number, width: number } | null>(null);

  const [deliveryErrors, setDeliveryErrors] = useState<any[]>([]);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);

  // Timeline accordion state: 'orderInfo' | 'confirmation' | 'delivery' | null
  const [expandedTimeline, setExpandedTimeline] = useState<'orderInfo' | 'confirmation' | 'delivery' | null>('orderInfo');

  const [isPostponeModalOpen, setIsPostponeModalOpen] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState<any>(null);

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

  // Detect manual items on load
  useEffect(() => {
    if (order.items && order.items.length > 0) {
      const initialModes: Record<number, 'select' | 'manual'> = {};
      order.items.forEach((item, idx) => {
        // If no productId is linked, it's a manual item
        if (!item.productId) {
          initialModes[idx] = 'manual';
        }
      });

      if (Object.keys(initialModes).length > 0) {
        setItemModes(prev => ({ ...prev, ...initialModes }));
      }
    }
  }, [order.id, order.items]);

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
        weight: editedOrder.weight,

        idDeliveryCompanyCenter: editedOrder.deliveryCenterId || undefined,
        deliveryCompany: editedOrder.deliveryCompanyId ? { idDeliveryCompany: editedOrder.deliveryCompanyId } : undefined,

        note: editedOrder.notes,
        discount: editedOrder.discount,
        // Map items
        products: editedOrder.items.map(item => ({
          idProduct: item.productId,
          idVariantsProduct: item.idVariantsProduct || item.variantId,
          sku: item.sku,
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
      onUpdate({ ...editedOrder, updatedAt: new Date().toLocaleString('ar') });
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

    // Intercept Postponed Status
    // Check both object property (nameEN) and resolved value
    const isPostponed =
      (typeof newLog.status === 'object' && newLog.status?.nameEN === 'postponed') ||
      statusValue === 'postponed' ||
      getStatusKey(statusValue) === 'postponed';

    if (isPostponed) {
      // Validate date is provided
      if (!newLog.postponeDate) {
        toast.error('الرجاء تحديد تاريخ التأجيل');
        return;
      }

      // Validate date is not in the past
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const picked = new Date(newLog.postponeDate);
      if (picked < today) {
        toast.error('لا يمكن تأجيل الطلب لتاريخ سابق');
        return;
      }

      try {
        await changeStatusOrder({
          variables: {
            id: order.id,
            content: {
              status: statusValue,
              note: newLog.note || `تم التأجيل إلى ${newLog.postponeDate}`,
              idUser: idUser,
              requiredFields: [
                { key: 'postponementDate', value: newLog.postponeDate, type: 'date' }
              ]
            }
          }
        });

        toast.success(`تم تأجيل الطلب إلى ${new Date(newLog.postponeDate).toLocaleDateString('ar-DZ')}`);

        // Optimistic update
        const now = new Date().toLocaleString('en-GB');
        const log: OrderLog = {
          status: newLog.status,
          date: now,
          note: newLog.note || `تم التأجيل إلى ${newLog.postponeDate}`,
          user: userData?.currentUser?.name || 'مستخدم'
        };

        const updated = {
          ...editedOrder,
          status: newLog.status,
          postponementDate: newLog.postponeDate,
          lastStatusDate: now,
          history: [...(editedOrder.history || []), log],
          confirmationTimeLine: [...(editedOrder.confirmationTimeLine || []), log],
          updatedAt: now
        };

        setEditedOrder(updated);
        onUpdate(updated);
        setIsAddLogOpen(false);
        setNewLog({ status: updated.status, note: '', postponeDate: '' });
        return;

      } catch (error) {
        console.error("Postpone Error", error);
        toast.error('حدث خطأ أثناء تأجيل الطلب');
        return;
      }
    }

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

  const handlePostponeConfirm = async (date: string) => {
    if (!pendingStatusChange) return;

    setIsPostponeModalOpen(false);

    try {
      await changeStatusOrder({
        variables: {
          id: order.id,
          content: {
            status: pendingStatusChange.status,
            note: pendingStatusChange.note,
            idUser: idUser,
            requiredFields: [
              { key: 'postponementDate', value: date, type: 'date' }
            ]
          }
        }
      });

      toast.success(`تم تأجيل الطلب إلى ${new Date(date).toLocaleDateString('ar-DZ')}`);

      // Optimistic update
      const now = new Date().toLocaleString('en-GB');
      const log: OrderLog = {
        status: pendingStatusChange.status, // Should be 'postponed'
        date: now,
        note: pendingStatusChange.note || `تم التأجيل إلى ${date}`,
        user: userData?.currentUser?.name || 'مستخدم'
      };

      const updated = {
        ...editedOrder,
        status: pendingStatusChange.status,
        postponementDate: date,
        lastStatusDate: now,
        history: [...(editedOrder.history || []), log],
        confirmationTimeLine: [...(editedOrder.confirmationTimeLine || []), log],
        updatedAt: now
      };

      setEditedOrder(updated);
      onUpdate(updated);
      setPendingStatusChange(null);
      setNewLog({ status: updated.status, note: '' });

    } catch (error) {
      console.error("Postpone Error", error);
      toast.error('حدث خطأ أثناء تأجيل الطلب');
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

  const updateItemFields = (index: number, fields: Partial<OrderItem>) => {
    if (readOnly) return;
    const newItems = [...editedOrder.items];
    newItems[index] = { ...newItems[index], ...fields };
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
    // If we already have a selected company (from edit or saved), set it as selected
    const preSelectedId = editedOrder.deliveryCompanyId || order.deliveryCompany?.deliveryCompany?.id;

    if (preSelectedId) {
      setSelectedCompanyId(preSelectedId);
    }

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

  const handleSendToDelivery = async (overrideCompanyId?: string | any) => {
    const companyId = (typeof overrideCompanyId === 'string' && overrideCompanyId) ? overrideCompanyId : selectedCompanyId;
    if (!companyId || !idCompany) return;

    setIsSendingToDelivery(true);
    const result = await deliveryCompanyService.addOrderToDeliveryCompany(
      companyId,
      [order.id]
    );

    setIsSendingToDelivery(false);

    if (result.success && result.data?.successOrder?.length > 0) {
      const successOrder = result.data.successOrder[0];
      const tracking = successOrder.deliveryCompany?.trackingCode || 'Unknown';

      // Try to find name from list or use generic if list empty/not found
      // If we auto-sent, deliveryCompanies might be empty, so we might not have the name immediately available 
      // unless we fetch it or it's in the order data.
      const companyName = deliveryCompanies.find(c => c.id === companyId)?.name ||
        (order.deliveryCompany?.deliveryCompany?.id === companyId ? order.deliveryCompany?.deliveryCompany?.name : 'الشركة');

      setSuccessTrackingCode(tracking);
      setSuccessCompanyName(companyName);
      setIsDeliveryModalOpen(false);
      setIsSuccessModalOpen(true);

      toast.success('تم إرسال الطلب بنجاح');
    } else if (result.data?.failedOrder?.length > 0) {
      // Handle Failure
      const failures = result.data.failedOrder.map((fail: any) => {
        let parsedErrors = [];
        try {
          const parsed = JSON.parse(fail.errors);
          parsedErrors = Array.isArray(parsed) ? parsed : [parsed];
        } catch (e) {
          parsedErrors = [{ message: fail.errors || 'Unknown Error', field: 'general' }];
        }
        return { ...fail, parsedErrors };
      });

      setDeliveryErrors(failures);
      setIsDeliveryModalOpen(false); // Close selection modal
      setIsErrorModalOpen(true);     // Open error display modal
      toast.error('فشل إرسال الطلب، يرجى مراجعة الأخطاء');
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
      {/* Header Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button onClick={onBack} className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:text-indigo-600 transition-all border border-slate-100 hover:bg-slate-100">
            <ArrowRight className="w-5 h-5 " />
          </button>

          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-slate-800">الطلب <span className="font-mono text-indigo-600 text-base">#{order.numberOrder || order.id?.slice(-8)}</span></h2>
              <span
                className={`px-2 py-0.5 rounded-lg text-[9px] font-black border uppercase ${!statusStyle ? `${fallbackColors.bg} ${fallbackColors.text} ${fallbackColors.border}` : ''}`}
                style={statusStyle ? { backgroundColor: statusStyle.backgroundColor, color: statusStyle.color, borderColor: statusStyle.borderColor } : {}}
              >
                {getStatusLabel(editedOrder.status)}
              </span>
            </div>
            <p className="text-[9px] font-bold text-slate-400 flex items-center gap-1.5">
              <Store className="w-3 h-3" />
              {editedOrder.storeName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 no-scrollbar">
          {!readOnly && onDelete && (
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              title="حذف الطلب"
              className="w-9 h-9 flex-shrink-0 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition-all border border-rose-100 flex items-center justify-center"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          {!readOnly && (
            <button
              onClick={handleSave}
              disabled={!isDirty || isUpdating}
              className={`h-9 px-4 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-[10px] transition-all uppercase flex items-center gap-2 whitespace-nowrap ${!isDirty || isUpdating ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-50 hover:border-slate-300'}`}
            >
              {isUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              {isUpdating ? 'جاري الحفظ...' : 'حفظ التعديلات'}
            </button>
          )}

          <button
            onClick={() => { setIsAddLogOpen(true); }}
            className="h-9 px-4 bg-indigo-600 text-white rounded-xl font-bold text-[10px] shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all uppercase flex items-center gap-2 whitespace-nowrap"
          >
            <RefreshCcw className="w-3.5 h-3.5" />
            <span>تحديث الحالة</span>
          </button>

          {!readOnly && !order.deliveryCompany?.trackingCode && getStatusKey(editedOrder.status) === 'confirmed' && (
            <button
              onClick={openDeliveryModal}
              className="h-9 px-4 bg-slate-900 text-white rounded-xl font-bold text-[10px] shadow-lg shadow-slate-900/20 hover:bg-slate-800 transition-all uppercase flex items-center gap-2 whitespace-nowrap"
            >
              <Truck className="w-3.5 h-3.5" />
              <span>إرسال</span>
            </button>
          )}
        </div>
      </div>

      {order.deliveryCompany?.trackingCode && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 animate-in slide-in-from-top-4 duration-500">
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
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-8">
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
                    // Auto-update price based on new state and current delivery type
                    let newShippingCost = editedOrder.shippingCost;
                    if (val && editedOrder.deliveryType) {
                      const prices = getDeliveryPriceForState(val);
                      newShippingCost = editedOrder.deliveryType === 'home' ? prices.home : prices.desk;
                    }
                    setEditedOrder({ ...editedOrder, state: val, city: '', shippingCost: newShippingCost });
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
                onClick={() => {
                  const currentState = typeof editedOrder.state === 'object' && editedOrder.state !== null
                    ? (editedOrder.state as any).name
                    : editedOrder.state;
                  const prices = getDeliveryPriceForState(currentState || '');
                  setEditedOrder({ ...editedOrder, deliveryType: 'home', shippingCost: prices.home });
                }}
                className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl border-2 transition-all ${editedOrder.deliveryType === 'home' ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-slate-50 bg-slate-50 text-slate-400'}`}
              >
                <div className="flex flex-col items-center gap-1">
                  <div className="flex items-center gap-2">
                    <Home className="w-5 h-5" />
                    <span className="text-[11px] font-black uppercase tracking-widest">توصيل للمنزل</span>
                  </div>
                  {editedOrder.state && (
                    <span className="text-[10px] font-bold">
                      {getDeliveryPriceForState(typeof editedOrder.state === 'object' ? (editedOrder.state as any).name : editedOrder.state).home} دج
                    </span>
                  )}
                </div>
              </button>
              <button
                disabled={readOnly}
                onClick={() => {
                  const currentState = typeof editedOrder.state === 'object' && editedOrder.state !== null
                    ? (editedOrder.state as any).name
                    : editedOrder.state;
                  const prices = getDeliveryPriceForState(currentState || '');
                  setEditedOrder({ ...editedOrder, deliveryType: "inDesk", shippingCost: prices.desk });
                }}
                className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl border-2 transition-all ${editedOrder.deliveryType === "inDesk" ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-slate-50 bg-slate-50 text-slate-400'}`}
              >
                <div className="flex flex-col items-center gap-1">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    <span className="text-[11px] font-black uppercase tracking-widest">توصيل للمكتب</span>
                  </div>
                  {editedOrder.state && (
                    <span className="text-[10px] font-bold">
                      {getDeliveryPriceForState(typeof editedOrder.state === 'object' ? (editedOrder.state as any).name : editedOrder.state).desk} دج
                    </span>
                  )}
                </div>
              </button>
            </div>

            {editedOrder.deliveryType === "inDesk" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in slide-in-from-top-2 mt-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">شركة التوصيل</label>
                  <ModernSelect
                    disabled={readOnly}
                    value={editedOrder.deliveryCompanyId}
                    onChange={(val) => setEditedOrder({ ...editedOrder, deliveryCompanyId: val, deliveryCenterId: '' })}
                    options={[
                      { value: '', label: 'اختر الشركة...' },
                      ...(deliveryCompaniesData?.allDeliveryCompany?.map((c: any) => ({
                        value: c.id,
                        label: c.name
                      })) || [])
                    ]}
                    placeholder="اختر شركة التوصيل..."
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">مركز التوصيل</label>
                  <ModernSelect
                    disabled={readOnly || !editedOrder.deliveryCompanyId || loadingCenters}
                    value={editedOrder.deliveryCenterId}
                    onChange={(val) => setEditedOrder({ ...editedOrder, deliveryCenterId: val })}
                    options={[
                      { value: '', label: loadingCenters ? 'جاري التحميل...' : 'اختر المركز...' },
                      ...(centersData?.allDeliveryCompanyCenter?.communes?.map((c: any) => ({
                        value: c.id,
                        label: `${c.name} (${c.commune || c.communeAr})`
                      })) || [])
                    ]}
                    placeholder="اختر المركز..."
                  />
                </div>
              </div>
            )}
          </div>

          {/* Items / Cart Management Card - Redesigned */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">سلة المشتريات</h3>
                  <p className="text-[10px] font-bold text-slate-400 mt-1">
                    {editedOrder.items?.length || 0} منتجات في الطلب
                  </p>
                </div>
              </div>
              {!readOnly && (
                <button
                  onClick={addItem}
                  className="group flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all hover:scale-105 active:scale-95"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>إضافة منتج</span>
                </button>
              )}
            </div>

            <div className="p-5 space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar">
              {editedOrder.items?.map((item, idx) => (
                <div key={idx} className="bg-slate-50/60 rounded-xl p-4 border border-slate-100 space-y-3 group relative">
                  {/* Delete button - top right */}
                  {!readOnly && (
                    <button
                      onClick={() => removeItem(idx)}
                      className="absolute top-3 left-3 p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}

                  {/* Row 1: Product Name (Full Width) */}
                  <div className="w-full">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[9px] font-black text-slate-400 uppercase">المنتج</label>
                        {!readOnly && (
                          <div className="flex bg-slate-100 rounded-lg p-0.5">
                            <button
                              onClick={() => setItemModes(prev => ({ ...prev, [idx]: 'select' }))}
                              className={`px-2 py-1 text-[8px] font-black rounded-md transition-all ${(!itemModes[idx] || itemModes[idx] === 'select') ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                              قائمة
                            </button>
                            <button
                              onClick={() => setItemModes(prev => ({ ...prev, [idx]: 'manual' }))}
                              className={`px-2 py-1 text-[8px] font-black rounded-md transition-all ${itemModes[idx] === 'manual' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                              يدوي
                            </button>
                          </div>
                        )}
                      </div>

                      {(!itemModes[idx] || itemModes[idx] === 'select') ? (
                        <div className="relative">
                          <div
                            className={`flex items-center gap-2 border rounded-xl px-3 py-2.5 bg-white transition-all ${focusedProductIndex === idx ? 'border-indigo-500 ring-2 ring-indigo-500/10' : 'border-slate-200'}`}
                            onFocus={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect();
                              setDropdownPosition({ top: rect.bottom + 8, left: rect.left, width: rect.width });
                              setFocusedProductIndex(idx);
                            }}
                            onClick={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect();
                              setDropdownPosition({ top: rect.bottom + 8, left: rect.left, width: rect.width });
                            }}
                          >
                            <Search className={`w-4 h-4 ${focusedProductIndex === idx ? 'text-indigo-500' : 'text-slate-300'}`} />
                            <input
                              disabled={readOnly}
                              value={item.name}
                              onChange={e => updateItem(idx, 'name', e.target.value)}
                              placeholder="بحث عن منتج..."
                              className="flex-1 bg-transparent border-none p-0 text-xs font-bold text-slate-700 placeholder:text-slate-300 focus:ring-0 focus:outline-none"
                              autoComplete="off"
                            />
                          </div>

                          {/* Suggestions Dropdown (Flattened Products & Variants) */}
                          {focusedProductIndex === idx && dropdownPosition && !readOnly && typeof document !== 'undefined' && ReactDOM.createPortal(
                            <div
                              className="fixed bg-white border border-slate-100 rounded-xl shadow-2xl z-[9999] max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-200 custom-scrollbar"
                              style={{ top: dropdownPosition.top, left: dropdownPosition.left, width: dropdownPosition.width }}
                              onMouseDown={(e) => e.preventDefault()}
                            >
                              {(() => {
                                const searchTerm = (item.name || '').toLowerCase();
                                const flattenedSuggestions: any[] = [];

                                productsData?.allProduct?.data?.forEach((product: any) => {
                                  // 1. Add Variants as separate items if they exist
                                  // Use variantsProbability as per GET_ALL_PRODUCTS query
                                  const variants = product.variantsProbability || product.variantsProduct;
                                  if (variants && variants.length > 0) {
                                    variants.forEach((variant: any) => {
                                      const variantFullName = `${product.name} - ${variant.name}`; // e.g. "T-Shirt - Red/XL"
                                      if (variantFullName.toLowerCase().includes(searchTerm)) {
                                        flattenedSuggestions.push({
                                          id: variant.id || `${product.id}-${variant.id}`, // specific ID
                                          name: variantFullName,
                                          price: variant.price || product.price,
                                          sku: variant.sku || product.sku,
                                          isVariant: true,
                                          originalProduct: product
                                        });
                                      }
                                    });
                                  } else {
                                    // 2. Add Simple Product
                                    if (product.name.toLowerCase().includes(searchTerm)) {
                                      flattenedSuggestions.push({
                                        id: product.id,
                                        name: product.name,
                                        price: product.price,
                                        sku: product.sku,
                                        isVariant: false,
                                        originalProduct: product
                                      });
                                    }
                                  }
                                });

                                if (flattenedSuggestions.length === 0) return (
                                  <div className="p-4 text-center">
                                    <p className="text-[10px] text-slate-400 font-bold">لا توجد منتجات مطابقة</p>
                                    <button
                                      onMouseDown={(e) => {
                                        e.preventDefault();
                                        setItemModes(prev => ({ ...prev, [idx]: 'manual' }));
                                        setFocusedProductIndex(null);
                                      }}
                                      className="text-[10px] text-indigo-600 font-black mt-1 hover:underline"
                                    >
                                      إدخال يدوي؟
                                    </button>
                                  </div>
                                );

                                return flattenedSuggestions.map((suggestion, sIdx) => (
                                  <button
                                    key={suggestion.id || sIdx}
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      updateItemFields(idx, {
                                        name: suggestion.name,
                                        price: suggestion.price || 0,
                                        sku: suggestion.sku,
                                        productId: suggestion.originalProduct.id,
                                        idVariantsProduct: suggestion.isVariant ? suggestion.id.split('-').pop() : undefined, // Assumes mapping or needs refinement if ID is composed
                                        variant: ''
                                      });
                                      setFocusedProductIndex(null);
                                    }}
                                    className="w-full text-right px-4 py-3 hover:bg-slate-50 flex items-center justify-between transition-colors border-b border-slate-50 last:border-0 group/item"
                                  >
                                    <div className="flex flex-col gap-0.5">
                                      <span className="text-xs font-bold text-slate-700 group-hover/item:text-indigo-700 transition-colors">{suggestion.name}</span>
                                      <div className="flex items-center gap-2">
                                        <span className="text-[9px] text-slate-400">{suggestion.sku || 'No SKU'}</span>
                                        {suggestion.isVariant && <span className="text-[8px] bg-slate-100 text-slate-500 px-1.5 rounded">Option</span>}
                                      </div>
                                    </div>
                                    <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">
                                      {suggestion.price?.toLocaleString()} دج
                                    </span>
                                  </button>
                                ));
                              })()}
                            </div>,
                            document.body
                          )}
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <input
                            disabled={readOnly}
                            value={item.name}
                            onChange={e => updateItem(idx, 'name', e.target.value)}
                            placeholder="اسم المنتج..."
                            className="w-full bg-amber-50 border-2 border-amber-200 border-dashed px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 placeholder:text-amber-300 focus:border-amber-400 focus:ring-2 focus:ring-amber-200/50 outline-none transition-all"
                          />
                          <p className="text-[8px] text-amber-500 font-bold flex items-center gap-1 px-1">
                            <AlertCircle className="w-3 h-3" />
                            منتج مدخل يدوياً - غير موجود في المخزون
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Row 2: Quantity + Price + Total */}
                  <div className="grid grid-cols-3 gap-3">
                    {/* Quantity */}
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-slate-400 uppercase">الكمية</label>
                      <input
                        disabled={readOnly}
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={e => updateItem(idx, 'quantity', parseInt(e.target.value) || 1)}
                        className="w-full bg-white border border-slate-200 px-3 py-2.5 rounded-xl text-center text-xs font-black text-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all"
                      />
                    </div>

                    {/* Price */}
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-slate-400 uppercase">السعر</label>
                      <div className="relative">
                        <input
                          disabled={readOnly}
                          type="number"
                          min="0"
                          value={item.price}
                          onChange={e => updateItem(idx, 'price', parseFloat(e.target.value) || 0)}
                          className="w-full bg-white border border-slate-200 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all pl-8"
                        />
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] text-slate-400 font-bold">دج</span>
                      </div>
                    </div>

                    {/* Total */}
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-slate-400 uppercase">الإجمالي</label>
                      <div className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl flex items-center justify-between">
                        <span className="text-xs font-black text-slate-700 font-mono">{(item.price * item.quantity).toLocaleString()}</span>
                        <span className="text-[9px] font-bold text-slate-400">دج</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Empty State */}
              {(!editedOrder.items || editedOrder.items.length === 0) && (
                <div className="py-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-300 mx-auto mb-4">
                    <ShoppingBag className="w-8 h-8 opacity-50" />
                  </div>
                  <p className="text-slate-400 font-black text-xs">سلة المشتريات فارغة</p>
                  <p className="text-slate-300 font-bold text-[10px] mt-1">أضف منتجات للبدء</p>
                </div>
              )}
            </div>

            <div className="bg-slate-50/50 border-t border-slate-100 p-8">
              <div className="flex flex-col md:flex-row gap-8 justify-end items-end">

                <div className="flex divide-x divide-slate-200 divide-x-reverse border border-slate-200 rounded-2xl bg-white shadow-sm overflow-hidden w-full md:w-auto">
                  <div className="p-4 space-y-1 min-w-[140px]">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">سعر التوصيل</label>
                    <div className="flex items-center gap-2">
                      <input
                        disabled={readOnly}
                        type="number"
                        value={editedOrder.shippingCost}
                        onChange={e => setEditedOrder({ ...editedOrder, shippingCost: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-transparent border-none p-0 text-sm font-black text-slate-700 focus:ring-0 outline-none"
                      />
                      <span className="text-[9px] font-bold text-slate-400">دج</span>
                    </div>
                  </div>

                  <div className="p-4 space-y-1 min-w-[140px] bg-rose-50/10">
                    <label className="text-[9px] font-black text-rose-300 uppercase tracking-widest block">الخصم</label>
                    <div className="flex items-center gap-2">
                      <input
                        disabled={readOnly}
                        type="number"
                        value={editedOrder.discount || 0}
                        onChange={e => setEditedOrder({ ...editedOrder, discount: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-transparent border-none p-0 text-sm font-black text-rose-500 focus:ring-0 outline-none"
                      />
                      <span className="text-[9px] font-bold text-rose-300">دج</span>
                    </div>
                  </div>

                  <div className="p-4 space-y-1 min-w-[140px] bg-slate-50/50">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">الوزن (كلغ)</label>
                    <div className="flex items-center gap-2">
                      <input
                        disabled={readOnly}
                        type="number"
                        step="0.1"
                        value={editedOrder.weight || 0}
                        onChange={e => setEditedOrder({ ...editedOrder, weight: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-transparent border-none p-0 text-sm font-black text-slate-600 focus:ring-0 outline-none"
                      />
                      <span className="text-[9px] font-bold text-slate-400">kg</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">المجموع النهائي</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-4xl font-black text-indigo-900 font-mono tracking-tighter">
                      {(editedOrder.amount - (editedOrder.discount || 0)).toLocaleString()}
                    </p>
                    <span className="text-sm font-black text-indigo-400">دج</span>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>

        {/* Timeline Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Order Meta Card - Collapsible */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <button
              onClick={() => setExpandedTimeline(expandedTimeline === 'orderInfo' ? null : 'orderInfo')}
              className="w-full p-5 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-indigo-500" />
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">معلومات الطلب</h3>
              </div>
              <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${expandedTimeline === 'orderInfo' ? 'rotate-180' : ''}`} />
            </button>
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${expandedTimeline === 'orderInfo' ? 'max-h-[400px]' : 'max-h-0'}`}>
              <div className="p-5 space-y-4">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">تاريخ الإنشاء</p>
                  <p className="text-xs font-bold text-slate-700 font-mono" dir="ltr">
                    {new Date(editedOrder.createdAt).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                {editedOrder.duplicatePhone > 1 && (
                  <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex items-center gap-2 text-amber-600">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-[10px] font-black">رقم هاتف مكرر</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">ملاحظة داخلية</label>
                  <textarea
                    disabled={readOnly}
                    value={editedOrder.notes || ''}
                    onChange={e => setEditedOrder({ ...editedOrder, notes: e.target.value })}
                    className="w-full h-20 px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all resize-none"
                    placeholder="ملاحظات حول الطلب..."
                  />
                </div>
              </div>
            </div>
          </div>
          {/* Confirmation Timeline - Collapsible */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <button
              onClick={() => setExpandedTimeline(expandedTimeline === 'confirmation' ? null : 'confirmation')}
              className="w-full p-5 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-indigo-500" />
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">تاريخ التأكيد</h3>
                <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                  {editedOrder.confirmationTimeLine?.length || 0}
                </span>
              </div>
              <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${expandedTimeline === 'confirmation' ? 'rotate-180' : ''}`} />
            </button>
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${expandedTimeline === 'confirmation' ? 'max-h-[350px]' : 'max-h-0'}`}>
              <div className="overflow-y-auto max-h-[350px] p-5 space-y-3 custom-scrollbar">
                {(!editedOrder.confirmationTimeLine || editedOrder.confirmationTimeLine.length === 0) && (
                  <p className="text-center py-8 text-[10px] text-slate-300 font-bold uppercase">لا يوجد سجل تأكيد بعد</p>
                )}
                {editedOrder.confirmationTimeLine?.map((log, idx) => {
                  const logStyle = getStatusStyle(log.status);
                  const logKey = getStatusKey(log.status);
                  const logColors = statusColors[logKey] || statusColors.default;

                  return (
                    <div key={idx} className="bg-slate-50/60 rounded-xl p-4 border border-slate-100 space-y-2">
                      <div className="flex justify-between items-start">
                        <span
                          className={`text-[8px] font-black px-2 py-1 rounded-lg border uppercase tracking-widest ${!logStyle ? `${logColors.bg} ${logColors.text} ${logColors.border}` : ''}`}
                          style={logStyle ? { backgroundColor: logStyle.backgroundColor, color: logStyle.color, borderColor: logStyle.borderColor } : {}}
                        >
                          {getStatusLabel(log.status)}
                        </span>
                        <span className="text-[8px] font-bold text-slate-400 font-mono" dir="ltr">{log.date}</span>
                      </div>
                      <p className="text-[10px] font-bold text-slate-600 leading-relaxed">{log.note}</p>
                      <div className="flex items-center gap-1.5">
                        <div className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center text-[7px] font-black text-slate-500">أ</div>
                        <span className="text-[8px] font-black text-slate-400">{log.user}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Delivery Timeline - Collapsible */}
          {(editedOrder.deliveryTimeLine && editedOrder.deliveryTimeLine.length > 0) && (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <button
                onClick={() => setExpandedTimeline(expandedTimeline === 'delivery' ? null : 'delivery')}
                className="w-full p-5 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Truck className="w-5 h-5 text-emerald-500" />
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">تتبع التوصيل</h3>
                  <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                    {editedOrder.deliveryTimeLine?.length || 0}
                  </span>
                </div>
                <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${expandedTimeline === 'delivery' ? 'rotate-180' : ''}`} />
              </button>
              <div className={`overflow-hidden transition-all duration-300 ease-in-out ${expandedTimeline === 'delivery' ? 'max-h-[350px]' : 'max-h-0'}`}>
                <div className="overflow-y-auto max-h-[350px] p-5 space-y-3 custom-scrollbar">
                  {(!editedOrder.deliveryTimeLine || editedOrder.deliveryTimeLine.length === 0) && (
                    <p className="text-center py-8 text-[10px] text-slate-300 font-bold uppercase">لا يوجد سجل توصيل بعد</p>
                  )}
                  {editedOrder.deliveryTimeLine?.map((log, idx) => {
                    const logStyle = getStatusStyle(log.status);
                    const logKey = getStatusKey(log.status);
                    const logColors = statusColors[logKey] || statusColors.default;

                    return (
                      <div key={idx} className="bg-slate-50/60 rounded-xl p-4 border border-slate-100 space-y-2">
                        <div className="flex justify-between items-start">
                          <span
                            className={`text-[8px] font-black px-2 py-1 rounded-lg border uppercase tracking-widest ${!logStyle ? `${logColors.bg} ${logColors.text} ${logColors.border}` : ''}`}
                            style={logStyle ? { backgroundColor: logStyle.backgroundColor, color: logStyle.color, borderColor: logStyle.borderColor } : {}}
                          >
                            {getStatusLabel(log.status)}
                          </span>
                          <span className="text-[8px] font-bold text-slate-400 font-mono" dir="ltr">{log.date}</span>
                        </div>
                        <p className="text-[10px] font-bold text-slate-600 leading-relaxed">{log.note}</p>
                        <div className="flex items-center gap-1.5">
                          <div className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center text-[7px] font-black text-slate-500">أ</div>
                          <span className="text-[8px] font-black text-slate-400">{log.user}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
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
              <div className="relative z-10 bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col my-auto h-[600px]">
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

                  {/* Postpone Date - Shows only when postponed status is selected */}
                  {(() => {
                    const selectedKey = getStatusKey(newLog.status);
                    const isPostponed =
                      selectedKey === 'postponed' ||
                      (typeof newLog.status === 'object' && newLog.status?.nameEN === 'postponed');

                    if (!isPostponed) return null;

                    return (
                      <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 space-y-3 animate-in slide-in-from-top-2 duration-200">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-amber-500" />
                          <label className="text-[10px] font-black text-amber-600 uppercase tracking-widest">تاريخ التأجيل</label>
                        </div>
                        <input
                          type="date"
                          value={newLog.postponeDate}
                          onChange={(e) => setNewLog({ ...newLog, postponeDate: e.target.value })}
                          min={new Date().toISOString().split('T')[0]}
                          className="w-full bg-white border border-amber-200 text-slate-800 text-sm font-bold rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                        />
                        <p className="text-[9px] font-bold text-amber-500/80 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          سيتم تذكيرك بهذا الطلب في التاريخ المحدد
                        </p>
                      </div>
                    );
                  })()}

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">ملاحظة (اختياري)</label>
                    <textarea
                      value={newLog.note}
                      onChange={e => setNewLog({ ...newLog, note: e.target.value })}
                      placeholder="اكتب ملاحظة التغيير..."
                      className="w-full min-h-[120px] px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none resize-none focus:border-indigo-500 transition-all shadow-inner"
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
          <div className="relative z-10 bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
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
                  {deliveryCompanies.map(company => {
                    // Check if *this* order has a delivery company assigned in the backend data (not just local edit)
                    const isCompanyLocked = !!order.deliveryCompany?.deliveryCompany?.id;
                    const isDisabled = isCompanyLocked && selectedCompanyId !== company.id;

                    return (
                      <label
                        key={company.id}
                        className={`flex items-center justify-between p-5 rounded-xl border-2 transition-all 
                          ${selectedCompanyId === company.id
                            ? 'border-indigo-600 bg-indigo-50/50 ring-4 ring-indigo-500/10'
                            : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'}
                          ${isDisabled ? 'opacity-50 cursor-not-allowed grayscale' : 'cursor-pointer'}
                        `}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-white border border-slate-100 flex items-center justify-center overflow-hidden">
                            {company.availableDeliveryCompany?.logo ? <img src={`${import.meta.env.VITE_Images_Url}/${company.availableDeliveryCompany.logo}`} alt={company.name} className="w-full h-full object-contain p-2" /> : <Truck className="w-6 h-6 text-slate-300" />}
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
                          onChange={() => !isCompanyLocked && setSelectedCompanyId(company.id)}
                          disabled={isCompanyLocked}
                          className="hidden"
                        />
                      </label>
                    );
                  })}
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
          <div className="relative z-10 bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
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
      {/* Error Modal */}
      {isErrorModalOpen && typeof document !== 'undefined' && ReactDOM.createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl w-full max-w-md shadow-2xl border border-rose-100 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 bg-rose-50/50 border-b border-rose-100 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shadow-sm shadow-rose-100">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-rose-950">فشل الإرسال</h3>
                <p className="text-xs font-bold text-rose-400 mt-0.5">يرجى تصحيح الأخطاء التالية والمحاولة مجدداً</p>
              </div>
              <button onClick={() => setIsErrorModalOpen(false)} className="mr-auto w-8 h-8 flex items-center justify-center rounded-xl hover:bg-rose-100 text-rose-300 hover:text-rose-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
              {deliveryErrors.map((fail, idx) => (
                <div key={idx} className="space-y-3">
                  {deliveryErrors.length > 1 && (
                    <div className="text-xs font-black text-slate-400 border-b border-slate-100 pb-2 mb-2">
                      طلب #{fail.data?.numberOrder || 'Unknown'}
                    </div>
                  )}
                  {fail.parsedErrors.map((err: any, i: number) => (
                    <div key={i} className="flex gap-3 bg-red-50 p-4 rounded-xl border border-red-100 items-start">
                      <div className="mt-1 text-red-500">
                        <AlertCircle className="w-4 h-4" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-red-700 leading-snug">{err.message}</p>
                        {err.field && err.field !== 'general' && (
                          <span className="inline-block px-2 py-1 rounded-lg bg-white border border-red-100 text-[9px] font-black text-red-300 uppercase tracking-wider">
                            {err.field}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100">
              <button
                onClick={() => setIsErrorModalOpen(false)}
                className="w-full py-3.5 bg-white border border-slate-200 rounded-xl text-slate-700 font-black text-xs hover:bg-slate-100 hover:border-slate-300 transition-all shadow-sm"
              >
                إغلاق النافذة
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
      {/* Postponed Modal */}
      <PostponedModal
        isOpen={isPostponeModalOpen}
        onClose={() => setIsPostponeModalOpen(false)}
        onConfirm={handlePostponeConfirm}
        currentDate={editedOrder.postponementDate || ''}
      />
    </div>
  );
};

export default OrderDetailsView;
