import React from 'react';
import { View } from '../types';
import { LayoutDashboard, Users, CheckCircle2, Truck, Box, FileWarning, Wallet, Banknote, FileSpreadsheet, Share2, Map, Store, BookOpen } from 'lucide-react';
import logo from '../assets/logo.png';
import { useOrderNotification } from '../contexts/OrderNotificationContext';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  currentView: View;
  onViewChange: (view: View) => void;
  isOpen: boolean;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onLogout: () => void;
}

interface SidebarItem {
  id: View;
  label: string;
  icon: any;
  hasNotification?: boolean;
  postponedBadge?: number;
  badge?: string;
}

interface SidebarSection {
  title: string;
  items: SidebarItem[];
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange, isOpen, isCollapsed, onToggleCollapse, onLogout }) => {
  const { hasNewOrders, markAsRead, duePostponedCount } = useOrderNotification();
  const { user } = useAuth();

  const handleViewChange = (view: View) => {
    if (view === View.ORDER_CONFIRMATION) {
      markAsRead();
    }
    onViewChange(view);
  };

  const allSections: SidebarSection[] = [
    {
      title: 'الأساسية',
      items: [
        { id: View.DASHBOARD, label: 'الرئيسية', icon: LayoutDashboard },
        { id: View.USERS, label: 'المستخدمين', icon: Users },
      ]
    },
    {
      title: 'العمليات',
      items: [
        {
          id: View.ORDER_CONFIRMATION,
          label: 'تأكيد الطلبيات',
          icon: CheckCircle2,
          hasNotification: hasNewOrders,
          postponedBadge: duePostponedCount
        },
        { id: View.ORDER_ABANDONED, label: 'الطلبات المتروكة', icon: FileWarning },
        { id: View.ORDER_TRACKING, label: 'تتبع الطلبيات', icon: Truck },
        { id: View.INVENTORY, label: 'المخزون', icon: Box },
      ]
    },
    {
      title: 'المالية',
      items: [
        { id: View.FINANCES, label: 'العمليات المالية', icon: Wallet },
        { id: View.FINANCIAL_STATS, label: 'إحصائيات الطلبيات', icon: LayoutDashboard },
        { id: View.SALARIES, label: 'الرواتب والعمولات', icon: Banknote },
      ]
    },
    {
      title: 'الربط والتقنية',
      items: [
        { id: View.SHIPPING_CARRIERS, label: 'شركات التوصيل', icon: Share2 },
        { id: View.SHIPPING_PRICING, label: 'تسعير التوصيل', icon: Map },
        { id: View.STORE_LINKING, label: 'ربط المتاجر', icon: Store },
        { id: View.INTEGRATION_SETTINGS, label: 'Google Sheets', icon: FileSpreadsheet },
        { id: View.API_DOCS, label: 'وثائق الـ API', icon: BookOpen, badge: 'قريباً' },
        { id: View.SUBSCRIPTIONS, label: 'الإشتراكات', icon: Banknote },
      ]
    }
  ];

  const sections = allSections.map(section => ({
    ...section,
    items: section.items.filter(item => {
      if (user?.role === 'admin' || user?.role === 'owner') return true;
      const allowed = [
        View.DASHBOARD,
        View.ORDER_CONFIRMATION,
        View.ORDER_ABANDONED,
        View.ORDER_TRACKING,
        View.FINANCIAL_STATS,
        View.SHIPPING_PRICING
      ];
      return allowed.includes(item.id);
    })
  })).filter(section => section.items.length > 0);

  return (
    <aside className={`
      fixed inset-y-0 right-0 z-50 bg-[#0F172A] text-slate-400 shadow-2xl transition-all duration-300 ease-in-out md:static md:flex md:flex-col
      ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      ${isCollapsed ? 'md:w-20' : 'md:w-64'}
      md:translate-x-0
    `}>
      <div className={`h-16 flex items-center border-b border-slate-800/50 ${isCollapsed ? 'justify-center' : 'justify-between px-6'}`}>
        {/* Logo and Pro Badge */}
        {!isCollapsed ? (
          <>
            <img src={logo} alt="Logo" className="w-16 h-auto object-contain" />
            <div className="bg-amber-400/10 text-amber-400 text-[9px] font-black px-1.5 py-0.5 rounded-md border border-amber-400/20 tracking-wider">PRO</div>
          </>
        ) : (
          <img src={logo} alt="Logo" className="w-8 h-8 object-contain" />
        )}
      </div>

      <nav className="flex-1 px-3 mt-4 space-y-6 overflow-y-auto custom-scrollbar">
        {sections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-1">
            {!isCollapsed && (
              <div className="px-4 mb-2 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">
                {section.title}
              </div>
            )}
            {section.items.map((item) => (
              <button
                key={item.id}
                onClick={() => handleViewChange(item.id)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative
                  ${currentView === item.id
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'hover:bg-slate-800 hover:text-white'
                  }
                  ${isCollapsed ? 'justify-center' : ''}
                `}
              >
                <div className="relative">
                  <item.icon className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 ${currentView === item.id ? 'scale-110' : 'group-hover:scale-110'}`} />
                </div>
                {!isCollapsed && (
                  <div className="flex-1 flex justify-between items-center">
                    <span className="text-[12px] font-bold">{item.label}</span>
                    <div className="flex items-center gap-2">
                      {/* @ts-ignore */}
                      {item.postponedBadge > 0 && (
                        <span className="bg-amber-500 text-white text-[10px] font-black px-2 py-0.5 rounded-md shadow-sm shadow-amber-500/20 animate-pulse">
                          {item.postponedBadge} مؤجل
                        </span>
                      )}
                      {item.badge && <span className="text-[8px] bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded font-black">{item.badge}</span>}
                    </div>
                  </div>
                )}

                {/* Red Dot Notification (New Orders) */}
                {/* @ts-ignore */}
                {item.hasNotification && (
                  <span className={`absolute w-2.5 h-2.5 bg-rose-500 rounded-full animate-pulse shadow-sm shadow-rose-500/50
                    ${isCollapsed ? 'top-2 right-2' : 'top-1/2 -translate-y-1/2 left-3'}
                  `} />
                )}

                {/* Postponed Dot (Collapsed Mode) */}
                {/* @ts-ignore */}
                {item.postponedBadge > 0 && isCollapsed && (
                  <span className="absolute bottom-2 right-2 ml-2 w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse shadow-sm shadow-amber-500/50 border border-[#0F172A]" />
                )}

              </button>
            ))}
          </div>
        ))}
      </nav>


    </aside>
  );
};

export default Sidebar;
