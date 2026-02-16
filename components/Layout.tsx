import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from './Sidebar';
import Header from './Header';
import { View } from '../types';
import ToastNotifications from './common/ToastNotifications';
import PostponedOrdersAlert from './common/PostponedOrdersAlert';
import { useGlobalError } from '../contexts/GlobalErrorContext';
import NetworkErrorScreen from './common/NetworkErrorScreen';
import SubscriptionWarning from './common/SubscriptionWarning';

const Layout: React.FC = () => {
  const { user: authUser, logout } = useAuth();
  const { error, clearError } = useGlobalError();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Fallback user for network error state to prevent crashes
  const user = authUser || {
    id: 'offline',
    name: 'غير متصل',
    email: 'offline@wilo.site',
    role: 'user',
    joinedDate: '-',
    permissions: []
  };

  // تحديد الـ view الحالي من الـ pathname
  const getCurrentView = (): View => {
    const path = location.pathname;
    if (path.includes('/users')) return View.USERS;
    if (path.includes('/orders')) return View.ORDER_CONFIRMATION;
    if (path.includes('/abandoned')) return View.ORDER_ABANDONED;
    if (path.includes('/tracking')) return View.ORDER_TRACKING;
    if (path.includes('/inventory')) return View.INVENTORY;
    if (path.includes('/carriers')) return View.SHIPPING_CARRIERS;
    if (path.includes('/pricing')) return View.SHIPPING_PRICING;
    if (path.includes('/stores')) return View.STORE_LINKING;
    if (path.includes('/api-docs')) return View.API_DOCS;
    if (path.includes('/subscriptions')) return View.SUBSCRIPTIONS;
    if (path.includes('/finances')) return View.FINANCES;
    if (path.includes('/financial-stats')) return View.FINANCIAL_STATS;
    if (path.includes('/salaries')) return View.SALARIES;
    if (path.includes('/profit-simulator')) return View.PROFIT_SIMULATOR;
    if (path.includes('/integration-settings')) return View.INTEGRATION_SETTINGS;
    // Check Dashboard last or exact match
    if (path === '/dashboard' || path === '/dashboard/') return View.DASHBOARD;

    return View.DASHBOARD;
  };

  const currentView = getCurrentView();

  const handleViewChange = (view: View) => {
    const routes: Record<View, string> = {
      [View.DASHBOARD]: '/dashboard',
      [View.USERS]: '/dashboard/users',
      [View.ORDER_CONFIRMATION]: '/dashboard/orders',
      [View.ORDER_ABANDONED]: '/dashboard/abandoned',
      [View.ORDER_TRACKING]: '/dashboard/tracking',
      [View.INVENTORY]: '/dashboard/inventory',
      [View.SHIPPING_CARRIERS]: '/dashboard/carriers',
      [View.SHIPPING_PRICING]: '/dashboard/pricing',
      [View.STORE_LINKING]: '/dashboard/stores',
      [View.INTEGRATION_SETTINGS]: '/dashboard/integration-settings',
      [View.API_DOCS]: '/dashboard/api-docs',
      [View.SUBSCRIPTIONS]: '/dashboard/subscriptions',
      [View.FINANCES]: '/dashboard/finances',
      [View.FINANCIAL_STATS]: '/dashboard/financial-stats',
      [View.SALARIES]: '/dashboard/salaries',
      [View.PROFIT_SIMULATOR]: '/dashboard/profit-simulator',
      [View.LOGIN]: '/login',
      [View.REGISTER]: '/register',
    };
    navigate(routes[view]);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const updateCurrentUser = (updated: any) => {
    // يمكن إضافة منطق تحديث المستخدم هنا
    console.log('Update user:', updated);
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] font-['Tajawal'] text-slate-900 overflow-hidden" dir="rtl">
      <ToastNotifications />
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}
      <Sidebar
        currentView={currentView}
        onViewChange={handleViewChange}
        isOpen={isSidebarOpen}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        onLogout={handleLogout}
      />
      <div className="flex-1 flex flex-col h-screen overflow-hidden transition-all duration-300 ease-in-out">
        <Header
          currentUser={user as any}
          onUpdateUser={updateCurrentUser}
          onMenuClick={() => setIsSidebarOpen(true)}
          currentView={currentView}
          onViewChange={handleViewChange}
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          onLogout={handleLogout}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-8 w-full max-w-[1600px] mx-auto custom-scrollbar">
          {error ? (
            <NetworkErrorScreen
              error={error}
              onRetry={() => {
                clearError();
                window.location.reload();
              }}
            />
          ) : (
            <>
              <SubscriptionWarning />
              <Outlet />
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default Layout;
