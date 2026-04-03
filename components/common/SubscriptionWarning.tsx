import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { AlertTriangle, Zap, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const SubscriptionWarning: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { t } = useTranslation();

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
                            <h4 className="text-sm font-black text-rose-700">{t('subscription.warning.expired.title')}</h4>
                            <p className="text-[11px] font-bold text-rose-500 mt-0.5">{t('subscription.warning.expired.desc')}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => navigate('/dashboard/subscriptions')}
                        className="px-4 py-2 bg-rose-600 text-white rounded-lg text-xs font-black shadow-lg shadow-rose-600/20 hover:bg-rose-700 transition-all"
                    >
                        {t('subscription.warning.expired.btn')}
                    </button>
                </div>
            ) : isExpiringSoon ? (
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
                            <Clock className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="text-sm font-black text-amber-700">{t('subscription.warning.expiring_soon.title', { days: daysLeft })}</h4>
                            <p className="text-[11px] font-bold text-amber-500 mt-0.5">{t('subscription.warning.expiring_soon.desc')}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => navigate('/dashboard/subscriptions')}
                        className="px-4 py-2 bg-amber-500 text-white rounded-lg text-xs font-black shadow-lg shadow-amber-500/20 hover:bg-amber-600 transition-all"
                    >
                        {t('subscription.warning.expiring_soon.btn')}
                    </button>
                </div>
            ) : isLowPoints ? (
                <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
                            <Zap className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="text-sm font-black text-rose-700">{t('subscription.warning.low_points.title', { points: pointes })}</h4>
                            <p className="text-[11px] font-bold text-rose-500 mt-0.5">{t('subscription.warning.low_points.desc')}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => navigate('/dashboard/subscriptions')}
                        className="px-4 py-2 bg-rose-600 text-white rounded-lg text-xs font-black shadow-lg shadow-rose-600/20 hover:bg-rose-700 transition-all"
                    >
                        {t('subscription.warning.low_points.btn')}
                    </button>
                </div>
            ) : null}
        </div>
    );
};

export default SubscriptionWarning;
