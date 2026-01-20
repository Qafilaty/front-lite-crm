import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Check, Zap, Crown, Rocket, CreditCard, ArrowRight, ShieldCheck,
  TrendingUp, History, Filter, X, Smartphone, Globe, DollarSign, Upload, FileText, Download, TicketPercent, Loader2
} from 'lucide-react';
import { invoiceService, couponService } from '../services/apiService';
import type { Invoice, Coupon } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { ModernSelect } from './common/ModernSelect';

// Types
type PlanId = 'pay-as-you-go' | 'pro' | 'premium';
type PaymentMethod = 'ccp' | 'baridimob' | 'redotpay' | 'paypal';
type Currency = 'DZD' | 'USD';

interface Plan {
  id: PlanId;
  name: string;
  basePrice: number;
  unit: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  features: string[];
  popular?: boolean;
  current?: boolean;
}

const SubscriptionsView: React.FC = () => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

  // Subscription Flow States
  const [step, setStep] = useState(1);
  const [duration, setDuration] = useState(1); // 1, 3, 6, 12
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('ccp');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);

  // Coupon State
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponMsg, setCouponMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Payment Info States
  const [currency, setCurrency] = useState<Currency>('DZD');
  const [totalPrice, setTotalPrice] = useState(0);

  const plans: Plan[] = [
    {
      id: 'pay-as-you-go',
      name: 'الدفع حسب الطلب',
      basePrice: 10,
      unit: 'دج / طلب',
      icon: Rocket,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
      features: [
        'كل ميزات النظام مفتوحة',
        'لا يوجد اشتراك شهري ثابت',
        'مثالي للمبتدئين',
        'دعم فني عبر البريد'
      ],
      current: true // This should be dynamic based on user plan
    },
    {
      id: 'pro',
      name: 'الخطة الاحترافية',
      basePrice: 2400,
      unit: 'دج / شهر',
      icon: Zap,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      features: [
        'كل ميزات النظام مفتوحة',
        'طلبات غير محدودة',
        'تقارير أداء متقدمة',
        'دعم فني سريع 24/7'
      ],
      popular: true
    },
    {
      id: 'premium',
      name: 'الربط المتقدم',
      basePrice: 3900,
      unit: 'دج / شهر',
      icon: Crown,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      features: [
        'دخول كامل للـ API',
        'ربط Webhooks فورية',
        'ربط غير محدود للمتاجر',
        'مدير حساب مخصص'
      ]
    }
  ];

  const fetchInvoices = async () => {
    try {
      setLoadingInvoices(true);
      const result = await invoiceService.getAllInvoices(user?.company?.id);
      if (result.success && result.invoices) {
        setInvoices(result.invoices);
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoadingInvoices(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [user]);

  // Derived State logic
  useEffect(() => {
    if (selectedPlan) {
      // Calculate Total Price based on Duration
      let price = selectedPlan.basePrice * duration;

      // Apply Duration Discounts (logic can be refined)
      if (duration === 3) price = price * 0.95; // 5% off
      if (duration === 6) price = price * 0.90; // 10% off
      if (duration === 12) price = price * 0.85; // 15% off

      // Apply Coupon Discount
      if (appliedCoupon) {
        price = price * (1 - appliedCoupon.discount / 100);
      }

      setTotalPrice(Math.floor(price));
    }
  }, [selectedPlan, duration, appliedCoupon]);

  useEffect(() => {
    if (paymentMethod === 'redotpay' || paymentMethod === 'paypal') {
      setCurrency('USD');
      // Simple conversion rate hardcoded for demo, usually fetched or fixed
      if (currency === 'DZD') {
        // Adjust price to USD relative to DZD (e.g., 1 USD = 220 DZD)
        // setTotalPrice(prev => Math.ceil(prev / 220)); 
        // Better to re-calculate from base USD price if available, or convert:
      }
    } else {
      setCurrency('DZD');
    }
  }, [paymentMethod]);

  // Helper to get formatted price
  const getDisplayPrice = () => {
    if (currency === 'USD') {
      // Approximate conversion for UI demo (1 USD ~ 200 DZD)
      return (totalPrice / 200).toFixed(2);
    }
    return totalPrice.toLocaleString();
  };

  const handleOpenModal = (plan: Plan) => {
    setSelectedPlan(plan);
    setStep(1);
    setDuration(1);
    setPaymentMethod('ccp');
    setProofFile(null);
    setProofPreview(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setProofFile(null);
    setProofPreview(null);
    setCouponCode('');
    setAppliedCoupon(null);
    setCouponMsg(null);
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;

    setCouponLoading(true);
    setCouponMsg(null);

    try {
      const result = await couponService.getCouponByCode(couponCode);
      if (result.success && result.coupon) {
        setAppliedCoupon(result.coupon);
        setCouponMsg({ type: 'success', text: `تم تطبيق الخصم: ${result.coupon.discount}%` });
      } else {
        setAppliedCoupon(null);
        setCouponMsg({ type: 'error', text: 'كود الكوبون غير صالح أو انتهت صلاحيته' });
      }
    } catch (error) {
      console.error('Coupon error:', error);
      setCouponMsg({ type: 'error', text: 'حدث خطأ أثناء التحقق من الكوبون' });
    } finally {
      setCouponLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProofFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitSubscription = async (isPayLater: boolean) => {
    if (!selectedPlan) return;

    // Build invoice data
    const invoiceData = {
      plan: selectedPlan.name,
      totalPrice: currency === 'USD' ? parseFloat(getDisplayPrice()) : totalPrice,
      totalDiscount: 0, // Calculate if needed
      duration: duration,
      proof: proofPreview, // In real app, upload first and send URL
      paymentMethod: paymentMethod,
      currency: currency,
      idCoupon: appliedCoupon?.id
    };

    const result = await invoiceService.createInvoice(invoiceData);
    if (result.success) {
      handleCloseModal();
      fetchInvoices();
      // Show success toast
    } else {
      console.error("Failed to create invoice");
    }
  };

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-700">
      {/* Upper Billing Cards - Kept as is or dynamic */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-sm shrink-0">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">حالة الحساب</p>
            <h3 className="text-sm font-black text-slate-800 mt-0.5">نشط - الخطة الحالية</h3>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              <span className="text-[9px] font-bold text-emerald-600">ينتهي في --/--/----</span>
            </div>
          </div>
        </div>

        {/* Balance Card */}
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-sm shrink-0">
            <TrendingUp className="w-7 h-7" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">الرصيد الحالي</p>
            <h3 className="text-xl font-black text-slate-800 mt-0.5">0 <span className="text-[10px]">دج</span></h3>
            <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase">غير متوفر</p>
          </div>
        </div>

        {/* Expenses Card */}
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-sm shrink-0">
            <CreditCard className="w-7 h-7" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">إجمالي المصاريف</p>
            <h3 className="text-sm font-black text-slate-800 mt-0.5">تعبئة رصيد سريعة</h3>
            <button className="text-[10px] font-black text-indigo-600 underline mt-1 uppercase hover:text-indigo-700 transition-colors">تحديث وسيلة الدفع</button>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="text-center space-y-2 py-4">
        <h2 className="text-2xl font-black text-slate-800 tracking-tight">اختر الخطة المناسبة لنمو تجارتك</h2>
        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">شفافية تامة، لا توجد رسوم خفية</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <div key={plan.id} className={`
            bg-white rounded-[2.5rem] p-10 border transition-all flex flex-col relative overflow-hidden group
            ${plan.popular ? 'border-indigo-200 shadow-2xl scale-105 z-10 bg-indigo-50/10' : 'border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-1'}
          `}>
            {plan.popular && (
              <div className="absolute top-6 -left-12 bg-indigo-600 text-white px-12 py-1.5 -rotate-45 text-[9px] font-black uppercase shadow-md">
                الأكثر طلباً
              </div>
            )}

            <div className="mb-8">
              <div className={`w-14 h-14 rounded-2xl ${plan.bg} ${plan.color} flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform`}>
                <plan.icon className="w-7 h-7" />
              </div>
              <h4 className="text-lg font-black text-slate-800 mb-2">{plan.name}</h4>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-black text-slate-900">{plan.basePrice}</span>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tighter">{plan.unit}</span>
              </div>
            </div>

            <div className="space-y-4 mb-10 flex-1">
              {plan.features.map((feature, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full ${plan.bg} flex items-center justify-center`}>
                    <Check className={`w-3 h-3 ${plan.color} stroke-[3]`} />
                  </div>
                  <span className="text-[11px] font-bold text-slate-600">{feature}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => handleOpenModal(plan)}
              className={`
              w-full py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all
              ${plan.current
                  ? 'bg-slate-100 text-slate-400 cursor-default flex items-center justify-center gap-2'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 active:scale-95'
                }
            `}>
              {plan.current ? <><Check className="w-4 h-4" /> خطتك الحالية</> : 'اشترك الآن'}
            </button>
          </div>
        ))}
      </div>

      {/* Payment History Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white shadow-sm flex items-center justify-center text-indigo-600 border border-slate-100">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">سجل المدفوعات</h3>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">إدارة الفواتير والعمليات السابقة</p>
            </div>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase hover:bg-slate-50 transition-all">
            <Filter className="w-3.5 h-3.5" /> تصفية السجل
          </button>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-slate-50/50 text-slate-500 border-b border-slate-100">
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em]">معرف الفاتورة</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em]">التاريخ</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em]">الخطة</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em]">المبلغ</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em]">الوسيلة</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em]">الحالة</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-center">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loadingInvoices ? (
                  <tr><td colSpan={7} className="text-center py-10">جاري التحميل...</td></tr>
                ) : invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/50 transition-all">
                    <td className="px-8 py-4 font-black text-indigo-600 text-[11px] font-mono tracking-widest">#{inv.id}</td>
                    <td className="px-8 py-4 text-[11px] font-bold text-slate-500">{new Date(inv.createdAt).toLocaleDateString('ar-SA')}</td>
                    <td className="px-8 py-4 text-[11px] font-black text-slate-700">{inv.plan}</td>
                    <td className="px-8 py-4 text-[11px] font-black text-slate-800">{inv.price} {inv.currency}</td>
                    <td className="px-8 py-4 text-[11px] font-bold text-slate-400">{inv.paymentMethod}</td>
                    <td className="px-8 py-4">
                      <span className={`px-3 py-1 rounded-lg text-[9px] font-black border uppercase tracking-widest ${inv.status === 'paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                        inv.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                          'bg-rose-50 text-rose-600 border-rose-100'
                        }`}>
                        {inv.status === 'paid' ? 'ناجحة' : inv.status === 'pending' ? 'معلقة' : 'فاشلة'}
                      </span>
                    </td>
                    <td className="px-8 py-4 text-center flex justify-center gap-2">
                      <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all" title="تحميل الفاتورة">
                        <Download className="w-4 h-4" />
                      </button>
                      {inv.status === 'pending' && (
                        <button className="p-2 text-amber-500 hover:text-amber-700 hover:bg-amber-50 rounded-xl transition-all" title="إكمال الدفع">
                          <CreditCard className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 bg-slate-50/50 border-t border-slate-100 text-center">
            <button className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline">عرض المزيد من العمليات</button>
          </div>
        </div>
      </div>

      {/* Subscription Modal */}
      {isModalOpen && selectedPlan && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white z-10 p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-slate-800">اشتراك جديد</h3>
                <p className="text-xs text-slate-400 font-bold mt-1">أكمل الخطوات لتفعيل {selectedPlan.name}</p>
              </div>
              <button onClick={handleCloseModal} className="p-2 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-xl transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-8">
              {/* Stepper */}
              <div className="flex items-center justify-center gap-4">
                {[1, 2, 3].map((s) => (
                  <div key={s} className={`flex items-center gap-2 ${step === s ? 'text-indigo-600' : step > s ? 'text-emerald-500' : 'text-slate-300'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs border-2 ${step === s ? 'border-indigo-600 bg-indigo-50' :
                      step > s ? 'border-emerald-500 bg-emerald-50' :
                        'border-slate-200 bg-slate-50'
                      }`}>
                      {step > s ? <Check className="w-4 h-4" /> : s}
                    </div>
                    <span className="text-[10px] font-black uppercase hidden md:block">
                      {s === 1 ? 'المدة' : s === 2 ? 'الدفع' : 'التأكيد'}
                    </span>
                    {s < 3 && <div className="w-8 h-0.5 bg-slate-100 mx-2"></div>}
                  </div>
                ))}
              </div>

              {/* Step 1: Duration */}
              {step === 1 && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[1, 3, 6, 12].map((m) => (
                      <button
                        key={m}
                        onClick={() => setDuration(m)}
                        className={`p-4 rounded-2xl border-2 transition-all text-center space-y-2 ${duration === m
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                          : 'border-slate-100 hover:border-indigo-100 hover:bg-slate-50 text-slate-600'
                          }`}
                      >
                        <h4 className="text-xl font-black">{m}</h4>
                        <p className="text-[10px] font-bold uppercase">أشهر</p>
                        {m > 1 && (
                          <span className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[9px] font-black rounded-full">
                            -{m === 3 ? '5' : m === 6 ? '10' : '15'}%
                          </span>
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                    {/* Coupon Section */}
                    <div className="relative">
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <input
                            type="text"
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value)}
                            placeholder="هل لديك كوبون خصم؟"
                            className="w-full pl-4 pr-10 py-3 rounded-xl border border-slate-200 text-sm font-bold outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                            disabled={!!appliedCoupon}
                          />
                          <TicketPercent className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        </div>
                        <button
                          onClick={appliedCoupon ? () => { setAppliedCoupon(null); setCouponCode(''); setCouponMsg(null); } : handleApplyCoupon}
                          disabled={couponLoading || (!couponCode && !appliedCoupon)}
                          className={`px-6 py-3 rounded-xl font-black text-xs transition-all ${appliedCoupon
                            ? 'bg-rose-100 text-rose-600 hover:bg-rose-200'
                            : 'bg-slate-800 text-white hover:bg-slate-700'
                            }`}
                        >
                          {couponLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : appliedCoupon ? 'إزالة' : 'تطبيق'}
                        </button>
                      </div>
                      {couponMsg && (
                        <p className={`text-[10px] font-bold mt-2 ${couponMsg.type === 'success' ? 'text-emerald-600' : 'text-rose-500'}`}>
                          {couponMsg.text}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-200 pt-4">
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase">الإجمالي التقديري</p>
                        <div className="flex items-baseline gap-2 mt-1">
                          <h3 className="text-2xl font-black text-slate-800">
                            {totalPrice.toLocaleString()}
                            <span className="text-sm text-slate-400 font-bold mr-1">دج</span>
                          </h3>
                          {appliedCoupon && (
                            <span className="text-sm font-bold text-slate-400 line-through">
                              {Math.floor(selectedPlan.basePrice * duration * (duration === 3 ? 0.95 : duration === 6 ? 0.90 : duration === 12 ? 0.85 : 1)).toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <button onClick={() => setStep(2)} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-black text-xs hover:bg-indigo-700 transition-colors">
                        متابعة للدفع
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Payment Method */}
              {step === 2 && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      onClick={() => setPaymentMethod('ccp')}
                      className={`p-4 rounded-2xl border-2 flex items-center gap-4 transition-all ${paymentMethod === 'ccp' ? 'border-indigo-600 bg-indigo-50' : 'border-slate-100'}`}
                    >
                      <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center text-yellow-600">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div className="text-right">
                        <h4 className="font-black text-slate-800">CCP البريد الجزائري</h4>
                        <p className="text-[10px] text-slate-500">تحويل كلاسيكي</p>
                      </div>
                    </button>

                    <button
                      onClick={() => setPaymentMethod('baridimob')}
                      className={`p-4 rounded-2xl border-2 flex items-center gap-4 transition-all ${paymentMethod === 'baridimob' ? 'border-indigo-600 bg-indigo-50' : 'border-slate-100'}`}
                    >
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                        <Smartphone className="w-6 h-6" />
                      </div>
                      <div className="text-right">
                        <h4 className="font-black text-slate-800">BaridiMob</h4>
                        <p className="text-[10px] text-slate-500">دفع إلكتروني سريع</p>
                      </div>
                    </button>

                    <button
                      onClick={() => setPaymentMethod('redotpay')}
                      className={`p-4 rounded-2xl border-2 flex items-center gap-4 transition-all ${paymentMethod === 'redotpay' ? 'border-indigo-600 bg-indigo-50' : 'border-slate-100'}`}
                    >
                      <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center text-rose-600">
                        <CreditCard className="w-6 h-6" />
                      </div>
                      <div className="text-right">
                        <h4 className="font-black text-slate-800">RedotPay</h4>
                        <p className="text-[10px] text-slate-500">دفع دولي (USD)</p>
                      </div>
                    </button>

                    <button
                      onClick={() => setPaymentMethod('paypal')}
                      className={`p-4 rounded-2xl border-2 flex items-center gap-4 transition-all ${paymentMethod === 'paypal' ? 'border-indigo-600 bg-indigo-50' : 'border-slate-100'}`}
                    >
                      <div className="w-12 h-12 bg-sky-100 rounded-xl flex items-center justify-center text-sky-600">
                        <Globe className="w-6 h-6" />
                      </div>
                      <div className="text-right">
                        <h4 className="font-black text-slate-800">PayPal</h4>
                        <p className="text-[10px] text-slate-500">دفع عالمي (USD)</p>
                      </div>
                    </button>
                  </div>

                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase">المبلغ النهائي</p>
                      <h3 className="text-2xl font-black text-slate-800 mt-1">
                        {getDisplayPrice()}
                        <span className="text-sm text-slate-400 font-bold mr-1">{currency}</span>
                      </h3>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setStep(1)} className="px-4 py-3 text-slate-500 font-bold text-xs hover:bg-slate-100 rounded-xl transition-colors">
                        عودة
                      </button>
                      <button onClick={() => setStep(3)} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-black text-xs hover:bg-indigo-700 transition-colors">
                        تأكيد الوسيلة
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Payment Info & Proof */}
              {step === 3 && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                    <h4 className="font-black text-slate-700 flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-indigo-600" />
                      معلومات الدفع
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="bg-white p-3 rounded-xl border border-slate-200">
                        <p className="text-[10px] text-slate-400 font-bold uppercase">الحساب / الرقم</p>
                        <p className="font-mono font-bold text-slate-700 mt-1 select-all">
                          {paymentMethod === 'ccp' && '0000000000 KEY 00'}
                          {paymentMethod === 'baridimob' && '007999990000000000'}
                          {paymentMethod === 'redotpay' && 'ID: 123456789 - TRC20'}
                          {paymentMethod === 'paypal' && 'payment@litecrm.com'}
                        </p>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-slate-200">
                        <p className="text-[10px] text-slate-400 font-bold uppercase">الإسم المستفيد</p>
                        <p className="font-bold text-slate-700 mt-1">LITE CRM LLC</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-black text-slate-700">إرفاق إثبات الدفع</label>
                    <div className="border-2 border-dashed border-slate-300 rounded-2xl p-8 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition-colors relative cursor-pointer group">
                      <input type="file" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*,application/pdf" />
                      {proofPreview ? (
                        <div className="relative w-full max-w-[200px] aspect-video">
                          <img src={proofPreview} alt="Proof" className="w-full h-full object-cover rounded-lg shadow-sm" />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                            <p className="text-white text-xs font-bold">تغيير الصورة</p>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                            <Upload className="w-6 h-6" />
                          </div>
                          <p className="text-sm font-bold text-slate-600">اضغط لرفع الصورة أو الملف</p>
                          <p className="text-[10px] text-slate-400 mt-1">PNG, JPG, PDF (Max 5MB)</p>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button onClick={() => setStep(2)} className="flex-1 py-3 text-slate-500 font-bold text-xs hover:bg-slate-100 rounded-xl transition-colors">
                      عودة
                    </button>
                    <button onClick={() => handleSubmitSubscription(true)} className="flex-1 py-3 border border-slate-200 text-slate-600 font-black text-xs hover:bg-slate-50 rounded-xl transition-colors">
                      الدفع لاحقاً
                    </button>
                    <button onClick={() => handleSubmitSubscription(false)} className="flex-[2] py-3 bg-indigo-600 text-white rounded-xl font-black text-xs hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/20">
                      إتمام العملية
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
        , document.body)}

      {/* Support Message */}
      <div className="bg-indigo-900 rounded-[2.5rem] p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32"></div>
        <div className="relative z-10 space-y-2 text-center md:text-right">
          <h3 className="text-lg font-black tracking-tight">تحتاج إلى عرض مخصص لشركتك؟</h3>
          <p className="text-indigo-200 text-[11px] font-medium max-w-md">نحن هنا لمساعدتك في تخصيص باقة تناسب حجم أعمالك اللوجستية وتوفر لك أفضل قيمة مقابل السعر.</p>
        </div>
        <button className="relative z-10 px-8 py-4 bg-white text-indigo-900 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-indigo-950/20 hover:bg-indigo-50 transition-all flex items-center gap-2">
          تواصل مع المبيعات <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default SubscriptionsView;
