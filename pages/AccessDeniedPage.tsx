import React from 'react';
import { ShieldAlert, ArrowRight, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AccessDeniedPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-[calc(100vh-130px)] bg-slate-50 flex items-center justify-center p-4 overflow-hidden relative">
            <div className="relative z-10 max-w-md w-full bg-white/70 backdrop-blur-xl border border-white/60 rounded-3xl p-8 text-center shadow-2xl shadow-indigo-100/50 transform transition-all hover:scale-[1.01] duration-500">
                {/* Icon Animation Wrapper */}
                <div className="relative w-20 h-20 mx-auto mb-6">
                    <div className="absolute inset-0 bg-rose-100/80 rounded-full animate-ping" />
                    <div className="relative z-10 w-full h-full bg-white rounded-full flex items-center justify-center border-2 border-rose-100 shadow-lg shadow-rose-200/50">
                        <Lock className="w-8 h-8 text-rose-500" strokeWidth={1.5} />
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1.5 border border-slate-100 shadow-sm">
                        <ShieldAlert className="w-5 h-5 text-amber-500" />
                    </div>
                </div>

                <h1 className="text-2xl font-black text-slate-800 mb-3 tracking-tight drop-shadow-sm font-['Tajawal']">
                    وصول مقيد
                </h1>

                <p className="text-slate-500 text-sm mb-8 leading-relaxed font-['Tajawal']">
                    عذراً، ليس لديك الصلاحية الكافية للوصول إلى هذه الصفحة.
                    <br className="hidden md:block" />
                    يرجى التواصل مع المسؤول إذا كنت تعتقد أن هذا خطأ.
                </p>

                <div className="flex flex-col gap-3">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="group w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-2 text-sm"
                    >
                        <span>العودة للرئيسية</span>
                        <ArrowRight className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    </button>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100">
                    <p className="text-[10px] text-slate-400 font-mono">
                        ERROR: 403_FORBIDDEN_ACCESS
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AccessDeniedPage;
