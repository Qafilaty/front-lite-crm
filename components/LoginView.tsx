
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, Zap, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

import logoIcon from '../assets/logo-icon-black.png';

interface LoginViewProps {
  onRegisterRedirect: () => void;
  onLoginSuccess?: () => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onRegisterRedirect, onLoginSuccess }) => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // إعادة التوجيه عند نجاح تسجيل الدخول
  useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as any)?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
      if (onLoginSuccess) {
        onLoginSuccess();
      }
    }
  }, [isAuthenticated, navigate, location, onLoginSuccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await login(email, password);
      if (!result.success) {
        if (result.error === "هذه الشركة محظورة" || result.error?.includes("محظورة")) {
          setError("هذه الشركة محظورة، يرجى الاتصال بالدعم.");
        } else {
          setError(result.error || 'فشل تسجيل الدخول');
        }
      }
      // إذا نجح، useEffect سيعيد التوجيه تلقائياً
    } catch (err: any) {
      if (err.message && (err.message === "هذه الشركة محظورة" || err.message.includes("محظورة"))) {
        setError("هذه الشركة محظورة، يرجى الاتصال بالدعم.");
      } else {
        setError(err.message || 'حدث خطأ أثناء تسجيل الدخول');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <div className="w-full max-w-md bg-white rounded-lg border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
        <div className="p-8 text-center border-b border-slate-50 bg-slate-50/50">
          <div className="w-16 h-16 mx-auto mb-4">
            <img src={logoIcon} alt="Wilo Logo" className="w-full h-full object-contain" />
          </div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">تسجيل الدخول</h2>
          <p className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-widest">مرحباً بك مجدداً في داش آي</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs font-bold text-red-600 text-center">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">البريد الإلكتروني</label>
            <div className="relative">
              <Mail className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@mail.com"
                className="w-full pr-11 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:border-indigo-500 focus:bg-white transition-all text-slate-700"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center px-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">كلمة المرور</label>
              <button type="button" onClick={() => navigate('/forgot-password')} className="text-[10px] font-black text-indigo-600 hover:underline">نسيت كلمة المرور؟</button>
            </div>
            <div className="relative">
              <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
              <input
                required
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
