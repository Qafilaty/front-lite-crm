import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { View } from '../types';
import AccessDeniedPage from '../pages/AccessDeniedPage';

interface RequirePermissionProps {
    children: React.ReactNode;
    allowedView: View;
}

export const RequirePermission: React.FC<RequirePermissionProps> = ({ children, allowedView }) => {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#F8FAFC]">
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    // Pre-check: ProtectedRoute usually ensures user exists. But safe guard.
    if (!user) {
        return <AccessDeniedPage />;
    }

    // 1. Admin Access: Always Allow
    if (user.role === 'admin' || user.role === 'owner') {
        return <>{children}</>;
    }

    // 2. Confirmed Access: Restricted List
    if (user.role === 'confirmed') {
        const allowedForConfirmed = [
            View.DASHBOARD,
            View.ORDER_CONFIRMATION,
            View.ORDER_ABANDONED,
            View.ORDER_TRACKING,
            View.FINANCIAL_STATS,
            View.SHIPPING_PRICING
        ];

        if (allowedForConfirmed.includes(allowedView)) {
            return <>{children}</>;
        }
    }

    // 3. Fallback: Access Denied
    return <AccessDeniedPage />;
};
