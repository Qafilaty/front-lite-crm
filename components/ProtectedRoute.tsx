import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useGlobalError } from '../contexts/GlobalErrorContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const { error } = useGlobalError();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50" dir="rtl">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-slate-600 font-bold">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  // If there is a global network error, allow rendering (to show the error screen inside Layout)
  // even if not authenticated
  if (!isAuthenticated && !error) {
    // حفظ الموقع الحالي لإعادة التوجيه بعد تسجيل الدخول
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
