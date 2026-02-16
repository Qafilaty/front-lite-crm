import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useLazyQuery } from '@apollo/client';
import { GET_PRODUCTS_LIST_LITE, GET_PRODUCT_ANALYTICS_SINGLE } from '../../graphql/queries/productQueries';

// Helper to calculate product stats from order statistics
// Helper to map backend format to UI format
// Helper to map backend format to UI format
const processProductData = (analytics: any) => {
   if (!analytics) return null;

   return {
      id: analytics.id,
      name: analytics.name,
      costPrice: analytics.cost || 0,

      // Ordinary (Ads)
      soldUnitsNew: analytics.ordinary?.delivered || 0,
      totalLeads: analytics.ordinary?.leads || 0,
      newConfRate: Math.round(analytics.ordinary?.confirmationRate || 0),
      newDelivRate: Math.round(analytics.ordinary?.deliveryRate || 0),

      // Recovered (Abandoned)
      soldUnitsRecovered: analytics.abandoned?.delivered || 0,
      totalAbandoned: analytics.abandoned?.leads || 0,
      recConfRate: Math.round(analytics.abandoned?.confirmationRate || 0),
      recDelivRate: Math.round(analytics.abandoned?.deliveryRate || 0),

      variants: analytics.variants.map((v: any) => ({
         name: v.name,
         units: v.ordinary?.leads || 0,
         unitsAbandoned: v.abandoned?.leads || 0,
         sellingPrice: v.sellingPrice || 0,
         revenue: v.revenue || 0,

         // Only for table display if needed, but main revenue is v.revenue
         revenueOrdinary: 0,
         revenueAbandoned: 0
      }))
   };
};

const ProfitSimulatorPage: React.FC = () => {
   // 1. Fetch List of Products (Lite)
   const { data: listData, loading: listLoading } = useQuery(GET_PRODUCTS_LIST_LITE, {
      variables: { pagination: { limit: 1000, page: 1 } }
   });

   // 2. Lazy Fetch Single Product Analytics
   const [fetchAnalytics, { data: analyticsData, loading: analyticsLoading, error: analyticsError }] = useLazyQuery(GET_PRODUCT_ANALYTICS_SINGLE, {
      fetchPolicy: 'network-only' // Ensure fresh data
   });

   const productsList = listData?.allProduct?.data || [];

   const [mode, setMode] = useState<'existing' | 'new'>('existing');
   const [selectedProductId, setSelectedProductId] = useState('');

   // Custom Product Inputs (Simulation)
   const [customCost, setCustomCost] = useState(2000);
   const [customPrice, setCustomPrice] = useState(5500);
   const [customTargetNew, setCustomTargetNew] = useState(100);
   const [customTargetRecovered, setCustomTargetRecovered] = useState(25);

   // Simulation Rates
   const [simNewConf, setSimNewConf] = useState(85);
   const [simNewDeliv, setSimNewDeliv] = useState(70);
   const [simRecConf, setSimRecConf] = useState(95);
   const [simRecDeliv, setSimRecDeliv] = useState(85);

   // Marketing & Operations
   const [adsCostUSD, setAdsCostUSD] = useState(0);
   const [exchangeRate, setExchangeRate] = useState(240); // DZD per USD default
   const [returnCost, setReturnCost] = useState(0); // DZD per returned order
   const [packagingCost, setPackagingCost] = useState(0);
   const [confirmationFee, setConfirmationFee] = useState(5);
   const [otherCosts, setOtherCosts] = useState(0);
   const [insuranceFee, setInsuranceFee] = useState(0);
   const [isInsuranceEnabled, setIsInsuranceEnabled] = useState(false);

   // Trigger fetch when selection changes
   useEffect(() => {
      if (selectedProductId && mode === 'existing') {
         fetchAnalytics({ variables: { id: selectedProductId } });
      }
   }, [selectedProductId, mode, fetchAnalytics]);

   // Process fetched single product
   const product = useMemo(() => {
      if (analyticsData?.productAnalytics) {
         return processProductData(analyticsData.productAnalytics);
      }
      return null;
   }, [analyticsData]);

   const analysis = useMemo(() => {
      const isReal = mode === 'existing';

      // In Real Mode, if no product selected or loading, return null
      if (isReal && !product) return null;

      // --- 1. Quantities ---
      const unitsNewDelivered = isReal && product ? product.soldUnitsNew : customTargetNew;
      const unitsRecoveredDelivered = isReal && product ? product.soldUnitsRecovered : customTargetRecovered;
      const totalDelivered = unitsNewDelivered + unitsRecoveredDelivered;

      // Rates
      const newRate = isReal && product ? product.newDelivRate : simNewDeliv;
      const recRate = isReal && product ? product.recDelivRate : simRecDeliv;

      // Confirmed
      const newConfirmed = newRate > 0 ? unitsNewDelivered / (newRate / 100) : 0;
      const recConfirmed = recRate > 0 ? unitsRecoveredDelivered / (recRate / 100) : 0;
      const totalConfirmed = newConfirmed + recConfirmed;

      // Returned
      const newReturned = newConfirmed - unitsNewDelivered;
      const recReturned = recConfirmed - unitsRecoveredDelivered;
      const totalReturned = newReturned + recReturned;

      // --- 2. Revenue ---
      let totalRevenue = 0;
      const sortedVariants = isReal && product
         ? [...product.variants].map((v: any) => ({
            ...v,
            profit: v.revenue // Simplified profit tracking - just showing revenue here as profit logic was undefined
         }))
         : [];

      if (isReal && product) {
         // Sum up revenue from all variants
         product.variants.forEach((v: any) => {
            totalRevenue += v.revenue;
         });
      } else {
         totalRevenue = totalDelivered * customPrice;
      }

      // --- 3. Expenses ---
      const costPerUnit = isReal && product ? product.costPrice : customCost;

      const purchaseCost = totalDelivered * costPerUnit;
      const mktCost = adsCostUSD * exchangeRate;
      const totalConfCost = totalConfirmed * confirmationFee;
      const totalPackCost = totalConfirmed * packagingCost;
      const totalReturnsLoss = totalReturned * returnCost;
      const totalInsuranceCost = isInsuranceEnabled ? (totalConfirmed * insuranceFee) : 0;

      const totalExpenses = purchaseCost + mktCost + totalConfCost + totalPackCost + totalReturnsLoss + totalInsuranceCost + otherCosts;

      // --- 4. Net Profit ---
      const netProfit = totalRevenue - totalExpenses;
      const realCPS = totalDelivered > 0 ? (totalExpenses / totalDelivered) : 0;
      const realProfitPerUnit = totalDelivered > 0 ? (netProfit / totalDelivered) : 0;

      // --- 5. Recovered (Simplified for sim) ---
      const avgSellingPrice = isReal ? (totalDelivered > 0 ? totalRevenue / totalDelivered : 5000) : customPrice;
      const recoveredRevenue = unitsRecoveredDelivered * avgSellingPrice;
      const recExpenses =
         (unitsRecoveredDelivered * costPerUnit) +
         (recConfirmed * packagingCost) +
         (recConfirmed * confirmationFee) +
         (recReturned * returnCost) +
         (isInsuranceEnabled ? (recConfirmed * insuranceFee) : 0);

      const recoveredNetProfit = recoveredRevenue - recExpenses;

      return {
         totalDelivered,
         unitsNewDelivered,
         unitsRecoveredDelivered,
         totalConfirmed,
         totalReturned,
         totalRevenue,
         totalExpenses,
         netProfit,
         realCPS,
         realProfitPerUnit,
         recoveredNetProfit,
         totalConfCost,
         totalPackCost,
         totalReturnsLoss,
         totalInsuranceCost,
         mktCost,
         sortedVariants,
         costPerUnit
      };
   }, [mode, selectedProductId, customCost, customPrice, customTargetNew, customTargetRecovered, simNewConf, simNewDeliv, simRecConf, simRecDeliv, adsCostUSD, exchangeRate, returnCost, insuranceFee, isInsuranceEnabled, packagingCost, confirmationFee, otherCosts, product]);

   if (listLoading) return <div className="p-12 text-center text-slate-400 font-bold">جاري تحميل قائمة المنتجات...</div>;

   return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-24 text-right transform-gpu">

         {/* 1. Header with Mode Switcher */}
         <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
            <div>
               <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${mode === 'existing' ? 'bg-indigo-100 text-indigo-600' : 'bg-amber-100 text-amber-600'}`}>
                     {mode === 'existing' ? 'تحليل الأداء الحقيقي' : 'نموذج التوقع'}
                  </span>
               </div>
               <h2 className="text-2xl font-black text-slate-900 tracking-tight">محاكي الأرباح الذكي</h2>
               <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-widest leading-relaxed">تحليل مالي مفصل للطلبيات الجديدة مقابل المتروكة مع حساب الفائدة الصافية</p>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200">
               <button
                  onClick={() => setMode('existing')}
                  className={`px-6 py-2 rounded-md text-xs font-black transition-all flex items-center gap-2 ${mode === 'existing' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
               >
                  <i className="fa-solid fa-chart-line"></i>
                  بيانات واقعية
               </button>
               <button
                  onClick={() => setMode('new')}
                  className={`px-6 py-2 rounded-md text-xs font-black transition-all flex items-center gap-2 ${mode === 'new' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
               >
                  <i className="fa-solid fa-wand-magic-sparkles"></i>
                  محاكاة جديدة
               </button>
            </div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

            <div className="lg:col-span-2 space-y-6">

               {/* A. Product Data Section */}
               <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                     <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                        <i className="fa-solid fa-box-open text-sm"></i>
                     </div>
                     <h3 className="font-black text-slate-800 text-sm">بيانات المنتج ومعدلات التحصيل</h3>
                  </div>

                  <div className="p-6">
                     {mode === 'existing' ? (
                        <div className="space-y-6">
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">المنتج المستهدف</label>
                              <select
                                 value={selectedProductId}
                                 onChange={(e) => setSelectedProductId(e.target.value)}
                                 className="w-full bg-slate-50 border border-slate-200 rounded-lg py-3 px-4 text-sm font-black text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all hover:bg-slate-100"
                              >
                                 <option value="">-- اختر منتجاً للتحليل --</option>
                                 {productsList.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                              </select>
                           </div>

                           {!selectedProductId ? (
                              <div className="border-2 border-dashed border-slate-200 rounded-xl p-10 flex flex-col items-center justify-center text-center space-y-3">
                                 <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-2">
                                    <i className="fa-solid fa-arrow-pointer text-xl"></i>
                                 </div>
                                 <h4 className="text-slate-400 font-bold text-sm">يرجى اختيار منتج من القائمة أعلاه</h4>
                                 <p className="text-[10px] text-slate-400 max-w-[200px] leading-relaxed">لتحليل الأداء الحقيقي، اختر أحد منتجاتك لرؤية الإحصائيات.</p>
                              </div>
                           ) : analyticsLoading ? (
                              <div className="p-10 text-center space-y-3">
                                 <i className="fa-solid fa-circle-notch fa-spin text-2xl text-indigo-500"></i>
                                 <p className="text-xs font-bold text-slate-500">جاري تحليل بيانات المنتج...</p>
                              </div>
                           ) : !product ? (
                              <div className="p-10 text-center text-rose-500 font-bold text-xs">
                                 فشل تحميل البيانات. يرجى المحاولة مرة أخرى.
                              </div>
                           ) : (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in zoom-in-95 duration-300">
                                 {/* Real New Performance (Ads) */}
                                 <div className="bg-indigo-50/40 border border-indigo-100 p-5 rounded-xl space-y-3 relative group hover:bg-indigo-50/70 transition-colors">
                                    <div className="flex items-center justify-between border-b border-indigo-100/50 pb-2">
                                       <span className="text-[10px] font-black text-indigo-600 uppercase">إجمالي الطلبات (ADS Leads)</span>
                                       <span className="text-lg font-black text-indigo-900">{product.totalLeads} طلب</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                       <div className="text-right">
                                          <p className="text-[9px] font-bold text-slate-400 mb-0.5">نسبة التأكيد (Ordinary)</p>
                                          <p className="text-base font-black text-slate-700">{product.newConfRate}%</p>
                                       </div>
                                       <div className="text-right">
                                          <p className="text-[9px] font-bold text-slate-400 mb-0.5">نسبة التوصيل (Ordinary)</p>
                                          <p className="text-base font-black text-slate-700">{product.newDelivRate}%</p>
                                       </div>
                                    </div>
                                 </div>

                                 {/* Real Recovered Performance */}
                                 <div className="bg-emerald-50/40 border border-emerald-100 p-5 rounded-xl space-y-3 relative group hover:bg-emerald-50/70 transition-colors">
                                    <div className="flex items-center justify-between border-b border-emerald-100/50 pb-2">
                                       <span className="text-[10px] font-black text-emerald-600 uppercase">الطلبات المتروكة (Recovered)</span>
                                       <span className="text-lg font-black text-emerald-900">{product.totalAbandoned} طلب</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                       <div className="text-right">
                                          <p className="text-[9px] font-bold text-slate-400 mb-0.5">نسبة الاستعادة (Recovery)</p>
                                          <p className="text-base font-black text-slate-700">{product.recConfRate}%</p>
                                       </div>
                                       <div className="text-right">
                                          <p className="text-[9px] font-bold text-slate-400 mb-0.5">نسبة التوصيل (متروك)</p>
                                          <p className="text-base font-black text-slate-700">{product.recDelivRate}%</p>
                                       </div>
                                    </div>
                                 </div>
                              </div>
                           )}
                        </div>
                     ) : (
                        <div className="space-y-6">
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-1">
                                 <label className="text-[10px] font-black text-slate-400 uppercase px-1">تكلفة الشراء (دج)</label>
                                 <input type="number" value={customCost} onChange={(e) => setCustomCost(Number(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs font-black outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/10 transition-all" />
                              </div>
                              <div className="space-y-1">
                                 <label className="text-[10px] font-black text-slate-400 uppercase px-1">سعر البيع المستهدف (دج)</label>
                                 <input type="number" value={customPrice} onChange={(e) => setCustomPrice(Number(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs font-black outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/10 transition-all" />
                              </div>
                           </div>

                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Simulation New Rates */}
                              <div className="bg-indigo-50/40 border border-indigo-100 p-5 rounded-xl space-y-3">
                                 <div className="flex items-center justify-between border-b border-indigo-100/50 pb-2">
                                    <span className="text-[10px] font-black text-indigo-600 uppercase">الجديدة (محاكاة)</span>
                                    <input type="number" value={customTargetNew} onChange={(e) => setCustomTargetNew(Number(e.target.value))} className="w-16 bg-white border border-indigo-200 rounded-md text-xs font-black p-1 text-center focus:ring-2 focus:ring-indigo-500/20 outline-none" />
                                 </div>
                                 <div className="grid grid-cols-2 gap-3">
                                    <div className="text-right space-y-1">
                                       <p className="text-[9px] font-bold text-slate-400">تأكيد %</p>
                                       <input type="number" value={simNewConf} onChange={(e) => setSimNewConf(Number(e.target.value))} className="w-full bg-white border border-slate-100 rounded-md text-xs font-black p-1 focus:ring-1 focus:ring-indigo-500 outline-none" />
                                    </div>
                                    <div className="text-right space-y-1">
                                       <p className="text-[9px] font-bold text-slate-400">توصيل %</p>
                                       <input type="number" value={simNewDeliv} onChange={(e) => setSimNewDeliv(Number(e.target.value))} className="w-full bg-white border border-slate-100 rounded-md text-xs font-black p-1 focus:ring-1 focus:ring-indigo-500 outline-none" />
                                    </div>
                                 </div>
                              </div>

                              {/* Simulation Recovered Rates */}
                              <div className="bg-emerald-50/40 border border-emerald-100 p-5 rounded-xl space-y-3">
                                 <div className="flex items-center justify-between border-b border-emerald-100/50 pb-2">
                                    <span className="text-[10px] font-black text-emerald-600 uppercase">المتروكة (محاكاة)</span>
                                    <input type="number" value={customTargetRecovered} onChange={(e) => setCustomTargetRecovered(Number(e.target.value))} className="w-16 bg-white border border-emerald-200 rounded-md text-xs font-black p-1 text-center focus:ring-2 focus:ring-emerald-500/20 outline-none" />
                                 </div>
                                 <div className="grid grid-cols-2 gap-3">
                                    <div className="text-right space-y-1">
                                       <p className="text-[9px] font-bold text-slate-400">تأكيد %</p>
                                       <input type="number" value={simRecConf} onChange={(e) => setSimRecConf(Number(e.target.value))} className="w-full bg-white border border-slate-100 rounded-md text-xs font-black p-1 focus:ring-1 focus:ring-emerald-500 outline-none" />
                                    </div>
                                    <div className="text-right space-y-1">
                                       <p className="text-[9px] font-bold text-slate-400">توصيل %</p>
                                       <input type="number" value={simRecDeliv} onChange={(e) => setSimRecDeliv(Number(e.target.value))} className="w-full bg-white border border-slate-100 rounded-md text-xs font-black p-1 focus:ring-1 focus:ring-emerald-500 outline-none" />
                                    </div>
                                 </div>
                              </div>
                           </div>
                        </div>
                     )}
                  </div>
               </div>

               {/* B. Variants Analysis Table */}
               {mode === 'existing' && analysis && (
                  <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-500">
                     <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                           <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                              <i className="fa-solid fa-layer-group text-sm"></i>
                           </div>
                           <h3 className="font-black text-slate-800 text-sm">ترتيب المتغيرات والأداء</h3>
                        </div>
                        <span className="text-[10px] bg-slate-100 px-2 py-1 rounded text-slate-500 font-bold">حسب صافي الربح</span>
                     </div>

                     <div className="p-6">
                        <div className="overflow-hidden border border-slate-100 rounded-lg">
                           <table className="w-full text-right text-xs">
                              <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                 <tr>
                                    <th className="p-3 w-12 text-center">#</th>
                                    <th className="p-3">المتغير (Variant)</th>
                                    <th className="p-3 text-center text-indigo-600">الطلبات (Ads)</th>
                                    <th className="p-3 text-center text-emerald-600">المتروكة (Rec)</th>
                                    <th className="p-3 text-center">سعر البيع</th>
                                    <th className="p-3 text-left">إجمالي الدخل</th>
                                 </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-50">
                                 {analysis.sortedVariants.map((v: any, i: number) => (
                                    <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                                       <td className="p-3 text-center">
                                          <div className={`w-5 h-5 rounded flex items-center justify-center font-black mx-auto ${i === 0 ? 'bg-amber-100 text-amber-600 border border-amber-200' : 'bg-slate-100 text-slate-400'}`}>
                                             {i + 1}
                                          </div>
                                       </td>
                                       <td className="p-3">
                                          <span className="font-black text-slate-700">{v.name}</span>
                                          {i === 0 && <span className="mr-2 text-[8px] bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded uppercase font-black tracking-widest">الأكثر مبيعاً</span>}
                                       </td>
                                       <td className="p-3 text-center font-black text-indigo-900">{v.units} <span className="text-[9px] text-slate-400 font-normal">طلب</span></td>
                                       <td className="p-3 text-center font-black text-emerald-900">{v.unitsAbandoned} <span className="text-[9px] text-slate-400 font-normal">طلب</span></td>
                                       <td className="p-3 text-center font-black text-indigo-600">{v.sellingPrice.toLocaleString()} دج</td>
                                       <td className="p-3 text-left">
                                          <span className="font-black text-emerald-600">{(v.revenue || 0).toLocaleString()} دج</span>
                                       </td>
                                    </tr>
                                 ))}
                              </tbody>
                           </table>
                        </div>
                     </div>
                  </div>
               )}

               {/* C. COMBINED Marketing & Operational Costs */}
               <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                     <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                        <i className="fa-solid fa-calculator text-sm"></i>
                     </div>
                     <h3 className="font-black text-slate-800 text-sm">التكاليف التشغيلية والتسويقية</h3>
                  </div>

                  <div className="p-6">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative items-start">

                        {/* Left Column: Marketing */}
                        <div className="space-y-5">
                           <h5 className="flex items-center gap-2 text-[11px] font-black text-slate-800 uppercase tracking-widest pb-2 border-b border-slate-100">
                              <i className="fa-solid fa-bullhorn text-indigo-500"></i>
                              التسويق والإعلانات
                           </h5>

                           <div className="bg-indigo-50/30 rounded-xl p-5 border border-indigo-100/50 space-y-4 hover:shadow-sm hover:border-indigo-200 transition-all">
                              <div className="space-y-1.5">
                                 <div className="flex justify-between items-center">
                                    <label className="text-[10px] font-bold text-slate-500">سعر الإعلان (USD)</label>
                                    <span className="text-[9px] bg-white border border-slate-200 px-1.5 rounded text-slate-400">ADS COST</span>
                                 </div>
                                 <div className="relative group">
                                    <input type="number" value={adsCostUSD} onChange={(e) => setAdsCostUSD(Number(e.target.value))} className="w-full bg-white border border-slate-200 rounded-lg py-2.5 pl-3 pr-9 text-sm font-black outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-300 transition-all" />
                                    <i className="fa-solid fa-dollar-sign absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm group-focus-within:text-indigo-500 transition-colors"></i>
                                 </div>
                              </div>

                              <div className="space-y-1.5">
                                 <label className="text-[10px] font-bold text-slate-500">سعر الصرف (1$ = DZD)</label>
                                 <div className="relative group">
                                    <input type="number" value={exchangeRate} onChange={(e) => setExchangeRate(Number(e.target.value))} className="w-full bg-white border border-slate-200 rounded-lg py-2.5 pl-3 pr-9 text-sm font-black outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-300 transition-all" />
                                    <i className="fa-solid fa-money-bill-transfer absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs group-focus-within:text-indigo-500 transition-colors"></i>
                                 </div>
                              </div>

                              <div className="pt-3 border-t border-indigo-100/50 flex items-center justify-between">
                                 <span className="text-[10px] font-bold text-slate-400">إجمالي التكلفة</span>
                                 <span className="text-sm font-black text-indigo-600 bg-white px-2 py-1 rounded border border-indigo-100 shadow-sm">{analysis ? Math.round(analysis.mktCost).toLocaleString() : '0'} دج</span>
                              </div>
                           </div>
                        </div>

                        {/* Divider for large screens */}
                        <div className="hidden md:block absolute left-1/2 top-4 bottom-4 w-px bg-slate-100 -ml-px"></div>

                        {/* Right Column: Operations */}
                        <div className="space-y-5">
                           <h5 className="flex items-center gap-2 text-[11px] font-black text-slate-800 uppercase tracking-widest pb-2 border-b border-slate-100">
                              <i className="fa-solid fa-truck-fast text-emerald-500"></i>
                              اللوجستيك والتكاليف الأخرى
                           </h5>

                           <div className="space-y-4">
                              {/* Returns & Packaging Group */}
                              <div className="grid grid-cols-2 gap-4">
                                 <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-rose-500">سعر الإرجاع (للطلب)</label>
                                    <input type="number" value={returnCost} onChange={(e) => setReturnCost(Number(e.target.value))} className="w-full bg-rose-50 border border-rose-100 rounded-lg py-2 px-3 text-sm font-black outline-none text-rose-600 focus:ring-2 focus:ring-rose-500/10 focus:border-rose-300 transition-all" />
                                 </div>
                                 <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-500">التغليف (للطرد)</label>
                                    <input type="number" value={packagingCost} onChange={(e) => setPackagingCost(Number(e.target.value))} className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-sm font-black outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-300 transition-all" />
                                 </div>
                              </div>

                              {/* Insurance Toggle */}
                              <div className="bg-slate-50 rounded-lg p-3 border border-slate-200/60 flex flex-col gap-3">
                                 <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                       <i className={`fa-solid fa-shield-halved text-xs ${isInsuranceEnabled ? 'text-indigo-500' : 'text-slate-400'}`}></i>
                                       <label className="text-[10px] font-bold text-slate-600 cursor-pointer select-none" onClick={() => setIsInsuranceEnabled(!isInsuranceEnabled)}>تفعيل التأمين على الطرود</label>
                                    </div>
                                    <div
                                       onClick={() => setIsInsuranceEnabled(!isInsuranceEnabled)}
                                       className={`w-8 h-4.5 flex items-center rounded-full p-0.5 cursor-pointer transition-colors ${isInsuranceEnabled ? 'bg-indigo-500' : 'bg-slate-300'}`}
                                    >
                                       <div className={`bg-white w-3.5 h-3.5 rounded-full shadow-sm transform duration-300 ease-in-out ${isInsuranceEnabled ? '-translate-x-3.5' : 'translate-x-0'}`} />
                                    </div>
                                 </div>

                                 {isInsuranceEnabled && (
                                    <div className="animate-in fade-in zoom-in-95 duration-200 pt-2 border-t border-slate-200/50">
                                       <div className="space-y-1">
                                          <label className="text-[9px] font-bold text-slate-400 block mb-1">الرسوم للطرد الواحد</label>
                                          <input type="number" value={insuranceFee} onChange={(e) => setInsuranceFee(Number(e.target.value))} className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-sm font-black outline-none focus:ring-1 focus:ring-indigo-500" />
                                       </div>
                                    </div>
                                 )}
                              </div>

                              {/* Other Costs */}
                              <div className="space-y-1.5">
                                 <label className="text-[10px] font-bold text-slate-500">تكاليف إضافية أخرى</label>
                                 <input type="number" value={otherCosts} onChange={(e) => setOtherCosts(Number(e.target.value))} className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-sm font-black outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-300 transition-all" />
                              </div>
                           </div>
                        </div>
                     </div>

                     {/* Summary Footer */}
                     <div className="mt-8 pt-4 border-t border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center md:text-right">
                           <p className="text-[9px] text-slate-400 font-bold mb-0.5">خسارة المرتجعات</p>
                           <p className="text-xs font-black text-rose-500">{analysis ? Math.round(analysis.totalReturnsLoss).toLocaleString() : '0'} دج</p>
                        </div>
                        <div className="text-center md:text-right">
                           <p className="text-[9px] text-slate-400 font-bold mb-0.5">تكلفة التأكيد</p>
                           <p className="text-xs font-black text-slate-700">{analysis ? Math.round(analysis.totalConfCost).toLocaleString() : '0'} دج</p>
                        </div>
                        <div className="text-center md:text-right">
                           <p className="text-[9px] text-slate-400 font-bold mb-0.5">تكلفة التغليف</p>
                           <p className="text-xs font-black text-slate-700">{analysis ? Math.round(analysis.totalPackCost).toLocaleString() : '0'} دج</p>
                        </div>
                        <div className="text-center md:text-right">
                           <p className="text-[9px] text-slate-400 font-bold mb-0.5">تكلفة التأمين</p>
                           <p className="text-xs font-black text-slate-700">{analysis ? Math.round(analysis.totalInsuranceCost).toLocaleString() : '0'} دج</p>
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            {/* Scoreboard Column */}
            <div className="space-y-6 sticky top-20">

               {/* Total Net Profit Card */}
               <div className="bg-slate-900 rounded-xl p-8 text-white shadow-xl relative overflow-hidden ring-4 ring-slate-100">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-indigo-500"></div>
                  <div className="relative z-10 space-y-8">
                     <div className="text-center space-y-2">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">إجمالي الربح الصافي</p>
                        <h3 className={`text-5xl font-black tracking-tighter ${analysis && analysis.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                           {analysis ? Math.round(analysis.netProfit).toLocaleString() : '---'} <span className="text-xs font-normal opacity-30 italic">دج</span>
                        </h3>
                     </div>

                     <div className="grid grid-cols-1 gap-2">
                        <div className="bg-white/5 border border-white/5 rounded-lg p-4 flex items-center justify-between group hover:bg-white/[0.08] transition-all cursor-default">
                           <div className="text-right">
                              <p className="text-[9px] font-black text-slate-500 uppercase mb-0.5">الربح لكل مبيعة (المتوسط)</p>
                              <p className="text-lg font-black text-emerald-400">{analysis ? Math.round(analysis.realProfitPerUnit).toLocaleString() : '---'} دج</p>
                           </div>
                           <i className="fa-solid fa-coins text-emerald-400 opacity-20 text-lg group-hover:scale-110 transition-transform"></i>
                        </div>

                        <div className="bg-white/5 border border-white/5 rounded-lg p-4 flex items-center justify-between group hover:bg-white/[0.08] transition-all cursor-default">
                           <div className="text-right">
                              <p className="text-[9px] font-black text-slate-500 uppercase mb-0.5">تكلفة المبيعة الواصلة (CPS)</p>
                              <p className="text-lg font-black text-rose-400">{analysis ? Math.round(analysis.realCPS).toLocaleString() : '---'} دج</p>
                           </div>
                           <i className="fa-solid fa-receipt text-rose-400 opacity-20 text-lg group-hover:scale-110 transition-transform"></i>
                        </div>
                     </div>
                  </div>
               </div>

               {/* Recovered Profit Card - Highlighted (No ad costs) */}
               <div className={`bg-emerald-600 rounded-xl p-6 text-white shadow-lg relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300`}>
                  <div className="relative z-10 space-y-3">
                     <div className="flex items-center justify-between">
                        <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center border border-white/20">
                           <i className="fa-solid fa-magnet text-emerald-100"></i>
                        </div>
                        <span className="text-[8px] bg-white/20 px-2 py-0.5 rounded font-black uppercase tracking-widest">صفر تكاليف إعلان</span>
                     </div>
                     <div className="text-right">
                        <p className="text-[10px] font-black text-emerald-100 uppercase tracking-widest mb-0.5">أرباح الطلبيات المتروكة (Recovered)</p>
                        <h4 className="text-2xl font-black">{analysis ? Math.round(analysis.recoveredNetProfit).toLocaleString() : '---'} <span className="text-xs font-normal opacity-60">دج</span></h4>
                     </div>
                     <p className="text-[9px] text-emerald-50 leading-relaxed font-bold italic opacity-80">
                        أرباح صافية بالكامل، بدون ميزانية إعلانية. (متاح في وضع المحاكاة فقط)
                     </p>
                  </div>
               </div>

               {/* Smart Advice */}
               <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                     <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-lg shrink-0">
                        <i className="fa-solid fa-lightbulb"></i>
                     </div>
                     <h5 className="text-sm font-black text-slate-900">نصيحة WILO المالية</h5>
                  </div>
                  <p className="text-[11px] font-bold text-slate-600 leading-relaxed">
                     {analysis ? (analysis.netProfit > 0
                        ? (mode === 'existing' && analysis.sortedVariants.length > 0
                           ? `منتجك يحقق أرباحاً جيدة بصافي ${Math.round(analysis.netProfit).toLocaleString()} دج. تكلفة المبيعة (CPS) هي ${Math.round(analysis.realCPS)} دج. حاول تحسين نسبة الاستلام (${product.newDelivRate}%) لرفع الأرباح أكثر.`
                           : `نموذجك المالي الحالي رابح! بصافي ربح ${Math.round(analysis.netProfit).toLocaleString()} دج. تأكد من ثبات نسب التوصيل المرتفعة للمتروك (${simRecDeliv}%) لضمان استمرار هذه النتائج.`)
                        : `انتبه! تكلفة المبيعة (CPS) الحالية البالغة ${Math.round(analysis.realCPS)} دج مرتفعة جداً مقارنة بسعر التكلفة (${analysis.costPerUnit} دج). حاول رفع سعر البيع أو تقليل ميزانية الإعلان.`) : 'اختر منتجاً للحصول على النصائح.'
                     }
                  </p>
               </div>
            </div>
         </div>

      </div>
   );
};

export default ProfitSimulatorPage;
