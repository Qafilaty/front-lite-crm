import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
    ShoppingCart, X, User, MapPinned, Home, Building2, ShoppingBag,
    PlusCircle, ChevronDown, Search, Package, MinusCircle, Trash2,
    Info, DollarSign, ChevronLeft, Loader2
} from 'lucide-react';
import { useMutation, useQuery, useLazyQuery } from '@apollo/client';
import { GET_ALL_WILAYAS } from '../graphql/queries';
import { CREATE_ORDER } from '../graphql/mutations/orderMutations';
import { GET_ALL_DELIVERY_PRICE_COMPANY } from '../graphql/queries/deliveryQueries';
import { GET_ALL_DELIVERY_COMPANIES, GET_DELIVERY_COMPANY_CENTER } from '../graphql/queries/deliveryCompanyQueries';
import { ModernSelect } from './common';
import { GET_ALL_PRODUCTS } from '../graphql/queries/productQueries';
import { useAuth } from '../contexts/AuthContext';
import { Product, Wilaya } from '../types';
import toast from 'react-hot-toast';

interface CreateOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const CreateOrderModal: React.FC<CreateOrderModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const { user } = useAuth();

    // --- States ---
    const [newOrder, setNewOrder] = useState({
        customer: '',
        phone: '',
        state: '', // ID or Name depending on needs, logic below maps it
        stateCode: '',
        city: '', // City
        address: '',
        deliveryType: 'home' as 'home' | "inDesk",
        shippingCost: 0,
        weight: 0,
        notes: '',
        deliveryCompanyId: '',
        deliveryCenterId: ''
    });

    const [cart, setCart] = useState<{
        id: string;
        idVariant?: string;
        name: string;
        variant: string;
        quantity: number;
        price: number;
        sku: string;
    }[]>([]);

    const [isProductPickerOpen, setIsProductPickerOpen] = useState(false);
    const [productSearchQuery, setProductSearchQuery] = useState('');
    const pickerRef = useRef<HTMLDivElement>(null);

    // --- Data Fetching ---

    // 1. Wilayas (Lazy)
    const [getWilayas, { data: wilayasData }] = useLazyQuery(GET_ALL_WILAYAS);
    const wilayas: Wilaya[] = wilayasData?.allWilayas || [];

    // 2. Pricing (Lazy)
    const [getDeliveryPricing, { data: pricingData }] = useLazyQuery(GET_ALL_DELIVERY_PRICE_COMPANY);

    // 3. Products (Lazy)
    // Only fetch when picker opens
    const [getProducts, { data: productsData }] = useLazyQuery(GET_ALL_PRODUCTS, {
        variables: { pagination: { limit: 100, page: 1 } },
        fetchPolicy: 'cache-first'
    });

    // 4. Delivery Companies
    const { data: deliveryCompaniesData } = useQuery(GET_ALL_DELIVERY_COMPANIES);
    const [getCenters, { data: centersData, loading: loadingCenters }] = useLazyQuery(GET_DELIVERY_COMPANY_CENTER);

    // Effect: Fetch centers when state or company changes
    useEffect(() => {
        if (newOrder.stateCode && newOrder.deliveryCompanyId && newOrder.deliveryType === "inDesk") {
            const selectedCompany = deliveryCompaniesData?.allDeliveryCompany?.find((c: any) => c.id === newOrder.deliveryCompanyId);
            if (selectedCompany?.availableDeliveryCompany?.id) {
                getCenters({
                    variables: {
                        stateCode: newOrder.stateCode,
                        idAvailableDeliveryCompany: selectedCompany.availableDeliveryCompany.id
                    }
                });
            }
        }
    }, [newOrder.stateCode, newOrder.deliveryCompanyId, newOrder.deliveryType, deliveryCompaniesData]);

    const products: Product[] = productsData?.allProduct?.data || [];

    // Helper: Find pricing for current state
    const currentPricing = useMemo(() => {
        if (!newOrder.state || !pricingData?.allDeliveryPriceCompany?.data?.[0]?.prices) return null;

        // Try to match by Exact Name, Code, or approximate match
        const prices = pricingData.allDeliveryPriceCompany.data[0].prices;
        const selectedState = wilayas.find(w => w.name === newOrder.state);

        // 1. Try match by Code (Most reliable)
        if (selectedState?.code) {
            const matchByCode = prices.find((p: any) => parseInt(p.code) === parseInt(selectedState.code));
            if (matchByCode) return matchByCode;
        }

        // 2. Try match by Name (Exact)
        const matchByName = prices.find((p: any) => p.name === newOrder.state);
        if (matchByName) return matchByName;

        return null;
    }, [newOrder.state, pricingData, wilayas]);

    // Fetch pricing when modal opens
    useEffect(() => {
        if (isOpen) {
            getDeliveryPricing();
        }
    }, [isOpen]);

    // Auto-update shipping cost when state/type changes
    useEffect(() => {
        if (currentPricing) {
            const price = newOrder.deliveryType === 'home' ? (currentPricing.home || 0) : (currentPricing.desk || 0);
            setNewOrder(prev => ({ ...prev, shippingCost: price }));
        }
    }, [currentPricing, newOrder.deliveryType]);

    // 4. Create Mutation
    const [createOrder, { loading: isSubmitting }] = useMutation(CREATE_ORDER);

    // --- Effects & Logic ---

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const handleClickOutside = (event: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
                setIsProductPickerOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Filter Products
    const filteredAndGroupedProducts = useMemo(() => {
        const result: Record<string, Product[]> = {};
        const query = productSearchQuery.toLowerCase();

        products.forEach(p => {
            if (p.name.toLowerCase().includes(query) || p.sku.toLowerCase().includes(query)) {
                const cat = p.category || 'عام';
                if (!result[cat]) result[cat] = [];
                result[cat].push(p);
            }
        });
        return result;
    }, [products, productSearchQuery]);

    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleAddItemToCart = (product: Product, variant?: any) => {
        const price = variant ? variant.price : (product.variantsProbability?.[0]?.price || product.price);
        const sku = variant ? variant.sku : (product.variantsProbability?.[0]?.sku || product.sku);
        const name = product.name;
        const variantName = variant ? variant.name : (product.variantsProbability?.length ? product.variantsProbability[0].name : "Standard");

        // Check if exists
        const existingIdx = cart.findIndex(i => i.id === product.id && i.variant === variantName);
        if (existingIdx !== -1) {
            const updated = [...cart];
            updated[existingIdx].quantity += 1;
            setCart(updated);
        } else {
            setCart([...cart, {
                id: product.id,
                idVariant: variant?._id || variant?.id,
                name,
                variant: variantName,
                quantity: 1,
                price,
                sku
            }]);
        }
        setIsProductPickerOpen(false);
    };

    const handleBlur = (field: string, value: any) => {
        const newErrors = { ...errors };
        delete newErrors[field];

        if (field === 'customer') {
            if (!value) newErrors.customer = 'يرجى إدخال اسم العميل';
        }
        else if (field === 'phone') {
            if (!value) newErrors.phone = 'يرجى إدخال رقم الهاتف';
            else if (!/^(0)(5|6|7)[0-9]{8}$/.test(value.replace(/\s/g, ''))) newErrors.phone = 'يرجى إدخال رقم هاتف صحيح (10 أرقام)';
        }
        else if (field === 'shippingCost') {
            if ((Number(value) || 0) < 0) newErrors.shippingCost = 'لا يمكن أن يكون سعر التوصيل أقل من 0';
        }

        setErrors(newErrors);
    };

    const handleConfirmOrder = async () => {
        const newErrors: Record<string, string> = {};

        if (!newOrder.customer) newErrors.customer = 'يرجى إدخال اسم العميل';
        if (!newOrder.phone) newErrors.phone = 'يرجى إدخال رقم الهاتف';
        if (!newOrder.state) newErrors.state = 'يرجى اختيار الولاية';

        // Phone Validation (Algerian Format: 05/06/07 + 8 digits = 10 digits total)
        const phoneRegex = /^(0)(5|6|7)[0-9]{8}$/;
        if (newOrder.phone && !phoneRegex.test(newOrder.phone.replace(/\s/g, ''))) {
            newErrors.phone = 'يرجى إدخال رقم هاتف صحيح (10 أرقام)';
        }

        if (cart.length === 0) {
            toast.error('يرجى إضافة منتج واحد على الأقل');
            return;
        }

        if ((newOrder.shippingCost || 0) < 0) {
            newErrors.shippingCost = 'لا يمكن أن يكون سعر التوصيل أقل من 0';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            toast.error('يرجى التحقق من الحقول');
            return;
        }

        setErrors({});

        const totalQuantity = cart.reduce((acc, item) => acc + item.quantity, 0);
        const subTotalPrice = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        const totalPrice = subTotalPrice + (newOrder.shippingCost || 0);

        // Find selected state object
        const selectedWilaya = wilayas.find(w => w.name === newOrder.state);

        try {
            await createOrder({
                variables: {
                    content: {
                        fullName: newOrder.customer,
                        phone: newOrder.phone,

                        state: {
                            idState: selectedWilaya?.id,
                            name: selectedWilaya?.name,
                            code: selectedWilaya?.code
                        },
                        city: newOrder.city,
                        address: newOrder.address,

                        idDeliveryCompanyCenter: newOrder.deliveryCenterId || undefined,
                        deliveryCompany: newOrder.deliveryCompanyId ? { idDeliveryCompany: newOrder.deliveryCompanyId } : undefined,

                        deliveryType: newOrder.deliveryType,
                        deliveryPrice: newOrder.shippingCost,
                        weight: newOrder.weight,
                        note: newOrder.notes,

                        totalPrice,
                        subTotalPrice,
                        totalQuantity,

                        products: cart.map(item => ({
                            idProduct: item.id,
                            idVariantsProduct: item.idVariant || null,
                            name: item.name,
                            sku: item.sku || "",
                            price: item.price,
                            quantity: item.quantity
                        })),

                        // Basic defaults required by schema
                        isAbandoned: false,
                        replaced: false
                    }
                }
            });

            toast.success('تم إنشاء الطلبية بنجاح');
            onSuccess();
            onClose();
            // Reset form
            setNewOrder({
                customer: '', phone: '', state: '', stateCode: '', city: '',
                address: '', deliveryType: 'home', shippingCost: 0, weight: 0, notes: '',
                deliveryCompanyId: '', deliveryCenterId: ''
            });
            setCart([]);
            setErrors({});

        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'فشل إنشاء الطلبية');
        }
    };

    const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0) + (newOrder.shippingCost || 0);
    const selectedWilaya = wilayas.find(w => w.name === newOrder.state);

    // Ensure we don't render until client-side (mounted) to access document.body safely
    if (!isOpen || !mounted) return null;

    return createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-300" dir="rtl">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[90vh] border border-slate-200">

                {/* Header */}
                <div className="px-6 py-5 border-b border-slate-200 flex justify-between items-center bg-white shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md">
                            <ShoppingCart className="w-6 h-6" />
                        </div>
                        <div>
                            <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">إنشاء طلبية</h4>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-0.5">أدخل البيانات اللوجستية بدقة</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-rose-500 transition-all p-2 rounded-lg hover:bg-rose-50">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Scrollable Form Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">

                    {/* 1. Customer Info */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-1">
                            <User className="w-4 h-4 text-indigo-500" />
                            <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">بيانات العميل</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">الاسم الكامل</label>
                                <input
                                    placeholder="أحمد الجزائري..."
                                    value={newOrder.customer}
                                    onChange={e => {
                                        setNewOrder({ ...newOrder, customer: e.target.value });
                                        if (errors.customer) setErrors({ ...errors, customer: '' });
                                    }}
                                    onBlur={(e) => handleBlur('customer', e.target.value)}
                                    className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-xs font-bold transition-all ${errors.customer ? 'border-red-500 focus:border-red-500 bg-red-50' : 'border-slate-200 focus:bg-white focus:border-indigo-500'}`}
                                />
                                {errors.customer && <p className="text-red-500 text-[9px] font-bold px-1">{errors.customer}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">رقم الهاتف</label>
                                <input
                                    placeholder="05 / 06 / 07..."
                                    value={newOrder.phone}
                                    onChange={e => {
                                        setNewOrder({ ...newOrder, phone: e.target.value });
                                        if (errors.phone) setErrors({ ...errors, phone: '' });
                                    }}
                                    onBlur={(e) => handleBlur('phone', e.target.value)}
                                    className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-xs font-bold transition-all ${errors.phone ? 'border-red-500 focus:border-red-500 bg-red-50' : 'border-slate-200 focus:bg-white focus:border-indigo-500'}`}
                                />
                                {errors.phone && <p className="text-red-500 text-[9px] font-bold px-1">{errors.phone}</p>}
                            </div>
                        </div>
                    </div>

                    {/* 2. Location Info */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-1">
                            <MapPinned className="w-4 h-4 text-indigo-500" />
                            <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">العنوان والشحن</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">الولاية</label>
                                <ModernSelect
                                    value={newOrder.state}
                                    onChange={(val) => {
                                        const w = wilayas.find(w => w.name === val);
                                        setNewOrder({ ...newOrder, state: val, stateCode: w?.code || '', city: '' });
                                    }}
                                    options={[
                                        { value: '', label: 'اختر الولاية...' },
                                        ...wilayas.map(w => ({ value: w.name, label: `${w.code} - ${w.name}` }))
                                    ]}
                                    placeholder="اختر الولاية..."
                                    onOpen={() => getWilayas()}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">البلدية</label>
                                <ModernSelect
                                    disabled={!newOrder.state}
                                    value={newOrder.city}
                                    onChange={(val) => setNewOrder({ ...newOrder, city: val })}
                                    options={[
                                        { value: '', label: 'اختر البلدية...' },
                                        ...(selectedWilaya?.communes?.map(c => ({ value: c.name, label: c.name })) || [])
                                    ]}
                                    placeholder="اختر البلدية..."
                                />
                            </div>
                            <div className="col-span-full space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">العنوان التفصيلي</label>
                                <textarea placeholder="اسم الشارع، رقم البيت..." value={newOrder.address} onChange={e => setNewOrder({ ...newOrder, address: e.target.value })} className="w-full h-20 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white outline-none transition-all resize-none" />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setNewOrder({ ...newOrder, deliveryType: 'home' })}
                                className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 rounded-xl border-2 transition-all ${newOrder.deliveryType === 'home' ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200'}`}
                            >
                                <div className="flex items-center gap-2">
                                    <Home className="w-4 h-4" /> <span className="text-[10px] uppercase font-black">للمنزل</span>
                                </div>
                                {currentPricing && (
                                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{currentPricing?.home || 0} دج</span>
                                )}
                            </button>
                            <button
                                onClick={() => setNewOrder({ ...newOrder, deliveryType: "inDesk" })}
                                className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 rounded-xl border-2 transition-all ${newOrder.deliveryType === "inDesk" ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200'}`}
                            >
                                <div className="flex items-center gap-2">
                                    <Building2 className="w-4 h-4" /> <span className="text-[10px] uppercase font-black">للمكتب</span>
                                </div>
                                {currentPricing && (
                                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{currentPricing?.desk || 0} دج</span>
                                )}
                            </button>
                        </div>

                        {newOrder.deliveryType === "inDesk" && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in slide-in-from-top-2">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">شركة التوصيل</label>
                                    <ModernSelect
                                        value={newOrder.deliveryCompanyId}
                                        onChange={(val) => setNewOrder({ ...newOrder, deliveryCompanyId: val, deliveryCenterId: '' })}
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
                                        disabled={!newOrder.deliveryCompanyId || loadingCenters}
                                        value={newOrder.deliveryCenterId}
                                        onChange={(val) => setNewOrder({ ...newOrder, deliveryCenterId: val })}
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

                    {/* 3. Product Picker */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-1">
                            <ShoppingBag className="w-4 h-4 text-indigo-500" />
                            <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">المنتجات</span>
                        </div>

                        <div className="relative" ref={pickerRef}>
                            <button
                                onClick={() => {
                                    if (!isProductPickerOpen) {
                                        getProducts();
                                    }
                                    setIsProductPickerOpen(!isProductPickerOpen);
                                }}
                                className="w-full px-5 py-4 bg-slate-900 text-white rounded-xl font-bold text-[11px] uppercase flex items-center justify-between hover:bg-slate-800 transition-all shadow-lg active:scale-[0.98]"
                            >
                                <div className="flex items-center gap-3">
                                    <PlusCircle className="w-4 h-4 text-indigo-400" />
                                    <span>{cart.length > 0 ? `تم اختيار (${cart.length}) منتجات` : 'اختر المنتج من القائمة'}</span>
                                </div>
                                <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isProductPickerOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isProductPickerOpen && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 overflow-hidden animate-in slide-in-from-top-2 flex flex-col border-indigo-100 max-h-60">
                                    <div className="p-3 border-b border-slate-100 bg-slate-50 flex items-center gap-2 sticky top-0">
                                        <Search className="w-4 h-4 text-slate-400" />
                                        <input
                                            autoFocus
                                            placeholder="بحث سريع في المخزون..."
                                            value={productSearchQuery}
                                            onChange={e => setProductSearchQuery(e.target.value)}
                                            className="flex-1 bg-transparent text-[11px] font-bold outline-none"
                                        />
                                    </div>

                                    <div className="overflow-y-auto no-scrollbar">
                                        {Object.entries(filteredAndGroupedProducts).map(([cat, categoryProducts]: [string, Product[]]) => (
                                            <div key={cat}>
                                                <div className="px-4 py-2 bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">{cat}</div>
                                                {categoryProducts.map(p => (
                                                    <div key={p.id} className="p-1">
                                                        {p.variantsProbability && p.variantsProbability.length > 0 ? p.variantsProbability.map((v: any) => (
                                                            <button key={v.id || v._id} onClick={() => handleAddItemToCart(p, v)} className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-indigo-50 transition-colors group">
                                                                <div className="text-right">
                                                                    <p className="text-[11px] font-bold text-slate-700 leading-none">{p.name}</p>
                                                                    <p className="text-[9px] text-slate-400 mt-1 uppercase">{v.name}</p>
                                                                </div>
                                                                <span className="text-[10px] font-black text-indigo-600">+{v.price}دج</span>
                                                            </button>
                                                        )) : (
                                                            <button onClick={() => handleAddItemToCart(p)} className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-indigo-50 transition-colors group">
                                                                <span className="text-[11px] font-bold text-slate-700">{p.name}</span>
                                                                <span className="text-[10px] font-black text-indigo-600">+{p.price}دج</span>
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        ))}
                                        {Object.keys(filteredAndGroupedProducts).length === 0 && (
                                            <div className="p-8 text-center text-slate-300 text-[10px] font-bold uppercase tracking-widest">لا توجد منتجات مطابقة</div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Cart Items */}
                        <div className="space-y-2">
                            {cart.map((item, idx) => (
                                <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between group animate-in slide-in-from-left-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-indigo-600"><Package className="w-4 h-4" /></div>
                                        <div>
                                            <p className="text-[11px] font-black text-slate-800 leading-none">{item.name}</p>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase mt-1 tracking-tighter">{item.variant}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2 bg-white rounded-lg p-1 border border-slate-200">
                                            <button onClick={() => { const u = [...cart]; u[idx].quantity = Math.max(1, u[idx].quantity - 1); setCart(u); }} className="p-1 text-slate-300 hover:text-rose-500"><MinusCircle className="w-4 h-4" /></button>
                                            <span className="w-6 text-center text-[11px] font-black text-slate-800">{item.quantity}</span>
                                            <button onClick={() => { const u = [...cart]; u[idx].quantity += 1; setCart(u); }} className="p-1 text-slate-300 hover:text-indigo-600"><PlusCircle className="w-4 h-4" /></button>
                                        </div>
                                        <button onClick={() => setCart(cart.filter((_, i) => i !== idx))} className="text-slate-300 hover:text-rose-500 p-1"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 4. Extra Info */}
                    <div className="space-y-4 pb-4">
                        <div className="flex items-center gap-2 mb-1">
                            <Info className="w-4 h-4 text-indigo-500" />
                            <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">التكاليف والملاحظات</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">سعر التوصيل</label>
                                <div className="relative">
                                    <DollarSign className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                    <input
                                        type="number"
                                        value={newOrder.shippingCost}
                                        onChange={e => {
                                            setNewOrder({ ...newOrder, shippingCost: Number(e.target.value) });
                                            if (errors.shippingCost) setErrors({ ...errors, shippingCost: '' });
                                        }}
                                        onBlur={(e) => handleBlur('shippingCost', e.target.value)}
                                        className={`w-full pr-10 pl-4 py-3 bg-slate-50 border rounded-xl text-xs font-black text-indigo-600 transition-all ${errors.shippingCost ? 'border-red-500 focus:border-red-500 bg-red-50' : 'border-slate-200 focus:bg-white focus:border-indigo-400'}`}
                                    />
                                </div>
                                {errors.shippingCost && <p className="text-red-500 text-[9px] font-bold px-1">{errors.shippingCost}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">الوزن (كلغ)</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.1"
                                        value={newOrder.weight || ''}
                                        onChange={e => setNewOrder({ ...newOrder, weight: parseFloat(e.target.value) || 0 })}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-700 focus:bg-white focus:border-indigo-400 transition-all outline-none"
                                        placeholder="0.0"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">ملاحظات (اختياري)</label>
                                <input value={newOrder.notes} onChange={e => setNewOrder({ ...newOrder, notes: e.target.value })} placeholder="تعليمات التوصيل..." className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:bg-white focus:border-indigo-400 transition-all" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="p-6 border-t border-slate-200 bg-white shrink-0 shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.05)]">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                        <div>
                            <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">إجمالي المبلغ المطلوب</p>
                            <p className="text-2xl font-black text-slate-800 font-mono tracking-tighter">{total} <span className="text-[10px] opacity-40">دج</span></p>
                        </div>
                        <button disabled={isSubmitting} onClick={handleConfirmOrder} className="w-full sm:w-auto px-10 py-4 bg-indigo-600 text-white rounded-xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-70 disabled:scale-100">
                            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <>تأكيد إنشاء الطلبية <ChevronLeft className="w-5 h-5" /></>}
                        </button>
                    </div>
                </div>
            </div>
        </div >,
        document.body
    );
};

export default CreateOrderModal;
