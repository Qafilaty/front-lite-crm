import React, { useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';

const GoogleSheetsSuccessPage: React.FC = () => {
    useEffect(() => {
        // Notify the opener window that authentication was successful (optional but good practice)
        if (window.opener) {
            window.opener.postMessage({ type: 'GOOGLE_SHEETS_AUTH_SUCCESS' }, '*');
        }

        // Close the window after 5 seconds
        const timer = setTimeout(() => {
            window.close();
        }, 5000);

        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center font-['Tajawal']" dir="rtl">
            <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100 max-w-md w-full space-y-6 animate-in zoom-in duration-500">
                <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-2 animate-bounce">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                </div>

                <div className="space-y-2">
                    <h1 className="text-2xl font-black text-slate-900">تم الربط بنجاح!</h1>
                    <p className="text-slate-500 font-bold text-sm leading-relaxed">
                        تم ربط حساب Google Sheets الخاص بك بنظام WILO بنجاح.
                    </p>
                </div>

                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <p className="text-xs font-bold text-slate-400">سيتم إغلاق هذه النافذة تلقائياً خلال 5 ثواني...</p>
                    <div className="w-full h-1 bg-slate-200 rounded-full mt-3 overflow-hidden">
                        <div className="h-full bg-emerald-500 animate-[width_5s_linear_forwards] w-full origin-right"></div>
                    </div>
                </div>

                <button
                    onClick={() => window.close()}
                    className="w-full py-3 bg-slate-900 text-white rounded-xl font-black hover:bg-slate-800 transition-colors"
                >
                    إغلاق النافذة الآن
                </button>
            </div>
        </div>
    );
};

export default GoogleSheetsSuccessPage;
