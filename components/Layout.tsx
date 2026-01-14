import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from './Sidebar';
import Header from './Header';
import { View } from '../types';

const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // تحديد الـ view الحالي من الـ pathname
  const getCurrentView = (): View => {
    const path = location.pathname;
    if (path.includes('/dashboard')) return View.DASHBOARD;
    if (path.includes('/users')) return View.USERS;
    if (path.includes('/orders')) return View.ORDER_CONFIRMATION;
    if (path.includes('/tracking')) return View.ORDER_TRACKING;
    if (path.includes('/inventory')) return View.INVENTORY;
    if (path.includes('/carriers')) return View.SHIPPING_CARRIERS;
    if (path.includes('/pricing')) return View.SHIPPING_PRICING;
    if (path.includes('/stores')) return View.STORE_LINKING;
    if (path.includes('/api-docs')) return View.API_DOCS;
    if (path.includes('/subscriptions')) return View.SUBSCRIPTIONS;
    return View.DASHBOARD;
  };

  const currentView = getCurrentView();

  const handleViewChange = (view: View) => {
    const routes: Record<View, string> = {
      [View.DASHBOARD]: '/dashboard',
      [View.USERS]: '/users',
      [View.ORDER_CONFIRMATION]: '/orders',
      [View.ORDER_TRACKING]: '/tracking',
      [View.INVENTORY]: '/inventory',
      [View.SHIPPING_CARRIERS]: '/carriers',
      [View.SHIPPING_PRICING]: '/pricing',
      [View.STORE_LINKING]: '/stores',
      [View.API_DOCS]: '/api-docs',
      [View.SUBSCRIPTIONS]: '/subscriptions',
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
    <div className="flex min-h-screen bg-[#F8FAFC] font-['Tajawal'] text-slate-900 overflow-hidden" dir="rtl">
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
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out">
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
        <main className="p-4 md:p-8 overflow-y-auto w-full max-w-[1600px] mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
