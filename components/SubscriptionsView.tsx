import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Check, Zap, Crown, Rocket, CreditCard, ArrowRight, ShieldCheck,
  TrendingUp, History, Filter, X, Smartphone, Globe, DollarSign, Upload, FileText, Download, TicketPercent, Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import TableSkeleton from './common/TableSkeleton';
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

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitSubscription = async (isPayLater: boolean) => {
    if (!selectedPlan) return;

    setIsSubmitting(true);
    // const toastId = toast.loading('جاري إنشاء الفاتورة...');

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

    try {
      const result = await invoiceService.createInvoice(invoiceData);
      if (result.success) {
        toast.success('تم إنشاء الفاتورة بنجاح');
        handleCloseModal();
        fetchInvoices();
      } else {
        toast.error('فشل إنشاء الفاتورة');
        console.error("Failed to create invoice");
      }
    } catch (error) {
      console.error(error);
      toast.error('حدث خطأ أثناء العملية');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-700">
      {/* ... previous content ... */}

      {/* Step 3: buttons update */}
      <div className="flex gap-3 pt-4">
        <button
          onClick={() => setStep(2)}
          disabled={isSubmitting}
          className="flex-1 py-3 text-slate-500 font-bold text-xs hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50"
        >
          عودة
        </button>
        <button
          onClick={() => handleSubmitSubscription(true)}
          disabled={isSubmitting}
          className="flex-1 py-3 border border-slate-200 text-slate-600 font-black text-xs hover:bg-slate-50 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <div className="w-4 h-4 border-2 border-slate-600 border-t-transparent rounded-full animate-spin"></div>
          ) : (
            'الدفع لاحقاً'
          )}
        </button>
        <button
          onClick={() => handleSubmitSubscription(false)}
          disabled={isSubmitting}
          className="flex-[2] py-3 bg-indigo-600 text-white rounded-xl font-black text-xs hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/20 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            'إتمام العملية'
          )}
        </button>
      </div>

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
