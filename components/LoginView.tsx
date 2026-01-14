
import React, { useState } from 'react';
import { Mail, Lock, Zap, Eye, EyeOff, Loader2 } from 'lucide-react';

interface LoginViewProps {
  onRegisterRedirect: () => void;
  onLoginSuccess: () => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onRegisterRedirect, onLoginSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onLoginSuccess();
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <div className="w-full max-w-md bg-white rounded-lg border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
        <div className="p-8 text-center border-b border-slate-50 bg-slate-50/50">
          <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-600/20">
            <Zap className="w-6 h-6 text-white fill-current" />
          </div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">تسجيل الدخول</h2>
          <p className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-widest">مرحباً بك مجدداً في داش آي</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">البريد الإلكتروني</label>
            <div className="relative">
              <Mail className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
              <input 
                required 
                type="email" 
                placeholder="example@mail.com" 
                className="w-full pr-11 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:border-indigo-500 focus:bg-white transition-all text-slate-700"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center px-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">كلمة المرور</label>
              <button type="button" className="text-[10px] font-black text-indigo-600 hover:underline">نسيت كلمة المرور؟</button>
            </div>
            <div className="relative">
              <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
              <input 
                required 
                type={showPassword ? "text" : "password"} 
                placeholder="••••••••" 
                className="w-full pr-11 pl-12 py-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:border-indigo-500 focus:bg-white transition-all text-slate-700"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-indigo-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button 
            disabled={loading}
            type="submit" 
            className="w-full py-3.5 bg-indigo-600 text-white rounded-lg font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'دخول'}
          </button>
        </form>

        <div className="p-6 bg-slate-50/50 border-t border-slate-100 text-center">
          <p className="text-[11px] font-bold text-slate-500">
            ليس لديك حساب؟ 
            <button onClick={onRegisterRedirect} className="text-indigo-600 font-black mr-1 hover:underline">أنشئ حسابك الآن</button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
