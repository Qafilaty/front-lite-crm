
import React, { useState } from 'react';
import { Store, Power, ShieldCheck, Settings, X, Link2, Globe, Zap, Save, ChevronRight } from 'lucide-react';

interface StoreConnection {
  name: string;
  status: 'connected' | 'disconnected';
  domain: string;
  logo: string;
  method?: 'api' | 'webhook' | 'direct';
}

const StoreLinkingView: React.FC = () => {
  const [stores, setStores] = useState<StoreConnection[]>([
    { name: 'Salla', status: 'connected', domain: 'my-store.salla.sa', logo: 'S', method: 'api' },
    { name: 'Zid', status: 'disconnected', domain: 'none', logo: 'Z' },
    { name: 'Shopify', status: 'connected', domain: 'clothes-boutique.myshopify.com', logo: 'Sh', method: 'webhook' },
    { name: 'WooCommerce', status: 'disconnected', domain: 'none', logo: 'W' },
  ]);

  const [selectedStore, setSelectedStore] = useState<StoreConnection | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [linkMethod, setLinkMethod] = useState<'api' | 'webhook' | 'direct'>('api');

  const handleOpenSettings = (store: StoreConnection) => {
    setSelectedStore(store);
    setLinkMethod(store.method || 'api');
    setIsModalOpen(true);
  };

  const handleSaveLink = () => {
    setStores(prev => prev.map(s => 
      s.name === selectedStore?.name 
        ? { ...s, status: 'connected', method: linkMethod } 
        : s
    ));
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">ربط المتاجر</h2>
          <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest mt-1">مزامنة المنتجات والطلبيات مع منصات التجارة الإلكترونية</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {stores.map((store) => (
          <div key={store.name} className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex items-center gap-5 group">
            <div className={`w-14 h-14 rounded-lg flex items-center justify-center font-black text-xl shadow-sm transition-transform group-hover:scale-105 ${store.status === 'connected' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
              {store.logo}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-black text-slate-800 text-[15px] tracking-tight">{store.name}</h3>
                {store.status === 'connected' && <ShieldCheck className="w-4 h-4 text-emerald-500" />}
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-3">
                {store.status === 'connected' ? store.domain : 'غير مربوط حالياً'}
              </p>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleOpenSettings(store)}
                  className={`text-[10px] font-black px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
                    store.status === 'connected' 
                    ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' 
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-600/10'
                  }`}
                >
                  {store.status === 'connected' ? <><Settings className="w-3.5 h-3.5" /> الإعدادات</> : <><Link2 className="w-3.5 h-3.5" /> إعداد الربط</>}
                </button>
                {store.status === 'connected' && (
                   <span className="text-[8px] font-black bg-indigo-50 text-indigo-600 px-2 py-1 rounded border border-indigo-100 uppercase">
                     {store.method === 'api' ? 'API' : store.method === 'webhook' ? 'Webhook' : 'Direct'}
                   </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Connection Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-3">
                 <Store className="w-5 h-5 text-indigo-600" />
                 <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">تهيئة متجر {selectedStore?.name}</h4>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-rose-500"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">طريقة الربط</label>
                <div className="grid grid-cols-3 gap-2">
                  <button 
                    onClick={() => setLinkMethod('api')}
                    className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${linkMethod === 'api' ? 'border-indigo-600 bg-indigo-50' : 'border-slate-50 bg-slate-50 hover:border-slate-200'}`}
                  >
                    <Link2 className={`w-4 h-4 ${linkMethod === 'api' ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <span className={`text-[9px] font-black ${linkMethod === 'api' ? 'text-indigo-600' : 'text-slate-400'}`}>API Key</span>
                  </button>
                  <button 
                    onClick={() => setLinkMethod('webhook')}
                    className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${linkMethod === 'webhook' ? 'border-indigo-600 bg-indigo-50' : 'border-slate-50 bg-slate-50 hover:border-slate-200'}`}
                  >
                    <Zap className={`w-4 h-4 ${linkMethod === 'webhook' ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <span className={`text-[9px] font-black ${linkMethod === 'webhook' ? 'text-indigo-600' : 'text-slate-400'}`}>Webhook</span>
                  </button>
                  <button 
                    onClick={() => setLinkMethod('direct')}
                    className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${linkMethod === 'direct' ? 'border-indigo-600 bg-indigo-50' : 'border-slate-50 bg-slate-50 hover:border-slate-200'}`}
                  >
                    <Globe className={`w-4 h-4 ${linkMethod === 'direct' ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <span className={`text-[9px] font-black ${linkMethod === 'direct' ? 'text-indigo-600' : 'text-slate-400'}`}>رابط مباشر</span>
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {linkMethod === 'api' && (
                  <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-200">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">مفتاح الـ API</label>
                    <input type="password" placeholder="sk_live_..." className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:border-indigo-500 outline-none transition-all" />
                  </div>
                )}
                {linkMethod === 'webhook' && (
                  <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-200">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">رابط الويبهوك (Payload URL)</label>
                    <input type="text" placeholder="https://api.mystore.com/webhook" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:border-indigo-500 outline-none transition-all" />
                  </div>
                )}
                {linkMethod === 'direct' && (
                  <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-200">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">رابط المتجر المباشر</label>
                    <input type="text" placeholder="https://store-name.com" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:border-indigo-500 outline-none transition-all" />
                  </div>
                )}
              </div>

              <div className="pt-2 flex gap-3">
                <button onClick={() => setIsModalOpen(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-lg font-black text-[10px] uppercase">إلغاء</button>
                <button onClick={handleSaveLink} className="flex-1 py-3 bg-indigo-600 text-white rounded-lg font-black text-[10px] uppercase shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2">
                  <Save className="w-3.5 h-3.5" /> حفظ الإعدادات
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoreLinkingView;
