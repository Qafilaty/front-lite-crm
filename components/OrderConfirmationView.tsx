import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Order, OrderStatus, OrderItem, StatusOrderObject } from '../types';
import {
  Search, MapPin, Phone, Store, ArrowLeft, ChevronRight, ChevronLeft,
  Plus, X, ShoppingBag, Truck, Calendar, Filter, UserCheck, Trash2, Eye, User, CheckSquare, Square
} from 'lucide-react';
import OrderDetailsView from './OrderDetailsView';
import TableSkeleton from './common/TableSkeleton';
import CreateOrderModal from './CreateOrderModal';
import { useQuery, useLazyQuery, useSubscription, gql } from '@apollo/client';
import { GET_ALL_ORDERS } from '../graphql/queries/orderQueries';
import { GET_ALL_STATUS_COMPANY } from '../graphql/queries/companyQueries';
import { GET_CURRENT_USER } from '../graphql/queries';
import toast from 'react-hot-toast';
import { GET_ALL_WILAYAS } from '../graphql/queries/wilayasQueries';
import { GET_ALL_STORES } from '../graphql/queries/storeQueries';
import { GET_ALL_PRODUCTS } from '../graphql/queries/productQueries';
import { ModernSelect, PaginationControl } from './common';
import { useAuth } from '../contexts/AuthContext';
import { statusLabels, statusColors } from '../constants/statusConstants';
import { BulkDeliveryModal } from './BulkDeliveryModal';
import { AssignConfirmerModal } from './AssignConfirmerModal';

interface OrderConfirmationViewProps {
  orders?: Order[];
  setOrders?: React.Dispatch<React.SetStateAction<Order[]>>;
}

const SYNC_ORDERS_SUBSCRIPTION = gql`
  subscription SyncOrders($idCompany: ID!) {
     syncOrdersWithExternalStores(idCompany: $idCompany) {
        id
        numberOrder
        fullName
        totalPrice
        status { id nameAR nameEN color }
     }
  }
`;

const OrderConfirmationView: React.FC<OrderConfirmationViewProps> = ({ orders: initialOrders = [], setOrders: setParentOrders }) => {
  // Use GET_CURRENT_USER for reliable company ID
  const { data: userData } = useQuery(GET_CURRENT_USER);
  const user = userData?.currentUser; // Override local user from useAuth for this context

  const navigate = useNavigate(); // Add hook
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all'); // Store ID or 'all'
  const [storeFilter, setStoreFilter] = useState('all'); // Store ID
  const [productFilter, setProductFilter] = useState('all'); // Product ID
  const [stateFilter, setStateFilter] = useState('all'); // State Code

  const [currentPage, setCurrentPage] = useState(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false); // New state for collapsible filters
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // Bulk Selection State
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [isBulkDeliveryModalOpen, setIsBulkDeliveryModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  // Highlighting State
  const [highlightedOrderIds, setHighlightedOrderIds] = useState<Set<string>>(new Set());

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.pageX - (scrollContainerRef.current?.offsetLeft || 0));
    setScrollLeft(scrollContainerRef.current?.scrollLeft || 0);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - (scrollContainerRef.current?.offsetLeft || 0);
    const walk = (x - startX) * 2; // scroll-fast
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = scrollLeft - walk;
    }
  };

  const scrollCheck = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 200;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

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
  const [getProducts, { data: productsData }] = useLazyQuery(GET_ALL_PRODUCTS, {
    variables: { pagination: { limit: 100, page: 1 } }
  });

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

    // Product Filter
    if (productFilter !== 'all') {
      filter["products.idProduct"] = productFilter;
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
  }, [statusFilter, storeFilter, productFilter, stateFilter, searchTerm, confirmationStatuses]);

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
      setSelectedOrderIds([]); // Clear selection on data change
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

  // Selection Logic
  const toggleSelection = (id: string) => {
    setSelectedOrderIds(prev =>
      prev.includes(id) ? prev.filter(oid => oid !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedOrderIds.length === orders.length) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(orders.map(o => o.id));
    }
  };

  const getSelectedOrders = () => {
    return orders.filter(o => selectedOrderIds.includes(o.id));
  };


  // Check if the current filter is "Confirmed"
  const isConfirmedStatus = useMemo(() => {
    if (statusFilter === 'all') return false;
    const selectedStatus = confirmationStatuses.find(s => s.id === statusFilter);
    return selectedStatus?.nameEN?.toLowerCase() === 'confirmed' || selectedStatus?.nameAR === 'مؤكدة';
  }, [statusFilter, confirmationStatuses]);

  // Real-time updates
  useSubscription(SYNC_ORDERS_SUBSCRIPTION, {
    variables: { idCompany: user?.company?.id || '' },
    skip: !user?.company?.id,
    onData: ({ data: { data } }) => {
      if (data?.syncOrdersWithExternalStores) {
        const newOrders = data.syncOrdersWithExternalStores;
        if (newOrders.length > 0) {
          const newIds = newOrders.map((o: any) => o.id);
          setHighlightedOrderIds(prev => {
            const next = new Set(prev);
            newIds.forEach((id: string) => next.add(id));
            return next;
          });

          toast.success(`تم استلام ${newOrders.length} طلبات جديدة!`, {
            icon: '🚀',
            duration: 5000
          });
          refetch(); // Refresh the list
        }
      }
    }
  });

  useEffect(() => {
    setSelectedOrderIds([]); // Clear selection when filter changes
  }, [statusFilter, storeFilter, productFilter, stateFilter, searchTerm]);

  return (
    <>
      <div className="space-y-6 pb-20 animate-in fade-in duration-500">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="animate-in slide-in-from-right duration-500">
            <h2 className="text-xl font-black text-slate-800 tracking-tight">تأكيد الطلبيات</h2>
            <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest mt-1">إدارة وتحرير الطلبات</p>
          </div>
          <div className="flex items-center gap-3 w-full lg:w-auto">
            {selectedOrderIds.length > 0 && (
              isConfirmedStatus ? (
                <button
                  onClick={() => setIsBulkDeliveryModalOpen(true)}
                  className="flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-900 text-white rounded-2xl font-black text-xs hover:bg-slate-800 shadow-xl shadow-slate-900/10 transition-all flex-1 lg:flex-none animate-in fade-in zoom-in"
                >
                  <Truck className="w-4 h-4" /> إرسال ({selectedOrderIds.length})
                </button>
              ) : (
                (user?.role === 'admin' || user?.role === 'owner') && (
                  <button
                    onClick={() => setIsAssignModalOpen(true)}
                    className="flex items-center justify-center gap-2 px-6 py-3.5 bg-indigo-600 text-white rounded-2xl font-black text-xs hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 transition-all flex-1 lg:flex-none animate-in fade-in zoom-in"
                  >
                    <UserCheck className="w-4 h-4" /> إسناد ({selectedOrderIds.length})
                  </button>
                )
              )
            )}
            <button onClick={() => setIsAddModalOpen(true)} className="flex items-center justify-center gap-2 px-6 py-3.5 bg-indigo-600 text-white rounded-2xl font-black text-xs hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 transition-all flex-1 lg:flex-none">
              <Plus className="w-4 h-4" /> إضافة طلب يدوي
            </button>
          </div>
        </div>

        <div className="bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm transition-all duration-300 animate-in slide-in-from-top-4">
          <div className="flex flex-col gap-4">
            {/* Top Row: Search + Filter Toggle + Add Button (Mobile) */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-300" />
                <input
                  type="text"
                  placeholder="بحث سريع... (الاسم، الهاتف، المبلغ)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pr-11 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] font-bold outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all text-slate-600 placeholder:text-slate-400"
                />
              </div>

              <button
                onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                className={`p-3 rounded-2xl border transition-all flex items-center gap-2 group ${isFiltersOpen ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-200 hover:text-indigo-600'}`}
              >
                <Filter className={`w-4 h-4 transition-transform duration-300 ${isFiltersOpen ? 'rotate-180' : ''}`} />
                <span className="hidden sm:inline text-[10px] font-black uppercase tracking-wider">تصفية</span>
                {(storeFilter !== 'all' || stateFilter !== 'all' || productFilter !== 'all') && (
                  <span className="flex items-center justify-center w-4 h-4 bg-indigo-600 text-white text-[8px] font-bold rounded-full">
                    {[storeFilter, stateFilter, productFilter].filter(f => f !== 'all').length}
                  </span>
                )}
              </button>
            </div>

            {/* Collapsible Filters Area */}
            {isFiltersOpen && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 animate-in slide-in-from-top-2 fade-in duration-300">
                <div className="space-y-1">
                  <span className="text-[9px] font-black text-slate-400 px-2">المتجر</span>
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
                <div className="space-y-1">
                  <span className="text-[9px] font-black text-slate-400 px-2">المنتج</span>
                  <ModernSelect
                    value={productFilter}
                    onChange={setProductFilter}
                    options={[
                      { value: 'all', label: 'جميع المنتجات' },
                      ...(productsData?.allProduct?.data?.map((p: any) => ({ value: p.id, label: p.name })) || [])
                    ]}
                    className="w-full"
                    onOpen={() => getProducts()}
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-black text-slate-400 px-2">الولاية</span>
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
              </div>
            )}

            {/* Status Tabs - Scrollable Area */}
            <div className="pt-2 border-t border-slate-50 relative group/scroll">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-full bg-gradient-to-r from-white to-transparent pointer-events-none" />
              <div className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-full bg-gradient-to-l from-white to-transparent pointer-events-none" />

              <button
                onClick={() => scrollCheck('right')}
                className="absolute -right-3 top-1/2 -translate-y-1/2 z-20 p-1.5 rounded-full bg-white shadow-md border border-slate-100 text-slate-400 hover:text-indigo-600 opacity-0 group-hover/scroll:opacity-100 transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => scrollCheck('left')}
                className="absolute -left-3 top-1/2 -translate-y-1/2 z-20 p-1.5 rounded-full bg-white shadow-md border border-slate-100 text-slate-400 hover:text-indigo-600 opacity-0 group-hover/scroll:opacity-100 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div
                ref={scrollContainerRef}
                onMouseDown={handleMouseDown}
                onMouseLeave={handleMouseLeave}
                onMouseUp={handleMouseUp}
                onMouseMove={handleMouseMove}
                className="overflow-x-auto no-scrollbar pb-1 cursor-grab active:cursor-grabbing select-none"
              >
                <div className="flex gap-2 min-w-max px-1">
                  <button
                    onClick={() => setStatusFilter('all')}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all border uppercase tracking-widest flex items-center gap-2 flex-shrink-0
                     ${statusFilter === 'all'
                        ? `bg-slate-800 text-white border-transparent shadow-lg scale-105`
                        : `bg-slate-50 text-slate-500 border-transparent hover:bg-slate-100 shadow-sm`}`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${statusFilter === 'all' ? 'bg-white' : 'bg-slate-400'}`} />
                    الكل
                  </button>
                  {confirmationStatuses.map((s: any) => {
                    const isActive = statusFilter === s.id;
                    const style = getStatusStyle(s);
                    return (
                      <button
                        key={s.id}
                        onClick={() => setStatusFilter(s.id)}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all border uppercase tracking-widest flex items-center gap-2 flex-shrink-0
                        ${isActive ? 'brightness-110 shadow-md scale-105 ring-2 ring-offset-2 ring-indigo-50/50' : 'bg-white border-slate-100 text-slate-500 hover:border-slate-200 hover:bg-slate-50'}`}
                        style={!isActive && style ? {
                          backgroundColor: style.backgroundColor,
                          color: style.color,
                          borderColor: style.borderColor
                        } : (isActive && style ? {
                          backgroundColor: style.color, // Solid color for active
                          color: '#fff',
                          borderColor: style.color
                        } : {})}
                      >
                        {isActive && <div className="w-1.5 h-1.5 rounded-full bg-white shadow-sm" />}
                        {s.nameAR || s.nameEN}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
          {ordersLoading ? (
            <div className="p-6">
              <TableSkeleton columns={isConfirmedStatus ? 7 : 6} rows={8} />
            </div>
          ) : (
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-right border-collapse min-w-[1100px]">
                <thead>
                  <tr className="bg-slate-50/80 text-slate-500 border-b border-slate-100">
                    <th className="px-6 py-4 w-12 text-center animate-in slide-in-from-right-4 fade-in">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500  cursor-pointer"
                        checked={selectedOrderIds.length > 0 && selectedOrderIds.length === orders.length}
                        onChange={toggleAll}
                      />
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em]">العميل</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em]">الموقع (الولاية - البلدية)</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em]">مؤكد الطلب</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em]">المبلغ</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em]">الحالة</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-center w-[120px]">الإجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.map((order) => {
                    const statusStyle = getStatusStyle(order.status);
                    const statusLabel = getStatusLabel(order.status);
                    const isSelected = selectedOrderIds.includes(order.id);

                    // Fallback colors if status is object but no color, OR if status is string
                    let fallbackColors = statusColors.default;
                    if (typeof order.status === 'string') {
                      fallbackColors = statusColors[order.status] || statusColors.default;
                    }

                    // Check highlight
                    const isNew = highlightedOrderIds.has(order.id);

                    return (
                      <tr
                        key={order.id}
                        onClick={() => navigate(`/dashboard/orders/${order.id}`)}
                        className={`group transition-all cursor-pointer ${isSelected ? 'bg-indigo-50/30' : (isNew ? 'bg-emerald-50/80 hover:bg-emerald-100' : 'hover:bg-slate-50')}`}
                      >
                        <td className="px-6 py-5 text-center animate-in slide-in-from-right-4 fade-in" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                            checked={isSelected}
                            onChange={() => toggleSelection(order.id)}
                          />
                        </td>
                        <td className="px-6 py-5">
                          <div className="space-y-0.5">
                            <p className="text-[12px] font-black text-slate-800">{order.fullName || order.customer || 'زائر'}</p>
                            <p className="text-[10px] font-bold text-slate-400 flex items-center gap-2">
                              {order.phone}
                              {order.duplicatePhone && order.duplicatePhone > 1 && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSearchTerm(order.phone);
                                  }}
                                  className="w-4 h-4 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-[9px] font-black hover:bg-amber-200 transition-colors"
                                  title={`${order.duplicatePhone} طلبات لهذا الرقم`}
                                >
                                  {order.duplicatePhone}
                                </button>
                              )}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col gap-1">
                            <span className="text-[11px] font-black text-slate-700 bg-slate-100 px-2 py-1 rounded w-fit">
                              {/* State Display */}
                              {order.state ? (typeof order.state === 'object' ? (order.state as any).name : order.state) : '-'}
                            </span>
                            {order.city && (
                              <span className="text-[10px] font-bold text-slate-400 px-1">
                                {order.city}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          {order.confirmed ? (
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                                <UserCheck className="w-3 h-3" />
                              </div>
                              <span className="text-[10px] font-bold text-slate-600">
                                {order.confirmed.name}
                              </span>
                            </div>
                          ) : (order.confirmationTimeLine && order.confirmationTimeLine.length > 0 ? (
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                                <UserCheck className="w-3 h-3" />
                              </div>
                              <span className="text-[10px] font-bold text-slate-600">
                                {order.confirmationTimeLine[0].user?.name || 'غير معروف'}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-300 font-bold">-</span>
                          ))}
                        </td>
                        <td className="px-6 py-5 font-black text-indigo-600 text-[11px] font-mono">{order.totalPrice || order.amount} دج</td>
                        <td className="px-6 py-5">
                          <span
                            className={`px-3 py-1 rounded-lg text-[9px] font-black border uppercase tracking-widest ${!statusStyle ? `${fallbackColors.bg} ${fallbackColors.text} ${fallbackColors.border}` : ''}`}
                            style={statusStyle ? { backgroundColor: statusStyle.backgroundColor, color: statusStyle.color, borderColor: statusStyle.borderColor } : {}}
                          >
                            {statusLabel}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-center">
                          <button onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/orders/${order.id}`); }} className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase group-hover:bg-indigo-600 group-hover:text-white group-hover:shadow-lg transition-all mx-auto">
                            مراجعة <Eye className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {orders.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-slate-400 font-bold">لا توجد طلبات تطابق معايير البحث</td>
                    </tr>
                  )}
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
            totalItems={ordersData?.allOrder?.total || 0}
            isLoading={ordersLoading}
          />
        </div>
      </div >
      <CreateOrderModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          refetch();
        }}
      />

      <BulkDeliveryModal
        isOpen={isBulkDeliveryModalOpen}
        onClose={() => setIsBulkDeliveryModalOpen(false)}
        selectedOrders={getSelectedOrders()}
        onRemoveOrder={(id) => toggleSelection(id)}
        onSuccess={() => {
          // refetch orders to update status ideally (though status might not change immediately unless backend does it)
          // But user might want to clear selection
          refetch();
          setSelectedOrderIds([]); // Clear selection after success
        }}
      />

      <AssignConfirmerModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        selectedIds={selectedOrderIds}
        onSuccess={() => {
          refetch();
          setSelectedOrderIds([]);
        }}
      />
    </>
  );
};

export default OrderConfirmationView;
