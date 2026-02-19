import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Order } from '../types';
import {
    Search, Filter, Eye, ChevronLeft, ChevronRight, LayoutList, MapPin, AlertTriangle, Home, Building2, User, UserCheck,
    AlertOctagon, RefreshCw, CheckCircle2, Truck, X, Calendar, ShoppingBag, DollarSign, ArrowLeft, CheckSquare
} from 'lucide-react';
import TableSkeleton from './common/TableSkeleton';
import { useQuery, useLazyQuery } from '@apollo/client';
import { GET_ALL_ABANDONED_ORDERS } from '../graphql/queries/orderQueries';
import { GET_ALL_WILAYAS } from '../graphql/queries/wilayasQueries';
import { GET_ALL_STORES } from '../graphql/queries/storeQueries';
import { GET_ALL_PRODUCTS } from '../graphql/queries/productQueries';
import { ModernSelect, PaginationControl } from './common';
import { statusLabels, statusColors } from '../constants/statusConstants';
import { GET_ALL_STATUS_COMPANY } from '../graphql/queries/companyQueries';
import { GET_ALL_USERS } from '../graphql/queries';

interface OrderAbandonedViewProps {
    orders?: Order[];
}

const OrderAbandonedView: React.FC<OrderAbandonedViewProps> = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState<Order[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all'); // Add Status Filter

    // Scroll refs
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
        const walk = (x - startX) * 2;
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

    // --- Dynamic Columns State ---
    // ... (keep existing column state)
    const [visibleColumns, setVisibleColumns] = useState(() => {
        try {
            const saved = localStorage.getItem('abandonedTableColumns_v1');
            return {
                customerInfo: true,
                locationInfo: true,
                dateInfo: true,
                confirmerInfo: true,
                financials: true,
                status: true,
                actions: true
            };
        } catch {
            return { customerInfo: true, locationInfo: true, dateInfo: true, confirmerInfo: true, financials: true, status: true, actions: true };
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
        localStorage.setItem('abandonedTableColumns_v1', JSON.stringify(newCols));
    };

    // Filters
    const [productFilter, setProductFilter] = useState('all');
    const [stateFilter, setStateFilter] = useState('all');
    const [confirmerFilter, setConfirmerFilter] = useState('all');

    const [currentPage, setCurrentPage] = useState(1);
    const [isFiltersOpen, setIsFiltersOpen] = useState(false);
    const [itemsPerPage, setItemsPerPage] = useState(20);

    // 1. Fetch Company Statuses
    const { data: statusData } = useQuery(GET_ALL_STATUS_COMPANY);

    const confirmationStatuses = useMemo(() => {
        if (!statusData?.allStatusCompany) return [];
        const group = statusData.allStatusCompany.find((g: any) =>
            g.group === 'Confirmation Group' ||
            g.group?.toLowerCase().trim() === 'confirmation group' ||
            g.group?.toLowerCase().includes('confirmation')
        );
        return group?.listStatus || [];
    }, [statusData]);

    const getStatusStyle = (s: any) => {
        if (typeof s === 'object' && s !== null && s.color) {
            return {
                backgroundColor: `${s.color}15`,
                color: s.color,
                borderColor: `${s.color}30`
            };
        }
        return null; // Let logic in render handle default
    };


    // 2. Fetch Stores & Wilayas (Lazy Load)
    const [getWilayas, { data: wilayasData, loading: wilayasLoading }] = useLazyQuery(GET_ALL_WILAYAS);
    const [getProducts, { data: productsData, loading: productsLoading }] = useLazyQuery(GET_ALL_PRODUCTS, {
        variables: { pagination: { limit: 100, page: 1 } }
    });
    const [getUsers, { data: usersData, loading: usersLoading }] = useLazyQuery(GET_ALL_USERS);

    // 3. Construct Advanced Filter
    const advancedFilter = useMemo(() => {
        const filter: any = {};

        // Status Filter
        if (statusFilter !== 'all') {
            filter.status = statusFilter;
        } else if (confirmationStatuses.length > 0) {
            // When 'all' is selected, we want to fetch orders with ANY of the statuses in the group
            // This overrides the backend default which might only return strict 'abandoned'
            filter.status = { $in: confirmationStatuses.map((s: any) => s.id) };
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
                { numberOrder: regex }
            ];
        }

        return filter;
    }, [statusFilter, productFilter, stateFilter, searchTerm]);

    // 4. Fetch Orders (Using Abandoned Query)
    const { data: ordersData, loading: ordersLoading } = useQuery(GET_ALL_ABANDONED_ORDERS, {
        variables: {
            pagination: { page: currentPage, limit: itemsPerPage },
            advancedFilter: Object.keys(advancedFilter).length > 0 ? advancedFilter : undefined
        },
        fetchPolicy: 'network-only'
    });

    useEffect(() => {
        if (ordersData?.allAbandonedOrder?.data) {
            setOrders(ordersData.allAbandonedOrder.data);
        }
    }, [ordersData]);

    const totalPages = ordersData?.allAbandonedOrder?.total ? Math.ceil(ordersData.allAbandonedOrder.total / itemsPerPage) : 0;
    const totalItems = ordersData?.allAbandonedOrder?.total || 0;

    // Helpers
    const getStatusLabel = (s: any): string => {
        if (typeof s === 'object' && s !== null) return s.nameAR || s.nameEN || 'غير محدد';
        return statusLabels[s] || s || 'غير محدد';
    };

    return (
        <div className="space-y-6 pb-20 animate-in fade-in duration-500">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div className="animate-in slide-in-from-right duration-500">
                    <h2 className="text-xl font-black text-slate-800 tracking-tight">الطلبات المتروكة</h2>
                    <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest mt-1">متابعة الطلبات غير المكتملة</p>
                </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm transition-all duration-300 animate-in slide-in-from-top-4">
                <div className="flex flex-col gap-4">
                    {/* Top Row: Search + Filter Toggle + Columns */}
                    <div className="flex items-center gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-300" />
                            <input
                                type="text"
                                placeholder="بحث سريع... (الاسم، الهاتف، المبلغ)"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pr-11 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all text-slate-600 placeholder:text-slate-400"
                            />
                        </div>

                        {/* Filter Toggle */}
                        <button
                            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                            className={`p-3 rounded-xl border transition-all flex items-center gap-2 group ${isFiltersOpen ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-200 hover:text-indigo-600'}`}
                        >
                            <Filter className={`w-4 h-4 transition-transform duration-300 ${isFiltersOpen ? 'rotate-180' : ''}`} />
                            <span className="hidden sm:inline text-[10px] font-black uppercase tracking-wider">تصفية</span>
                            {(stateFilter !== 'all' || productFilter !== 'all') && (
                                <span className="flex items-center justify-center w-4 h-4 bg-indigo-600 text-white text-[8px] font-bold rounded-full">
                                    {[stateFilter, productFilter].filter(f => f !== 'all').length}
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
                                                dateInfo: 'التاريخ',
                                                confirmerInfo: 'مؤكد الطلب',
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

                    {/* Status Tabs - Scrollable Area (Added) */}
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
                                            className={`px-4 py-2 rounded-lg text-[10px] font-black transition-all border uppercase tracking-widest flex items-center gap-2 flex-shrink-0
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

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
                {ordersLoading ? (
                    <div className="p-6">
                        <div className="p-6">
                            <TableSkeleton columns={7} rows={8} />
                        </div>
                    </div>
                ) : (
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-right border-collapse min-w-[1100px]">
                            <thead>
                                <tr className="bg-slate-50/80 text-slate-500 border-b border-slate-100">
                                    {(visibleColumns as any).customerInfo && <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em]">العميل</th>}
                                    {(visibleColumns as any).locationInfo && <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em]">الموقع (الولاية - البلدية)</th>}
                                    {(visibleColumns as any).dateInfo && <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em]">تاريخ الطلب</th>}
                                    {(visibleColumns as any).confirmerInfo && <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em]">مؤكد الطلب</th>}
                                    {(visibleColumns as any).financials && <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em]">المالية</th>}
                                    {(visibleColumns as any).status && <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em]">الحالة</th>}
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-center w-[120px]">الإجراء</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {orders.map((order) => {
                                    const statusStyle = getStatusStyle(order.status);
                                    const statusLabel = getStatusLabel(order.status);
                                    const fallbackColors = typeof order.status === 'string'
                                        ? (statusColors[order.status] || statusColors.default)
                                        : statusColors.default;

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
                                            onClick={() => navigate(`/dashboard/orders/${order.id}`)}
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

                                                    <div className="flex flex-col gap-1">
                                                        <p className="text-[14px] font-bold font-black text-slate-800 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                                                            {order.fullName || order.customer || 'زائر'}
                                                        </p>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[10px] font-bold font-mono tracking-tight text-slate-400 dir-ltr">
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
                                                    {order.address && (
                                                        <p className="text-[9px] text-slate-400 font-bold pr-5 truncate max-w-[150px]" title={order.address}>
                                                            {order.address}
                                                        </p>
                                                    )}
                                                </div>
                                            </td>}

                                            {/* Date Info */}
                                            {(visibleColumns as any).dateInfo && <td className="px-6 py-5">
                                                <div className="text-[11px] font-bold text-slate-600">
                                                    {new Date(order.createdAt).toLocaleDateString('ar-DZ')}
                                                </div>
                                                <div className="text-[9px] font-bold text-slate-400">
                                                    {new Date(order.createdAt).toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </td>}

                                            {/* Confirmer Info */}
                                            {(visibleColumns as any).confirmerInfo && <td className="px-6 py-5">
                                                {order.confirmed ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-[9px] font-black">
                                                            {order.confirmed.name.charAt(0)}
                                                        </div>
                                                        <span className="text-[10px] font-bold text-slate-700">{order.confirmed.name}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-[10px] font-bold text-slate-300">-</span>
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
                                                    <span
                                                        className={`px-3 py-1.5 rounded-md text-[9px] font-black border uppercase tracking-widest flex items-center gap-2 ${!statusStyle ? `${fallbackColors.bg} ${fallbackColors.text} ${fallbackColors.border}` : ''}`}
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
                                                        {statusLabel}
                                                    </span>
                                                </div>
                                            </td>}

                                            {/* Actions */}
                                            <td className="px-6 py-5 text-center">
                                                <button onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/orders/${order.id}`); }} className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-[10px] font-black uppercase group-hover:bg-indigo-600 group-hover:text-white transition-all mx-auto">
                                                    مراجعة <Eye className="w-3.5 h-3.5" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {orders.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="text-center py-10 text-slate-400 font-bold">لا توجد طلبات متروكة حالياً</td>
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
                    totalItems={totalItems}
                    isLoading={ordersLoading}
                />
            </div>
        </div>
    );
};

export default OrderAbandonedView;
