import React, { useState, useEffect, useCallback } from 'react';
import { X, UploadCloud, Plus, Trash2, Package, Tag, Layers, DollarSign, Archive, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { ProductVariantDefinition, ProductVariantProbability, VariantValue, Product } from '../types';
import { Input, TextArea, Toggle, Button } from './UIComponents';
import { useMutation } from '@apollo/client';
import { CREATE_PRODUCT, UPDATE_PRODUCT } from '../graphql/mutations/productMutations';
import { SINGLE_UPLOAD } from '../graphql/mutations/uploadMutations';
import toast from 'react-hot-toast';

interface ProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (product?: any) => void;
    product?: Product; // Added product prop for edit mode
}

interface ProductFormState {
    thumbnail: string;
    name: string;
    sku: string;
    price: number;
    cost: number;
    status: boolean;
    note: string;
    variants: ProductVariantDefinition[];
    variantsProbability: ProductVariantProbability[];

    // IDs (Mocked for UI or passed from context if needed)
    idCompany?: string;
    idDeliveryPrice?: string;
}

const INITIAL_STATE: ProductFormState = {
    thumbnail: '',
    name: '',
    sku: '',
    price: 0,
    cost: 0,
    status: true,
    note: '',
    variants: [],
    variantsProbability: [],
};

const ProductModal: React.FC<ProductModalProps> = ({ isOpen, onClose, onSuccess, product }) => {
    const isEditMode = !!product; // Derive isEditMode
    const [formData, setFormData] = useState<ProductFormState>(INITIAL_STATE);
    const [activeTab, setActiveTab] = useState<'general' | 'variants'>('general');

    // Variant Input State
    const [newVariantName, setNewVariantName] = useState('');
    const [newVariantValueInput, setNewVariantValueInput] = useState('');
    const [currentVariantValues, setCurrentVariantValues] = useState<string[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);

    // Mutations
    const [createProduct, { loading: isCreating }] = useMutation(CREATE_PRODUCT);
    const [updateProduct, { loading: isUpdating }] = useMutation(UPDATE_PRODUCT); // Added update mutation
    const [singleUpload] = useMutation(SINGLE_UPLOAD);

    // Reset or Populate on open
    useEffect(() => {
        if (isOpen) {
            if (product) {
                // Populate form for Edit Mode
                setFormData({
                    thumbnail: product.thumbnail || '',
                    name: product.name || '',
                    sku: product.sku || '',
                    price: product.price || 0,
                    cost: product.cost || 0, // Ensure Product type has cost or cast it
                    status: product.status !== false, // Default to true if undefined
                    note: product.note || '',
                    variants: product.variants || [], // Assuming structure matches or needs mapping
                    variantsProbability: product.variantsProbability || [],
                });
            } else {
                // Reset for Add Mode
                setFormData(INITIAL_STATE);
            }
            setActiveTab('general');
        }
    }, [isOpen, product]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? parseFloat(value) || 0 : value
        }));
    };

    const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const toastId = toast.loading('جاري رفع الصورة...');
        try {
            const result = await singleUpload({
                variables: { file }
            });

            if (result.data?.singleUpload?.url) {
                const fullUrl = `${result.data.singleUpload.url}/${result.data.singleUpload.filename}`;
                setFormData(prev => ({ ...prev, thumbnail: fullUrl }));
                toast.success('تم رفع الصورة بنجاح', { id: toastId });
            } else {
                toast.error('فشل رفع الصورة', { id: toastId });
            }
        } catch (error) {
            console.error(error);
            toast.error('حدث خطأ أثناء رفع الصورة', { id: toastId });
        }
    };

    // --- Variant Logic ---

    const addVariantValue = () => {
        if (!newVariantValueInput.trim()) return;
        if (!currentVariantValues.includes(newVariantValueInput.trim())) {
            setCurrentVariantValues([...currentVariantValues, newVariantValueInput.trim()]);
        }
        setNewVariantValueInput('');
    };

    const removeVariantValue = (val: string) => {
        setCurrentVariantValues(currentVariantValues.filter(v => v !== val));
    };

    const handleAddVariantGroup = () => {
        if (!newVariantName.trim() || currentVariantValues.length === 0) return;

        const newVariant: ProductVariantDefinition = {
            name: newVariantName,
            type: 'select',
            value: currentVariantValues.map(v => ({ name: v, value: v }))
        };

        const updatedVariants = [...formData.variants, newVariant];

        setFormData(prev => ({
            ...prev,
            variants: updatedVariants
        }));

        setNewVariantName('');
        setCurrentVariantValues([]);
        setNewVariantValueInput('');

        generateCombinations(updatedVariants);
    };

    const removeVariantGroup = (index: number) => {
        const updatedVariants = formData.variants.filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, variants: updatedVariants }));
        generateCombinations(updatedVariants);
    };

    const generateCombinations = useCallback((variants: ProductVariantDefinition[]) => {
        setIsGenerating(true);
        if (variants.length === 0) {
            setFormData(prev => ({ ...prev, variantsProbability: [] }));
            setIsGenerating(false);
            return;
        }

        const cartesian = (args: VariantValue[][]): VariantValue[][] => {
            const result: VariantValue[][] = [];
            const max = args.length - 1;
            const helper = (arr: VariantValue[], i: number) => {
                for (let j = 0, l = args[i].length; j < l; j++) {
                    const a = arr.slice(0); // clone arr
                    a.push(args[i][j]);
                    if (i === max) result.push(a);
                    else helper(a, i + 1);
                }
            };
            helper([], 0);
            return result;
        };

        const values = variants.map(v => v.value);
        const combinations = cartesian(values);

        const newProbabilities: ProductVariantProbability[] = combinations.map((combo) => {
            const name = combo.map(c => c.name).join(' / ');
            const existing = formData.variantsProbability.find(p => p.name === name);

            return {
                name: name,
                sku: existing?.sku || `${formData.sku || 'SKU'}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
                price: existing?.price || formData.price,
                cost: existing?.cost || formData.cost,
                quantity: existing?.quantity || 0,
                isDefault: existing?.isDefault || false
            };
        });

        setFormData(prev => ({ ...prev, variantsProbability: newProbabilities }));
        setIsGenerating(false);
    }, [formData.price, formData.cost, formData.sku, formData.variantsProbability]);

    const updateVariantProbability = (index: number, field: keyof ProductVariantProbability, value: any) => {
        const updated = [...formData.variantsProbability];
        updated[index] = { ...updated[index], [field]: value };
        setFormData(prev => ({ ...prev, variantsProbability: updated }));
    };

    const handleSubmit = async () => {
        if (!formData.name) {
            toast.error('يرجى إدخال اسم المنتج');
            return;
        }

        const toastId = toast.loading(isEditMode ? 'جاري تحديث المنتج...' : 'جاري إضافة المنتج...');
        const isLoading = isEditMode ? isUpdating : isCreating;

        try {
            // Map form data to backend input type 'contentProduct'
            const content = {
                thumbnail: formData.thumbnail,
                name: formData.name,
                sku: formData.sku,
                price: formData.price,
                // cost: formData.cost, // Ensure checking if backend accepts this
                status: formData.status,
                note: formData.note,

                variants: formData.variants.map(v => ({
                    name: v.name,
                    type: v.type,
                    value: v.value.map(val => ({ name: val.name, value: val.value }))
                })),

                variantsProbability: formData.variantsProbability.map(vp => ({
                    // For update, we might need _id if it's an existing variant to update it, 
                    // but often full replacement or simplified structure works depending on resolvers.
                    ...(vp._id || vp.id ? { _id: vp._id || vp.id } : {}),
                    name: vp.name,
                    sku: vp.sku,
                    price: vp.price,
                    cost: vp.cost,
                    quantity: vp.quantity,
                })),
            };

            let result;
            if (isEditMode && product?.id) {
                result = await updateProduct({
                    variables: {
                        id: product.id,
                        content: content
                    }
                });
                toast.success('تم تحديث المنتج بنجاح', { id: toastId });
                onSuccess(result.data?.updateProduct?.data);
            } else {
                result = await createProduct({
                    variables: {
                        content: content
                    }
                });
                toast.success('تم إضافة المنتج بنجاح', { id: toastId });
                onSuccess(result.data?.createProduct);
            }

            onClose();

        } catch (error: any) {
            console.error(error);
            toast.error(error.message || (isEditMode ? 'فشل تحديث المنتج' : 'فشل إضافة المنتج'), { id: toastId });
        }
    };

    if (!isOpen) return null;

    const hasVariants = formData.variants.length > 0;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto no-scrollbar dir-rtl" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            {/* Backdrop */}
            <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                <div className="relative transform overflow-hidden rounded-2xl bg-white text-right shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-5xl border border-gray-100 flex flex-col h-[85vh]">

                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white sticky top-0 z-10 shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-indigo-600 rounded-xl text-white shadow-md shadow-indigo-200">
                                <Package size={22} strokeWidth={2.5} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900" id="modal-title">{isEditMode ? 'تعديل بيانات المنتج' : 'إضافة منتج جديد'}</h3>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-red-500 bg-gray-50 hover:bg-red-50 p-2 rounded-full transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="px-6 border-b border-gray-100 bg-white flex gap-6 shrink-0 z-10">
                        <button
                            onClick={() => setActiveTab('general')}
                            className={`py-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${activeTab === 'general' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        >
                            <Layers size={18} />
                            بيانات المنتج
                        </button>
                        <button
                            onClick={() => setActiveTab('variants')}
                            className={`py-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${activeTab === 'variants' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        >
                            <Tag size={18} />
                            الخيارات والمتغيرات
                            {hasVariants && <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-[10px] min-w-[20px] text-center">{formData.variantsProbability.length}</span>}
                        </button>
                    </div>

                    {/* Content Scrollable Area - Hidden Scrollbar */}
                    <div className="px-6 py-6 overflow-y-auto flex-1 bg-white no-scrollbar scroll-smooth">

                        {/* --- TAB: General --- */}
                        {activeTab === 'general' && (
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in zoom-in-95 duration-200">
                                {/* Left Column: Image */}
                                <div className="lg:col-span-4 space-y-6">
                                    <div className="bg-gray-50/50 rounded-2xl border border-dashed border-gray-300 p-6 text-center hover:bg-gray-50 transition-colors">
                                        <label className="block text-sm font-medium text-slate-700 mb-4">صورة المنتج الرئيسية</label>
                                        <div className="relative group w-full aspect-[4/3] rounded-xl overflow-hidden bg-white shadow-sm ring-1 ring-gray-100 flex items-center justify-center">
                                            {formData.thumbnail ? (
                                                <>
                                                    <img src={formData.thumbnail} alt="Preview" className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <button
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                setFormData(prev => ({ ...prev, thumbnail: '' }));
                                                            }}
                                                            className="p-2 bg-red-500 text-white rounded-full hover:scale-110 transition-transform shadow-lg"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="flex flex-col items-center text-gray-400">
                                                    <UploadCloud className="h-12 w-12 mb-3 text-gray-300" />
                                                    <span className="text-sm font-medium text-indigo-600">اضغط للرفع</span>
                                                    <span className="text-xs text-gray-400 mt-1">PNG, JPG حتى 5MB</span>
                                                </div>
                                            )}
                                            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleThumbnailUpload} accept="image/*" />
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex items-center justify-between">
                                        <div className="flex flex-col text-right">
                                            <span className="text-sm font-bold text-slate-900">حالة المنتج</span>
                                            <span className="text-xs text-slate-500">المنتج متاح للبيع في المتجر</span>
                                        </div>
                                        <Toggle checked={formData.status} onChange={(v) => setFormData(prev => ({ ...prev, status: v }))} />
                                    </div>
                                </div>

                                {/* Right Column: Details */}
                                <div className="lg:col-span-8 space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div className="md:col-span-2">
                                            <Input
                                                label="اسم المنتج"
                                                placeholder="مثال: قميص قطني صيفي"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleInputChange}
                                                autoFocus
                                            />
                                        </div>
                                        <Input
                                            label="رمز التخزين (SKU)"
                                            placeholder="PRD-001"
                                            name="sku"
                                            value={formData.sku}
                                            onChange={handleInputChange}
                                            icon={<span className="text-xs font-bold text-gray-500">#</span>}
                                        />

                                        <div className="hidden md:block"></div>

                                        <Input
                                            label="سعر البيع"
                                            type="number"
                                            name="price"
                                            value={formData.price}
                                            onChange={handleInputChange}
                                            icon={<DollarSign size={14} className="text-gray-500" />}
                                            disabled={hasVariants}
                                            className={hasVariants ? "bg-gray-50 text-gray-400" : ""}
                                        />
                                        <Input
                                            label="سعر التكلفة"
                                            type="number"
                                            name="cost"
                                            value={formData.cost}
                                            onChange={handleInputChange}
                                            icon={<Archive size={14} className="text-gray-500" />}
                                            disabled={hasVariants}
                                            className={hasVariants ? "bg-gray-50 text-gray-400" : ""}
                                        />

                                        {hasVariants && (
                                            <div className="md:col-span-2 bg-blue-50 text-blue-700 px-4 py-3 rounded-xl text-sm flex items-center gap-3 border border-blue-100">
                                                <AlertCircle size={18} className="shrink-0" />
                                                <p>يتم إدارة الأسعار من تبويب "الخيارات والمتغيرات" لأن المنتج يحتوي على أنواع متعددة.</p>
                                            </div>
                                        )}

                                        <div className="md:col-span-2">
                                            <TextArea
                                                label="ملاحظات"
                                                rows={4}
                                                name="note"
                                                value={formData.note}
                                                onChange={handleInputChange}
                                                placeholder="اكتب وصفاً مختصراً للمنتج..."
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* --- TAB: Variants --- */}
                        {activeTab === 'variants' && (
                            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">

                                {/* Add New Variant Section */}
                                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                                    <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                                        <div className="p-1.5 bg-gray-100 rounded-md">
                                            <Plus size={16} className="text-gray-600" />
                                        </div>
                                        إضافة نوع متغير
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                                        <div className="md:col-span-3">
                                            <Input
                                                placeholder="الاسم (مثال: اللون)"
                                                value={newVariantName}
                                                onChange={(e) => setNewVariantName(e.target.value)}
                                                className="bg-gray-50 border-gray-200 focus:bg-white"
                                            />
                                        </div>
                                        <div className="md:col-span-7">
                                            <div className="relative">
                                                <input
                                                    className="block w-full rounded-lg border-gray-200 border bg-gray-50 py-2.5 px-3 text-sm focus:border-indigo-500 focus:ring-indigo-500 focus:bg-white transition-all"
                                                    placeholder="القيم (مثال: أحمر) - اضغط Enter للإضافة"
                                                    value={newVariantValueInput}
                                                    onChange={(e) => setNewVariantValueInput(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                            addVariantValue();
                                                        }
                                                    }}
                                                />
                                                <button
                                                    onClick={addVariantValue}
                                                    className="absolute left-2 top-1.5 p-1 bg-gray-200 hover:bg-gray-300 rounded text-gray-600 transition-colors"
                                                >
                                                    <Plus size={16} />
                                                </button>
                                            </div>
                                            {currentVariantValues.length > 0 && (
                                                <div className="flex flex-wrap gap-2 mt-3">
                                                    {currentVariantValues.map((val, idx) => (
                                                        <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                                                            {val}
                                                            <button onClick={() => removeVariantValue(val)} className="hover:text-red-500 transition-colors"><X size={12} /></button>
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <div className="md:col-span-2">
                                            <Button
                                                variant="secondary"
                                                className="w-full justify-center border-gray-200 hover:bg-gray-50"
                                                onClick={handleAddVariantGroup}
                                                disabled={!newVariantName || currentVariantValues.length === 0}
                                            >
                                                إضافة
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                {/* Active Variants List */}
                                {formData.variants.length > 0 && (
                                    <div className="flex flex-wrap gap-3">
                                        {formData.variants.map((variant, idx) => (
                                            <div key={idx} className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg shadow-sm group">
                                                <div>
                                                    <span className="text-xs font-bold text-gray-500 block mb-1">نوع المتغير</span>
                                                    <span className="text-sm font-bold text-slate-800">{variant.name}</span>
                                                </div>
                                                <div className="h-6 w-px bg-gray-200 mx-1"></div>
                                                <div className="flex -space-x-2 space-x-reverse overflow-hidden">
                                                    {(variant.value || []).slice(0, 3).map((v, vIdx) => (
                                                        <span key={vIdx} className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-gray-100 border-2 border-white text-xs text-gray-600 font-medium" title={v.name}>
                                                            {v.name.charAt(0)}
                                                        </span>
                                                    ))}
                                                    {(variant.value?.length || 0) > 3 && (
                                                        <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-gray-50 border-2 border-white text-xs text-gray-500">
                                                            +{(variant.value?.length || 0) - 3}
                                                        </span>
                                                    )}
                                                </div>
                                                <button onClick={() => removeVariantGroup(idx)} className="mr-2 text-gray-300 hover:text-red-500 p-1.5 rounded-full hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Generated Combinations Table - Improved Design */}
                                {formData.variantsProbability.length > 0 && (
                                    <div className="mt-8">
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="text-base font-bold text-slate-800 flex items-center gap-2">
                                                <Archive size={18} className="text-indigo-600" />
                                                قائمة المتغيرات ({formData.variantsProbability.length})
                                            </h4>
                                            {isGenerating && <span className="text-xs text-gray-400 flex items-center gap-1"><RefreshCw size={12} className="animate-spin" /> جاري التحديث...</span>}
                                        </div>

                                        <div className="overflow-hidden border border-gray-200 rounded-xl shadow-sm bg-white">
                                            {/* Container handles scroll but bar is hidden via class */}
                                            <div className="overflow-x-auto max-h-[400px] no-scrollbar">
                                                <table className="min-w-full divide-y divide-gray-100">
                                                    <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                                                        <tr>
                                                            <th scope="col" className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">المتغير</th>
                                                            <th scope="col" className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider w-36">SKU</th>
                                                            <th scope="col" className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider w-28">السعر</th>
                                                            <th scope="col" className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider w-28">التكلفة</th>
                                                            <th scope="col" className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider w-24">الكمية</th>
                                                            <th scope="col" className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider w-16">افتراضي</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-white divide-y divide-gray-50">
                                                        {formData.variantsProbability.map((item, idx) => (
                                                            <tr key={idx} className="hover:bg-blue-50/50 transition-colors group">
                                                                <td className="px-4 py-2.5 text-sm font-semibold text-gray-700 whitespace-nowrap">
                                                                    {item.name}
                                                                </td>
                                                                <td className="px-4 py-1.5">
                                                                    <input
                                                                        type="text"
                                                                        className="w-full text-xs bg-transparent border-transparent rounded px-2 py-1.5 hover:bg-white hover:border-gray-200 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono text-gray-600"
                                                                        value={item.sku}
                                                                        onChange={(e) => updateVariantProbability(idx, 'sku', e.target.value)}
                                                                    />
                                                                </td>
                                                                <td className="px-4 py-1.5">
                                                                    <input
                                                                        type="number"
                                                                        className="w-full text-xs bg-transparent border-transparent rounded px-2 py-1.5 hover:bg-white hover:border-gray-200 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                                                                        value={item.price}
                                                                        onChange={(e) => updateVariantProbability(idx, 'price', parseFloat(e.target.value))}
                                                                    />
                                                                </td>
                                                                <td className="px-4 py-1.5">
                                                                    <input
                                                                        type="number"
                                                                        className="w-full text-xs bg-transparent border-transparent rounded px-2 py-1.5 hover:bg-white hover:border-gray-200 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-gray-500"
                                                                        value={item.cost}
                                                                        onChange={(e) => updateVariantProbability(idx, 'cost', parseFloat(e.target.value))}
                                                                    />
                                                                </td>
                                                                <td className="px-4 py-1.5">
                                                                    <input
                                                                        type="number"
                                                                        className="w-full text-xs bg-transparent border-transparent rounded px-2 py-1.5 hover:bg-white hover:border-gray-200 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium text-gray-900"
                                                                        value={item.quantity}
                                                                        onChange={(e) => updateVariantProbability(idx, 'quantity', parseFloat(e.target.value))}
                                                                    />
                                                                </td>
                                                                <td className="px-4 py-1.5 text-center">
                                                                    <input
                                                                        type="radio"
                                                                        name="defaultVariant"
                                                                        checked={item.isDefault}
                                                                        onChange={() => {
                                                                            const updated = formData.variantsProbability.map((p, i) => ({ ...p, isDefault: i === idx }));
                                                                            setFormData(prev => ({ ...prev, variantsProbability: updated }));
                                                                        }}
                                                                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 cursor-pointer"
                                                                    />
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer / Actions */}
                    <div className="px-6 py-4 bg-white border-t border-gray-100 flex items-center justify-between sticky bottom-0 z-20 shrink-0">
                        <Button variant="secondary" onClick={onClose} className="w-24 text-gray-500 border-gray-200 hover:text-gray-700 hover:bg-gray-50">إلغاء</Button>
                        <div className="flex items-center gap-3">
                            {formData.variantsProbability.length > 0 && (
                                <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full hidden sm:block">
                                    {formData.variantsProbability.reduce((acc, curr) => acc + (curr.quantity || 0), 0)} قطعة في المخزون
                                </span>
                            )}
                            <Button className="min-w-[160px] shadow-lg shadow-indigo-100" onClick={handleSubmit} isLoading={isCreating || isUpdating}>
                                <CheckCircle2 size={18} className="ml-2" />
                                {isEditMode ? 'حفظ التغييرات' : 'حفظ المنتج'}
                            </Button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default ProductModal;
