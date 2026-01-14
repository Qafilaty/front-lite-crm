
import React, { useState } from 'react';
import { StatePricing } from '../types';
import { 
  Home, Building2, Save, Search, Zap, CheckCircle2, DollarSign, MapPin, 
  ArrowLeft, ChevronRight, ChevronLeft 
} from 'lucide-react';

const algerianStates = [
  "أدرار", "الشلف", "الأغواط", "أم البواقي", "باتنة", "بجاية", "بسكرة", "بشار", "البليدة", "البويرة",
  "تمنراست", "تبسة", "تلمسان", "تيارت", "تيزي وزو", "الجزائر العاصمة", "الجلفة", "جيجل", "سطيف", "سعيدة",
  "سكيكدة", "سيدي بلعباس", "عنابة", "قالمة", "قسنطينة", "المدية", "مستغانم", "المسيلة", "معسكر", "ورقلة",
  "وهران", "البيض", "إليزي", "برج بوعريريج", "بومرداس", "الطارف", "تندوف", "تيسمسيلت", "الوادي", "خنشلة",
  "سوق أهراس", "تيبازة", "ميلة", "عين الدفلى", "النعامة", "عين تموشنت", "غرداية", "غليزان", "تيميمون", "برج باجي مختار",
  "أولاد جلال", "بني عباس", "عين صالح", "عين قزام", "تقرت", "جانت", "المغير", "المنيعة"
];

const ShippingPricingView: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [pricings, setPricings] = useState<StatePricing[]>(
    algerianStates.map((name, index) => ({
      id: index + 1,
      name,
      homePrice: 500,
      officePrice: 300
    }))
  );

  const [globalHomePrice, setGlobalHomePrice] = useState<number | string>('');
  const [globalOfficePrice, setGlobalOfficePrice] = useState<number | string>('');

  const updatePricing = (id: number, field: keyof StatePricing, value: number) => {
    setPricings(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const applyToAllHome = () => {
    if (globalHomePrice === '') return;
    setPricings(prev => prev.map(p => ({ ...p, homePrice: Number(globalHomePrice) })));
    alert('تم تطبيق السعر على كافة الولايات (للمنزل)');
  };

  const applyToAllOffice = () => {
    if (globalOfficePrice === '') return;
    setPricings(prev => prev.map(p => ({ ...p, officePrice: Number(globalOfficePrice) })));
    alert('تم تطبيق السعر على كافة الولايات (للمكتب)');
  };

  const filteredPricings = pricings.filter(p => p.name.includes(searchTerm));

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">تسعير التوصيل</h2>
          <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest mt-1">إدارة تكاليف الشحن حسب الولايات ونوع التوصيل</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-black text-xs hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20">
          <Save className="w-4 h-4" /> حفظ كافة الأسعار
        </button>
      </div>

      {/* Global Setting Section */}
      <div className="bg-white p-6 rounded-lg border border-slate-100 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <Zap className="w-4 h-4 text-amber-500" />
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">التطبيق الجماعي السريع</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <label className="text-[11px] font-black text-slate-700 flex items-center gap-2">
              <Home className="w-4 h-4 text-indigo-500" /> سعر التوصيل للمنزل (الكل)
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <DollarSign className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                <input 
                  type="number" 
                  value={globalHomePrice}
                  onChange={(e) => setGlobalHomePrice(e.target.value)}
                  placeholder="مثال: 500" 
                  className="w-full pr-10 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                />
              </div>
              <button 
                onClick={applyToAllHome}
                className="px-4 py-3 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase hover:bg-indigo-100 transition-all"
              >
                تطبيق
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[11px] font-black text-slate-700 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-500" /> سعر التوصيل للمكتب (الكل)
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <DollarSign className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                <input 
                  type="number" 
                  value={globalOfficePrice}
                  onChange={(e) => setGlobalOfficePrice(e.target.value)}
                  placeholder="مثال: 300" 
                  className="w-full pr-10 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                />
              </div>
              <button 
                onClick={applyToAllOffice}
                className="px-4 py-3 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase hover:bg-indigo-100 transition-all"
              >
                تطبيق
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* States Grid/Table */}
      <div className="bg-white rounded-lg border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-indigo-500" />
            <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">قائمة الولايات (58 ولاية)</h3>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input 
              type="text" 
              placeholder="ابحث عن ولاية..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-9 pl-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-white text-slate-400 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">الولاية</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">توصيل للمنزل (ر.س)</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">توصيل للمكتب (ر.س)</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-center">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredPricings.map((state) => (
                <tr key={state.id} className="hover:bg-slate-50/80 transition-all">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500">
                        {state.id}
                      </div>
                      <span className="text-[13px] font-black text-slate-800">{state.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="relative w-32 group">
                      <Home className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300 group-focus-within:text-indigo-500" />
                      <input 
                        type="number" 
                        value={state.homePrice}
                        onChange={(e) => updatePricing(state.id, 'homePrice', Number(e.target.value))}
                        className="w-full pr-9 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-black text-slate-700 focus:bg-white focus:border-indigo-400 transition-all outline-none"
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="relative w-32 group">
                      <Building2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300 group-focus-within:text-indigo-500" />
                      <input 
                        type="number" 
                        value={state.officePrice}
                        onChange={(e) => updatePricing(state.id, 'officePrice', Number(e.target.value))}
                        className="w-full pr-9 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-black text-slate-700 focus:bg-white focus:border-indigo-400 transition-all outline-none"
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center">
                       <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Simple Pagination Simulation */}
        <div className="p-4 bg-slate-50/30 border-t border-slate-100 flex justify-center items-center">
           <div className="flex items-center gap-2">
             <button className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
             <div className="flex items-center gap-1 mx-2">
               <button className="w-7 h-7 rounded text-[10px] font-black bg-indigo-600 text-white shadow-sm">1</button>
               <button className="w-7 h-7 rounded text-[10px] font-black bg-white text-slate-400 border border-slate-200">2</button>
               <button className="w-7 h-7 rounded text-[10px] font-black bg-white text-slate-400 border border-slate-200">3</button>
             </div>
             <button className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-indigo-600"><ChevronLeft className="w-4 h-4" /></button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ShippingPricingView;
