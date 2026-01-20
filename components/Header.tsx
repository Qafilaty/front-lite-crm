import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { Search, Menu, Calendar, PanelRightOpen, PanelRightClose, CreditCard, User, Mail, Phone, Shield, X, LogOut, Save, Settings, ChevronDown } from 'lucide-react';
import { View, User as UserType } from '../types';
import { useNavigate } from 'react-router-dom';
import { useLazyQuery } from '@apollo/client';
import { SPOTLIGHT_SEARCH } from '../graphql/queries/orderQueries';
import { useDebounce } from '../hooks/useDebounce';
import { Loader2 } from 'lucide-react';

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
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType>({ ...currentUser });

  // Spotlight Search Logic
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSpotlight, setShowSpotlight] = useState(false);
  const debouncedSearch = useDebounce(searchQuery, 300);

  const [searchOrders, { data: searchData, loading: isSearching }] = useLazyQuery(SPOTLIGHT_SEARCH, {
    fetchPolicy: 'network-only' // Ensure fresh results
  });

  React.useEffect(() => {
    if (debouncedSearch && debouncedSearch.length > 1 && currentUser?.company?.id) {
      // Construct advanced filter similar to OrderConfirmationView
      const regex = { $regex: debouncedSearch, $options: 'i' };
      const advancedFilter = {
        $or: [
          { fullName: regex },
          { phone: regex },
          { numberOrder: regex },
          { "deliveryCompany.trackingCode": regex }
        ]
      };

      searchOrders({
        variables: {
          idCompany: currentUser.company.id,
          pagination: { page: 1, limit: 5 }, // Limit results
          advancedFilter
        }
      });
    }
  }, [debouncedSearch, currentUser?.company?.id]);

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
    <header className="h-16 bg-white border-b border-slate-200/50 flex items-center justify-between px-4 md:px-6 z-30 transition-all duration-300 shrink-0">
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
            placeholder="البحث السريع (الاسم، الهاتف، المعرف)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setShowSpotlight(true)}
            onBlur={() => setTimeout(() => setShowSpotlight(false), 200)} // Delay to allow click
            className="w-full pr-10 pl-10 py-2 bg-slate-100/50 border-transparent border focus:border-indigo-500/30 focus:bg-white rounded-lg focus:outline-none transition-all text-xs font-medium placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setShowSpotlight(false);
              }}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500 transition-colors p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Spotlight Results */}
          {showSpotlight && searchQuery.length > 1 && (
            <div className="absolute top-full mt-2 w-full sm:w-[500px] left-1/2 -translate-x-1/2 bg-white border border-slate-100 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="p-3 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-400 uppercase">نتائج البحث</span>
                {isSearching && <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />}
              </div>

              <div className="max-h-[350px] overflow-y-auto custom-scrollbar p-1">
                {searchData?.allOrder?.data?.length === 0 && !isSearching && (
                  <div className="py-8 text-center text-slate-400 text-xs font-bold flex flex-col items-center gap-2">
                    <Search className="w-6 h-6 opacity-20" />
                    لا توجد نتائج مطابقة
                  </div>
                )}

                {searchData?.allOrder?.data?.map((order: any) => (
                  <button
                    key={order.id}
                    onClick={() => navigate(`/orders/${order.id}`)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl transition-all group text-right border-b border-slate-50 last:border-0"
                  >
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-[10px] shrink-0 font-mono">
                      #{order.numberOrder || order.id?.slice(-4)}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <h5 className="text-[11px] font-black text-slate-700 truncate group-hover:text-indigo-600">{order.fullName || 'بدون اسم'}</h5>
                      <p className="text-[10px] text-slate-400 font-bold truncate tracking-wide flex items-center gap-2">
                        <span>{order.phone}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                        <span>{new Date(order.createdAt).toLocaleDateString('ar-EG')}</span>
                      </p>
                    </div>
                    <div className="flex flex-col items-end shrink-0 gap-1">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${!order.status.color ? 'bg-slate-100 text-slate-500' : ''}`}
                        style={order.status.color ? { backgroundColor: `${order.status.color}15`, color: order.status.color } : {}}
                      >
                        {order.status.nameAR || 'غير محدد'}
                      </span>
                      <span className="text-[10px] font-black text-slate-800">{order.totalPrice?.toLocaleString()} د.ج</span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Footer hint */}
              <div className="p-2 bg-slate-50 border-t border-slate-100 text-[9px] font-bold text-center text-slate-400">
                اضغط Enter لعرض كل النتائج
              </div>
            </div>
          )}
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

        <div className="relative">
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className={`flex items-center gap-2 p-1 md:pr-2 rounded-lg transition-all group ${isUserMenuOpen ? 'bg-indigo-50' : 'hover:bg-slate-50'}`}
          >
            <div className="text-right hidden sm:block">
              <p className="text-[11px] font-black text-slate-800 leading-none mb-0.5 group-hover:text-indigo-600 transition-colors">{currentUser.name}</p>
              <p className="text-[9px] font-black text-indigo-500 uppercase tracking-tighter">{currentUser.role === 'admin' ? 'أدمن' : 'مؤكد'}</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center text-white font-black text-xs shadow-sm ring-2 ring-transparent group-hover:ring-indigo-100 transition-all">
              {currentUser.name.charAt(0)}
            </div>
            <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform hidden sm:block ${isUserMenuOpen ? 'rotate-180 text-indigo-500' : ''}`} />
          </button>

          {/* User Dropdown Menu */}
          {isUserMenuOpen && (
            <>
              {/* Backdrop to close on click outside */}
              <div className="fixed inset-0 z-40" onClick={() => setIsUserMenuOpen(false)}></div>

              <div className="absolute left-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden animate-in slide-in-from-top-2 fade-in duration-200">
                <div className="p-4 bg-slate-50/50 border-b border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">مسجل الدخول باسم</p>
                  <div className="flex items-center gap-2 text-slate-800 font-bold text-xs truncate dir-ltr">
                    <Mail className="w-3.5 h-3.5 text-indigo-500" />
                    <span className="truncate">{currentUser.email}</span>
                  </div>
                </div>

                <div className="p-2 space-y-1">
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      setEditingUser({ ...currentUser });
                      setIsProfileModalOpen(true);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600">
                      <Settings className="w-4 h-4" />
                    </div>
                    تحديث الملف الشخصي
                  </button>

                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onLogout();
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold text-rose-500 hover:bg-rose-50 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-500">
                      <LogOut className="w-4 h-4" />
                    </div>
                    تسجيل الخروج
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Profile Modal */}
      {isProfileModalOpen && (
        <React.Fragment>
          {typeof document !== 'undefined' && ReactDOM.createPortal(
            <div className="fixed inset-0 z-[100] grid place-items-center overflow-y-auto py-10 px-4">
              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity" onClick={() => setIsProfileModalOpen(false)}></div>

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
                        onChange={e => setEditingUser({ ...editingUser, name: e.target.value })}
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
                        onChange={e => setEditingUser({ ...editingUser, email: e.target.value })}
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
                        onChange={e => setEditingUser({ ...editingUser, phone: e.target.value })}
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

                {/* Modal Footer */}
                <div className="p-6 md:p-8 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row gap-3 sm:gap-4 shrink-0 justify-end">
                  <button
                    onClick={handleSaveProfile}
                    className="w-full sm:w-auto px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" /> حفظ التغييرات
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )}
        </React.Fragment>
      )}
    </header>
  );
};

export default Header;
