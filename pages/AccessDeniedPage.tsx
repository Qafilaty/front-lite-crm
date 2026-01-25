import React from 'react';
import { ShieldAlert, ArrowRight, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AccessDeniedPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4 overflow-hidden relative">
            {/* Background Ambience */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-rose-500/10 rounded-full blur-[100px] animate-pulse" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] animate-pulse delay-700" />
            </div>

            <div className="relative z-10 max-w-lg w-full bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 md:p-12 text-center shadow-2xl transform transition-all hover:scale-[1.01] duration-500">

                {/* Icon Animation Wrapper */}
                <div className="relative w-24 h-24 mx-auto mb-8">
                    <div className="absolute inset-0 bg-rose-500/20 rounded-full animate-ping" />
                    <div className="relative z-10 w-full h-full bg-slate-800 rounded-full flex items-center justify-center border-2 border-rose-500/50 shadow-lg shadow-rose-500/20">
                        <Lock className="w-10 h-10 text-rose-500" strokeWidth={1.5} />
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-slate-900 rounded-full p-2 border border-slate-700">
                        <ShieldAlert className="w-6 h-6 text-amber-500 " />
                    </div>
                </div>

                <h1 className="text-3xl md:text-4xl font-black text-white mb-4 tracking-tight drop-shadow-sm font-['Tajawal']">
                    وصول مقيد
                </h1>

                <p className="text-slate-400 text-base md:text-lg mb-8 leading-relaxed font-['Tajawal']">
                    عذراً، ليس لديك الصلاحية الكافية للوصول إلى هذه الصفحة.
                    <br className="hidden md:block" />
                    يرجى التواصل مع المسؤول إذا كنت تعتقد أن هذا خطأ.
                </p>

                <div className="flex flex-col gap-3">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="group w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold py-3.5 px-6 rounded-xl transition-all duration-300 shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2"
                    >
                        <span>العودة للرئيسية</span>
                        <ArrowRight className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    </button>

                    <button
                        onClick={() => window.history.back()}
                        className="w-full bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-white font-semibold py-3.5 px-6 rounded-xl transition-all duration-300 border border-slate-700/50 hover:border-slate-600"
                    >
                        الرجوع للصفحة السابقة
                    </button>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-800/50">
                    <p className="text-xs text-slate-600 font-mono">
                        ERROR: 403_FORBIDDEN_ACCESS
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AccessDeniedPage;
