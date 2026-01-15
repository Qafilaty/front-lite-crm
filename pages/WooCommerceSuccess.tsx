import React, { useEffect } from 'react';
import { ArrowLeftRight, CheckCircle2 } from 'lucide-react';

const WooCommerceSuccess: React.FC = () => {
    useEffect(() => {
        // Send message to the opener window
        if (window.opener) {
            window.opener.postMessage('success', '*');

            // Close popup after a short delay to allow message to be sent
            setTimeout(() => {
                window.close();
            }, 1000);
        }
    }, []);

    return (
        <div className="h-screen w-screen flex justify-center items-center bg-slate-50">
            <div className="bg-white w-[400px] p-6 rounded-xl border border-slate-200 shadow-xl flex flex-col items-center gap-5 text-center">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center animate-in zoom-in">
                    <CheckCircle2 className="w-8 h-8" />
                </div>

                <div className="space-y-2">
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight">
                        تم الربط بنجاح!
                    </h1>
                    <p className="text-sm font-bold text-slate-400">
                        تمت عملية المصادقة مع متجر WooCommerce بنجاح. يمكنك إغلاق هذه النافذة الآن.
                    </p>
                </div>

                <div className="flex items-center justify-center gap-4 py-4 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                    <img src="/logo.png" className="h-10 w-auto object-contain" alt="Sendibad" onError={(e) => e.currentTarget.style.display = 'none'} />
                    <ArrowLeftRight className="w-5 h-5 text-slate-400" />
                    <img
                        src="https://upload.wikimedia.org/wikipedia/commons/2/2a/WooCommerce_logo.svg"
                        className="h-8 w-auto object-contain"
                        alt="WooCommerce"
                    />
                </div>

                <button
                    onClick={() => window.close()}
                    className="text-xs font-bold text-slate-400 hover:text-slate-600 underline"
                >
                    إغلاق النافذة
                </button>
            </div>
        </div>
    );
}

export default WooCommerceSuccess;
