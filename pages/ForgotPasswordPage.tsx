import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, CheckCircle2, ArrowRight, Loader2, ShieldCheck, KeyRound } from 'lucide-react';
import { useMutation } from '@apollo/client';
import { FORGET_PASSWORD, CHECK_OTP_PASSWORD, CHANGE_PASSWORD } from '../graphql/mutations/authMutations';
import toast from 'react-hot-toast';
import logoIcon from '../assets/logo-icon-black.png';

const ForgotPasswordPage: React.FC = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    // Mutations
    const [forgetPassword] = useMutation(FORGET_PASSWORD);
    const [checkOTP] = useMutation(CHECK_OTP_PASSWORD);
    const [changePassword] = useMutation(CHANGE_PASSWORD);

    const handleSendOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;
        setLoading(true);

        try {
            const { data } = await forgetPassword({ variables: { email } });
            if (data?.forgetPassword?.status) {
                toast.success('تم إرسال رمز التحقق إلى بريدك الإلكتروني');
                setStep(2);
            } else {
                toast.error('لم يتم العثور على هذا البريد الإلكتروني');
            }
        } catch (error: any) {
            toast.error(error.message || 'حدث خطأ ما');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!otp) return;
        setLoading(true);

        try {
            const { data } = await checkOTP({ variables: { email, code: otp } });
            if (data?.checkOTPPassword?.status) {
                toast.success('تم التحقق من الرمز بنجاح');
                setStep(3);
            } else {
                toast.error('رمز التحقق غير صحيح');
            }
        } catch (error: any) {
            toast.error(error.message || 'حدث خطأ ما');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!password || password !== confirmPassword) {
            toast.error('كلمات المرور غير متطابقة');
            return;
        }
        setLoading(true);

        try {
            const { data } = await changePassword({
                variables: {
                    content: {
                        email,
                        code: otp,
                        password
                    }
                }
            });

            if (data?.changePassword?.status) {
                toast.success('تم تغيير كلمة المرور بنجاح');
                navigate('/login');
            } else {
                toast.error('فشل تغيير كلمة المرور');
            }
        } catch (error: any) {
            toast.error(error.message || 'حدث خطأ ما');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50" dir="rtl">
            <div className="w-full max-w-md bg-white rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden animate-in fade-in zoom-in duration-300">

                {/* Header */}
                <div className="p-8 text-center border-b border-slate-50 bg-slate-50/50">
                    <div className="w-16 h-16 mx-auto mb-4 bg-white rounded-2xl shadow-sm border border-slate-100 p-3 flex items-center justify-center">
                        <img src={logoIcon} alt="Logo" className="w-full h-full object-contain" />
                    </div>
                    <h2 className="text-xl font-black text-slate-800 tracking-tight">استعادة كلمة المرور</h2>
                    <p className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-widest">
                        {step === 1 && 'أدخل بريدك الإلكتروني لاستلام رمز التحقق'}
                        {step === 2 && 'أدخل رمز التحقق المرسل إلى بريدك'}
                        {step === 3 && 'قم بتعيين كلمة المرور الجديدة'}
                    </p>
                </div>

                {/* Steps Progress */}
                <div className="flex items-center justify-center gap-2 p-4 border-b border-slate-50 bg-white">
                    <div className={`w-2 h-2 rounded-full transition-all ${step >= 1 ? 'bg-indigo-600 w-6' : 'bg-slate-200'}`} />
                    <div className={`w-2 h-2 rounded-full transition-all ${step >= 2 ? 'bg-indigo-600 w-6' : 'bg-slate-200'}`} />
                    <div className={`w-2 h-2 rounded-full transition-all ${step >= 3 ? 'bg-indigo-600 w-6' : 'bg-slate-200'}`} />
                </div>

                <div className="p-8">
                    {step === 1 && (
                        <form onSubmit={handleSendOTP} className="space-y-5 animate-in slide-in-from-right-8 duration-300">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">البريد الإلكتروني</label>
                                <div className="relative">
                                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                    <input
                                        required
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="example@mail.com"
                                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500 focus:bg-white transition-all text-slate-700 text-left"
                                        dir="ltr"
                                    />
                                </div>
                            </div>
                            <button
                                disabled={loading}
                                type="submit"
                                className="w-full py-3.5 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>إرسال الرمز <ArrowRight className="w-4 h-4 rotate-180" /></>}
                            </button>
                        </form>
                    )}

                    {step === 2 && (
                        <form onSubmit={handleVerifyOTP} className="space-y-5 animate-in slide-in-from-right-8 duration-300">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">رمز التحقق (OTP)</label>
                                <div className="relative">
                                    <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                    <input
                                        required
                                        type="text"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        placeholder="123456"
                                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500 focus:bg-white transition-all text-slate-700 text-center tracking-[0.5em]"
                                        dir="ltr"
                                    />
                                </div>
                                <p className="text-[10px] font-bold text-slate-400 px-1">تم إرسال الرمز إلى {email}</p>
                            </div>
                            <button
                                disabled={loading}
                                type="submit"
                                className="w-full py-3.5 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>تحقق <CheckCircle2 className="w-4 h-4" /></>}
                            </button>
                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                className="w-full py-2 text-[10px] font-black text-slate-400 hover:text-indigo-600 transition-colors"
                            >
                                تغيير البريد الإلكتروني
                            </button>
                        </form>
                    )}

                    {step === 3 && (
                        <form onSubmit={handleResetPassword} className="space-y-5 animate-in slide-in-from-right-8 duration-300">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">كلمة المرور الجديدة</label>
                                <div className="relative">
                                    <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                    <input
                                        required
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500 focus:bg-white transition-all text-slate-700 text-left"
                                        dir="ltr"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">تأكيد كلمة المرور</label>
                                <div className="relative">
                                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                    <input
                                        required
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500 focus:bg-white transition-all text-slate-700 text-left"
                                        dir="ltr"
                                    />
                                </div>
                            </div>
                            <button
                                disabled={loading}
                                type="submit"
                                className="w-full py-3.5 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>تغيير كلمة المرور <CheckCircle2 className="w-4 h-4" /></>}
                            </button>
                        </form>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 bg-slate-50/50 border-t border-slate-100 text-center">
                    <button onClick={() => navigate('/login')} className="text-[11px] font-black text-slate-500 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2 mx-auto">
                        <ArrowRight className="w-3 h-3" /> العودة لتسجيل الدخول
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
