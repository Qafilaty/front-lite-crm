import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { deliveryPricingService, wilayasService } from '../services/apiService';
import toast from 'react-hot-toast';
import LoadingSpinner from './common/LoadingSpinner';
import { StatePricing, Wilaya } from '../types';
import {
  Home, Building2, Save, Search, Zap, CheckCircle2, DollarSign, MapPin,
} from 'lucide-react';
import TableSkeleton from './common/TableSkeleton';

// Initial static list removed in favor of API fetching

const ShippingPricingView: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [pricings, setPricings] = useState<StatePricing[]>([]);
  const [pricingId, setPricingId] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  const canEdit = user?.role === 'admin' || user?.role === 'owner';

  const loadData = async () => {
    if (!user?.company?.id) return;

    setLoading(true);
    try {
      // 1. Fetch Pricing First
      const pricingResult = await deliveryPricingService.getAllDeliveryPriceCompany();

      if (pricingResult.success && pricingResult.deliveryPrices && pricingResult.deliveryPrices.length > 0) {
        // --- CASE A: Pricing Exists ---
        const existingData = pricingResult.deliveryPrices[0];
        setPricingId(existingData.id);

        if (existingData.prices && existingData.prices.length > 0) {
          const mappedPricings = existingData.prices.map((p: any) => ({
            id: Number(p.code),
            name: p.name,
            homePrice: p.home || 0,
            officePrice: p.desk || 0
          }));
          // Sort by ID/Code
          mappedPricings.sort((a: any, b: any) => a.id - b.id);
          setPricings(mappedPricings);
        } else {
          // Fallback: Pricing record exists but empty prices array? Should fetch wilayas
          await fetchWilayasAndDefault();
        }

      } else {
        // --- CASE B: No Pricing Found ---
        // Fetch Wilayas to build default list
        await fetchWilayasAndDefault();
      }

    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('حدث خطأ أثناء تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const fetchWilayasAndDefault = async () => {
    const wilayasResult = await wilayasService.getAllWilayas();

    if (wilayasResult.success && wilayasResult.wilayas) {
      const allWilayas = [...wilayasResult.wilayas];
      allWilayas.sort((a, b) => Number(a.code) - Number(b.code));

      const defaultPricings = allWilayas.map((wilaya) => ({
        id: Number(wilaya.code),
        name: wilaya.arName || wilaya.name,
        homePrice: 0,
        officePrice: 0
      }));
      setPricings(defaultPricings);
      setPricingId(null);
    } else {
      toast.error('فشل تحميل قائمة الولايات');
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const [globalHomePrice, setGlobalHomePrice] = useState<number | string>('');
  const [globalOfficePrice, setGlobalOfficePrice] = useState<number | string>('');

  const updatePricing = (id: number, field: keyof StatePricing, value: number) => {
    setPricings(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
    setIsDirty(true);
  };

  const applyToAllHome = () => {
    if (globalHomePrice === '') return;
    setPricings(prev => prev.map(p => ({ ...p, homePrice: Number(globalHomePrice) })));
    setIsDirty(true);
    toast.success('تم تطبيق السعر على كافة الولايات (للمنزل)');
  };

  const applyToAllOffice = () => {
    if (globalOfficePrice === '') return;
    setPricings(prev => prev.map(p => ({ ...p, officePrice: Number(globalOfficePrice) })));
    setIsDirty(true);
    toast.success('تم تطبيق السعر على كافة الولايات (للمكتب)');
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async () => {
    if (!user?.company?.id) return;

    setIsSubmitting(true);
    // const toastId = toast.loading('جاري حفظ الأسعار...');

    // Prepare payload
    const pricesPayload = pricings.map(p => ({
      name: p.name,
      code: p.id.toString().padStart(2, '0'),
      home: Number(p.homePrice),
      desk: Number(p.officePrice),
      blocked: false,
      blockedCommunes: []
    }));

    const payload = {
      name: 'Standard Pricing', // You can make this editable if needed
      isDefault: true,
      prices: pricesPayload
    };

    try {
      let result;
      if (pricingId) {
        // Update existing
        result = await deliveryPricingService.updateDeliveryPrice(pricingId, payload);
      } else {
        // Create new
        result = await deliveryPricingService.createDeliveryPrice(payload);
      }

      if (result.success) {
        toast.success('تم حفظ الأسعار بنجاح');
        setIsDirty(false);
        if (!pricingId && result.deliveryPrice) {
          setPricingId(result.deliveryPrice.id);
        }
        // Reload to ensure sync - REMOVED to prevent reverting to stale data
        // loadData();
      } else {
        toast.error('فشل حفظ الأسعار');
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.error('حدث خطأ أثناء الحفظ');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredPricings = pricings.filter(p => p.name.includes(searchTerm));



  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">تسعير التوصيل</h2>
          <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest mt-1">إدارة تكاليف الشحن حسب الولايات ونوع التوصيل</p>
        </div>
        {isDirty && canEdit && !loading && (
          <button
            onClick={handleSave}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-black text-xs hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 animate-in fade-in slide-in-from-top-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <Save className="w-4 h-4" /> حفظ التغييرات
              </>
            )}
          </button>
        )}
      </div>

      {loading ? (
        <div className="bg-white rounded-lg border border-slate-100 shadow-sm overflow-hidden p-6">
          <TableSkeleton columns={4} rows={10} />
        </div>
      ) : (
        <>
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
                      disabled={!canEdit}
                      value={globalHomePrice}
                      onChange={(e) => setGlobalHomePrice(e.target.value)}
                      placeholder="مثال: 500"
                      className="w-full pr-10 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all disabled:opacity-60"
                    />
                  </div>
                  <button
                    onClick={applyToAllHome}
                    disabled={!canEdit}
                    className="px-4 py-3 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase hover:bg-indigo-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
                      disabled={!canEdit}
                      value={globalOfficePrice}
                      onChange={(e) => setGlobalOfficePrice(e.target.value)}
                      placeholder="مثال: 300"
                      className="w-full pr-10 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all disabled:opacity-60"
                    />
                  </div>
                  <button
                    onClick={applyToAllOffice}
                    disabled={!canEdit}
                    className="px-4 py-3 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase hover:bg-indigo-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">توصيل للمنزل (د.ج)</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">توصيل للمكتب (د.ج)</th>
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
                            disabled={!canEdit}
                            value={state.homePrice}
                            onChange={(e) => updatePricing(state.id, 'homePrice', Number(e.target.value))}
                            className="w-full pr-9 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-black text-slate-700 focus:bg-white focus:border-indigo-400 transition-all outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="relative w-32 group">
                          <Building2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300 group-focus-within:text-indigo-500" />
                          <input
                            type="number"
                            disabled={!canEdit}
                            value={state.officePrice}
                            onChange={(e) => updatePricing(state.id, 'officePrice', Number(e.target.value))}
                            className="w-full pr-9 pl-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-black text-slate-700 focus:bg-white focus:border-indigo-400 transition-all outline-none disabled:opacity-60 disabled:cursor-not-allowed"
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
          </div>
        </>
      )}
    </div>
  );
};

export default ShippingPricingView;
