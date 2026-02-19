import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Order, OrderStatus } from '../types';
import {
  Truck, MapPin, Search, Store, Phone, Eye,
  ChevronRight, ChevronLeft, Filter, X,
  PlusCircle, Check, RefreshCcw, Info, UserCheck, User, LayoutList, Home, Building2, AlertTriangle,
  AlertOctagon, RefreshCw, CheckCircle2, ShoppingBag, DollarSign, ArrowLeft, CheckSquare, Calendar
} from 'lucide-react';
import { statusLabels, statusColors } from '../constants/statusConstants';
import OrderDetailsView from './OrderDetailsView';
import TableSkeleton from './common/TableSkeleton';
import { useQuery, useLazyQuery } from '@apollo/client';
import { GET_ALL_ORDERS } from '../graphql/queries/orderQueries';
import { GET_ALL_STATUS_COMPANY } from '../graphql/queries/companyQueries';
import { GET_CURRENT_USER, GET_ALL_USERS } from '../graphql/queries';
import { GET_ALL_WILAYAS } from '../graphql/queries/wilayasQueries';
import { GET_ALL_STORES } from '../graphql/queries/storeQueries';
import { GET_ALL_PRODUCTS } from '../graphql/queries/productQueries';
import { useAuth } from '../contexts/AuthContext';
import { ModernSelect, PaginationControl } from './common';

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

  // --- Dynamic Columns State ---
  const [visibleColumns, setVisibleColumns] = useState(() => {
    try {
      const saved = localStorage.getItem('trackingTableColumns_v1');
      return saved ? JSON.parse(saved) : {
        customerInfo: true,
        locationInfo: true,
        trackingInfo: true,
        confirmedBy: true,
        financials: true,
        status: true,
        actions: true
      };
    } catch {
      return {
        customerInfo: true, locationInfo: true, trackingInfo: true,
        confirmedBy: true, financials: true, status: true, actions: true
      };
    }
  });
  const [isColumnsMenuOpen, setIsColumnsMenuOpen] = useState(false);

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = () => setIsColumnsMenuOpen(false);
    if (isColumnsMenuOpen) document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isColumnsMenuOpen]);

  const toggleColumn = (key: string) => {
    const newCols: any = { ...visibleColumns, [key]: !(visibleColumns as any)[key] };
    setVisibleColumns(newCols);
    localStorage.setItem('trackingTableColumns_v1', JSON.stringify(newCols));
  };
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [storeFilter, setStoreFilter] = useState('all');
  const [productFilter, setProductFilter] = useState('all');
  const [stateFilter, setStateFilter] = useState('all');
  const [confirmerFilter, setConfirmerFilter] = useState('all');
  const [isAbandonedFilter, setIsAbandonedFilter] = useState(false); // New Filter State
  const [currentPage, setCurrentPage] = useState(1);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false); // New state for collapsible filters
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

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
  const [getStores, { data: storesData, loading: storesLoading }] = useLazyQuery(GET_ALL_STORES);
  const [getWilayas, { data: wilayasData, loading: wilayasLoading }] = useLazyQuery(GET_ALL_WILAYAS);
  const [getProducts, { data: productsData, loading: productsLoading }] = useLazyQuery(GET_ALL_PRODUCTS, {
    variables: { pagination: { limit: 100, page: 1 } }
  });
  const [getUsers, { data: usersData, loading: usersLoading }] = useLazyQuery(GET_ALL_USERS);

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

    // Abandoned Filter
    if (isAbandonedFilter) {
      filter.isAbandoned = true;
      // If we filter by abandoned, we might want to relax the status filter if needed, 
      // but usually abandoned orders in tracking ARE confirmed/delivered, so they have tracking status.
      // So keeping status filter as is is correct.
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

    // Confirmer Filter
    if (confirmerFilter !== 'all') {
      filter.idConfirmed = confirmerFilter;
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
  }, [statusFilter, storeFilter, productFilter, stateFilter, searchTerm, trackingStatuses, isAbandonedFilter, confirmerFilter]);

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

      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm transition-all duration-300 animate-in slide-in-from-top-4">
        <div className="flex flex-col gap-4">
          {/* Top Row: Search + Filter Toggle */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-300" />
              <input
                type="text"
                placeholder="بحث سريع... (الكود، الاسم، الهاتف)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-11 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all text-slate-600 placeholder:text-slate-400"
              />
            </div>

            {/* Abandoned Filter Toggle */}
            <button
              onClick={() => setIsAbandonedFilter(!isAbandonedFilter)}
              className={`p-3 rounded-xl border transition-all flex items-center gap-2 group ${isAbandonedFilter ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-white border-slate-200 text-slate-500 hover:border-rose-200 hover:text-rose-600'}`}
              title="عرض الطلبات المتروكة فقط"
            >
              <AlertTriangle className={`w-4 h-4 ${isAbandonedFilter ? 'fill-rose-600' : ''}`} />
              <span className="hidden sm:inline text-[10px] font-black uppercase tracking-wider">المتروكة</span>
            </button>

            <button
              onClick={() => setIsFiltersOpen(!isFiltersOpen)}
              className={`p-3 rounded-xl border transition-all flex items-center gap-2 group ${isFiltersOpen ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-200 hover:text-indigo-600'}`}
            >
              <Filter className={`w-4 h-4 transition-transform duration-300 ${isFiltersOpen ? 'rotate-180' : ''}`} />
              <span className="hidden sm:inline text-[10px] font-black uppercase tracking-wider">تصفية</span>
              {(storeFilter !== 'all' || stateFilter !== 'all' || productFilter !== 'all' || confirmerFilter !== 'all') && (
                <span className="flex items-center justify-center w-4 h-4 bg-indigo-600 text-white text-[8px] font-bold rounded-full">
                  {[storeFilter, stateFilter, productFilter, confirmerFilter].filter(f => f !== 'all').length}
                </span>
              )}
            </button>

            {/* Columns Toggle */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsColumnsMenuOpen(!isColumnsMenuOpen);
                }}
                className={`p-3 rounded-xl border transition-all flex items-center gap-2 group ${isColumnsMenuOpen ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-200 hover:text-indigo-600'}`}
              >
                <LayoutList className="w-4 h-4" />
                <span className="hidden sm:inline text-[10px] font-black uppercase tracking-wider">الأعمدة</span>
              </button>

              {isColumnsMenuOpen && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute top-full left-0 mt-2 w-56 bg-white border border-slate-100 rounded-xl shadow-xl z-50 p-2 animate-in slide-in-from-top-2 fade-in"
                >
                  <p className="px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">عرض الأعمدة</p>
                  <div className="space-y-1">
                    {Object.keys(visibleColumns).map(key => {
                      if (key === 'actions') return null;
                      const labels: any = {
                        customerInfo: 'العميل',
                        locationInfo: 'الموقع',
                        trackingInfo: 'كود التتبع',
                        confirmedBy: 'مؤكد الطلب',
                        financials: 'المالية',
                        status: 'الحالة'
                      };
                      return (
                        <label key={key} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors">
                          <input
                            type="checkbox"
                            checked={(visibleColumns as any)[key]}
                            onChange={() => toggleColumn(key)}
                            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="text-xs font-bold text-slate-700">{labels[key] || key}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Collapsible Filters Area */}
          {isFiltersOpen && (
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 animate-in slide-in-from-top-2 fade-in duration-300">
              <div className="space-y-1">
                <span className="text-[9px] font-black text-slate-400 px-2">المؤكد</span>
                <ModernSelect
                  value={confirmerFilter}
                  onChange={setConfirmerFilter}
                  options={[
                    { value: 'all', label: 'جميع المؤكدين' },
                    ...(usersData?.allUser
                      ?.filter((u: any) => u.role === 'confirmed' || u.role === 'admin' || u.role === 'confirmation')
                      ?.map((u: any) => ({ value: u.id, label: u.name })) || [])
                  ]}
                  className="w-full"
                  onOpen={() => getUsers()}
                  isLoading={usersLoading}
                />
              </div>
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
                  isLoading={storesLoading}
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
                  isLoading={productsLoading}
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
                  isLoading={wilayasLoading}
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
                  className={`px-4 py-2 rounded-lg text-[10px] font-black transition-all border uppercase tracking-widest flex items-center gap-2 flex-shrink-0
                   ${statusFilter === 'all'
                      ? `bg-indigo-600 text-white border-transparent shadow-lg scale-105`
                      : `bg-white text-slate-500 border-transparent hover:bg-slate-50 shadow-sm`}`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full ${statusFilter === 'all' ? 'bg-white' : 'bg-slate-300'}`} />
                  الكل
                </button>
                {trackingStatuses.map((s: any) => {
                  const isActive = statusFilter === s.id;
                  const style = getStatusStyle(s);
                  return (
                    <button
                      key={s.id}
                      onClick={() => setStatusFilter(s.id)}
                      className={`px-4 py-2 rounded-lg text-[10px] font-black transition-all border uppercase tracking-widest flex items-center gap-2 flex-shrink-0
                      ${isActive ? 'brightness-110 shadow-md scale-105 ring-2 ring-offset-2 ring-indigo-50/50' : 'bg-white border-slate-100 text-slate-500 hover:border-slate-200 hover:bg-slate-50'}`}
                      style={!isActive && style ? {
                        backgroundColor: style.backgroundColor, // keep soft bg for tracking
                        color: style.color,
                        borderColor: style.borderColor
                      } : (isActive && style ? {
                        backgroundColor: style.color, // Solid for active in tracking
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

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
        {ordersLoading ? (
          <div className="p-6">
            <TableSkeleton columns={6} rows={8} />
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-right border-collapse min-w-[1100px]">
              <thead>
                <tr className="bg-slate-50/80 text-slate-500 border-b border-slate-100">
                  {(visibleColumns as any).customerInfo && <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em]">العميل</th>}
                  {(visibleColumns as any).locationInfo && <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em]">الموقع (الولاية - البلدية)</th>}
                  {(visibleColumns as any).trackingInfo && <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em]">كود التتبع</th>}
                  {(visibleColumns as any).confirmedBy && <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em]">مؤكد الطلب</th>}
                  {(visibleColumns as any).financials && <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em]">المالية</th>}
                  {(visibleColumns as any).status && <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em]">الحالة</th>}
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em]">تاريخ الطلب</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-center w-[120px]">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((order) => {
                  const statusStyle = getStatusStyle(order.status);
                  const statusName = typeof order.status === 'object' && order.status ? ((order.status as any).nameAR || (order.status as any).nameEN) : order.status;
                  const trackingCode = order.deliveryCompany?.trackingCode || '-';

                  // Row Coloring Logic
                  let hexColor = '#64748b'; // Default
                  if (typeof order.status === 'string') {
                    const hexMap: Record<string, string> = {
                      confirmed: '#4f46e5', delivered: '#10b981', pending: '#64748b', cancelled: '#e11d48',
                      postponed: '#d97706', failed_01: '#ef4444', failed_02: '#ef4444', failed_03: '#ef4444',
                      processing: '#2563eb', out_of_stock: '#ea580c', ramasse: '#8b5cf6', shipped: '#8b5cf6',
                      paid: '#10b981', retour_vendeur: '#9333ea', retourne_vendeur: '#9333ea',
                    };
                    if (hexMap[order.status]) hexColor = hexMap[order.status];
                  } else if (order.status && (order.status as any).color) {
                    hexColor = (order.status as any).color;
                  }

                  return (
                    <tr
                      key={order.id}
                      onClick={() => navigate(`/dashboard/tracking/${order.id}`)}
                      className="group transition-all cursor-pointer border-b border-slate-50 hover:brightness-95"
                      style={{ backgroundColor: `${hexColor}08` }}
                    >

                      {/* Customer Info */}
                      {(visibleColumns as any).customerInfo && <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          {/* Avatar */}
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm shadow-sm shrink-0 uppercase transition-transform group-hover:scale-110 duration-300 ring-2 ring-offset-2 ring-offset-white
                              ${(() => {
                              const name = order.fullName || order.customer || '?';
                              const char = name.charCodeAt(0);
                              const colors = [
                                'bg-indigo-100 text-indigo-600 ring-indigo-50',
                                'bg-emerald-100 text-emerald-600 ring-emerald-50',
                                'bg-rose-100 text-rose-600 ring-rose-50',
                                'bg-amber-100 text-amber-600 ring-amber-50',
                                'bg-violet-100 text-violet-600 ring-violet-50',
                                'bg-cyan-100 text-cyan-600 ring-cyan-50',
                                'bg-pink-100 text-pink-600 ring-pink-50',
                                'bg-slate-100 text-slate-600 ring-slate-50'
                              ];
                              return colors[char % colors.length];
                            })()}
                            `}>
                            <span className="font-black drop-shadow-sm">
                              {(order.fullName || order.customer || '?').charAt(0)}
                            </span>
                          </div>

                          {/* Info */}
                          <div className="flex flex-col gap-1">
                            <p className="text-[14px] font-bold font-black text-slate-800 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                              {order.fullName || order.customer || 'زائر'}
                            </p>
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] font-bold font-mono tracking-tight text-slate-400 dir-ltr`}>
                                {order.phone}
                              </span>
                              {order.duplicatePhone && order.duplicatePhone > 1 && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSearchTerm(order.phone);
                                  }}
                                  className="px-1.5 py-0.5 rounded-md bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center gap-1 hover:bg-indigo-100 transition-colors"
                                  title={`${order.duplicatePhone} طلبات لهذا الرقم`}
                                >
                                  <span className="text-[9px] font-black">{order.duplicatePhone}</span>
                                  <RefreshCw className="w-2.5 h-2.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>}

                      {/* Location Info */}
                      {(visibleColumns as any).locationInfo && <td className="px-6 py-5">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5 ">
                            <MapPin className="w-3 h-3 text-slate-300" />
                            <span className="text-[10px] font-bold text-slate-700">
                              {order.state ? (typeof order.state === 'object' ? (order.state as any).name : order.state) : '-'}
                              {order.city && ` - ${order.city}`}
                            </span>
                          </div>
                        </div>
                      </td>}

                      {/* Tracking Info */}
                      {(visibleColumns as any).trackingInfo && <td className="px-6 py-5 font-black text-indigo-600 text-[11px] font-mono tracking-widest">#{trackingCode}</td>}

                      {/* Confirmed By */}
                      {(visibleColumns as any).confirmedBy && <td className="px-6 py-5">
                        {order.confirmationTimeLine && order.confirmationTimeLine.length > 0 ? (
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
                        )}
                      </td>}

                      {/* Financials */}
                      {(visibleColumns as any).financials && <td className="px-6 py-5">
                        <div className="flex flex-col gap-1.5 items-start">
                          <span className="text-[12px] font-black text-indigo-700 font-mono tracking-tight">{order.totalPrice || order.amount} دج</span>
                          <div className="flex items-center gap-2 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                            {order.deliveryType === 'home' ? <Home className="w-3 h-3 text-indigo-400" /> : <Building2 className="w-3 h-3 text-indigo-400" />}
                            <span className="text-[9px] font-bold text-slate-500">{order.shippingCost || order.deliveryPrice || 0} دج</span>
                          </div>
                        </div>
                      </td>}

                      {/* Status */}
                      {(visibleColumns as any).status && <td className="px-6 py-5">
                        <div className="flex flex-col gap-1 items-start">
                          {order.isAbandoned && (
                            <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 text-[8px] font-black border border-rose-100 flex items-center gap-1">
                              <AlertTriangle className="w-2.5 h-2.5" />
                              متروك
                            </span>
                          )}
                          <span className={`px-3 py-1.5 rounded-md text-[9px] font-black border uppercase tracking-widest flex items-center gap-2`}
                            style={statusStyle ? { backgroundColor: statusStyle.backgroundColor, color: statusStyle.color, borderColor: statusStyle.borderColor } : {}}
                          >
                            {(() => {
                              const statusKey = typeof order.status === 'string' ? order.status : (order.status as any).nameEN?.toLowerCase();
                              let Icon = AlertOctagon;
                              if (statusKey?.includes('pending') || statusKey?.includes('processing')) Icon = RefreshCw;
                              else if (statusKey?.includes('confirm')) Icon = CheckCircle2;
                              else if (statusKey?.includes('deliver')) Icon = Truck;
                              else if (statusKey?.includes('cancel') || statusKey?.includes('fail') || statusKey?.includes('wrong')) Icon = X;
                              else if (statusKey?.includes('postpone')) Icon = Calendar;
                              else if (statusKey?.includes('ramasse') || statusKey?.includes('shipped')) Icon = ShoppingBag;
                              else if (statusKey?.includes('out')) Icon = AlertTriangle;
                              else if (statusKey?.includes('paid')) Icon = DollarSign;
                              else if (statusKey?.includes('return')) Icon = ArrowLeft;

                              if (statusKey === 'pending') Icon = RefreshCw;
                              if (statusKey === 'confirmed') Icon = CheckCircle2;
                              if (statusKey === 'delivered') Icon = CheckSquare;
                              if (statusKey === 'cancelled') Icon = X;
                              if (statusKey === 'postponed') Icon = Calendar;

                              return <Icon className="w-3.5 h-3.5" />;
                            })()}
                            {statusName}
                          </span>
                        </div>
                      </td>}

                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px] font-bold text-slate-700">
                            {order.createdAt ? new Date(order.createdAt).toLocaleDateString('ar') : '-'}
                          </span>
                          <span className="text-[9px] font-bold text-slate-400">
                            {order.createdAt ? new Date(order.createdAt).toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' }) : ''}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-5 text-center">
                        <button onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/tracking/${order.id}`); }} className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-[10px] font-black uppercase group-hover:bg-indigo-600 group-hover:text-white transition-all mx-auto">
                          تتبع <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-slate-400 font-bold">لا توجد شحنات تطابق معايير البحث</td>
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
    </div>
  );
};

export default OrderTrackingView;
