import React from 'react';
import { XCircle, AlertTriangle, RefreshCw } from 'lucide-react';

const GoogleSheetsFailedPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center font-['Tajawal']" dir="rtl">
            <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100 max-w-md w-full space-y-6 animate-in zoom-in duration-500">
                <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-2 animate-pulse">
                    <XCircle className="w-10 h-10 text-rose-500" />
                </div>

                <div className="space-y-2">
                    <h1 className="text-2xl font-black text-slate-900">فشل عملية الربط</h1>
                    <p className="text-slate-500 font-bold text-sm leading-relaxed">
                        حدث خطأ أثناء محاولة ربط حساب Google Sheets.
                    </p>
                </div>

                <div className="space-y-3 text-right">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest px-2">الأسباب المحتملة:</p>
                    <div className="bg-amber-50 rounded-xl p-4 border border-amber-100 space-y-3">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                            <p className="text-xs font-bold text-amber-800">لم يتم منح الصلاحيات الكاملة للوصول للملفات.</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                            <p className="text-xs font-bold text-amber-800">انتقال صلاحية جلسة الاتصال (Session Expired).</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                            <p className="text-xs font-bold text-amber-800">المتصفح قام بحظر النافذة المنبثقة أو ملفات الارتباط.</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    <button
                        onClick={() => window.close()}
                        className="w-full py-3 bg-slate-900 text-white rounded-xl font-black hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                    >
                        إغلاق والمحاولة مرة أخرى
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GoogleSheetsFailedPage;
