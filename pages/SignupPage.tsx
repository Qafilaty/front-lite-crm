import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/apiService';
import { Button, ErrorMessage } from '../components/common';
import logoIcon from '../assets/logo-icon-black.png';
import { Store, User, Phone, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';

const SignupPage: React.FC = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    const [formData, setFormData] = useState({
        nameAdmin: '',
        phoneAdmin: '',
        emailAdmin: '',
        passwordAdmin: '',
        nameCompany: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            const result = await authService.signup(formData);

            if (result.success && result.token) {
                window.location.href = '/dashboard';
            } else {
                setError(result.error || 'فشل إنشاء الحساب');
            }
        } catch (err: any) {
            setError(err.message || 'حدث خطأ غير متوقع');
        } finally {
            setIsLoading(false);
        }
    };

    // Common Input Styles from LoginView
    const labelClass = "text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 mb-1.5 block";
    const inputClass = "w-full pr-11 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:border-indigo-500 focus:bg-white transition-all text-slate-700 placeholder-slate-400";
    const iconClass = "absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300";

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50" dir="rtl">
            <div className="max-w-2xl w-full">
                <div className="bg-white rounded-[20px] border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">

                    {/* Header */}
                    <div className="p-8 text-center border-b border-slate-50 bg-slate-50/50">
                        <div className="w-16 h-16 mx-auto mb-4">
                            <img src={logoIcon} alt="Wilo Logo" className="w-full h-full object-contain" />
                        </div>
                        <h2 className="text-xl font-black text-slate-800 tracking-tight">إنشاء حساب جديد</h2>
                        <p className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-widest">
                            أو <Link to="/login" className="text-indigo-600 hover:text-indigo-700 transition-colors">تسجيل الدخول إلى حسابك</Link>
                        </p>
                    </div>

                    {/* Form */}
                    <div className="p-8">
                        {error && (
                            <div className="p-3 mb-6 bg-red-50 border border-red-200 rounded-lg text-xs font-bold text-red-600 text-center">
                                {error}
                            </div>
                        )}

                        <form className="space-y-6" onSubmit={handleSubmit}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                {/* Store Name */}
                                <div className="md:col-span-1">
                                    <label htmlFor="nameCompany" className={labelClass}>اسم المتجر</label>
                                    <div className="relative">
                                        <Store className={iconClass} />
                                        <input
                                            id="nameCompany"
                                            name="nameCompany"
                                            type="text"
                                            required
                                            value={formData.nameCompany}
                                            onChange={handleChange}
                                            placeholder="أدخل اسم المتجر"
                                            className={inputClass}
                                        />
                                    </div>
                                </div>

                                {/* User Name */}
                                <div className="md:col-span-1">
                                    <label htmlFor="nameAdmin" className={labelClass}>اسم المستخدم</label>
                                    <div className="relative">
                                        <User className={iconClass} />
                                        <input
                                            id="nameAdmin"
                                            name="nameAdmin"
                                            type="text"
                                            required
                                            value={formData.nameAdmin}
                                            onChange={handleChange}
                                            placeholder="أدخل الاسم الكامل"
                                            className={inputClass}
                                        />
                                    </div>
                                </div>

                                {/* Phone */}
                                <div className="md:col-span-1">
                                    <label htmlFor="phoneAdmin" className={labelClass}>رقم الهاتف</label>
                                    <div className="relative">
                                        <Phone className={iconClass} />
                                        <input
                                            id="phoneAdmin"
                                            name="phoneAdmin"
                                            type="text"
                                            required
                                            value={formData.phoneAdmin}
                                            onChange={handleChange}
                                            placeholder="05XXXXXXXX"
                                            className={inputClass}
                                        />
                                    </div>
                                </div>

                                {/* Email */}
                                <div className="md:col-span-1">
                                    <label htmlFor="emailAdmin" className={labelClass}>البريد الإلكتروني</label>
                                    <div className="relative">
                                        <Mail className={iconClass} />
                                        <input
                                            id="emailAdmin"
                                            name="emailAdmin"
                                            type="email"
                                            autoComplete="email"
                                            required
                                            value={formData.emailAdmin}
                                            onChange={handleChange}
                                            placeholder="example@store.com"
                                            className={inputClass}
                                        />
                                    </div>
                                </div>

                                {/* Password - Full Width */}
                                <div className="md:col-span-2">
                                    <label htmlFor="passwordAdmin" className={labelClass}>كلمة المرور</label>
                                    <div className="relative">
                                        <Lock className={iconClass} />
                                        <input
                                            id="passwordAdmin"
                                            name="passwordAdmin"
                                            type={showPassword ? "text" : "password"}
                                            autoComplete="new-password"
                                            required
                                            value={formData.passwordAdmin}
                                            onChange={handleChange}
                                            placeholder="••••••••"
                                            className={`${inputClass} pl-12`} // Extra padding for eye icon
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

                            </div>

                            <div className="pt-2">
                                <button
                                    disabled={isLoading}
                                    type="submit"
                                    className="w-full py-3.5 bg-indigo-600 text-white rounded-lg font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2"
                                >
                                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'إنشاء حساب'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SignupPage;
