
import React, { useState } from 'react';
import { CheckCircle2, AlertCircle, Key, Lock, X, Globe, Save, Settings, Link2 } from 'lucide-react';

interface Carrier {
  id: string;
  name: string;
  status: 'connected' | 'disconnected';
  type: 'global' | 'local';
  logo: string;
  apiKey?: string;
  token?: string;
}

const ShippingCarriersView: React.FC = () => {
  const [carriers, setCarriers] = useState<Carrier[]>([
    { id: 'c1', name: 'Aramex', status: 'connected', type: 'global', logo: 'A', apiKey: '••••••••', token: '••••••••' },
    { id: 'c2', name: 'SMSA Express', status: 'connected', type: 'local', logo: 'S', apiKey: '••••••••', token: '••••••••' },
    { id: 'c3', name: 'DHL', status: 'disconnected', type: 'global', logo: 'D' },
    { id: 'c4', name: 'Zajil', status: 'disconnected', type: 'local', logo: 'Z' },
  ]);

  const [selectedCarrier, setSelectedCarrier] = useState<Carrier | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [token, setToken] = useState('');

  const handleOpenSettings = (carrier: Carrier) => {
    setSelectedCarrier(carrier);
    setApiKey(carrier.apiKey || '');
    setToken(carrier.token || '');
    setIsModalOpen(true);
  };

  const handleSaveConnection = () => {
    if (!apiKey || !token) {
      alert('يرجى إدخال مفتاح الـ API والـ Token للمتابعة');
      return;
    }

    setCarriers(prev => prev.map(c => 
      c.id === selectedCarrier?.id 
        ? { ...c, status: 'connected', apiKey, token } 
        : c
    ));
    
    setIsModalOpen(false);
    setSelectedCarrier(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">شركات التوصيل</h2>
          <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest mt-1">إدارة الربط البرمجي مع مزودي الخدمات اللوجستية</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {carriers.map((carrier) => (
          <div key={carrier.id} className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between relative overflow-hidden">
            <div>
              <div className="flex justify-between items-start mb-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-black text-lg shadow-sm ${carrier.status === 'connected' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                  {carrier.logo}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`text-[8px] font-black px-2 py-0.5 rounded-md border uppercase tracking-widest ${carrier.status === 'connected' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
                    {carrier.status === 'connected' ? 'نشط' : 'غير متصل'}
                  </span>
                </div>
              </div>
              <h3 className="font-black text-slate-800 text-[15px] mb-1 tracking-tight">{carrier.name}</h3>
              <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest flex items-center gap-1">
                <Globe className="w-3 h-3" /> مزود خدمة {carrier.type === 'global' ? 'دولي' : 'محلي'}
              </p>
            </div>
            
            <div className="mt-5 pt-4 border-t border-slate-50 flex items-center justify-between">
              <button 
                onClick={() => handleOpenSettings(carrier)}
                className={`flex items-center gap-2 text-[10px] font-black px-4 py-2 rounded-lg transition-all ${carrier.status === 'connected' ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
              >
                {carrier.status === 'connected' ? <><Settings className="w-3.5 h-3.5" /> الإعدادات</> : <><Link2 className="w-3.5 h-3.5" /> ربط API</>}
              </button>
              {carrier.status === 'connected' ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <AlertCircle className="w-5 h-5 text-slate-200" />}
            </div>
          </div>
        ))}
      </div>

      {/* API Connection Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-3">
                 <Link2 className="w-5 h-5 text-indigo-600" />
                 <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">إعدادات ربط {selectedCarrier?.name}</h4>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-rose-500"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-6 space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">API Key</label>
                <div className="relative">
                  <Key className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <input 
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="مفتاح الـ API..."
                    className="w-full pr-10 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Token</label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <input 
                    type="password"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="رمز الـ Token..."
                    className="w-full pr-10 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button onClick={() => setIsModalOpen(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-lg font-black text-[10px] uppercase">إلغاء</button>
                <button onClick={handleSaveConnection} className="flex-1 py-3 bg-indigo-600 text-white rounded-lg font-black text-[10px] uppercase shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2">
                  <Save className="w-3.5 h-3.5" /> حفظ البيانات
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShippingCarriersView;
