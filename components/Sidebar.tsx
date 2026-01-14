
import React from 'react';
import { View } from '../types';
import { LayoutDashboard, Users, CheckCircle2, Truck, Box, LogOut, Zap, ChevronLeft, ChevronRight, Share2, Store, Map, BookOpen } from 'lucide-react';

interface SidebarProps {
  currentView: View;
  onViewChange: (view: View) => void;
  isOpen: boolean;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange, isOpen, isCollapsed, onToggleCollapse, onLogout }) => {
  const sections = [
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
        { id: View.ORDER_CONFIRMATION, label: 'تأكيد الطلبيات', icon: CheckCircle2 },
        { id: View.ORDER_TRACKING, label: 'تتبع الطلبيات', icon: Truck },
        { id: View.INVENTORY, label: 'المخزون', icon: Box },
      ]
    },
    {
      title: 'الربط والتقنية',
      items: [
        { id: View.SHIPPING_CARRIERS, label: 'شركات التوصيل', icon: Share2 },
        { id: View.SHIPPING_PRICING, label: 'تسعير التوصيل', icon: Map },
        { id: View.STORE_LINKING, label: 'ربط المتاجر', icon: Store },
        { id: View.API_DOCS, label: 'وثائق الـ API', icon: BookOpen, badge: 'قريباً' },
      ]
    }
  ];

  return (
    <aside className={`
      fixed inset-y-0 right-0 z-50 bg-[#0F172A] text-slate-400 shadow-2xl transition-all duration-300 ease-in-out md:static md:flex md:flex-col
      ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      ${isCollapsed ? 'md:w-20' : 'md:w-64'}
      md:translate-x-0
    `}>
      <div className={`p-6 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-500 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20 flex-shrink-0">
            <Zap className="w-5 h-5 text-white fill-current" />
          </div>
          {!isCollapsed && <h1 className="text-lg font-black text-white tracking-tight truncate">داش آي</h1>}
        </div>
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
                onClick={() => onViewChange(item.id)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative
                  ${currentView === item.id
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'hover:bg-slate-800 hover:text-white'
                  }
                  ${isCollapsed ? 'justify-center' : ''}
                `}
              >
                <item.icon className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 ${currentView === item.id ? 'scale-110' : 'group-hover:scale-110'}`} />
                {!isCollapsed && (
                  <div className="flex-1 flex justify-between items-center">
                    <span className="text-[12px] font-bold">{item.label}</span>
                    {item.badge && <span className="text-[8px] bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded font-black">{item.badge}</span>}
                  </div>
                )}
              </button>
            ))}
          </div>
        ))}
      </nav>

      <div className="p-4 space-y-2 border-t border-slate-800/50">
        <button 
          onClick={onLogout}
          className={`w-full flex items-center gap-3 px-3 py-2.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all duration-200 group ${isCollapsed ? 'justify-center' : ''}`}>
          <LogOut className="w-5 h-5 flex-shrink-0 group-hover:rotate-12 transition-transform" />
          {!isCollapsed && <span className="text-[12px] font-bold">خروج</span>}
        </button>

        <button 
          onClick={onToggleCollapse}
          className="hidden md:flex w-full items-center justify-center py-2 text-slate-600 hover:text-indigo-400 transition-colors"
        >
          {isCollapsed ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
