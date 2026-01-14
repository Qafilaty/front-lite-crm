
import React, { useState, useMemo } from 'react';
import { View, User, Order, Product, SubscriptionTier } from './types';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardView from './components/DashboardView';
import UsersView from './components/UsersView';
import OrderConfirmationView from './components/OrderConfirmationView';
import OrderTrackingView from './components/OrderTrackingView';
import InventoryView from './components/InventoryView';
import ShippingCarriersView from './components/ShippingCarriersView';
import ShippingPricingView from './components/ShippingPricingView';
import StoreLinkingView from './components/StoreLinkingView';
import SubscriptionsView from './components/SubscriptionsView';
import LoginView from './components/LoginView';
import RegisterView from './components/RegisterView';
import ApiDocsView from './components/ApiDocsView';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // حالة الاشتراك المحاكية (يمكنك تغييرها لاختبار السيناريوهات: none, pay_as_you_go, pro, premium)
  const [subscriptionTier, setSubscriptionTier] = useState<SubscriptionTier>(SubscriptionTier.PAY_AS_YOU_GO);

  const [currentUser, setCurrentUser] = useState<User>({
    id: '1',
    name: 'أحمد محمد',
    email: 'ahmed@example.com',
    phone: '0550112233',
    role: 'admin',
    joinedDate: '2023-10-01'
  });

  const [users, setUsers] = useState<User[]>([
    currentUser,
    { id: '2', name: 'سارة خالد', email: 'sara@example.com', role: 'confirmed_orders', joinedDate: '2023-11-15', ordersLocked: false },
  ]);

  const [orders, setOrders] = useState<Order[]>([
    { 
      id: 'ORD-1001', 
      customer: 'كريم بن زياد', 
      phone: '0550123456',
      state: 'الجزائر العاصمة',
      municipality: 'باب الزوار',
      address: 'حي 5 جويلية، عمارة 12',
      deliveryType: 'home',
      items: [
        { name: 'ساعة ذكية Ultra', variant: 'برتقالي - XL', quantity: 1, price: 1200 },
        { name: 'شاحن سريع 20W', variant: 'أبيض', quantity: 2, price: 90 }
      ],
      shippingCost: 50,
      amount: 1430, 
      status: 'pending', 
      storeName: 'متجر تكنو',
      createdAt: '2024-05-20 09:00 ص',
      updatedAt: '2024-05-20 09:00 ص',
      lastStatusDate: '2024-05-20 09:00 ص',
      history: []
    }
  ]);

  const [inventory, setInventory] = useState<Product[]>([
    { 
      id: 'PRD001', 
      name: 'ساعة ذكية Ultra', 
      sku: 'SW-ULT', 
      stock: 45, 
      price: 1200, 
      category: 'إلكترونيات',
      variants: [
        { id: 'v1', name: 'برتقالي - XL', sku: 'SW-ULT-ORG-XL', stock: 15 }
      ]
    }
  ]);

  const stats = useMemo(() => ({
    totalUsers: users.length,
    totalOrders: orders.length,
    revenue: orders.reduce((acc, curr) => acc + curr.amount, 0),
    lowStockItems: inventory.filter(p => p.stock < 10).length,
  }), [users, orders, inventory]);

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentView(View.LOGIN);
  };

  const updateCurrentUser = (updated: User) => {
    setCurrentUser(updated);
    setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
  };

  const renderView = () => {
    if (!isLoggedIn) {
      if (currentView === View.REGISTER) {
        return <RegisterView onLoginRedirect={() => setCurrentView(View.LOGIN)} onRegisterSuccess={() => setIsLoggedIn(true)} />;
      }
      return <LoginView onRegisterRedirect={() => setCurrentView(View.REGISTER)} onLoginSuccess={() => setIsLoggedIn(true)} />;
    }

    switch (currentView) {
      case View.DASHBOARD: 
        return <DashboardView 
          stats={stats} 
          orders={orders} 
          inventory={inventory} 
          subscriptionTier={subscriptionTier}
          onUpgrade={() => setCurrentView(View.SUBSCRIPTIONS)}
        />;
      case View.USERS: return <UsersView users={users} setUsers={setUsers} />;
      case View.ORDER_CONFIRMATION: return <OrderConfirmationView orders={orders} setOrders={setOrders} />;
      case View.ORDER_TRACKING: return <OrderTrackingView orders={orders} setOrders={setOrders} />;
      case View.INVENTORY: return <InventoryView inventory={inventory} setInventory={setInventory} />;
      case View.SHIPPING_CARRIERS: return <ShippingCarriersView />;
      case View.SHIPPING_PRICING: return <ShippingPricingView />;
      case View.STORE_LINKING: return <StoreLinkingView />;
      case View.API_DOCS: return <ApiDocsView />;
      case View.SUBSCRIPTIONS: return <SubscriptionsView />;
      default: return <DashboardView stats={stats} orders={orders} inventory={inventory} subscriptionTier={subscriptionTier} onUpgrade={() => setCurrentView(View.SUBSCRIPTIONS)} />;
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-50 font-['Tajawal']" dir="rtl">
        {renderView()}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] font-['Tajawal'] text-slate-900 overflow-hidden" dir="rtl">
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}
      <Sidebar currentView={currentView} onViewChange={setCurrentView} isOpen={isSidebarOpen} isCollapsed={isSidebarCollapsed} onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} onLogout={handleLogout} />
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out">
        <Header 
          currentUser={currentUser}
          onUpdateUser={updateCurrentUser}
          onMenuClick={() => setIsSidebarOpen(true)} 
          currentView={currentView} 
          onViewChange={setCurrentView} 
          isSidebarCollapsed={isSidebarCollapsed} 
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
          onLogout={handleLogout}
        />
        <main className="p-4 md:p-8 overflow-y-auto w-full max-w-[1600px] mx-auto">
          {renderView()}
        </main>
      </div>
    </div>
  );
};

export default App;
