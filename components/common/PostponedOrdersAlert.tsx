import React, { useState, useEffect } from 'react';
import { AlertTriangle, X, Clock, ArrowRight } from 'lucide-react';
import { useOrderNotification } from '../../contexts/OrderNotificationContext';
import { useNavigate } from 'react-router-dom';

interface PostponedOrdersAlertProps {
    onFilterPostponed?: () => void;
    deferredCount?: number;
}

const PostponedOrdersAlert: React.FC<PostponedOrdersAlertProps> = ({ onFilterPostponed, deferredCount = 0 }) => {
    // Removed useOrderNotification context usage for count
    const [isVisible, setIsVisible] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        // Check if we should show the alert
        if (deferredCount <= 0) {
            setIsVisible(false);
            return;
        }

        const today = new Date().toISOString().split('T')[0];
        const dimsissedDate = localStorage.getItem('dismissedPostponedAlert');

        if (dimsissedDate !== today) {
            setIsVisible(true);
        }
    }, [deferredCount]);

    const handleDismiss = () => {
        const today = new Date().toISOString().split('T')[0];
        localStorage.setItem('dismissedPostponedAlert', today);
        setIsVisible(false);
    };

    const handleViewOrders = () => {
        if (onFilterPostponed) {
            onFilterPostponed();
        } else {
            // Fallback if used elsewhere without the handler
            navigate('/dashboard/orders?status=postponed');
        }
    };

    if (!isVisible) return null;

    return (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start justify-between shadow-sm animate-in slide-in-from-top-2 duration-300">
            <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                    <Clock className="w-5 h-5" />
                </div>
                <div>
                    <h4 className="font-black text-sm text-amber-900 mb-1">لديك {deferredCount} طلبات مؤجلة تستحق المعالجة اليوم</h4>
                    <p className="text-xs font-bold text-amber-700/80 leading-relaxed max-w-xl">
                        هناك طلبات تم تأجيلها سابقاً وحان موعد التواصل معها اليوم. يرجى مراجعتها واتخاذ الإجراء المناسب.
                    </p>
                    <button
                        onClick={handleViewOrders}
                        className="mt-3 flex items-center gap-2 text-[10px] font-black bg-amber-500 text-white px-3 py-1.5 rounded-lg hover:bg-amber-600 transition-colors shadow-sm shadow-amber-500/20"
                    >
                        <span>عرض الطلبات المؤجلة</span>
                        <ArrowRight className="w-3 h-3 rtl:rotate-180" />
                    </button>
                </div>
            </div>
            <button
                onClick={handleDismiss}
                className="text-amber-400 hover:text-amber-600 hover:bg-amber-100 p-1 rounded-lg transition-colors"
            >
                <X className="w-5 h-5" />
            </button>
        </div>
    );
};

export default PostponedOrdersAlert;
