import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Order, OrderStatus, OrderItem, StatusOrderObject } from '../types';
import {
  Search, MapPin, Phone, Store, ArrowLeft, ChevronRight, ChevronLeft,
  Plus, X, ShoppingBag, Truck, Calendar, Filter, UserCheck, Trash2, Eye
} from 'lucide-react';
import OrderDetailsView from './OrderDetailsView';
import TableSkeleton from './common/TableSkeleton';
import CreateOrderModal from './CreateOrderModal';
import { useQuery, useLazyQuery } from '@apollo/client';
import { GET_ALL_ORDERS } from '../graphql/queries/orderQueries';
import { GET_ALL_STATUS_COMPANY } from '../graphql/queries/companyQueries';
import { GET_CURRENT_USER } from '../graphql/queries';
import { GET_ALL_WILAYAS } from '../graphql/queries/wilayasQueries';
import { GET_ALL_STORES } from '../graphql/queries/storeQueries';
import { ModernSelect } from './common';
import { useAuth } from '../contexts/AuthContext';
import { statusLabels, statusColors } from '../constants/statusConstants';

interface OrderConfirmationViewProps {
  orders?: Order[];
  setOrders?: React.Dispatch<React.SetStateAction<Order[]>>;
}

const OrderConfirmationView: React.FC<OrderConfirmationViewProps> = ({ orders: initialOrders = [], setOrders: setParentOrders }) => {
  // Use GET_CURRENT_USER for reliable company ID
  const { data: userData } = useQuery(GET_CURRENT_USER);
  const user = userData?.currentUser; // Override local user from useAuth for this context

  const navigate = useNavigate(); // Add hook
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all'); // Store ID or 'all'
  const [storeFilter, setStoreFilter] = useState('all'); // Store ID
  const [stateFilter, setStateFilter] = useState('all'); // State Code

  const [currentPage, setCurrentPage] = useState(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const itemsPerPage = 8;

  // 1. Fetch Company Statuses (Filtered by Group: 'confirmation')
  const { data: statusData } = useQuery(GET_ALL_STATUS_COMPANY);

  const confirmationStatuses = useMemo(() => {
    if (!statusData?.allStatusCompany) return [];
    // Robust finding: Exact match -> content match -> heuristic match
    const group = statusData.allStatusCompany.find((g: any) =>
      g.group === 'Confirmation Group' ||
      g.group?.toLowerCase().trim() === 'confirmation group' ||
      g.group?.toLowerCase().includes('confirmation')
    );
    return group?.listStatus || [];
  }, [statusData]);

  const statusMap = useMemo(() => {
    if (!statusData?.allStatusCompany) return { labels: statusLabels, colors: statusColors };
    const map: Record<string, string> = {};
    const colors: Record<string, any> = {};

    statusData.allStatusCompany.forEach((g: any) => {
      g.listStatus?.forEach((s: any) => {
        map[s.nameEN] = s.nameAR;
        if (s.color) colors[s.nameEN] = s.color;
      });
    });

    return { labels: { ...statusLabels, ...map }, colors: { ...statusColors, ...colors } };
  }, [statusData]);

  // 2. Fetch Stores & Wilayas (Lazy Load)
  const [getStores, { data: storesData }] = useLazyQuery(GET_ALL_STORES);
  const [getWilayas, { data: wilayasData }] = useLazyQuery(GET_ALL_WILAYAS);

  // 3. Construct Advanced Filter
  const advancedFilter = useMemo(() => {
    const filter: any = {};

    // Status Filter (Ensure we only show confirmation group statuses unless specific one selected)
    if (statusFilter !== 'all') {
      filter.status = statusFilter; // ID of the status
    } else {
      // If 'all', filter by ALL status IDs in the confirmation group
      if (confirmationStatuses.length > 0) {
        filter.status = { $in: confirmationStatuses.map((s: any) => s.id) };
      }
    }

    // Store Filter
    if (storeFilter !== 'all') {
      filter["store.idStore"] = storeFilter;
    }

    // State Filter
    if (stateFilter !== 'all') {
      filter["state.code"] = stateFilter;
    }

    // Search Term (Server-side Regex)
    if (searchTerm) {
      const regex = { $regex: searchTerm, $options: 'i' };
      filter.$or = [
        { fullName: regex },
        { phone: regex },
        { numberOrder: regex },
        { "deliveryCompany.trackingCode": regex }
      ];
    }

    return filter;
  }, [statusFilter, storeFilter, stateFilter, searchTerm, confirmationStatuses]);

  // 4. Fetch Orders with Advanced Filter
  const { data: ordersData, loading: ordersLoading, refetch } = useQuery(GET_ALL_ORDERS, {
    variables: {
      pagination: { page: currentPage, limit: itemsPerPage },
      advancedFilter: Object.keys(advancedFilter).length > 0 ? advancedFilter : undefined
    },
    fetchPolicy: 'network-only', // Ensure fresh data on filter change
    skip: !statusData?.allStatusCompany // Skip until statuses are loaded to prevent double fetch
  });

  useEffect(() => {
    if (ordersData?.allOrder?.data) {
      setOrders(ordersData.allOrder.data);
    }
  }, [ordersData]);

  const totalPages = ordersData?.allOrder?.total ? Math.ceil(ordersData.allOrder.total / itemsPerPage) : 0;

  // Helpers
  const getStatusLabel = (s: any): string => {
    if (typeof s === 'object' && s !== null) return s.nameAR || s.nameEN || 'غير محدد';
    // Fallback for string statuses
    return statusLabels[s] || s || 'غير محدد';
  };

  const getStatusStyle = (s: any) => {
    if (typeof s === 'object' && s !== null && s.color) {
      return {
        backgroundColor: `${s.color}15`,
        color: s.color,
        borderColor: `${s.color}30`
      };
    }
    // No fallback style logic here, we let the component handle it or return null
    return null;
  };

  // Handlers
  // handleUpdateOrder removed as OrderDetailsView is no longer rendered here

  return (
    <>
      <div className="space-y-6 pb-20 animate-in fade-in duration-500">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="animate-in slide-in-from-right duration-500">
            <h2 className="text-xl font-black text-slate-800 tracking-tight">تأكيد الطلبيات</h2>
            <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest mt-1">إدارة وتحرير الطلبات</p>
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
              <ModernSelect
                value={storeFilter}
                onChange={setStoreFilter}
                options={[
                  { value: 'all', label: 'جميع المتاجر' },
                  ...(storesData?.allStore?.map((s: any) => ({ value: s.id, label: s.name })) || [])
                ]}
                className="w-full"
                onOpen={() => getStores()}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">الولاية</label>
              <ModernSelect
                value={stateFilter}
                onChange={setStateFilter}
                options={[
                  { value: 'all', label: 'جميع الولايات' },
                  ...(wilayasData?.allWilayas?.map((w: any) => ({ value: w.code, label: `${w.code} - ${w.name}` })) || [])
                ]}
                className="w-full"
                onOpen={() => getWilayas()}
              />
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">بحث نصي (الكل)</label>
              <div className="relative">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                <input
                  type="text"
                  placeholder="ابحث بالاسم، الهاتف، الكود، التتبع..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pr-12 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500 transition-all"
                />
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-50 flex flex-wrap gap-2">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-1.5 rounded-lg text-[9px] font-black transition-all border uppercase tracking-widest 
               ${statusFilter === 'all'
                  ? `bg-slate-800 text-white border-transparent shadow-lg scale-105`
                  : `bg-slate-50 text-slate-600 border-slate-100 hover:bg-slate-100 shadow-sm`}`}
            >
              الكل
            </button>
            {confirmationStatuses.map((s: any) => {
              const isActive = statusFilter === s.id;
              const style = getStatusStyle(s);
              return (
                <button
                  key={s.id}
                  onClick={() => setStatusFilter(s.id)}
                  className={`px-4 py-1.5 rounded-lg text-[9px] font-black transition-all border uppercase tracking-widest 
                  ${isActive ? 'brightness-110 shadow-md scale-105 ring-2 ring-offset-1 ring-indigo-200' : 'hover:bg-slate-50 opacity-80 hover:opacity-100'}`}
                  style={style ? {
                    backgroundColor: isActive ? s.color : style.backgroundColor,
                    color: isActive ? '#fff' : style.color,
                    borderColor: isActive ? s.color : style.borderColor
                  } : {}}
                >
                  {s.nameAR || s.nameEN}
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
          {ordersLoading ? (
            <div className="p-6">
              <TableSkeleton columns={6} rows={8} />
            </div>
          ) : (
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
                  {orders.map((order) => {
                    const statusStyle = getStatusStyle(order.status);
                    const statusLabel = getStatusLabel(order.status);

                    // Fallback colors if status is object but no color, OR if status is string
                    let fallbackColors = statusColors.default;
                    if (typeof order.status === 'string') {
                      fallbackColors = statusColors[order.status] || statusColors.default;
                    }

                    return (
                      <tr key={order.id} onClick={() => navigate(`/orders/${order.id}`)} className="group hover:bg-slate-50 transition-all cursor-pointer">
                        <td className="px-6 py-5 font-black text-indigo-600 text-[11px]">#{order.numberOrder || order.id?.substring(0, 8)}</td>
                        <td className="px-6 py-5">
                          <div className="space-y-0.5">
                            <p className="text-[12px] font-black text-slate-800">{order.fullName || order.customer || 'زائر'}</p>
                            <p className="text-[10px] font-bold text-slate-400">{order.phone}</p>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-[11px] font-bold text-slate-600">
                          {order.state ? (typeof order.state === 'object' ? (order.state as any).name : order.state) : '-'}
                        </td>
                        <td className="px-6 py-5 font-black text-indigo-600 text-[11px]">{order.totalPrice || order.amount} دج</td>
                        <td className="px-6 py-5">
                          <span
                            className={`px-3 py-1 rounded-lg text-[9px] font-black border uppercase tracking-widest ${!statusStyle ? `${fallbackColors.bg} ${fallbackColors.text} ${fallbackColors.border}` : ''}`}
                            style={statusStyle ? { backgroundColor: statusStyle.backgroundColor, color: statusStyle.color, borderColor: statusStyle.borderColor } : {}}
                          >
                            {statusLabel}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-center">
                          <button onClick={(e) => { e.stopPropagation(); navigate(`/orders/${order.id}`); }} className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase group-hover:bg-indigo-600 group-hover:text-white group-hover:shadow-lg transition-all mx-auto">
                            مراجعة <Eye className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {orders.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-slate-400 font-bold">لا توجد طلبات تطابق معايير البحث</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

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
          refetch();
        }}
      />
    </>
  );
};

export default OrderConfirmationView;
