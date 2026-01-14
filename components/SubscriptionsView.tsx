
import React from 'react';
import { 
  Check, Zap, Crown, Rocket, CreditCard, ArrowRight, ShieldCheck, 
  Clock, Download, AlertCircle, TrendingUp, History, Filter 
} from 'lucide-react';

const SubscriptionsView: React.FC = () => {
  const plans = [
    {
      id: 'pay-as-you-go',
      name: 'الدفع حسب الطلب',
      price: '10',
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
      current: true
    },
    {
      id: 'pro',
      name: 'الخطة الاحترافية',
      price: '2400',
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
      current: false,
      popular: true
    },
    {
      id: 'premium',
      name: 'الربط المتقدم',
      price: '3900',
      unit: 'دج / شهر',
      icon: Crown,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      features: [
        'دخول كامل للـ API',
        'ربط Webhooks فورية',
        'ربط غير محدود للمتاجر',
        'مدير حساب مخصص'
      ],
      current: false
    }
  ];

  const paymentHistory = [
    { id: 'INV-8821', date: '2024-05-15', amount: '2400', plan: 'الاحترافية', method: 'بطاقة ذهبية', status: 'paid' },
    { id: 'INV-8750', date: '2024-04-15', amount: '2400', plan: 'الاحترافية', method: 'CIB', status: 'paid' },
    { id: 'INV-8612', date: '2024-03-15', amount: '500', plan: 'شحن رصيد طلبات', method: 'بريدي موب', status: 'paid' },
    { id: 'INV-8501', date: '2024-02-15', amount: '10', plan: 'تجريبي', method: 'نظام', status: 'failed' },
  ];

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-700">
      {/* Upper Billing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-sm shrink-0">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">حالة الحساب</p>
            <h3 className="text-sm font-black text-slate-800 mt-0.5">نشط - الدفع حسب الطلب</h3>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              <span className="text-[9px] font-bold text-emerald-600">ينتهي في 01 جوان 2024</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-sm shrink-0">
            <TrendingUp className="w-7 h-7" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">الرصيد الحالي</p>
            <h3 className="text-xl font-black text-slate-800 mt-0.5">1,250 <span className="text-[10px]">دج</span></h3>
            <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase">يكفي لـ 125 طلب إضافي</p>
          </div>
        </div>

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
                <span className="text-3xl font-black text-slate-900">{plan.price}</span>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tighter">{plan.unit}</span>
              </div>
            </div>

            <div className="space-y-4 mb-10 flex-1">
              {plan.features.map((feature) => (
                <div key={feature} className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full ${plan.bg} flex items-center justify-center`}>
                    <Check className={`w-3 h-3 ${plan.color} stroke-[3]`} />
                  </div>
                  <span className="text-[11px] font-bold text-slate-600">{feature}</span>
                </div>
              ))}
            </div>

            <button className={`
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
                {paymentHistory.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/50 transition-all">
                    <td className="px-8 py-4 font-black text-indigo-600 text-[11px] font-mono tracking-widest">#{inv.id}</td>
                    <td className="px-8 py-4 text-[11px] font-bold text-slate-500">{inv.date}</td>
                    <td className="px-8 py-4 text-[11px] font-black text-slate-700">{inv.plan}</td>
                    <td className="px-8 py-4 text-[11px] font-black text-slate-800">{inv.amount} دج</td>
                    <td className="px-8 py-4 text-[11px] font-bold text-slate-400">{inv.method}</td>
                    <td className="px-8 py-4">
                      <span className={`px-3 py-1 rounded-lg text-[9px] font-black border uppercase tracking-widest ${
                        inv.status === 'paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                      }`}>
                        {inv.status === 'paid' ? 'ناجحة' : 'فاشلة'}
                      </span>
                    </td>
                    <td className="px-8 py-4 text-center">
                      <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all" title="تحميل الفاتورة">
                        <Download className="w-4 h-4" />
                      </button>
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
