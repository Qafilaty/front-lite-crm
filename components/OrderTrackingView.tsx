
import React, { useState, useMemo } from 'react';
import { Order, OrderStatus, OrderLog } from '../types';
import { 
  Truck, MapPin, Search, Store, Phone, Eye, 
  ChevronRight, ChevronLeft, Filter, X, 
  PlusCircle, Check, RefreshCcw, Info
} from 'lucide-react';
import { statusLabels, statusColors } from './OrderConfirmationView';
import OrderDetailsView from './OrderDetailsView';

interface OrderTrackingViewProps {
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
}

const OrderTrackingView: React.FC<OrderTrackingViewProps> = ({ orders, setOrders }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [storeFilter, setStoreFilter] = useState('all');
  const [stateFilter, setStateFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const itemsPerPage = 8;

  // الحالات الـ 15 اللوجستية المطلوبة حصراً للتتبع
  const trackingStatuses: OrderStatus[] = [
    'en_preparation', 'ramasse', 'sorti_livraison', 'delivered', 'annule', 
    'tentative_01', 'tentative_02', 'tentative_03', 'reporte_01', 
    'wrong_number', 'client_absent', 'wrong_address', 'retour_vendeur', 
    'retourne_vendeur', 'paid'
  ];

  const stores = useMemo(() => ['all', ...new Set(orders.map(o => o.storeName))], [orders]);
  const states = useMemo(() => ['all', ...new Set(orders.map(o => o.state))], [orders]);

  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.customer.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         o.id.includes(searchTerm) || 
                         o.phone.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    const matchesStore = storeFilter === 'all' || o.storeName === storeFilter;
    const matchesState = stateFilter === 'all' || o.state === stateFilter;
    return matchesSearch && matchesStatus && matchesStore && matchesState;
  });

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const selectedOrder = orders.find(o => o.id === selectedOrderId);

  const handleUpdateOrder = (updatedOrder: Order) => {
    setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
  };

  if (selectedOrder) {
    return (
      <OrderDetailsView 
        order={selectedOrder} 
        onBack={() => setSelectedOrderId(null)} 
        onUpdate={handleUpdateOrder}
        readOnly={true} // تفعيل وضع القراءة فقط لشاشة التتبع
        trackingMode={true} // تفعيل وضع التتبع (15 حالة)
      />
    );
  }

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="animate-in slide-in-from-right duration-500">
          <h2 className="text-xl font-black text-slate-800 tracking-tight">تتبع الطرود (Logistics)</h2>
          <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest mt-1">تحديث مسارات الشحن والتسليم بالدينار الجزائري</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6 animate-in slide-in-from-top-4 duration-500">
        <div className="flex items-center gap-2 mb-2">
          <Filter className="w-4 h-4 text-indigo-500" />
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">تصفية الشحنات</h3>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">بحث سريع</label>
            <div className="relative">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
              <input 
                type="text" 
                placeholder="الاسم، الهاتف، الكود..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-12 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500 transition-all"
              />
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-50 flex flex-wrap gap-2 overflow-x-auto no-scrollbar pb-2">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-1.5 rounded-lg text-[9px] font-black transition-all border uppercase tracking-widest 
              ${statusFilter === 'all' ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' : 'bg-slate-50 text-slate-400 border-slate-200'}`}
          >
            الكل
          </button>
          {trackingStatuses.map(f => {
            const colors = statusColors[f] || statusColors.default;
            return (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`px-4 py-1.5 rounded-lg text-[9px] font-black transition-all border uppercase tracking-widest whitespace-nowrap
                  ${statusFilter === f ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' : `${colors.bg} ${colors.text} ${colors.border} hover:scale-105 shadow-sm`}`}
              >
                {statusLabels[f]}
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
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em]">كود التتبع</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em]">العميل</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em]">الموقع</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em]">المبلغ</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em]">الحالة</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-center w-[120px]">الإجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedOrders.map((order) => {
                const colors = statusColors[order.status] || statusColors.default;
                return (
                  <tr key={order.id} onClick={() => setSelectedOrderId(order.id)} className="group hover:bg-slate-50 transition-all cursor-pointer">
                    <td className="px-6 py-5 font-black text-indigo-600 text-[11px] font-mono tracking-widest">#{order.id}</td>
                    <td className="px-6 py-5">
                      <div className="space-y-0.5">
                        <p className="text-[12px] font-black text-slate-800">{order.customer}</p>
                        <p className="text-[10px] font-bold text-slate-400">{order.phone}</p>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-[11px] font-bold text-slate-600">{order.state}</td>
                    <td className="px-6 py-5 font-black text-slate-800 text-[11px]">{order.amount} دج</td>
                    <td className="px-6 py-5">
                      <span className={`px-3 py-1.5 rounded-lg text-[9px] font-black border uppercase tracking-widest ${colors.bg} ${colors.text} ${colors.border}`}>
                        {statusLabels[order.status]}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-center">
                       <button className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase group-hover:bg-indigo-600 group-hover:text-white transition-all mx-auto">
                          تتبع <Eye className="w-3.5 h-3.5" />
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
  );
};

export default OrderTrackingView;
