import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { AlertTriangle, Crown, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SubscriptionWarning: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    if (!user?.company?.plans) return null;

    const { pointes, dateExpiry, name } = user.company.plans;
    const isPayg = name?.toLowerCase() === 'payg' || name?.toLowerCase() === 'pay_as_you_go';

    // Logic for warnings
    const lowPointsThreshold = 20;
    const isLowPoints = (pointes || 0) < lowPointsThreshold;

    let daysLeft = 0;
    if (dateExpiry) {
        const expiry = new Date(dateExpiry);
        const today = new Date();
        const diffTime = expiry.getTime() - today.getTime();
        daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    const isExpiringSoon = !isPayg && daysLeft <= 3 && daysLeft >= 0;
    const isExpired = !isPayg && daysLeft < 0;

    if (!isLowPoints && !isExpiringSoon && !isExpired) return null;

    return (
        <div className="mb-6 animate-in slide-in-from-top-2 duration-500">
            {isExpired ? (
                <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
                            <AlertTriangle className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="text-sm font-black text-rose-700">اشتراكك منتهي الصلاحية!</h4>
                            <p className="text-[11px] font-bold text-rose-500 mt-0.5">توقفت عملية إنشاء الطلبات. يرجى تجديد الاشتراك للمتابعة.</p>
                        </div>
                    </div>
                    <button
                        onClick={() => navigate('/dashboard/subscriptions')}
                        className="px-4 py-2 bg-rose-600 text-white rounded-lg text-xs font-black shadow-lg shadow-rose-600/20 hover:bg-rose-700 transition-all"
                    >
                        تجديد الآن
                    </button>
                </div>
            ) : isExpiringSoon ? (
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
                            <Clock className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="text-sm font-black text-amber-700">اشتراكك ينتهي قريباً ({daysLeft} أيام)</h4>
                            <p className="text-[11px] font-bold text-amber-500 mt-0.5">جدد اشتراكك الآن لتجنب انقطاع الخدمة.</p>
                        </div>
                    </div>
                    <button
                        onClick={() => navigate('/dashboard/subscriptions')}
                        className="px-4 py-2 bg-amber-500 text-white rounded-lg text-xs font-black shadow-lg shadow-amber-500/20 hover:bg-amber-600 transition-all"
                    >
                        تجديد الاشتراك
                    </button>
                </div>
            ) : isLowPoints ? (
                <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
                            <Zap className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="text-sm font-black text-rose-700">رصيد النقاط منخفض ({pointes} نقطة)</h4>
                            <p className="text-[11px] font-bold text-rose-500 mt-0.5">اشحن رصيدك الآن لضمان استمرارية إنشاء الطلبات.</p>
                        </div>
                    </div>
                    <button
                        onClick={() => navigate('/dashboard/subscriptions')}
                        className="px-4 py-2 bg-rose-600 text-white rounded-lg text-xs font-black shadow-lg shadow-rose-600/20 hover:bg-rose-700 transition-all"
                    >
                        شحن الرصيد
                    </button>
                </div>
            ) : null}
        </div>
    );
};

import { Clock } from 'lucide-react';

export default SubscriptionWarning;
