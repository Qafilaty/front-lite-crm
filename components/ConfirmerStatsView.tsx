import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useQuery } from '@apollo/client';
import { GET_CONFIRMER_STATS } from '../graphql/queries/statsQueries';
import { ConfirmerStatsSkeleton } from './ConfirmerStatsSkeleton';
import { PaginationControl } from './common';
import { Printer } from 'lucide-react';
import logoBlack from '../assets/logo-black.png';
import { useAuth } from '../contexts/AuthContext';

const CONFIRMATION_STATS_MOCK = [
    { name: 'مؤكدة', value: 78, color: '#4F46E5' },
    { name: 'ملغاة', value: 15, color: '#E11D48' },
    { name: 'مؤجلة', value: 7, color: '#D97706' },
];

const DELIVERY_STATS_MOCK = [
    { name: 'تم التسليم', value: 65, color: '#059669' },
    { name: 'قيد التوصيل', value: 20, color: '#4F46E5' },
    { name: 'مرتجع', value: 15, color: '#E11D48' },
];

export const ConfirmerStatsView: React.FC = () => {
    const { user } = useAuth();
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(5);
    // ...
    const { data: statsData, loading } = useQuery(GET_CONFIRMER_STATS, {
        fetchPolicy: 'network-only' // Ensure fresh data
    });

    if (loading) return <ConfirmerStatsSkeleton />;

    const stats = statsData?.confirmerStats || {};

    // Logic & Data Processing
    // Mapping Backend Data to UI Structure

    // 1. Commission & Rules
    const commissionPrice = stats.commissionPrice || 150;

    // 2. Counts
    const deliveredCount = stats.deliveredCount || 0;
    const postponedCount = stats.postponedCount || 0;

    // 3. Rates
    const confirmationRate = stats.confirmationRate || 0;
    const deliveryRate = stats.deliveryRate || 0;

    // 4. Financials
    const totalEarnings = stats.totalEarnings ?? 0;

    // 5. Pie Charts Data & Logic
    const confirmedCountVal = stats.confirmationBreakdown?.confirmed || 0;

    // Derive Total Orders for "Out of Total" calculation
    // We try to reverse engineer from rate, or sum up if rate invalid
    let totalOrdersEstimate = 0;
    if (stats.confirmationRate > 0 && confirmedCountVal > 0) {
        totalOrdersEstimate = Math.round(confirmedCountVal / (stats.confirmationRate / 100));
    } else {
        // Fallback: Sum of available parts + maybe a buffer? 
        // Better to just sum known parts if rate is missing
        totalOrdersEstimate = (stats.confirmationBreakdown?.confirmed || 0) +
            (stats.confirmationBreakdown?.cancelled || 0) +
            (stats.confirmationBreakdown?.postponed || 0);
    }

    const calcPct = (val: number, total: number) => {
        if (!total || total === 0) return 0;
        return parseFloat(((val / total) * 100).toFixed(1));
    };

    // 1) Confirmation Charts (Base: Total Orders)
    // We use counts for the Pie to show relative distribution of these 3 statuses
    // But we display the % of TOTAL in the label
    // 1) Confirmation Charts (Base: Total Orders)
    const confirmationStatsRaw = stats.confirmationBreakdown ? [
        {
            name: 'مؤكدة',
            count: stats.confirmationBreakdown.confirmed || 0,
            value: calcPct(stats.confirmationBreakdown.confirmed || 0, totalOrdersEstimate),
            color: '#4F46E5'
        },
        {
            name: 'ملغاة',
            count: stats.confirmationBreakdown.cancelled || 0,
            value: calcPct(stats.confirmationBreakdown.cancelled || 0, totalOrdersEstimate),
            color: '#E11D48'
        },
        {
            name: 'مؤجلة',
            count: stats.confirmationBreakdown.postponed || 0,
            value: calcPct(stats.confirmationBreakdown.postponed || 0, totalOrdersEstimate),
            color: '#D97706'
        },
    ] : CONFIRMATION_STATS_MOCK;

    // Calculate 'Other' for Pie Chart visual accuracy (so 50% looks like 50%)
    const confirmationTotalPct = (confirmationStatsRaw as any[]).reduce((acc, curr) => acc + (curr.value || 0), 0);
    // Only add 'Other' if we are using real data (not mock)
    const confirmationChartData = stats.confirmationBreakdown ? [
        ...confirmationStatsRaw,
        { name: 'أخرى', value: Math.max(0, 100 - confirmationTotalPct), color: '#F1F5F9', hidden: true }
    ] : CONFIRMATION_STATS_MOCK;


    // 2) Delivery Charts (Base: Confirmed Orders)
    const deliveryStatsRaw = stats.deliveryBreakdown ? [
        {
            name: 'تم التسليم',
            count: stats.deliveryBreakdown.delivered || 0,
            value: calcPct(stats.deliveryBreakdown.delivered || 0, confirmedCountVal),
            color: '#059669'
        },
        {
            name: 'قيد التوصيل',
            count: stats.deliveryBreakdown.delivering || 0,
            value: calcPct(stats.deliveryBreakdown.delivering || 0, confirmedCountVal),
            color: '#4F46E5'
        },
        {
            name: 'مرتجع',
            count: stats.deliveryBreakdown.returned || 0,
            value: calcPct(stats.deliveryBreakdown.returned || 0, confirmedCountVal),
            color: '#E11D48'
        },
    ] : DELIVERY_STATS_MOCK;

    // Calculate 'Other' for Pie Chart visual accuracy
    const deliveryTotalPct = (deliveryStatsRaw as any[]).reduce((acc, curr) => acc + (curr.value || 0), 0);
    const deliveryChartData = stats.deliveryBreakdown ? [
        ...deliveryStatsRaw,
        { name: 'أخرى', value: Math.max(0, 100 - deliveryTotalPct), color: '#F1F5F9', hidden: true }
    ] : DELIVERY_STATS_MOCK;

    // 6. Invoices
    const invoices = stats.invoices || [];

    // Pagination Logic
    const totalPages = Math.ceil(invoices.length / itemsPerPage);
    const paginatedInvoices = invoices.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handlePrint = (invoice: any) => {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            const date = new Date(invoice.date).toLocaleDateString('ar-DZ');
            const time = new Date(invoice.date).toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' });

            const html = `
        <!DOCTYPE html>
        <html dir="rtl">
        <head>
          <title>وصل دفع - ${invoice.id}</title>
          <meta charset="utf-8">
          <style>
            @page { margin: 0; }
            body { 
                font-family: 'Tajawal', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                background: #fff;
                margin: 0;
                padding: 40px;
                color: #1e293b;
                -webkit-print-color-adjust: exact;
            }
            .invoice-container {
                max-width: 800px;
                margin: 0 auto;
                border: 1px solid #e2e8f0;
                border-radius: 24px;
                padding: 48px;
                position: relative;
                overflow: hidden;
            }
            .watermark {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) rotate(-45deg);
                font-size: 120px;
                color: #f1f5f9;
                font-weight: 900;
                z-index: -1;
                pointer-events: none;
                white-space: nowrap;
            }
            .header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 60px;
                border-bottom: 2px solid #f1f5f9;
                padding-bottom: 32px;
            }
            .logo-section h1 {
                font-size: 32px;
                font-weight: 900;
                color: #4f46e5;
                margin: 0;
                letter-spacing: -1px;
            }
            .logo-section p {
                font-size: 14px;
                color: #64748b;
                margin-top: 8px;
                font-weight: 500;
            }
            .invoice-details {
                text-align: left;
            }
            .status-badge {
                background: #ecfdf5;
                color: #059669;
                padding: 8px 16px;
                border-radius: 99px;
                font-size: 12px;
                font-weight: 800;
                display: inline-block;
                margin-bottom: 12px;
            }
            .invoice-id {
                font-size: 16px;
                font-weight: 700;
                color: #334155;
                font-family: monospace;
            }
            
            .info-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 40px;
                margin-bottom: 48px;
            }
            .info-group h3 {
                font-size: 12px;
                color: #94a3b8;
                text-transform: uppercase;
                letter-spacing: 1px;
                margin: 0 0 12px 0;
                font-weight: 700;
            }
            .info-group .value {
                font-size: 18px;
                font-weight: 700;
                color: #0f172a;
            }
            .info-group .sub-value {
                font-size: 14px;
                color: #64748b;
                margin-top: 4px;
            }

            .summary-card {
                background: #f8fafc;
                border-radius: 20px;
                padding: 32px;
                border: 1px solid #e2e8f0;
            }
            .summary-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 16px;
                padding-bottom: 16px;
                border-bottom: 1px solid #e2e8f0;
            }
            .summary-row:last-child {
                border-bottom: none;
                margin-bottom: 0;
                padding-bottom: 0;
            }
            .summary-row.total {
                border-top: 2px solid #e2e8f0;
                border-bottom: none;
                padding-top: 24px;
                margin-top: 8px;
            }
            .summary-label {
                font-size: 14px;
                color: #64748b;
                font-weight: 600;
            }
            .summary-value {
                font-size: 16px;
                font-weight: 700;
                color: #334155;
            }
            .total .summary-label {
                font-size: 18px;
                color: #0f172a;
                font-weight: 800;
            }
            .total .summary-value {
                font-size: 32px;
                color: #4f46e5;
                font-weight: 900;
            }

            .footer {
                margin-top: 80px;
                text-align: center;
                color: #94a3b8;
                font-size: 12px;
                border-top: 1px solid #f1f5f9;
                padding-top: 32px;
            }
            
            @media print {
                body { padding: 0; }
                .invoice-container { border: none; }
            }
          </style>
          <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap" rel="stylesheet">
        </head>
        <body>
          <div class="invoice-container">
            <div class="watermark">مدفــوع</div>
            
            <div class="header">
              <div class="logo-section">
                <img src="${logoBlack}" alt="Lite CRM" style="height: 50px; margin-bottom: 8px;" />
                <p>نظام إدارة المبيعات والعمولات</p>
              </div>
              <div class="invoice-details">
                <div class="status-badge">تم الدفع بنجاح</div>
                <div class="invoice-id">#${invoice.id.substring(invoice.id.length - 8).toUpperCase()}</div>
              </div>
            </div>

            <div class="info-grid">
              <div class="info-group">
                <h3>معلومات المستفيد</h3>
                <div class="value">${user?.name || '-'}</div>
                <div class="sub-value">${user?.email || ''}</div>
              </div>
              <div class="info-group">
                <h3>تاريخ ووقت المعاملة</h3>
                <div class="value">${date}</div>
                <div class="sub-value">${time}</div>
              </div>
            </div>

            <div class="summary-card">
              <div class="summary-row">
                 <span class="summary-label">ملاحظات</span>
                 <span class="summary-value" style="font-size: 12px;">${invoice.note || '-'}</span>
              </div>
              <div class="summary-row total">
                <span class="summary-label">صافي المبلغ المدفوع</span>
                <span class="summary-value">${(invoice.total || 0).toLocaleString()} دج</span>
              </div>
            </div>

            <div class="footer">
              <p>هذا المستند تم إنشاؤه إلكترونياً وهو يثبت استلام الموظف للمبلغ المذكور أعلاه.</p>
              <p>تاريخ الطباعة: ${new Date().toLocaleString('ar-DZ')}</p>
            </div>
          </div>
        </body>
        </html>
      `;
            printWindow.document.write(html);
            printWindow.document.close();
            setTimeout(() => {
                printWindow.print();
            }, 500);
        }
    };


    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 pb-20 max-w-[1400px] mx-auto text-right">

            {/* 1. Page Header */}
            <div className="flex justify-between items-center border-b border-slate-200 pb-4">
                <div>
                    <h2 className="text-xl font-extrabold text-slate-900">ملخص الأداء والمالية</h2>
                    <p className="text-xs text-slate-500 font-bold mt-1">متابعة دقيقة لمعدلات الإنجاز والأرباح المحققة</p>
                </div>
                <div className="bg-indigo-50 text-indigo-700 px-4 py-1.5 rounded-lg border border-indigo-100 text-[10px] font-black">
                    سعر العمولة: {commissionPrice} دج
                </div>
            </div>

            {/* 2. Top Financial Cards (The Three Cards) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Card 1: Confirmation Rate */}
                <div className="bg-white border border-slate-200 p-6 rounded-lg shadow-sm flex flex-col justify-between h-36">
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">معدل التأكيد</span>
                        <div className="w-8 h-8 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center">
                            <i className="fa-solid fa-check-double text-xs"></i>
                        </div>
                    </div>
                    <div>
                        <h3 className="text-3xl font-black text-slate-900">{confirmationRate}%</h3>
                        <p className="text-[10px] font-bold text-slate-400 mt-1">نسبة الطلبات المؤكدة من الإجمالي</p>
                    </div>
                </div>

                {/* Card 2: Delivery Rate */}
                <div className="bg-white border border-slate-200 p-6 rounded-lg shadow-sm flex flex-col justify-between h-36">
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">معدل التوصيل</span>
                        <div className="w-8 h-8 rounded bg-emerald-50 text-emerald-600 flex items-center justify-center">
                            <i className="fa-solid fa-truck-fast text-xs"></i>
                        </div>
                    </div>
                    <div>
                        <h3 className="text-3xl font-black text-slate-900">{deliveryRate}%</h3>
                        <p className="text-[10px] font-bold text-slate-400 mt-1">نسبة النجاح في التسليم الفعلي</p>
                    </div>
                </div>

                {/* Card 3: Earnings (Delivered x Commission) */}
                <div className="bg-slate-900 text-white p-6 rounded-lg shadow-xl shadow-slate-200 flex flex-col justify-between h-36 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500"></div>
                    <div className="flex justify-between items-center relative z-10">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">أرباح التوصيل ({deliveredCount} طلبية)</span>
                        <i className="fa-solid fa-money-bill-trend-up text-indigo-400 opacity-60"></i>
                    </div>
                    <div className="relative z-10">
                        <h3 className="text-3xl font-black">{totalEarnings.toLocaleString()} <span className="text-sm font-normal opacity-50">دج</span></h3>
                        <p className="text-[9px] font-bold text-indigo-300 mt-1 italic">المبلغ الصافي بناءً على التسليمات</p>
                    </div>
                </div>
            </div>

            {/* 3. Performance Alerts */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {postponedCount > 0 && (
                    <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg flex items-center gap-4">
                        <div className="w-10 h-10 rounded bg-amber-500 text-white flex items-center justify-center shrink-0">
                            <i className="fa-solid fa-hourglass-start"></i>
                        </div>
                        <div>
                            <p className="text-xs font-black text-amber-900">تنبيه: {postponedCount} طلبية مؤجلة</p>
                            <p className="text-[10px] text-amber-700 font-bold">يرجى متابعة الطلبات المؤجلة لرفع نسبة التأكيد.</p>
                        </div>
                    </div>
                )}

                {confirmationRate < 80 && (
                    <div className="bg-rose-50 border border-rose-200 p-4 rounded-lg flex items-center gap-4">
                        <div className="w-10 h-10 rounded bg-rose-500 text-white flex items-center justify-center shrink-0">
                            <i className="fa-solid fa-triangle-exclamation"></i>
                        </div>
                        <div>
                            <p className="text-xs font-black text-rose-900">معدل التأكيد منخفض</p>
                            <p className="text-[10px] text-rose-700 font-bold">المعدل الحالي ({confirmationRate}%) تحت الحد المطلوب.</p>
                        </div>
                    </div>
                )}

                {deliveryRate < 65 && (
                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg flex items-center gap-4">
                        <div className="w-10 h-10 rounded bg-slate-400 text-white flex items-center justify-center shrink-0">
                            <i className="fa-solid fa-chart-line-down"></i>
                        </div>
                        <div>
                            <p className="text-xs font-black text-slate-900">انخفاض في جودة التوصيل</p>
                            <p className="text-[10px] text-slate-500 font-bold">يؤثر هذا الانخفاض مباشرة على عمولاتك المالية.</p>
                        </div>
                    </div>
                )}
            </div>

            {/* 4. Status Breakdown (Pie Charts) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white border border-slate-200 p-6 rounded-lg shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                        <h4 className="text-sm font-black text-slate-800">تحليل الحالات (التأكيد)</h4>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">نتائج الاتصال</span>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                        <div className="flex-1 space-y-2 w-full">
                            {confirmationStatsRaw.map(s => (
                                <div key={s.name} className="flex items-center justify-between bg-slate-50 px-3 py-1.5 rounded border border-slate-100">
                                    <div className="flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.color }}></span>
                                        <span className="text-[10px] font-black text-slate-600">{s.name}</span>
                                    </div>
                                    <span className="text-[11px] font-black" style={{ color: s.color }}>{s.value}%</span>
                                </div>
                            ))}
                        </div>
                        <div className="w-36 h-36 shrink-0 relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={confirmationChartData} innerRadius={45} outerRadius={65} paddingAngle={2} dataKey="value">
                                        {confirmationChartData.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <span className="text-lg font-black text-slate-800">{confirmationRate}%</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white border border-slate-200 p-6 rounded-lg shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                        <h4 className="text-sm font-black text-slate-800">حالات التتبع في الميدان</h4>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">معدل التسليم</span>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                        <div className="flex-1 space-y-2 w-full">
                            {deliveryStatsRaw.map(s => (
                                <div key={s.name} className="flex items-center justify-between bg-slate-50 px-3 py-1.5 rounded border border-slate-100">
                                    <div className="flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.color }}></span>
                                        <span className="text-[10px] font-black text-slate-600">{s.name}</span>
                                    </div>
                                    <span className="text-[11px] font-black" style={{ color: s.color }}>{s.value}%</span>
                                </div>
                            ))}
                        </div>
                        <div className="w-36 h-36 shrink-0 relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={deliveryChartData} innerRadius={45} outerRadius={65} paddingAngle={2} dataKey="value">
                                        {deliveryChartData.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <span className="text-lg font-black text-emerald-600">{deliveryRate}%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 5. Payments History */}
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                    <h4 className="text-sm font-black text-slate-800">تاريخ تسوية الفواتير</h4>
                    <div className="flex items-center gap-2">
                        <span className="text-[9px] font-bold text-slate-400">الإجمالي المسدد: {invoices.reduce((acc: number, curr: any) => acc + (curr.total || 0), 0).toLocaleString()} دج</span>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-right">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="py-3 px-6 text-[9px] font-black text-slate-400 uppercase tracking-widest">المعرف</th>
                                <th className="py-3 px-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">التاريخ</th>
                                <th className="py-3 px-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">المبلغ</th>
                                <th className="py-3 px-6 text-[9px] font-black text-slate-400 uppercase tracking-widest text-left">ملاحظة</th>
                                <th className="py-3 px-6 text-[9px] font-black text-slate-400 uppercase tracking-widest text-left">الحالة</th>
                                <th className="py-3 px-6 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">طباعة</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {paginatedInvoices.length > 0 ? paginatedInvoices.map((inv: any) => (
                                <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="py-3.5 px-6">
                                        <span className="text-[11px] font-black text-indigo-600 tracking-tight">#{inv.id.substring(inv.id.length - 6).toUpperCase()}</span>
                                    </td>
                                    <td className="py-3.5 px-4 text-center">
                                        <span className="text-[10px] font-bold text-slate-500">
                                            {inv.date ? new Date(inv.date).toLocaleDateString('ar-DZ') : '-'}
                                        </span>
                                    </td>
                                    <td className="py-3.5 px-4 text-center">
                                        <span className="text-[11px] font-black text-slate-900">{inv.total?.toLocaleString()} دج</span>
                                    </td>
                                    <td className="py-3.5 px-6 text-left">
                                        <span className="text-[10px] font-bold text-slate-400 truncate max-w-[150px] block" title={inv.note}>
                                            {inv.note || '-'}
                                        </span>
                                    </td>
                                    <td className="py-3.5 px-6 text-left">
                                        <span className="px-2 py-0.5 rounded text-[9px] font-black border bg-emerald-50 text-emerald-600 border-emerald-100">
                                            مدفوعة
                                        </span>
                                    </td>
                                    <td className="py-3.5 px-6 text-center">
                                        <button
                                            onClick={() => handlePrint(inv)}
                                            className="w-8 h-8 flex items-center justify-center rounded-md text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all mx-auto"
                                            title="طباعة وصل"
                                        >
                                            <Printer className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={5} className="py-8 text-center text-[10px] font-bold text-slate-400">لا توجد فواتير سابقة</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {invoices.length > 0 && (
                    <div className="p-4 border-t border-slate-100 bg-slate-50">
                        <PaginationControl
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                            limit={itemsPerPage}
                            onLimitChange={(limit) => { setItemsPerPage(limit); setCurrentPage(1); }}
                            totalItems={invoices.length}
                            isLoading={loading}
                        />
                    </div>
                )}
            </div>

        </div>
    );
};
