
import React, { useState, useMemo } from 'react';
import { Order, OrderStatus, OrderItem } from '../types';
import {
  Search, MapPin, Phone, Store, ArrowLeft, ChevronRight, ChevronLeft,
  Plus, X, ShoppingBag, Truck, Calendar, Filter, UserCheck, Trash2, Eye
} from 'lucide-react';
import OrderDetailsView from './OrderDetailsView';
import CreateOrderModal from './CreateOrderModal';

interface OrderConfirmationViewProps {
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
}

export const statusLabels: Record<OrderStatus, string> = {
  pending: 'معلقة',
  failed_01: 'فاشلة 01',
  failed_02: 'فاشلة 02',
  failed_03: 'فاشلة 03',
  confirmed: 'مؤكدة',
  cancelled: 'ملغاة',
  postponed: 'مؤجلة',
  duplicate: 'مكررة',
  failed_04: 'فاشلة 04',
  failed_05: 'فاشلة 05',
  wrong_number: 'رقم خاطئ',
  wrong_order: 'طلب خاطئ',
  message_sent: 'تم إرسال الرسالة',
  out_of_stock: 'غير متوفر في المخزون',
  processing: 'جاري التجهيز',
  en_preparation: 'قيد التجهيز',
  ramasse: 'تم الاستلام من المتجر',
  sorti_livraison: 'خرج للتوصيل',
  delivered: 'تم التوصيل',
  annule: 'ملغى',
  tentative_01: 'محاولة 01',
  tentative_02: 'محاولة 02',
  tentative_03: 'محاولة 03',
  reporte_01: 'مؤجل 01',
  client_absent: 'العميل غائب',
  wrong_address: 'عنوان خاطئ',
  retour_vendeur: 'في طريق العودة للبائع',
  retourne_vendeur: 'تم الإرجاع للبائع',
  paid: 'تم الدفع',
  shipped: 'تم الشحن'
};

export const statusColors: Record<string, { bg: string, text: string, border: string, hover: string, active: string }> = {
  pending: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100', hover: 'hover:bg-blue-100', active: 'bg-blue-600' },
  confirmed: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', hover: 'hover:bg-emerald-100', active: 'bg-emerald-600' },
  message_sent: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-100', hover: 'hover:bg-indigo-100', active: 'bg-indigo-600' },
  postponed: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100', hover: 'hover:bg-amber-100', active: 'bg-amber-600' },
  failed_01: { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-100', hover: 'hover:bg-rose-100', active: 'bg-rose-600' },
  failed_02: { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-100', hover: 'hover:bg-rose-100', active: 'bg-rose-600' },
  failed_03: { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-100', hover: 'hover:bg-rose-100', active: 'bg-rose-600' },
  failed_04: { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-100', hover: 'hover:bg-rose-100', active: 'bg-rose-600' },
  failed_05: { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-100', hover: 'hover:bg-rose-100', active: 'bg-rose-600' },
  duplicate: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100', hover: 'hover:bg-purple-100', active: 'bg-purple-600' },
  wrong_number: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-100', hover: 'hover:bg-orange-100', active: 'bg-orange-600' },
  wrong_order: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-100', hover: 'hover:bg-orange-100', active: 'bg-orange-600' },
  out_of_stock: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-100', hover: 'hover:bg-red-100', active: 'bg-red-600' },
  cancelled: { bg: 'bg-slate-100', text: 'text-slate-500', border: 'border-slate-200', hover: 'hover:bg-slate-200', active: 'bg-slate-600' },
  delivered: { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200', hover: 'hover:bg-emerald-200', active: 'bg-emerald-700' },
  paid: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200', hover: 'hover:bg-green-200', active: 'bg-green-700' },
  default: { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-100', hover: 'hover:bg-slate-200', active: 'bg-indigo-600' }
};

const OrderConfirmationView: React.FC<OrderConfirmationViewProps> = ({ orders, setOrders }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [storeFilter, setStoreFilter] = useState('all');
  const [stateFilter, setStateFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const itemsPerPage = 8;

  const stores = useMemo(() => ['all', ...new Set(orders.map(o => o.storeName))], [orders]);
  // Use safe access for state as well in case it becomes object later, though unlikely for now
  const states = useMemo(() => ['all', ...new Set(orders.map(o => typeof o.state === 'object' ? (o.state as any).name : o.state))], [orders]);

  const [newManualOrder, setNewManualOrder] = useState<Partial<Order>>({
    customer: '', phone: '', state: '', municipality: '', address: '',
    deliveryType: 'home', storeName: 'إضافة يدوية',
    items: [{ name: '', variant: '', quantity: 1, price: 0 }],
    shippingCost: 0, amount: 0, status: 'pending'
  });

  // Helper to extract status key
  const getStatusKey = (s: any): string => {
    if (typeof s === 'object' && s !== null) return s.nameEN || 'pending';
    return s || 'pending';
  };

  // Helper to extract status label
  const getStatusLabel = (s: any): string => {
    if (typeof s === 'object' && s !== null) return s.nameAR || s.nameEN || 'pending';
    return statusLabels[s as OrderStatus] || s || 'pending';
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
    return null;
  };

  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.customer.toLowerCase().includes(searchTerm.toLowerCase()) || o.id.includes(searchTerm) || o.phone.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || getStatusKey(o.status) === statusFilter;
    const matchesStore = storeFilter === 'all' || o.storeName === storeFilter;
    const matchesState = stateFilter === 'all' || (typeof o.state === 'string' ? o.state : (o.state as any).name) === stateFilter;
    return matchesSearch && matchesStatus && matchesStore && matchesState;
  });

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const selectedOrder = orders.find(o => o.id === selectedOrderId);

  const handleUpdateOrder = (updatedOrder: Order) => {
    setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
  };

  const handleCreateManualOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const order: Order = {
      ...(newManualOrder as Order),
      id: `DZD-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: new Date().toLocaleString('ar-SA'),
      updatedAt: new Date().toLocaleString('ar-SA'),
      lastStatusDate: new Date().toLocaleString('ar-SA'),
      history: []
    };
    setOrders([order, ...orders]);
    setIsAddModalOpen(false);
  };

  if (selectedOrder) {
    return (
      <OrderDetailsView
        order={selectedOrder}
        onBack={() => setSelectedOrderId(null)}
        onUpdate={handleUpdateOrder}
        readOnly={false} // تفعيل وضع التعديل الكامل
        trackingMode={false} // استخدام حالات التأكيد
      />
    );
  }

  const allStatuses: (OrderStatus | 'all')[] = [
    'all', 'pending', 'confirmed', 'message_sent', 'postponed',
    'failed_01', 'failed_02', 'failed_03', 'failed_04', 'failed_05',
    'duplicate', 'wrong_number', 'wrong_order', 'out_of_stock', 'cancelled'
  ];

  return (
    <>
      <div className="space-y-6 pb-20 animate-in fade-in duration-500">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="animate-in slide-in-from-right duration-500">
            <h2 className="text-xl font-black text-slate-800 tracking-tight">تأكيد الطلبيات</h2>
            <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest mt-1">إدارة وتحرير الطلبات (DZD)</p>
          </div>
          <button onClick={() => setIsAddModalOpen(true)} className="flex items-center justify-center gap-2 px-6 py-3.5 bg-indigo-600 text-white rounded-2xl font-black text-xs hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 transition-all w-full lg:w-auto">
            <Plus className="w-4 h-4" /> إضافة طلب يدوي
          </button>
        </div>

        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6 animate-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-2 mb-2">
            <Filter className="w-4 h-4 text-indigo-500" />
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">فرز وتصفية الطلبات</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">المتجر</label>
              <select value={storeFilter} onChange={e => setStoreFilter(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold outline-none focus:border-indigo-500 transition-all">
                {stores.map(s => <option key={s} value={s}>{s === 'all' ? 'جميع المتاجر' : s}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">الولاية</label>
              <select value={stateFilter} onChange={e => setStateFilter(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold outline-none focus:border-indigo-500 transition-all">
                {states.map(s => <option key={s} value={s}>{s === 'all' ? 'جميع الولايات' : s}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">بحث نصي</label>
              <div className="relative">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                <input
                  type="text"
                  placeholder="ابحث بالاسم، الهاتف أو الكود..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pr-12 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500 transition-all"
                />
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-50 flex flex-wrap gap-2">
            {allStatuses.map(f => {
              const colors = statusColors[f] || statusColors.default;
              const isActive = statusFilter === f;
              return (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  className={`px-4 py-1.5 rounded-lg text-[9px] font-black transition-all border uppercase tracking-widest 
                  ${isActive
                      ? `${colors.active} text-white border-transparent shadow-lg scale-105`
                      : `${colors.bg} ${colors.text} ${colors.border} hover:bg-slate-100 shadow-sm`}`}
                >
                  {f === 'all' ? 'الكل' : statusLabels[f as OrderStatus]}
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-right border-collapse min-w-[1100px]">
              <thead>
                <tr className="bg-slate-50/80 text-slate-500 border-b border-slate-100">
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em]">الطلب</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em]">العميل</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em]">الموقع</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em]">المبلغ</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em]">الحالة</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-center w-[120px]">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedOrders.map((order) => {
                  const statusKey = getStatusKey(order.status);
                  const colors = statusColors[statusKey] || statusColors.default;
                  const statusStyle = getStatusStyle(order.status);

                  return (
                    <tr key={order.id} onClick={() => setSelectedOrderId(order.id)} className="group hover:bg-slate-50 transition-all cursor-pointer">
                      <td className="px-6 py-5 font-black text-indigo-600 text-[11px]">#{order.id}</td>
                      <td className="px-6 py-5">
                        <div className="space-y-0.5">
                          <p className="text-[12px] font-black text-slate-800">{order.customer}</p>
                          <p className="text-[10px] font-bold text-slate-400">{order.phone}</p>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-[11px] font-bold text-slate-600">{typeof order.state === 'object' ? (order.state as any).name : order.state}</td>
                      <td className="px-6 py-5 font-black text-indigo-600 text-[11px]">{order.amount} دج</td>
                      <td className="px-6 py-5">
                        <span
                          className={`px-3 py-1 rounded-lg text-[9px] font-black border uppercase tracking-widest ${!statusStyle ? `${colors.bg} ${colors.text} ${colors.border}` : ''}`}
                          style={statusStyle ? { backgroundColor: statusStyle.backgroundColor, color: statusStyle.color, borderColor: statusStyle.borderColor } : {}}
                        >
                          {getStatusLabel(order.status)}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <button className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase group-hover:bg-indigo-600 group-hover:text-white group-hover:shadow-lg transition-all mx-auto">
                          مراجعة <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex justify-center items-center">
            <div className="flex items-center gap-2">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} className="p-2 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 disabled:opacity-30 transition-all"><ChevronRight className="w-5 h-5" /></button>
              <div className="flex items-center gap-1.5 mx-3">
                {[...Array(totalPages)].map((_, i) => (
                  <button key={i} onClick={() => setCurrentPage(i + 1)} className={`w-10 h-10 rounded-xl text-[10px] font-black transition-all ${currentPage === i + 1 ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-200'}`}>{i + 1}</button>
                ))}
              </div>
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} className="p-2 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 disabled:opacity-30 transition-all"><ChevronLeft className="w-5 h-5" /></button>
            </div>
          </div>
        </div>
      </div>
      <CreateOrderModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          window.location.reload();
        }}
      />
    </>
  );
};

export default OrderConfirmationView;
