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
      soldOrdersNew: analytics.ordinary?.delivered || 0,
      soldUnitsNew: analytics.ordinary?.deliveredUnits || analytics.ordinary?.delivered || 0,
      confirmedOrdersNew: analytics.ordinary?.confirmed || 0, // Added exact count
      totalLeads: analytics.ordinary?.leads || 0,
      newConfRate: Math.round(analytics.ordinary?.confirmationRate || 0),
      newDelivRate: Math.round(analytics.ordinary?.deliveryRate || 0),
      ordinaryTotalCost: analytics.ordinary?.totalCost || 0, // NEW

      // Recovered (Abandoned)
      soldOrdersRecovered: analytics.abandoned?.delivered || 0,
      soldUnitsRecovered: analytics.abandoned?.deliveredUnits || analytics.abandoned?.delivered || 0,
      confirmedOrdersRecovered: analytics.abandoned?.confirmed || 0, // Added exact count
      totalAbandoned: analytics.abandoned?.leads || 0,
      recConfRate: Math.round(analytics.abandoned?.confirmationRate || 0),
      recDelivRate: Math.round(analytics.abandoned?.deliveryRate || 0),
      recoveredTotalCost: analytics.abandoned?.totalCost || 0, // NEW

      variants: analytics.variants.map((v: any) => ({
         name: v.name,
         sku: v.sku || '',
         units: v.ordinary?.leads || 0,
         unitsAbandoned: v.abandoned?.leads || 0,
         sellingPrice: v.sellingPrice || 0,
         revenue: v.revenue || 0,
         totalCost: v.totalCost || 0,
      })),
      totalHistoricalCost: analytics.totalCost || 0 // Global Total Cost from DB
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
   const [customTargetNew, setCustomTargetNew] = useState(100); // Orders
   const [customTargetRecovered, setCustomTargetRecovered] = useState(25); // Orders
   const [simItemsPerOrder, setSimItemsPerOrder] = useState(1); // New input for simulation

   // Product Selector Switcher
   const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
   const [productSearchQuery, setProductSearchQuery] = useState('');

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

      // --- 1. Quantities (Separating Orders vs Units) ---
      // Orders (for Operations: Packaging, Returns, Shipping Fees usually per order)
      const ordersNewDelivered = isReal && product ? product.soldOrdersNew : customTargetNew;
      const ordersRecoveredDelivered = isReal && product ? product.soldOrdersRecovered : customTargetRecovered;
      const totalOrdersDelivered = ordersNewDelivered + ordersRecoveredDelivered;

      // Units (for COGS: Purchase Cost)
      const unitsNewDelivered = isReal && product ? product.soldUnitsNew : (customTargetNew * simItemsPerOrder);
      const unitsRecoveredDelivered = isReal && product ? product.soldUnitsRecovered : (customTargetRecovered * simItemsPerOrder);
      const totalUnitsDelivered = unitsNewDelivered + unitsRecoveredDelivered;

      // Rates (Apply to Orders)
      const newRate = isReal && product ? product.newDelivRate : simNewDeliv;
      const recRate = isReal && product ? product.recDelivRate : simRecDeliv;

      // Confirmed (Orders)
      const ordersNewConfirmed = isReal && product
         ? product.confirmedOrdersNew
         : (newRate > 0 ? ordersNewDelivered / (newRate / 100) : 0);

      const ordersRecConfirmed = isReal && product
         ? product.confirmedOrdersRecovered
         : (recRate > 0 ? ordersRecoveredDelivered / (recRate / 100) : 0);

      const totalOrdersConfirmed = ordersNewConfirmed + ordersRecConfirmed;

      // Returned (Orders)
      const ordersNewReturned = ordersNewConfirmed - ordersNewDelivered;
      const ordersRecReturned = ordersRecConfirmed - ordersRecoveredDelivered;
      const totalOrdersReturned = ordersNewReturned + ordersRecReturned;

      // --- 2. Revenue (Already sums up total price of all items) ---
      let totalRevenue = 0;
      const sortedVariants = isReal && product
         ? [...product.variants].map((v: any) => ({
            ...v,
            profit: v.revenue // Simplified profit tracking
         }))
         : [];

      if (isReal && product) {
         // Sum up revenue from all variants
         product.variants.forEach((v: any) => {
            totalRevenue += v.revenue;
         });
      } else {
         // Simulation: Orders * AvgPrice (Or Units * Price? Usually Price is per piece, but here we simplify)
         // Let's assume customPrice is Selling Price Per Unit
         totalRevenue = totalUnitsDelivered * customPrice;
      }

      // --- 3. Expenses ---
      const costPerUnit = isReal && product ? product.costPrice : customCost;

      // COGS is calculated on UNITS
      // If Real Mode: Use the historical cost from DB (sum of all order costs)
      // If Sim Mode: Use the calculated cost (Units * CustomCost)
      const purchaseCost = (isReal && product)
         ? product.totalHistoricalCost
         : (totalUnitsDelivered * costPerUnit);

      // Marketing (Usually Cost per Lead/Order)
      const confRate = isReal && product ? product.newConfRate : simNewConf;
      const calcTotalLeads = isReal && product ? product.totalLeads : (confRate > 0 ? totalOrdersConfirmed / (confRate / 100) : 0);
      const mktCost = (adsCostUSD * exchangeRate) * calcTotalLeads;

      // Operational Costs (Usually per Order)
      // User requested confirmation cost to be calculated on DELIVERED orders only
      const totalConfCost = totalOrdersDelivered * confirmationFee;
      const totalPackCost = totalOrdersConfirmed * packagingCost;
      const totalReturnsLoss = totalOrdersReturned * returnCost;

      // Insurance (Percentage of Revenue of Delivered items)
      // avgPrice for insurance base
      const avgPriceForIns = totalUnitsDelivered > 0 ? totalRevenue / totalUnitsDelivered : 0;
      const totalInsuranceCost = isInsuranceEnabled ? (totalUnitsDelivered * (avgPriceForIns * (insuranceFee / 100))) : 0; // Simplified to % of total revenue

      const totalExpenses = purchaseCost + mktCost + totalConfCost + totalPackCost + totalReturnsLoss + totalInsuranceCost + otherCosts;

      // --- 4. Net Profit ---
      const netProfit = totalRevenue - totalExpenses;
      const realCPS = totalUnitsDelivered > 0 ? (totalExpenses / totalUnitsDelivered) : 0; // Cost Per Sale (Unit)
      const realProfitPerUnit = totalUnitsDelivered > 0 ? (netProfit / totalUnitsDelivered) : 0; // Profit Per Unit

      // --- 5. Recovered (Simplified for sim) ---
      const avgSellingPrice = isReal ? (totalUnitsDelivered > 0 ? totalRevenue / totalUnitsDelivered : 5000) : customPrice;
      const recoveredRevenue = unitsRecoveredDelivered * avgSellingPrice;
      const recExpenses =
         (isReal && product ? product.recoveredTotalCost : (unitsRecoveredDelivered * costPerUnit)) +
         (ordersRecConfirmed * packagingCost) +
         (ordersRecoveredDelivered * confirmationFee) + // Updated to use Delivered count to match global logic
         (ordersRecReturned * returnCost) +
         (isInsuranceEnabled ? (unitsRecoveredDelivered * avgSellingPrice * (insuranceFee / 100)) : 0);

      const recoveredNetProfit = recoveredRevenue - recExpenses;

      return {
         totalDelivered: totalOrdersDelivered, // For display (Orders usually shown as successes)
         totalUnits: totalUnitsDelivered,
         unitsNewDelivered,
         unitsRecoveredDelivered,
         totalConfirmed: totalOrdersConfirmed,
         totalReturned: totalOrdersReturned,
         totalRevenue,
         totalExpenses,
         netProfit,
         realCPS, // Cost Per Order
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
   }, [mode, selectedProductId, customCost, customPrice, customTargetNew, customTargetRecovered, simItemsPerOrder, simNewConf, simNewDeliv, simRecConf, simRecDeliv, adsCostUSD, exchangeRate, returnCost, insuranceFee, isInsuranceEnabled, packagingCost, confirmationFee, otherCosts, product]);

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
                  disabled
                  className={`px-6 py-2 rounded-md text-xs font-black transition-all flex items-center gap-2 opacity-50 cursor-not-allowed text-slate-400 bg-slate-50 border border-transparent`}
               >
                  <i className="fa-solid fa-wand-magic-sparkles"></i>
                  محاكاة جديدة
                  <span className="bg-slate-200 text-slate-500 text-[9px] px-1.5 py-0.5 rounded">قريباً</span>
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
                           <div className="relative z-50">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 mb-2 block">المنتج المستهدف</label>

                              <div className="relative">
                                 <button
                                    onClick={() => setIsProductDropdownOpen(!isProductDropdownOpen)}
                                    className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 flex items-center justify-between hover:border-indigo-300 hover:shadow-md transition-all group"
                                 >
                                    {selectedProductId ? (
                                       (() => {
                                          const selected = productsList.find((p: any) => p.id === selectedProductId);
                                          return selected ? (
                                             <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                                                   {selected.thumbnail ? (
                                                      <img src={selected.thumbnail} alt={selected.name} className="w-full h-full object-cover" />
                                                   ) : (
                                                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                         <i className="fa-solid fa-image"></i>
                                                      </div>
                                                   )}
                                                </div>
                                                <div className="text-right">
                                                   <p className="text-sm font-black text-slate-800 line-clamp-1">{selected.name}</p>
                                                   <p className="text-[10px] text-slate-400 font-bold">{selected.sku || '---'} | {selected.price?.toLocaleString()} دج</p>
                                                </div>
                                             </div>
                                          ) : <span className="text-slate-400 font-bold">منتج غير موجود</span>;
                                       })()
                                    ) : (
                                       <div className="flex items-center gap-2 text-slate-400">
                                          <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-200 border-dashed flex items-center justify-center">
                                             <i className="fa-solid fa-box-open"></i>
                                          </div>
                                          <span className="font-bold text-sm">اختر منتجاً للتحليل...</span>
                                       </div>
                                    )}
                                    <i className={`fa-solid fa-chevron-down text-slate-400 transition-transform duration-300 ${isProductDropdownOpen ? 'rotate-180 text-indigo-500' : ''}`}></i>
                                 </button>

                                 {/* Dropdown Menu */}
                                 {isProductDropdownOpen && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-50">
                                       {/* Search */}
                                       <div className="p-3 border-b border-slate-100 bg-slate-50/50 sticky top-0">
                                          <div className="relative">
                                             <i className="fa-solid fa-search absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                                             <input
                                                type="text"
                                                placeholder="بحث عن منتج..."
                                                value={productSearchQuery}
                                                onChange={(e) => setProductSearchQuery(e.target.value)}
                                                autoFocus
                                                className="w-full bg-white border border-slate-200 rounded-lg py-2.5 pr-9 pl-3 text-xs font-bold outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/10 transition-all"
                                             />
                                          </div>
                                       </div>

                                       {/* List */}
                                       <div className="max-h-60 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                                          {productsList
                                             .filter((p: any) => p.name.toLowerCase().includes(productSearchQuery.toLowerCase()) || p.sku?.toLowerCase().includes(productSearchQuery.toLowerCase()))
                                             .map((p: any) => (
                                                <button
                                                   key={p.id}
                                                   onClick={() => {
                                                      setSelectedProductId(p.id);
                                                      setIsProductDropdownOpen(false);
                                                      setProductSearchQuery('');
                                                   }}
                                                   className={`w-full flex items-center gap-3 p-2 rounded-lg transition-all text-right group ${selectedProductId === p.id ? 'bg-indigo-50 border border-indigo-100' : 'hover:bg-slate-50 border border-transparent'}`}
                                                >
                                                   <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 overflow-hidden shrink-0 relative">
                                                      {p.thumbnail ? (
                                                         <img src={p.thumbnail} alt={p.name} className="w-full h-full object-cover" />
                                                      ) : (
                                                         <div className="w-full h-full flex items-center justify-center text-slate-200 bg-slate-50">
                                                            <i className="fa-solid fa-image text-xs"></i>
                                                         </div>
                                                      )}
                                                      {selectedProductId === p.id && (
                                                         <div className="absolute inset-0 bg-indigo-500/10 flex items-center justify-center">
                                                            <i className="fa-solid fa-check text-indigo-600 drop-shadow-sm"></i>
                                                         </div>
                                                      )}
                                                   </div>
                                                   <div className="flex-1 min-w-0">
                                                      <p className={`text-xs font-black truncate ${selectedProductId === p.id ? 'text-indigo-700' : 'text-slate-700 group-hover:text-slate-900'}`}>{p.name}</p>
                                                      <div className="flex items-center gap-2 mt-0.5">
                                                         <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 rounded">{p.sku || 'No SKU'}</span>
                                                         <span className="text-[9px] font-bold text-slate-500">{p.price?.toLocaleString()} دج</span>
                                                      </div>
                                                   </div>
                                                   {p.quantity > 0 && (
                                                      <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">{p.quantity}</span>
                                                   )}
                                                </button>
                                             ))}

                                          {productsList.filter((p: any) => p.name.toLowerCase().includes(productSearchQuery.toLowerCase())).length === 0 && (
                                             <div className="p-4 text-center text-slate-400 text-xs font-bold">
                                                لا توجد نتائج
                                             </div>
                                          )}
                                       </div>
                                    </div>
                                 )}
                              </div>

                              {/* Click Outside Handler (SimplifiedOverlay) */}
                              {isProductDropdownOpen && (
                                 <div className="fixed inset-0 z-40" onClick={() => setIsProductDropdownOpen(false)}></div>
                              )}
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
                           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              <div className="space-y-1">
                                 <label className="text-[10px] font-black text-slate-400 uppercase px-1">تكلفة الشراء (دج)</label>
                                 <input type="number" value={customCost} onChange={(e) => setCustomCost(Number(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs font-black outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/10 transition-all" />
                              </div>
                              <div className="space-y-1">
                                 <label className="text-[10px] font-black text-slate-400 uppercase px-1">سعر البيع المستهدف (دج)</label>
                                 <input type="number" value={customPrice} onChange={(e) => setCustomPrice(Number(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs font-black outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/10 transition-all" />
                              </div>
                              <div className="space-y-1">
                                 <label className="text-[10px] font-black text-slate-400 uppercase px-1">متوسط القطع/الطلب</label>
                                 <input type="number" min="1" step="0.1" value={simItemsPerOrder} onChange={(e) => setSimItemsPerOrder(Number(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs font-black outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/10 transition-all" />
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
                              <div className="flex justify-between items-center relative group/info cursor-help">
                                 <div className="flex items-center gap-1">
                                    <label className="text-[10px] font-bold text-slate-500 cursor-help">سعر الإعلان (USD)</label>
                                    <i className="fa-solid fa-circle-info text-slate-300 text-[10px]"></i>
                                    <div className="absolute bottom-full mb-2 -right-2 w-48 p-2 bg-slate-800 text-white text-[10px] font-normal rounded shadow-lg z-20 hidden group-hover/info:block pointer-events-none">
                                       يتم ضرب هذا السعر في عدد الطلبات الإجمالي لحساب تكلفة التسويق الكلية
                                       <div className="absolute -bottom-1 right-4 w-2 h-2 bg-slate-800 rotate-45"></div>
                                    </div>
                                 </div>
                                 <span className="text-[9px] bg-white border border-slate-200 px-1.5 rounded text-slate-400">ADS COST</span>
                              </div>
                              <div className="relative group">
                                 <input type="number" value={adsCostUSD} onChange={(e) => setAdsCostUSD(Number(e.target.value))} className="w-full bg-white border border-slate-200 rounded-lg py-2.5 pl-3 pr-9 text-sm font-black outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-300 transition-all" />
                                 <i className="fa-solid fa-dollar-sign absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm group-focus-within:text-indigo-500 transition-colors"></i>
                              </div>
                           </div>

                           <div className="space-y-1.5">
                              <div className="flex items-center gap-1 relative group/info cursor-help">
                                 <label className="text-[10px] font-bold text-slate-500 cursor-help">سعر الصرف (1$ = DZD)</label>
                                 <i className="fa-solid fa-circle-info text-slate-300 text-[10px]"></i>
                                 <div className="absolute bottom-full mb-2 -right-2 w-48 p-2 bg-slate-800 text-white text-[10px] font-normal rounded shadow-lg z-20 hidden group-hover/info:block pointer-events-none">
                                    سعر صرف الدولار مقابل الدينار الجزائري
                                    <div className="absolute -bottom-1 right-4 w-2 h-2 bg-slate-800 rotate-45"></div>
                                 </div>
                              </div>
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
                                    <div className="flex items-center gap-1 relative group/info cursor-help">
                                       <label className="text-[10px] font-bold text-rose-500 cursor-help">سعر الإرجاع (للطلب)</label>
                                       <i className="fa-solid fa-circle-info text-rose-300 text-[10px]"></i>
                                       <div className="absolute bottom-full mb-2 -right-2 w-48 p-2 bg-slate-800 text-white text-[10px] font-normal rounded shadow-lg z-20 hidden group-hover/info:block pointer-events-none">
                                          تكلفة خسارة كل طلب يتم إرجاعه (رسوم التوصيل + رسوم الإرجاع)
                                          <div className="absolute -bottom-1 right-4 w-2 h-2 bg-slate-800 rotate-45"></div>
                                       </div>
                                    </div>
                                    <input type="number" value={returnCost} onChange={(e) => setReturnCost(Number(e.target.value))} className="w-full bg-rose-50 border border-rose-100 rounded-lg py-2 px-3 text-sm font-black outline-none text-rose-600 focus:ring-2 focus:ring-rose-500/10 focus:border-rose-300 transition-all" />
                                 </div>
                                 <div className="space-y-1.5">
                                    <div className="flex items-center gap-1 relative group/info cursor-help">
                                       <label className="text-[10px] font-bold text-slate-500 cursor-help">التغليف (للطرد)</label>
                                       <i className="fa-solid fa-circle-info text-slate-300 text-[10px]"></i>
                                       <div className="absolute bottom-full mb-2 -right-2 w-48 p-2 bg-slate-800 text-white text-[10px] font-normal rounded shadow-lg z-20 hidden group-hover/info:block pointer-events-none">
                                          تكلفة تغليف وتجهيز كل طلب تم تأكيده
                                          <div className="absolute -bottom-1 right-4 w-2 h-2 bg-slate-800 rotate-45"></div>
                                       </div>
                                    </div>
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
                                          <div className="flex items-center gap-1 relative group/info cursor-help mb-1">
                                             <label className="text-[9px] font-bold text-slate-400 cursor-help">الرسوم للطرد الواحد (%)</label>
                                             <i className="fa-solid fa-circle-info text-slate-300 text-[10px]"></i>
                                             <div className="absolute bottom-full mb-2 -right-2 w-48 p-2 bg-slate-800 text-white text-[10px] font-normal rounded shadow-lg z-20 hidden group-hover/info:block pointer-events-none">
                                                نسبة مئوية من سعر المنتج تقتطع لتأمين الطلبات الموصلة فقط
                                                <div className="absolute -bottom-1 right-4 w-2 h-2 bg-slate-800 rotate-45"></div>
                                             </div>
                                          </div>
                                          <div className="relative group">
                                             <input type="number" value={insuranceFee} onChange={(e) => setInsuranceFee(Number(e.target.value))} className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 pl-8 text-sm font-black outline-none focus:ring-1 focus:ring-indigo-500 transition-all" />
                                             <i className="fa-solid fa-percent absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs group-focus-within:text-indigo-500 transition-colors"></i>
                                          </div>
                                       </div>
                                    </div>
                                 )}
                              </div>

                              {/* Other Costs */}
                              <div className="space-y-1.5">
                                 <div className="flex items-center gap-1 relative group/info cursor-help">
                                    <label className="text-[10px] font-bold text-slate-500 cursor-help">تكاليف إضافية أخرى</label>
                                    <i className="fa-solid fa-circle-info text-slate-300 text-[10px]"></i>
                                    <div className="absolute bottom-full mb-2 -right-2 w-48 p-2 bg-slate-800 text-white text-[10px] font-normal rounded shadow-lg z-20 hidden group-hover/info:block pointer-events-none">
                                       مبلغ ثابت إضافي يضاف إلى إجمالي التكاليف (مثل رواتب، إيجار...)
                                       <div className="absolute -bottom-1 right-4 w-2 h-2 bg-slate-800 rotate-45"></div>
                                    </div>
                                 </div>
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
               {/* Ad Cost Warning */}
               <div className="bg-amber-50 border border-amber-100 rounded-xl p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                     <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center text-lg shrink-0">
                        <i className="fa-solid fa-triangle-exclamation"></i>
                     </div>
                     <h5 className="text-sm font-black text-slate-900">تنبيه هام حول التكاليف</h5>
                  </div>
                  <p className="text-[11px] font-bold text-slate-600 leading-relaxed">
                     التكلفة الإعلانية المحسوبة في هذا التحليل تخص فقط <span className="text-indigo-600">الطلبات الجديدة (Ordinary)</span>، ولا تشمل أي ميزانية إعلانية للطلبات المتروكة (Recovered) حيث نعتبرها أرباحاً صافية بدون تكلفة استحواذ إضافية.
                  </p>
               </div>
            </div>
         </div>
      </div >
   );
};

export default ProfitSimulatorPage;
