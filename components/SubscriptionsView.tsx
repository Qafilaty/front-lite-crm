import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { createPortal } from 'react-dom';
import { useMutation, useLazyQuery } from '@apollo/client';
import { invoiceService, couponService } from '../services/apiService';
import type { Invoice } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { History, Filter, Download, CreditCard, ArrowRight, Loader2, Tag } from 'lucide-react';
import toast from 'react-hot-toast';
import { SINGLE_UPLOAD } from '../graphql/mutations/uploadMutations';
import { CREATE_INVOICE } from '../graphql/mutations/invoiceMutations';
import { GET_COUPON_BY_CODE } from '../graphql/queries/couponQueries';
import { formatCurrency } from '../utils/formatters';

// New Plans Data (from PricingPlans.tsx)
const MAIN_PLANS = [
  {
    id: 'starter',
    nameKey: 'subscriptions.starter',
    price: 1900,
    descriptionKey: 'subscriptions.starter_desc',
    features: [
      { key: 'subscriptions.features.orders_count', params: { count: 600 } },
      { key: 'subscriptions.features.unlimited_abandoned' },
      { key: 'subscriptions.features.users_count', params: { count: 4 } },
      { key: 'subscriptions.features.assign_agents' },
      { key: 'subscriptions.features.inventory_finance' },
      { key: 'subscriptions.features.stats_reports' },
      { key: 'subscriptions.features.delivery_linking' },
      { key: 'subscriptions.features.estore_linking' },
      { key: 'subscriptions.features.sheets_linking' },
      { key: 'subscriptions.features.updates' },
      { key: 'subscriptions.features.support' },
      { key: 'subscriptions.features.extra_order', params: { price: 10 } }
    ],
    buttonTextKey: 'subscriptions.start_now',
    popular: false,
    color: 'bg-white border-slate-200'
  },
  {
    id: 'pro',
    nameKey: 'subscriptions.pro',
    price: 3900,
    descriptionKey: 'subscriptions.pro_desc',
    features: [
      { key: 'subscriptions.features.orders_count', params: { count: 2500 } },
      { key: 'subscriptions.features.unlimited_abandoned' },
      { key: 'subscriptions.features.users_count', params: { count: 7 } },
      { key: 'subscriptions.features.assign_agents' },
      { key: 'subscriptions.features.inventory_finance' },
      { key: 'subscriptions.features.stats_reports' },
      { key: 'subscriptions.features.delivery_linking' },
      { key: 'subscriptions.features.estore_linking' },
      { key: 'subscriptions.features.sheets_linking' },
      { key: 'subscriptions.features.updates' },
      { key: 'subscriptions.features.support' },
      { key: 'subscriptions.features.extra_order', params: { price: 10 } }
    ],
    buttonTextKey: 'subscriptions.renew',
    popular: true,
    color: 'bg-white border-indigo-600 ring-2 ring-indigo-600 ring-offset-4 ring-offset-slate-50'
  },
  {
    id: 'ultimate',
    nameKey: 'subscriptions.ultimate',
    price: 5900,
    descriptionKey: 'subscriptions.ultimate_desc',
    features: [
      { key: 'subscriptions.features.unlimited_orders' },
      { key: 'subscriptions.features.unlimited_abandoned' },
      { key: 'subscriptions.features.users_count', params: { count: 14 } },
      { key: 'subscriptions.features.assign_agents' },
      { key: 'subscriptions.features.inventory_finance' },
      { key: 'subscriptions.features.stats_reports' },
      { key: 'subscriptions.features.delivery_linking' },
      { key: 'subscriptions.features.estore_linking' },
      { key: 'subscriptions.features.sheets_linking' },
      { key: 'subscriptions.features.updates' },
      { key: 'subscriptions.features.support' },
      { key: 'subscriptions.features.updates' }
    ],
    buttonTextKey: 'subscriptions.expand',
    popular: false,
    color: 'bg-white border-slate-200'
  }
];

const POINT_BUNDLES = [
  { points: 100, price: 1000, labelKey: 'subscriptions.points_bundle', params: { count: 100 }, discount: 0 },
  { points: 500, price: 4500, labelKey: 'subscriptions.points_bundle', params: { count: 500 }, discount: 5 },
  { points: 1000, price: 8000, labelKey: 'subscriptions.points_bundle', params: { count: 1000 }, discount: 10 },
  { points: 5000, price: 35000, labelKey: 'subscriptions.points_bundle', params: { count: 5000 }, discount: 15 }
];

const SubscriptionsView: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(true);

  /* Subscription Flow States */
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any | null>(null);
  const [step, setStep] = useState(1);
  const [duration, setDuration] = useState(1); // 1, 3, 6, 12
  const [selectedPoints, setSelectedPoints] = useState<number | null>(null); // For PAYG
  const [paymentMethod, setPaymentMethod] = useState<'ccp' | 'baridimob' | 'redotpay' | 'paypal'>('ccp');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);

  /* Coupon State */
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponMsg, setCouponMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  /* Payment Info States */
  const [currency, setCurrency] = useState<'DZD' | 'USD'>('DZD');
  const [totalPrice, setTotalPrice] = useState(0);

  // Derive Active Subscription from User Company Data
  const planData = user?.company?.plans;

  let currentPlan = {
    name: t('subscriptions.no_active_plan'),
    expiryDate: '',
    daysLeft: 0,
    credit: 0,
    type: 'none',
    status: t('subscriptions.status_inactive')
  };

  if (planData && planData.name) {
    const nameLower = planData.name.toLowerCase();
    const isPayg = nameLower === 'payg' || nameLower === 'pay_as_you_go';

    // Calculate expiry if NOT payg
    let daysLeft = 0;
    if (!isPayg && planData.dateExpiry) {
      const expiry = new Date(planData.dateExpiry);
      const today = new Date();
      const diffTime = Math.max(0, expiry.getTime() - today.getTime());
      daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    // Find Arabic name from MAIN_PLANS
    const planDetails = MAIN_PLANS.find(p => p.id === nameLower);
    const displayName = isPayg ? t('subscriptions.payg_title') : (planDetails ? t(planDetails.nameKey) : planData.name);

    currentPlan = {
      name: displayName,
      expiryDate: planData.dateExpiry || '',
      daysLeft: daysLeft,
      credit: planData.pointes || 0,
      type: isPayg ? 'payg' : 'monthly',
      status: isPayg ? t('subscriptions.status_active') : (daysLeft > 0 ? t('subscriptions.status_active') : t('subscriptions.status_expired'))
    };
  }

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

  // Check if this is the first purchase (no confirmed invoices yet)
  const isFirstPurchase = !invoices.some(inv => inv.status === 'confirmed');

  /* Helper Functions */
  const handleOpenModal = (plan: any) => {
    setSelectedPlan(plan);
    setStep(1);

    if (plan.id === 'payg') {
      setDuration(0);
      setSelectedPoints(100); // Default
    } else {
      setDuration(1);
      setSelectedPoints(null);
    }

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

  // Derived State logic
  useEffect(() => {
    if (selectedPlan) {
      if (selectedPlan.id === 'payg' && selectedPoints) {
        const bundle = POINT_BUNDLES.find(b => b.points === selectedPoints);
        let price = bundle ? bundle.price : 0;

        // Apply Coupon logic if needed (usually coupons might apply to points too)
        if (appliedCoupon) {
          price = price * (1 - appliedCoupon.discount / 100);
        }
        setTotalPrice(Math.floor(price));
      } else {
        const basePrice = typeof selectedPlan.price === 'number' ? selectedPlan.price : parseInt(selectedPlan.price.replace(/,/g, ''));
        let price = basePrice * duration;

        // Apply Duration Discounts
        if (duration === 3) price = price * 0.95; // 5% off
        if (duration === 6) price = price * 0.90; // 10% off
        if (duration === 12) price = price * 0.85; // 15% off

        // Apply Affiliate Referral Discount (ONLY on first purchase)
        const referralDiscount = user?.company?.affiliate?.referralDiscount || 0;
        if (isFirstPurchase && referralDiscount > 0) {
          price = price * (1 - referralDiscount / 100);
        }

        // Apply Coupon Discount
        if (appliedCoupon) {
          price = price * (1 - appliedCoupon.discount / 100);
        }

        setTotalPrice(Math.floor(price));
      }
    }
  }, [selectedPlan, duration, selectedPoints, appliedCoupon, user?.company?.affiliate?.referralDiscount, isFirstPurchase]);

  useEffect(() => {
    if (paymentMethod === 'redotpay' || paymentMethod === 'paypal') {
      setCurrency('USD');
    } else {
      setCurrency('DZD');
    }
  }, [paymentMethod]);

  // Helper to get formatted price
  const getDisplayPrice = () => {
    if (currency === 'USD') {
      // Approximate conversion for UI demo (1 USD ~ 250 DZD)
      return (totalPrice / 250).toFixed(2);
    }
    return formatCurrency(totalPrice).split(' ')[0]; // Just the number part if we want manual currency symbol, but let's see
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponMsg(null);
    
    try {
      const result = await couponService.getCouponByCode(couponCode.trim().toUpperCase());
      if (result.success && result.coupon) {
        setAppliedCoupon(result.coupon);
        setCouponMsg({ 
          type: 'success', 
          text: t('subscriptions.toast.coupon_applied', { discount: result.coupon.discount }) 
        });
      } else {
        setAppliedCoupon(null);
        setCouponMsg({ type: 'error', text: t('subscriptions.toast.coupon_invalid') });
      }
    } catch (error) {
      console.error(error);
      setAppliedCoupon(null);
      setCouponMsg({ type: 'error', text: t('subscriptions.toast.coupon_invalid') });
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

  /* Mutations */
  const [singleUpload] = useMutation(SINGLE_UPLOAD);
  const [createInvoice] = useMutation(CREATE_INVOICE);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitSubscription = async (isPayLater: boolean) => {
    if (!proofFile) {
      toast.error(t('subscriptions.toast.attach_proof'));
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Upload Proof
      const uploadResult = await singleUpload({
        variables: { file: proofFile }
      });

      const proofFilename = uploadResult.data?.singleUpload?.filename;

      if (!proofFilename) {
        throw new Error(t('subscriptions.toast.upload_failed'));
      }

      // 2. Create Invoice
      const invoiceContent = {
        plan: selectedPlan.id,
        totalPrice: totalPrice,
        totalDiscount: 0, // already applied in totalPrice calculation logic if needed, or send separate
        duration: duration,
        proof: proofFilename,
        paymentMethod: paymentMethod,
        currency: currency,
        pointes: selectedPoints || 0,
        idCoupon: appliedCoupon ? appliedCoupon.id : null
      };

      const result = await createInvoice({
        variables: { content: invoiceContent }
      });

      if (result.data?.createInvoice) {
        toast.success(t('subscriptions.toast.success'));
        handleCloseModal();
        fetchInvoices(); // Refresh list
      }

    } catch (error) {
      console.error('Subscription Error:', error);
      toast.error(t('subscriptions.toast.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-24 max-w-[1400px] mx-auto" dir={i18n.dir()}>

      {/* 0. Active Subscription Status Bar */}
      <section className="bg-indigo-600 text-white rounded-lg p-6 shadow-xl shadow-indigo-100 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-16 -mt-16 blur-xl"></div>

        <div className="flex items-center gap-5 relative z-10">
          <div className="w-14 h-14 rounded-lg bg-white/20 flex items-center justify-center text-2xl backdrop-blur-md border border-white/30">
            <i className="fa-solid fa-crown"></i>
          </div>
          <div>
            <p className="text-xs font-bold text-indigo-100/80 uppercase tracking-widest">{t('subscriptions.active_status')}</p>
            <h3 className="text-2xl font-black">{currentPlan.name}</h3>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 relative z-10 w-full md:w-auto">
          {currentPlan.type !== 'payg' && (
            <div className="flex-1 md:flex-none bg-white/10 border border-white/20 px-6 py-3 rounded-lg backdrop-blur-md">
              <p className="text-[10px] font-black text-indigo-100 uppercase tracking-widest mb-1 text-center md:text-right">{t('subscriptions.days_left')}</p>
              <p className="text-lg font-black text-center md:text-right">{currentPlan.daysLeft} {t('subscriptions.days')}</p>
            </div>
          )}
          {currentPlan.type === 'payg' && (
            <div className="flex-1 md:flex-none bg-emerald-500/20 border border-emerald-500/30 px-6 py-3 rounded-lg backdrop-blur-md">
              <p className="text-[10px] font-black text-emerald-100 uppercase tracking-widest mb-1 text-center md:text-right">{t('subscriptions.credit_available')}</p>
              <p className="text-lg font-black text-center md:text-right">{currentPlan.credit} {t('subscriptions.points')}</p>
            </div>
          )}
          <div className="flex-1 md:flex-none bg-white text-indigo-600 px-6 py-3 rounded-lg flex items-center justify-center gap-2 font-black text-xs shadow-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            {t('common.order')} {currentPlan.status}
          </div>
        </div>
      </section>

      {/* 1. Page Header */}
      <section className="text-center space-y-4 max-w-3xl mx-auto px-4">
        <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">{t('subscriptions.title')}</h2>
        <p className="text-slate-500 font-medium text-base">{t('subscriptions.subtitle')}</p>
      </section>

      {/* 2. Monthly Subscriptions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {MAIN_PLANS.map((plan, index) => {
          // Determine logic based on current plan
          const PLAN_ORDER = ['starter', 'pro', 'ultimate'];
          const currentPlanId = planData?.name ? planData.name.toLowerCase() : '';
          const currentIndex = PLAN_ORDER.indexOf(currentPlanId);
          const planIndex = PLAN_ORDER.indexOf(plan.id);

          let buttonText = t('subscriptions.start_now');
          let buttonStyle = 'bg-slate-50 text-slate-900 hover:bg-slate-100 border border-slate-200';
          let showBadge = false;

          if (currentPlanId && currentPlanId === plan.id) {
            // Current Plan
            buttonText = t('subscriptions.renew');
            buttonStyle = 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-100';
          } else if (currentIndex !== -1 && planIndex > currentIndex) {
            // Upgrade Plan
            buttonText = t('subscriptions.upgrade_now');
            buttonStyle = 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100 animate-pulse-slow ring-offset-2 focus:ring-2 ring-indigo-500';
            showBadge = true;
          } else if (currentIndex !== -1 && planIndex < currentIndex) {
            // Downgrade / Lower Plan
            buttonText = t('subscriptions.start_now'); // Or "تغيير للخطة"
            buttonStyle = 'bg-white text-slate-700 border-2 border-slate-100 hover:border-slate-300 hover:bg-slate-50';
          } else {
            // No active monthly plan (or PAYG)
            buttonText = t(plan.buttonTextKey); // Default fallback
            if (plan.popular) {
              buttonStyle = 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100';
            } else {
              buttonStyle = 'bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-200';
            }
          }

          return (
            <div key={plan.id} className={`relative flex flex-col p-8 rounded-lg border transition-all hover:scale-[1.02] hover:shadow-2xl ${plan.color}`}>
              {(plan.popular || showBadge) && (
                <span className={`absolute -top-4 right-1/2 translate-x-1/2 px-5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl ${showBadge ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-white'}`}>
                  {showBadge ? t('subscriptions.recommended_upgrade') : t('subscriptions.most_popular')}
                </span>
              )}

              <div className="mb-6">
                <h3 className="text-xl font-black text-slate-900">{t(plan.nameKey)}</h3>
                <p className="text-xs text-slate-400 font-bold mt-2 leading-relaxed">{t(plan.descriptionKey)}</p>
              </div>

              <div className="mb-8 flex items-baseline gap-2">
                {(() => {
                  const referralDiscount = user?.company?.affiliate?.referralDiscount || 0;
                  if (isFirstPurchase && referralDiscount > 0) {
                    const baseP = typeof plan.price === 'number' ? plan.price : parseInt((plan.price as string).replace(/,/g, ''));
                    const finalP = Math.floor(baseP * (1 - referralDiscount / 100));
                    return (
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-4xl font-black text-slate-900 tracking-tighter">{formatCurrency(finalP).split(' ')[0]}</span>
                          <span className="text-lg font-bold text-slate-300 line-through">{formatCurrency(baseP).split(' ')[0]}</span>
                        </div>
                        <div className="mt-1 flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-md w-fit border border-emerald-100">
                          <span className="text-[9px] font-black uppercase tracking-wider">{t('subscriptions.discount_badge', { percent: referralDiscount })}</span>
                        </div>
                      </div>
                    );
                  }
                  return <span className="text-4xl font-black text-slate-900 tracking-tighter">{formatCurrency(plan.price as number).split(' ')[0]}</span>;
                })()}
                <span className="text-sm font-bold text-slate-400">{' ' + t('common.currency')} / {t('subscriptions.duration_month')}</span>
              </div>

              <ul className="flex-1 space-y-4 mb-10 border-t border-slate-50 pt-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm font-bold text-slate-600">
                    <i className="fa-solid fa-circle-check text-indigo-500 text-xs shrink-0"></i>
                    {t(feature.key, feature.params)}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleOpenModal(plan)}
                className={`w-full py-4 rounded-md font-black text-sm transition-all flex items-center justify-center gap-2 ${buttonStyle}`}>
                {buttonText}
                {planIndex > currentIndex && currentIndex !== -1 && <i className="fa-solid fa-arrow-up text-xs animate-bounce"></i>}
              </button>
            </div>
          )
        })}
      </div>

      {/* 3. Special Solutions (Pay-as-you-go & Enterprise) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">

        {/* Enhanced Pay-as-you-go Plan */}
        <div className="bg-gradient-to-br from-amber-50 to-white border-2 border-amber-200 rounded-lg p-10 flex flex-col justify-between relative overflow-hidden group hover:shadow-2xl transition-all border-dashed">
          <div className="absolute top-0 left-0 w-24 h-24 bg-amber-500/5 rounded-br-full -ml-8 -mt-8 transition-transform group-hover:scale-125"></div>

          <div className="space-y-6 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-lg bg-amber-500 text-white flex items-center justify-center text-2xl shadow-lg shadow-amber-100">
                <i className="fa-solid fa-bolt-lightning"></i>
              </div>
              <div>
                <h4 className="text-2xl font-black text-slate-900">{t('subscriptions.payg_title')}</h4>
                <p className="text-[10px] text-amber-600 font-black uppercase tracking-widest mt-1">{t('subscriptions.payg_subtitle')}</p>
              </div>
            </div>

            <p className="text-slate-600 text-sm font-medium leading-relaxed">
              {t('subscriptions.payg_desc')}
            </p>

            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-lg border border-amber-100 flex items-center justify-between">
              <div className="text-right">
                <span className="block text-[10px] font-black text-slate-400 uppercase">{t('subscriptions.payg_cost_per_conf')}</span>
                <span className="text-3xl font-black text-amber-600 tracking-tighter">{formatCurrency(10)}</span>
              </div>
              <ul className="space-y-1.5">
                <li className="text-[11px] font-bold text-slate-500 flex items-center gap-2">
                  <i className="fa-solid fa-circle text-[4px] text-amber-400"></i>
                  {t('subscriptions.payg_benefit_1')}
                </li>
                <li className="text-[11px] font-bold text-slate-500 flex items-center gap-2">
                  <i className="fa-solid fa-circle text-[4px] text-amber-400"></i>
                  {t('subscriptions.payg_benefit_2')}
                </li>
              </ul>
            </div>
          </div>

          <button
            onClick={() => handleOpenModal({ id: 'payg', nameKey: 'subscriptions.payg_title', price: '0' })}
            className="w-full mt-8 bg-slate-900 text-white py-4 rounded-md font-black text-sm hover:bg-slate-800 transition-all shadow-xl shadow-slate-200">
            {t('subscriptions.payg_title')} ({t('subscriptions.top_up')})
          </button>
        </div>

        {/* Enhanced Enterprise / Self-Hosted Plan */}
        <div className="bg-[#0F172A] text-white border border-slate-800 rounded-lg p-10 flex flex-col justify-between relative overflow-hidden group hover:shadow-2xl transition-all">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] -mr-20 -mt-20"></div>

          <div className="space-y-6 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-lg bg-white/10 border border-white/20 text-white flex items-center justify-center text-2xl backdrop-blur-sm">
                <i className="fa-solid fa-server"></i>
              </div>
              <div>
                <h4 className="text-2xl font-black text-white">{t('subscriptions.self_hosted_title')}</h4>
                <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest mt-1">{t('subscriptions.self_hosted_subtitle')}</p>
              </div>
            </div>

            <p className="text-slate-400 text-sm font-medium leading-relaxed">
              {t('subscriptions.self_hosted_desc')}
            </p>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: t('subscriptions.self_hosted_feat_1'), icon: 'fa-shield-halved' },
                { label: t('subscriptions.self_hosted_feat_2'), icon: 'fa-microchip' },
                { label: t('subscriptions.self_hosted_feat_3'), icon: 'fa-code' },
                { label: t('subscriptions.self_hosted_feat_4'), icon: 'fa-sliders' }
              ].map((item, i) => (
                <div key={i} className="bg-white/5 border border-white/5 p-3 rounded-md flex items-center gap-3">
                  <i className={`fa-solid ${item.icon} text-indigo-400 text-xs`}></i>
                  <span className="text-[10px] font-bold text-slate-300">{item.label}</span>
                </div>
              ))}
            </div>

            <div className="pt-6 border-t border-white/5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase">{t('subscriptions.self_hosted_pricing_desc')}</span>
                <span className="text-sm font-black text-indigo-400 bg-indigo-400/10 px-3 py-1 rounded-sm border border-indigo-400/20">{t('subscriptions.on_request')}</span>
              </div>
            </div>
          </div>

          <a
            href="https://wa.me/213779717696"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full mt-8 bg-white text-slate-900 py-4 rounded-md font-black text-sm hover:bg-slate-100 transition-all flex items-center justify-center gap-3 shadow-2xl"
          >
            <i className="fa-solid fa-headset text-base"></i>
            {t('subscriptions.talk_to_experts')}
          </a>
        </div>

      </div>

      {/* Payment History Table */}
      <div className="space-y-4 pt-8 border-t border-slate-100 mt-12">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white shadow-sm flex items-center justify-center text-indigo-600 border border-slate-100">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">{t('subscriptions.payment_history')}</h3>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">{t('common.financials')}</p>
            </div>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-[10px] font-black uppercase hover:bg-slate-50 transition-all">
            <Filter className="w-3.5 h-3.5" /> {t('subscriptions.filter_history')}
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-slate-50/50 text-slate-500 border-b border-slate-100">
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em]">{t('subscriptions.invoice_id')}</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em]">{t('subscriptions.date')}</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em]">{t('subscriptions.plan')}</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em]">{t('subscriptions.amount')}</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em]">{t('subscriptions.method')}</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em]">{t('common.status')}</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-center">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loadingInvoices ? (
                  <tr><td colSpan={7} className="text-center py-10">{t('common.soon')}</td></tr>
                ) : invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/50 transition-all">
                    <td className="px-8 py-4 font-black text-indigo-600 text-[11px] font-mono tracking-widest">#{inv.id}</td>
                    <td className="px-8 py-4 text-[11px] font-bold text-slate-500">{new Date(inv.createdAt).toLocaleDateString(i18n.language)}</td>
                    <td className="px-8 py-4 text-[11px] font-black text-slate-700">
                      {inv.plan}
                      {inv.couponInfo && (
                        <div className="flex items-center gap-1 mt-1">
                          <Tag className="w-2.5 h-2.5 text-indigo-500" />
                          <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-1.5 rounded">{inv.couponInfo.code}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-8 py-4 text-[11px] font-black text-slate-800">{inv.price} {inv.currency}</td>
                    <td className="px-8 py-4 text-[11px] font-bold text-slate-400">{inv.paymentMethod}</td>
                    <td className="px-8 py-4">
                      <span className={`px-3 py-1 rounded-md text-[9px] font-black border uppercase tracking-widest ${inv.status === 'confirmed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                        inv.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                          'bg-rose-50 text-rose-600 border-rose-100'
                        }`}>
                        {inv.status === 'confirmed' ? t('subscriptions.history_status.success') : inv.status === 'pending' ? t('subscriptions.history_status.pending') : t('subscriptions.history_status.failed')}
                      </span>
                    </td>
                    <td className="px-8 py-4 text-center flex justify-center gap-2">
                      <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title={t('subscriptions.download_invoice')}>
                        <Download className="w-4 h-4" />
                      </button>
                      {inv.status === 'pending' && (
                        <button className="p-2 text-amber-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-all" title={t('subscriptions.complete_payment')}>
                          <CreditCard className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* New Subscription Modal */}
      {isModalOpen && selectedPlan && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={handleCloseModal}></div>
          <div className="relative z-10 bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">

            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
              <div>
                <h3 className="text-lg font-black text-slate-800">{t('subscriptions.activate')}</h3>
                <p className="text-[10px] font-bold text-slate-400 mt-1">
                  {t('subscriptions.subtitle')} <span className="text-indigo-600">{selectedPlan.nameKey ? t(selectedPlan.nameKey) : selectedPlan.id}</span>
                </p>
              </div>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-rose-500 transition-colors">
                <i className="fa-solid fa-xmark text-xl"></i>
              </button>
            </div>

            <div className="p-8 overflow-y-auto custom-scrollbar">
              {/* Stepper */}
              <div className="flex items-center justify-center mb-8">
                {[1, 2, 3].map((s) => (
                  <div key={s} className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border-2 transition-all ${step === s ? 'border-indigo-600 bg-indigo-50 text-indigo-600' :
                      step > s ? 'border-emerald-500 bg-emerald-500 text-white' :
                        'border-slate-200 bg-white text-slate-300'
                      }`}>
                      {step > s ? <i className="fa-solid fa-check"></i> : s}
                    </div>
                    {s < 3 && <div className={`w-12 h-1 bg-slate-100 mx-2 ${step > s ? 'bg-emerald-200' : ''}`}></div>}
                  </div>
                ))}
              </div>

              {/* Step 1: Duration */}
              {step === 1 && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                  <h4 className="font-black text-slate-800 text-sm flex items-center gap-3">
                    {selectedPlan.id === 'payg' ? t('subscriptions.choose_points') : t('subscriptions.choose_duration')}
                  </h4>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {selectedPlan.id === 'payg' ? (
                      POINT_BUNDLES.map((bundle) => (
                        <button
                          key={bundle.points}
                          onClick={() => setSelectedPoints(bundle.points)}
                          className={`p-4 rounded-lg border-2 transition-all text-center space-y-2 ${selectedPoints === bundle.points
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-600'
                            : 'border-slate-100 bg-white text-slate-500 hover:border-slate-200'
                            }`}
                        >
                          <h5 className="text-xl font-black">{bundle.points}</h5>
                          <span className="text-[10px] font-bold uppercase">{t('subscriptions.points')}</span>
                          <span className="block text-xs font-bold text-slate-900 mt-1">{formatCurrency(bundle.price).split(' ')[0]}</span>
                          {bundle.discount > 0 && <span className="block text-[9px] text-emerald-600 font-bold bg-emerald-50 rounded-sm px-1">{t('subscriptions.discount_percent', { percent: bundle.discount })}</span>}
                        </button>
                      ))
                    ) : (
                      [1, 3, 6, 12].map((m) => (
                        <button
                          key={m}
                          onClick={() => setDuration(m)}
                          className={`p-4 rounded-lg border-2 transition-all text-center space-y-2 ${duration === m
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-600'
                            : 'border-slate-100 bg-white text-slate-500 hover:border-slate-200'
                            }`}
                        >
                          <h5 className="text-xl font-black">{m}</h5>
                          <span className="text-[10px] font-bold uppercase">{t('subscriptions.months')}</span>
                          {m > 1 && <span className="block text-[9px] text-emerald-600 font-bold bg-emerald-50 rounded-sm px-1">{t('subscriptions.discount')} {(m === 3 ? 5 : m === 6 ? 10 : 15)}%</span>}
                        </button>
                      ))
                    )}
                  </div>

                  {!(user?.company?.affiliate && isFirstPurchase) && (
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 space-y-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value)}
                          placeholder={t('subscriptions.promo_code')}
                          className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-md text-xs font-bold outline-none focus:border-indigo-500"
                        />
                        <button
                          onClick={handleApplyCoupon}
                          disabled={couponLoading}
                          className="px-6 py-3 bg-slate-900 text-white rounded-md text-xs font-black hover:bg-slate-800 disabled:opacity-50"
                        >
                          {couponLoading ? '...' : t('subscriptions.apply')}
                        </button>
                      </div>
                      {couponMsg && (
                        <p className={`text-[10px] font-bold ${couponMsg.type === 'success' ? 'text-emerald-600' : 'text-rose-500'}`}>
                          {couponMsg.text}
                        </p>
                      )}
                    </div>
                  )}

                  {(user?.company?.affiliate && isFirstPurchase) && (
                    <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-lg space-y-2 animate-in zoom-in duration-300">
                      <div className="flex items-center gap-2 text-emerald-700">
                        <i className="fa-solid fa-gift text-sm"></i>
                        <span className="text-xs font-black">{t('subscriptions.auto_discount_title')}</span>
                      </div>
                      <p className="text-[10px] text-emerald-600 font-bold leading-relaxed">
                        {t('subscriptions.auto_discount_desc', { discount: user.company.affiliate.referralDiscount })}
                      </p>
                    </div>
                  )}
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="flex items-center justify-between border-t border-slate-200 pt-4">
                      <span className="text-xs font-black text-slate-500 uppercase">{t('subscriptions.total')}</span>
                      <div className="text-left">
                        <span className="text-2xl font-black text-slate-900">{getDisplayPrice()} <small className="text-sm font-bold text-slate-400">{currency}</small></span>
                        {(user?.company?.affiliate && isFirstPurchase) ? (
                          <p className="text-[9px] font-bold text-emerald-600 text-left mt-0.5">{t('subscriptions.discount_included', { percent: user.company.affiliate.referralDiscount })}</p>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <button onClick={() => setStep(2)} className="w-full py-4 bg-indigo-600 text-white rounded-md font-black text-xs hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20">
                    {t('subscriptions.proceed_payment')}
                  </button>
                </div>
              )}

              {/* Step 2: Payment Method */}
              {step === 2 && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                  <h4 className="font-black text-slate-800 text-sm">{t('subscriptions.payment_method')}</h4>
                  <div className="grid grid-cols-1 gap-4">
                    {[
                      { id: 'ccp', name: t('subscriptions.ccp_title'), icon: 'fa-building-columns', color: 'text-yellow-600 bg-yellow-50', details: '0023555199 79 - ' + t('subscriptions.ccp_name') },
                      { id: 'baridimob', name: 'BaridiMob', icon: 'fa-mobile-screen', color: 'text-blue-600 bg-blue-50', details: '00799999002355519979' },
                      { id: 'redotpay', name: 'RedotPay (USD)', icon: 'fa-credit-card', color: 'text-rose-600 bg-rose-50', details: '1484831242' },
                    ].map((method) => (
                      <button
                        key={method.id}
                        onClick={() => setPaymentMethod(method.id as any)}
                        className={`flex items-center gap-4 p-4 rounded-md border-2 transition-all text-right ${paymentMethod === method.id
                          ? 'border-indigo-600 bg-indigo-50/50'
                          : 'border-slate-100 hover:bg-slate-50'
                          }`}
                      >
                        <div className={`w-12 h-12 rounded-sm flex items-center justify-center text-xl ${method.color}`}>
                          <i className={`fa-brands ${method.icon.includes('paypal') ? '' : 'fa-solid'} ${method.icon}`}></i>
                        </div>
                        <div>
                          <h5 className="font-black text-slate-800 text-sm">{method.name}</h5>
                          {/* @ts-ignore */}
                          <p className="text-[11px] font-bold text-slate-500 mt-1 font-mono">{method.details}</p>
                        </div>
                        {paymentMethod === method.id && <i className="fa-solid fa-circle-check text-indigo-600 mr-auto text-xl"></i>}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-4">
                    <button onClick={() => setStep(1)} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-md font-black text-xs hover:bg-slate-200">{t('common.back')}</button>
                    <button onClick={() => setStep(3)} className="flex-[2] py-4 bg-indigo-600 text-white rounded-md font-black text-xs hover:bg-indigo-700 shadow-lg shadow-indigo-600/20">{t('subscriptions.confirm_method')}</button>
                  </div>
                </div>
              )}

              {/* Step 3: Confirmation & Proof */}
              {step === 3 && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                  <div className="bg-slate-50 p-6 rounded-md border border-slate-200 text-center space-y-4">
                    <p className="text-xs font-bold text-slate-500">
                      {t('subscriptions.send_amount')}: <span className="text-slate-900 font-black tracking-tight">{getDisplayPrice()} {currency}</span> {t('common.to')}:
                    </p>
                    <div
                      className="bg-white p-4 rounded-lg border-2 border-dashed border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all font-mono font-bold text-indigo-600 select-all cursor-pointer group relative"
                      onClick={() => {
                        const text = paymentMethod === 'ccp' ? '0023555199 79' :
                          paymentMethod === 'baridimob' ? '00799999002355519979' :
                            paymentMethod === 'redotpay' ? '1484831242' : '';
                        navigator.clipboard.writeText(text);
                        // Optional: Add a toast notification here
                      }}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-lg">
                          {paymentMethod === 'ccp' && '0023555199 79'}
                          {paymentMethod === 'baridimob' && '00799999002355519979'}
                          {paymentMethod === 'redotpay' && '1484831242'}
                        </span>
                        {paymentMethod === 'ccp' && (
                          <span className="text-xs text-slate-400 font-sans">{t('subscriptions.ccp_name')}</span>
                        )}
                        <i className="fa-solid fa-copy absolute top-2 right-2 text-slate-300 group-hover:text-indigo-400 transition-colors text-xs"></i>
                      </div>
                    </div>
                  </div>

                  <div className="border-2 border-dashed border-slate-300 rounded-md p-8 flex flex-col items-center justify-center text-center hover:bg-indigo-50 hover:border-indigo-300 transition-all cursor-pointer relative">
                    <input type="file" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                    {proofPreview ? (
                      <img src={proofPreview} alt="Proof" className="h-32 object-contain rounded-sm shadow-sm" />
                    ) : (
                      <>
                        <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-3">
                          <i className="fa-solid fa-cloud-arrow-up"></i>
                        </div>
                        <h5 className="font-black text-slate-700 text-xs">{t('subscriptions.upload_proof')}</h5>
                        <p className="text-[10px] text-slate-400 mt-1">{t('subscriptions.upload_proof_desc')}</p>
                      </>
                    )}
                  </div>

                  <div className="flex gap-4">
                    <button onClick={() => setStep(2)} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-md font-black text-xs hover:bg-slate-200">{t('common.back')}</button>
                    <button
                      onClick={() => handleSubmitSubscription(false)}
                      disabled={isSubmitting}
                      className="flex-[2] py-4 bg-emerald-600 text-white rounded-md font-black text-xs hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                      {isSubmitting ? t('common.sending') : t('subscriptions.finish_send')}
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};

export default SubscriptionsView;