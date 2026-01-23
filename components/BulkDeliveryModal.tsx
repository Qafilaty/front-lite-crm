import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Order, DeliveryCompany } from '../types';
import { Truck, X, Trash2, CheckCircle2, AlertCircle, Loader2, Copy } from 'lucide-react';
import { deliveryCompanyService } from '../services/apiService';
import toast from 'react-hot-toast';
import { ModernSelect } from './common';

interface BulkDeliveryModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedOrders: Order[];
    onRemoveOrder: (orderId: string) => void;
    onSuccess: () => void; // Callback to refresh parent list
}

export const BulkDeliveryModal: React.FC<BulkDeliveryModalProps> = ({
    isOpen, onClose, selectedOrders, onRemoveOrder, onSuccess
}) => {
    const [step, setStep] = useState<'review' | 'select_company' | 'processing' | 'results'>('review');
    const [deliveryCompanies, setDeliveryCompanies] = useState<DeliveryCompany[]>([]);
    const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
    const [loadingCompanies, setLoadingCompanies] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Results state
    const [results, setResults] = useState<{
        success: { orderId: string; trackingCode: string }[];
        failed: { orderId: string; error?: string }[];
    } | null>(null);

    // Reset state on open
    useEffect(() => {
        if (isOpen) {
            setStep('review');
            setResults(null);
            setSelectedCompanyId('');
            // Fetch companies if needed, or pre-fetch
            const fetchCompanies = async () => {
                setLoadingCompanies(true);
                const res = await deliveryCompanyService.getAllDeliveryCompanies();
                if (res.success && res.deliveryCompanies) {
                    setDeliveryCompanies(res.deliveryCompanies.filter(c => c.active));
                }
                setLoadingCompanies(false);
            };
            fetchCompanies();
        }
    }, [isOpen]);

    const handleConfirm = async () => {
        if (!selectedCompanyId) {
            toast.error('الرجاء اختيار شركة التوصيل');
            return;
        }

        setIsSubmitting(true);
        setStep('processing');

        try {
            // Mapping order IDs
            const orderIds = selectedOrders.map(o => o.id);
            const response = await deliveryCompanyService.addOrderToDeliveryCompany(selectedCompanyId, orderIds);

            if (response.success && response.data) {
                const successOrders = response.data.successOrder || [];
                const failedOrders = response.data.failedOrder || [];

                // Transform to our internal result format
                const successMapped = successOrders.map((s: any) => ({
                    orderId: s.id, // Ensure your backend returns the order ID inside successOrder objects
                    trackingCode: s.deliveryCompany?.trackingCode || 'Unknown'
                }));

                const failedMapped = failedOrders.map((f: any) => ({
                    orderId: f.id,
                    error: 'فشل الإرسال' // Backend might return specific error?
                }));

                setResults({
                    success: successMapped,
                    failed: failedMapped
                });
                setStep('results');
                onSuccess(); // Trigger refresh in parent
            } else {
                toast.error('حدث خطأ غير متوقع');
                setStep('select_company');
            }
        } catch (error) {
            console.error(error);
            toast.error('فشل الاتصال بالخادم');
            setStep('select_company');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] grid place-items-center p-4">
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
            <div className="relative z-10 bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
                            <Truck className="w-6 h-6" />
                        </div>
                        <div>
                            <h4 className="text-lg font-black text-slate-800 tracking-tight">إرسال للتوصيل (جماعي)</h4>
                            <p className="text-xs font-bold text-slate-400 mt-1">
                                {step === 'review' && 'مراجعة الطلبات المختارة'}
                                {step === 'select_company' && 'اختيار شركة التوصيل'}
                                {step === 'processing' && 'جاري المعالجة...'}
                                {step === 'results' && 'نتائج العملية'}
                            </p>
                        </div>
                    </div>
                    {step !== 'processing' && (
                        <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors">
                            <X className="w-6 h-6" />
                        </button>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">

                    {step === 'review' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-xs font-black text-slate-500 bg-slate-100 px-3 py-1 rounded-lg">العدد: {selectedOrders.length} طلب</span>
                                <button onClick={() => setStep('select_company')} disabled={selectedOrders.length === 0} className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black hover:bg-indigo-700 transition-all disabled:opacity-50">
                                    متابعة
                                </button>
                            </div>

                            <div className="grid gap-3">
                                {selectedOrders.map(order => (
                                    <div key={order.id} className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-xs font-black text-slate-800">{order.fullName || order.customer}</span>
                                            <span className="text-[10px] text-slate-400 font-bold">{order.state ? (typeof order.state === 'object' ? (order.state as any).name : order.state) : '-'} - {order.phone}</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-xs font-black text-indigo-600 font-mono">{order.totalPrice || order.amount} دج</span>
                                            <button onClick={() => onRemoveOrder(order.id)} className="text-rose-300 hover:text-rose-500 transition-colors p-2 hover:bg-rose-50 rounded-lg">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 'select_company' && (
                        <div className="space-y-6 max-w-md mx-auto py-8">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-500 px-1">اختر شركة التوصيل</label>
                                <ModernSelect
                                    value={selectedCompanyId}
                                    onChange={setSelectedCompanyId}
                                    options={[{ value: '', label: 'اختر الشركة...' }, ...deliveryCompanies.map(c => ({ value: c.id, label: c.name }))]}
                                    placeholder="اختر شركة التوصيل..."
                                    className="w-full"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button onClick={() => setStep('review')} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl text-xs font-black hover:bg-slate-200 transition-all">
                                    رجوع
                                </button>
                                <button
                                    onClick={handleConfirm}
                                    disabled={!selectedCompanyId || isSubmitting}
                                    className="flex-[2] py-3 bg-indigo-600 text-white rounded-xl text-xs font-black hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                                >
                                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Truck className="w-4 h-4" />}
                                    تأكيد وإرسال
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 'processing' && (
                        <div className="flex flex-col items-center justify-center py-16 space-y-6">
                            <div className="relative">
                                <div className="w-20 h-20 rounded-full border-4 border-slate-100 border-t-indigo-600 animate-spin"></div>
                                <Truck className="w-8 h-8 text-indigo-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                            </div>
                            <div className="text-center space-y-2">
                                <h3 className="text-lg font-black text-slate-800">جاري إرسال الطلبات...</h3>
                                <p className="text-xs font-bold text-slate-400">يرجى الانتظار، قد تستغرق العملية بضع ثوانٍ</p>
                            </div>
                        </div>
                    )}

                    {step === 'results' && results && (
                        <div className="space-y-6">
                            {/* Success Section */}
                            {results.success.length > 0 && (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-3 rounded-xl border border-emerald-100">
                                        <CheckCircle2 className="w-5 h-5" />
                                        <span className="text-xs font-black">تم الإرسال بنجاح ({results.success.length})</span>
                                    </div>
                                    <div className="grid gap-2 max-h-[200px] overflow-y-auto custom-scrollbar p-1">
                                        {results.success.map((res, idx) => {
                                            const order = selectedOrders.find(o => o.id === res.orderId);
                                            return (
                                                <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-white">
                                                    <span className="text-[11px] font-bold text-slate-700">{order?.fullName || 'طلب'}</span>

                                                    <div
                                                        onClick={() => { navigator.clipboard.writeText(res.trackingCode); toast.success('تم النسخ') }}
                                                        className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors border border-slate-200 group"
                                                    >
                                                        <span className="font-mono text-[10px] font-black text-slate-600 select-all">{res.trackingCode}</span>
                                                        <Copy className="w-3 h-3 text-slate-400 group-hover:text-indigo-600" />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Failed Section */}
                            {results.failed.length > 0 && (
                                <div className="space-y-3 pt-4 border-t border-slate-100">
                                    <div className="flex items-center gap-2 text-rose-600 bg-rose-50 px-4 py-3 rounded-xl border border-rose-100">
                                        <AlertCircle className="w-5 h-5" />
                                        <span className="text-xs font-black">فشل الإرسال ({results.failed.length})</span>
                                    </div>
                                    <div className="grid gap-2 max-h-[150px] overflow-y-auto custom-scrollbar p-1">
                                        {results.failed.map((res, idx) => {
                                            const order = selectedOrders.find(o => o.id === res.orderId);
                                            return (
                                                <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-rose-100 bg-rose-50/30">
                                                    <span className="text-[11px] font-bold text-slate-700">{order?.fullName || 'طلب'}</span>
                                                    <span className="text-[10px] font-bold text-rose-500">{res.error || 'خطأ غير معروف'}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            <div className="pt-6">
                                <button onClick={onClose} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20">
                                    إغلاق
                                </button>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>,
        document.body
    );
};
