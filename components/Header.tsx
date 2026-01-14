
import React, { useState } from 'react';
import { Search, Menu, Calendar, PanelRightOpen, PanelRightClose, CreditCard, User, Mail, Phone, Shield, X, LogOut, Save } from 'lucide-react';
import { View, User as UserType } from '../types';

interface HeaderProps {
  currentUser: UserType;
  onUpdateUser: (updated: UserType) => void;
  onMenuClick: () => void;
  currentView: View;
  onViewChange: (view: View) => void;
  isSidebarCollapsed: boolean;
  onToggleCollapse: () => void;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  currentUser, onUpdateUser, onMenuClick, currentView, onViewChange, isSidebarCollapsed, onToggleCollapse, onLogout 
}) => {
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType>({ ...currentUser });

  const getViewTitle = () => {
    switch (currentView) {
      case View.DASHBOARD: return 'الرئيسية';
      case View.USERS: return 'المستخدمين';
      case View.ORDER_CONFIRMATION: return 'تأكيد الطلبيات';
      case View.ORDER_TRACKING: return 'تتبع الطلبيات';
      case View.INVENTORY: return 'المخزون';
      case View.SHIPPING_CARRIERS: return 'شركات التوصيل';
      case View.SHIPPING_PRICING: return 'تسعير التوصيل';
      case View.STORE_LINKING: return 'ربط المتاجر';
      case View.API_DOCS: return 'وثائق الـ API';
      case View.SUBSCRIPTIONS: return 'الاشتراكات والفوترة';
      default: return 'داش آي';
    }
  };

  const today = new Date().toLocaleDateString('ar-SA', { weekday: 'long', day: 'numeric', month: 'long' });

  const handleSaveProfile = () => {
    onUpdateUser(editingUser);
    setIsProfileModalOpen(false);
  };

  return (
    <header className="h-16 bg-white/70 backdrop-blur-xl border-b border-slate-200/50 flex items-center justify-between px-4 md:px-6 sticky top-0 z-30 transition-all duration-300">
      <div className="flex items-center gap-2 md:gap-4">
        <button 
          onClick={onMenuClick}
          className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg md:hidden transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <button 
          onClick={onToggleCollapse}
          className="hidden md:flex p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
        >
          {isSidebarCollapsed ? <PanelRightOpen className="w-5 h-5" /> : <PanelRightClose className="w-5 h-5" />}
        </button>
        
        <div className="hidden sm:block">
          <h2 className="text-sm font-black text-slate-800 tracking-tight">{getViewTitle()}</h2>
          <div className="flex items-center gap-1.5 text-slate-400">
            <Calendar className="w-2.5 h-2.5" />
            <span className="text-[10px] font-bold">{today}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-sm mx-4 hidden lg:block">
        <div className="relative group">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          <input
            type="text"
            placeholder="البحث السريع..."
            className="w-full pr-10 pl-4 py-2 bg-slate-100/50 border-transparent border focus:border-indigo-500/30 focus:bg-white rounded-lg focus:outline-none transition-all text-xs font-medium placeholder:text-slate-400"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        <button 
          onClick={() => onViewChange(View.SUBSCRIPTIONS)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${currentView === View.SUBSCRIPTIONS ? 'bg-indigo-600 text-white shadow-md' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">الاشتراك</span>
        </button>

        <div className="h-6 w-px bg-slate-200/60 mx-1"></div>

        <button 
          onClick={() => {
            setEditingUser({...currentUser});
            setIsProfileModalOpen(true);
          }}
          className="flex items-center gap-2 hover:bg-slate-50 p-1 md:pr-2 rounded-lg transition-all group"
        >
          <div className="text-right hidden sm:block">
            <p className="text-[11px] font-black text-slate-800 leading-none mb-0.5 group-hover:text-indigo-600 transition-colors">{currentUser.name}</p>
            <p className="text-[9px] font-black text-indigo-500 uppercase tracking-tighter">{currentUser.role === 'admin' ? 'أدمن' : 'مؤكد'}</p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center text-white font-black text-xs shadow-sm group-hover:scale-110 transition-transform">
            {currentUser.name.charAt(0)}
          </div>
        </button>
      </div>

      {/* Profile Modal - Perfectly Centered & Fully Responsive */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          {/* Backdrop Overlay Click to close */}
          <div className="absolute inset-0" onClick={() => setIsProfileModalOpen(false)}></div>
          
          <div className="relative bg-white w-full max-w-md rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-10 duration-300 max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="p-6 md:p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest leading-none">إعدادات الحساب</h4>
                    <p className="text-[9px] text-slate-400 font-bold uppercase mt-1 tracking-tighter">تحديث بياناتك الشخصية</p>
                  </div>
               </div>
               <button onClick={() => setIsProfileModalOpen(false)} className="text-slate-400 hover:text-rose-500 p-2 hover:bg-rose-50 rounded-xl transition-all">
                  <X className="w-6 h-6" />
               </button>
            </div>
            
            {/* Scrollable Content */}
            <div className="p-6 md:p-10 space-y-6 overflow-y-auto custom-scrollbar flex-1">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">الاسم الكامل</label>
                <div className="relative">
                  <User className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <input 
                    value={editingUser.name} 
                    onChange={e => setEditingUser({...editingUser, name: e.target.value})}
                    className="w-full pr-12 pl-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">البريد الإلكتروني</label>
                <div className="relative">
                  <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <input 
                    type="email"
                    value={editingUser.email} 
                    onChange={e => setEditingUser({...editingUser, email: e.target.value})}
                    className="w-full pr-12 pl-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">رقم الهاتف</label>
                <div className="relative">
                  <Phone className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <input 
                    value={editingUser.phone} 
                    onChange={e => setEditingUser({...editingUser, phone: e.target.value})}
                    className="w-full pr-12 pl-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="pt-4 grid grid-cols-2 gap-3 sm:gap-4">
                 <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col items-center gap-2 text-center">
                    <Shield className="w-5 h-5 text-indigo-500" />
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">الصلاحية</span>
                    <span className="text-[10px] sm:text-[11px] font-black text-slate-800 truncate w-full">{currentUser.role === 'admin' ? 'مدير كامل' : 'مؤكد طلبات'}</span>
                 </div>
                 <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col items-center gap-2 text-center">
                    <Calendar className="w-5 h-5 text-emerald-500" />
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">انضممت في</span>
                    <span className="text-[10px] sm:text-[11px] font-black text-slate-800">{currentUser.joinedDate}</span>
                 </div>
              </div>
            </div>

            {/* Modal Footer - Fixed at bottom */}
            <div className="p-6 md:p-8 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row gap-3 sm:gap-4 shrink-0">
                <button 
                  onClick={() => {
                    setIsProfileModalOpen(false);
                    onLogout();
                  }}
                  className="order-2 sm:order-1 flex-1 py-4 bg-white border border-rose-100 text-rose-500 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-rose-50 transition-all flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" /> خروج
                </button>
                <button 
                  onClick={handleSaveProfile} 
                  className="order-1 sm:order-2 flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" /> حفظ التغييرات
                </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
