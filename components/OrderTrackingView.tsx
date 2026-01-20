
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Order, OrderStatus } from '../types';
import {
  Truck, MapPin, Search, Store, Phone, Eye,
  ChevronRight, ChevronLeft, Filter, X,
  PlusCircle, Check, RefreshCcw, Info
} from 'lucide-react';
import { statusLabels, statusColors } from '../constants/statusConstants';
import OrderDetailsView from './OrderDetailsView';
import TableSkeleton from './common/TableSkeleton';
import { useQuery, useLazyQuery } from '@apollo/client';
import { GET_ALL_ORDERS } from '../graphql/queries/orderQueries';
import { GET_ALL_STATUS_COMPANY } from '../graphql/queries/companyQueries';
import { GET_CURRENT_USER } from '../graphql/queries';
import { GET_ALL_WILAYAS } from '../graphql/queries/wilayasQueries';
import { GET_ALL_STORES } from '../graphql/queries/storeQueries';
import { useAuth } from '../contexts/AuthContext';
import { ModernSelect } from './common';

interface OrderTrackingViewProps {
  orders?: Order[];
  setOrders?: React.Dispatch<React.SetStateAction<Order[]>>;
}

const OrderTrackingView: React.FC<OrderTrackingViewProps> = ({ orders: initialOrders = [], setOrders: setParentOrders }) => {
  // Use GET_CURRENT_USER for reliable company ID
  const { data: userData } = useQuery(GET_CURRENT_USER);
  const user = userData?.currentUser;

  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [storeFilter, setStoreFilter] = useState('all');
  const [stateFilter, setStateFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // 1. Fetch Company Statuses (Filtered by Group: 'tracking')
  const { data: statusData } = useQuery(GET_ALL_STATUS_COMPANY, {
    skip: !user
  });

  const trackingStatuses = useMemo(() => {
    // Robust finding: Exact match -> content match -> heuristic
    if (!statusData?.allStatusCompany) return [];
    const group = statusData.allStatusCompany.find((g: any) =>
      g.group === 'Tracking Group' ||
      g.group?.toLowerCase().trim() === 'tracking group' ||
      g.group?.toLowerCase().includes('tracking')
    );
    return group?.listStatus || [];
  }, [statusData]);

  // 2. Fetch Stores & Wilayas (Lazy)
  const [getStores, { data: storesData }] = useLazyQuery(GET_ALL_STORES);
  const [getWilayas, { data: wilayasData }] = useLazyQuery(GET_ALL_WILAYAS);

  // 3. Construct Advanced Filter
  const advancedFilter = useMemo(() => {
    const filter: any = {};

    // Mandatory: Only show orders with a Delivery Company assigned
    filter["deliveryCompany.idDeliveryCompany"] = { $exists: true, $ne: null };

    // Status Filter (Only show tracking statuses)
    if (statusFilter !== 'all') {
      filter.status = statusFilter;
    } else {
      if (trackingStatuses.length > 0) {
        filter.status = { $in: trackingStatuses.map((s: any) => s.id) };
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

    // Search Term
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
  }, [statusFilter, storeFilter, stateFilter, searchTerm, trackingStatuses]);

  // 4. Fetch Orders
  const { data: ordersData, loading: ordersLoading, refetch } = useQuery(GET_ALL_ORDERS, {
    variables: {
      pagination: { page: currentPage, limit: itemsPerPage },
      advancedFilter: Object.keys(advancedFilter).length > 0 ? advancedFilter : undefined
    },
    skip: !user || !statusData?.allStatusCompany, // Wait for user AND statuses
    fetchPolicy: 'network-only'
  });

  useEffect(() => {
    if (ordersData?.allOrder?.data) {
      setOrders(ordersData.allOrder.data);
    }
  }, [ordersData]);

  const totalPages = ordersData?.allOrder?.total ? Math.ceil(ordersData.allOrder.total / itemsPerPage) : 0;

  // Helper to get status color (dynamic)
  const getStatusStyle = (s: any) => {
    if (typeof s === 'object' && s !== null && s.color) {
      return {
        backgroundColor: `${s.color}15`,
        color: s.color,
        borderColor: `${s.color}30`
      };
    }
    return null;
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="animate-in slide-in-from-right duration-500">
          <h2 className="text-xl font-black text-slate-800 tracking-tight">تتبع الطرود (Logistics)</h2>
          <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest mt-1">تحديث مسارات الشحن والتسليم</p>
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
          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">بحث سريع (الكل)</label>
            <div className="relative">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
              <input
                type="text"
                placeholder="الاسم، الهاتف، الكود، التتبع..."
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
          {trackingStatuses.map((s: any) => {
            const isActive = statusFilter === s.id;
            const style = getStatusStyle(s);
            return (
              <button
                key={s.id}
                onClick={() => setStatusFilter(s.id)}
                className={`px-4 py-1.5 rounded-lg text-[9px] font-black transition-all border uppercase tracking-widest whitespace-nowrap
                  ${isActive ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' : 'hover:scale-105 shadow-sm'}`}
                style={!isActive && style ? {
                  backgroundColor: style.backgroundColor,
                  color: style.color,
                  borderColor: style.borderColor
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
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em]">كود التتبع</th>
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
                  const statusName = typeof order.status === 'object' && order.status ? ((order.status as any).nameAR || (order.status as any).nameEN) : order.status;
                  const trackingCode = order.deliveryCompany?.trackingCode || '-';

                  return (
                    <tr key={order.id} onClick={() => navigate(`/tracking/${order.id}`)} className="group hover:bg-slate-50 transition-all cursor-pointer">
                      <td className="px-6 py-5 font-black text-indigo-600 text-[11px] font-mono tracking-widest">#{trackingCode}</td>
                      <td className="px-6 py-5">
                        <div className="space-y-0.5">
                          <p className="text-[12px] font-black text-slate-800">{order.fullName || order.customer}</p>
                          <p className="text-[10px] font-bold text-slate-400">{order.phone}</p>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-[11px] font-bold text-slate-600">
                        {order.state ? (typeof order.state === 'object' ? (order.state as any).name : order.state) : '-'}
                      </td>
                      <td className="px-6 py-5 font-black text-slate-800 text-[11px]">{order.totalPrice || order.amount} دج</td>
                      <td className="px-6 py-5">
                        <span className={`px-3 py-1.5 rounded-lg text-[9px] font-black border uppercase tracking-widest`}
                          style={statusStyle ? { backgroundColor: statusStyle.backgroundColor, color: statusStyle.color, borderColor: statusStyle.borderColor } : {}}
                        >
                          {statusName}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <button onClick={(e) => { e.stopPropagation(); navigate(`/tracking/${order.id}`); }} className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase group-hover:bg-indigo-600 group-hover:text-white transition-all mx-auto">
                          تتبع <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-slate-400 font-bold">لا توجد شحنات تطابق معايير البحث</td>
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
  );
};

export default OrderTrackingView;
