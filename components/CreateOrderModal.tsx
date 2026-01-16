import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    ShoppingCart, X, User, MapPinned, Home, Building2, ShoppingBag,
    PlusCircle, ChevronDown, Search, Package, MinusCircle, Trash2,
    Info, DollarSign, ChevronLeft, Loader2
} from 'lucide-react';
import { useMutation, useQuery } from '@apollo/client';
import { GET_ALL_WILAYAS } from '../graphql/queries';
import { CREATE_ORDER } from '../graphql/mutations/orderMutations';
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
        municipality: '', // City
        address: '',
        deliveryType: 'home' as 'home' | 'office',
        shippingCost: 0,
        notes: ''
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

    // 1. Wilayas
    const { data: wilayasData } = useQuery(GET_ALL_WILAYAS);
    const wilayas: Wilaya[] = wilayasData?.allWilayas || [];

    // 2. Products (Ideally fetch on demand or pre-load lightly)
    const { data: productsData } = useQuery(GET_ALL_PRODUCTS, {
        variables: { idCompany: user?.company?.id, pagination: { limit: 100, page: 1 } },
        skip: !user?.company?.id
    });

    const products: Product[] = productsData?.allProduct?.data || [];

    // 3. Create Mutation
    const [createOrder, { loading: isSubmitting }] = useMutation(CREATE_ORDER);

    // --- Effects & Logic ---

    useEffect(() => {
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

    const handleConfirmOrder = async () => {
        if (!newOrder.customer || !newOrder.phone || !newOrder.state) {
            toast.error('يرجى ملء جميع الحقول المطلوبة (الاسم، الهاتف، الولاية)');
            return;
        }

        if (cart.length === 0) {
            toast.error('يرجى إضافة منتج واحد على الأقل');
            return;
        }

        const totalQuantity = cart.reduce((acc, item) => acc + item.quantity, 0);
        const subTotalPrice = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        const totalPrice = subTotalPrice + (newOrder.shippingCost || 0);

        // Find selected state object
        const selectedWilaya = wilayas.find(w => w.name === newOrder.state);

        try {
            await createOrder({
                variables: {
                    content: {
                        idCompany: user?.company?.id,
                        fullName: newOrder.customer,
                        phone: newOrder.phone,

                        state: {
                            idState: selectedWilaya?.id,
                            name: selectedWilaya?.name,
                            code: selectedWilaya?.code
                        },
                        city: newOrder.municipality,
                        address: newOrder.address,

                        deliveryType: newOrder.deliveryType, // 'home' or 'office'
                        deliveryPrice: newOrder.shippingCost,

                        note: newOrder.notes,
                        status: 'pending', // Default status

                        totalPrice,
                        subTotalPrice,
                        totalQuantity,

                        products: cart.map(item => ({
                            idProduct: item.id,
                            idVariantsProduct: item.idVariant,
                            name: item.name,
                            sku: item.sku,
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
                customer: '', phone: '', state: '', stateCode: '', municipality: '',
                address: '', deliveryType: 'home', shippingCost: 0, notes: ''
            });
            setCart([]);

        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'فشل إنشاء الطلبية');
        }
    };

    const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0) + (newOrder.shippingCost || 0);
    const selectedWilaya = wilayas.find(w => w.name === newOrder.state);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[300] flex items-center justify-center p-4 animate-in fade-in duration-300" dir="rtl">
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
                                    onChange={e => setNewOrder({ ...newOrder, customer: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">رقم الهاتف</label>
                                <input
                                    placeholder="05 / 06 / 07..."
                                    value={newOrder.phone}
                                    onChange={e => setNewOrder({ ...newOrder, phone: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all"
                                />
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
                                <select
                                    value={newOrder.state}
                                    onChange={e => setNewOrder({ ...newOrder, state: e.target.value, municipality: '' })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white outline-none transition-all"
                                >
                                    <option value="">اختر الولاية...</option>
                                    {wilayas.map(w => <option key={w.id} value={w.name}>{w.code} - {w.name}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">البلدية</label>
                                <select
                                    disabled={!newOrder.state}
                                    value={newOrder.municipality}
                                    onChange={e => setNewOrder({ ...newOrder, municipality: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white outline-none transition-all disabled:opacity-50"
                                >
                                    <option value="">اختر البلدية...</option>
                                    {selectedWilaya?.communes?.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                </select>
                            </div>
                            <div className="col-span-full space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">العنوان التفصيلي</label>
                                <textarea placeholder="اسم الشارع، رقم البيت..." value={newOrder.address} onChange={e => setNewOrder({ ...newOrder, address: e.target.value })} className="w-full h-20 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white outline-none transition-all resize-none" />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => setNewOrder({ ...newOrder, deliveryType: 'home' })} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all ${newOrder.deliveryType === 'home' ? 'border-indigo-600 bg-indigo-50 text-indigo-600 font-black' : 'border-slate-100 bg-slate-50 text-slate-400 font-bold hover:border-slate-200'}`}>
                                <Home className="w-4 h-4" /> <span className="text-[10px] uppercase">للمنزل</span>
                            </button>
                            <button onClick={() => setNewOrder({ ...newOrder, deliveryType: 'office' })} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all ${newOrder.deliveryType === 'office' ? 'border-indigo-600 bg-indigo-50 text-indigo-600 font-black' : 'border-slate-100 bg-slate-50 text-slate-400 font-bold hover:border-slate-200'}`}>
                                <Building2 className="w-4 h-4" /> <span className="text-[10px] uppercase">للمكتب</span>
                            </button>
                        </div>
                    </div>

                    {/* 3. Product Picker */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-1">
                            <ShoppingBag className="w-4 h-4 text-indigo-500" />
                            <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">المنتجات</span>
                        </div>

                        <div className="relative" ref={pickerRef}>
                            <button
                                onClick={() => setIsProductPickerOpen(!isProductPickerOpen)}
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
                                    <input type="number" value={newOrder.shippingCost} onChange={e => setNewOrder({ ...newOrder, shippingCost: Number(e.target.value) })} className="w-full pr-10 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-indigo-600 focus:bg-white focus:border-indigo-400 outline-none transition-all" />
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
        </div>
    );
};

export default CreateOrderModal;
