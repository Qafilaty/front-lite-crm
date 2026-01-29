import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/apiService';
import { Button, ErrorMessage, LoadingSpinner } from '../components/common';
import logoIcon from '../assets/logo-icon-black.png';

const SignupPage: React.FC = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

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
                // Login utilizing the context or redirect
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

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8" dir="rtl">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="w-16 h-16 mx-auto mb-4">
                    <img src={logoIcon} alt="Wilo Logo" className="w-full h-full object-contain" />
                </div>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    إنشاء حساب جديد
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    أو{' '}
                    <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                        تسجيل الدخول إلى حسابك الموجود
                    </Link>
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md md:max-w-2xl">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    {error && <ErrorMessage message={error} />}

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            {/* Store Name */}
                            <div className="md:col-span-1">
                                <label htmlFor="nameCompany" className="block text-sm font-medium text-gray-700">
                                    اسم المتجر
                                </label>
                                <div className="mt-1">
                                    <input
                                        id="nameCompany"
                                        name="nameCompany"
                                        type="text"
                                        required
                                        value={formData.nameCompany}
                                        onChange={handleChange}
                                        placeholder="أدخل اسم المتجر"
                                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    />
                                </div>
                            </div>

                            {/* User Name */}
                            <div className="md:col-span-1">
                                <label htmlFor="nameAdmin" className="block text-sm font-medium text-gray-700">
                                    اسم المستخدم
                                </label>
                                <div className="mt-1">
                                    <input
                                        id="nameAdmin"
                                        name="nameAdmin"
                                        type="text"
                                        required
                                        value={formData.nameAdmin}
                                        onChange={handleChange}
                                        placeholder="أدخل الاسم الكامل"
                                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    />
                                </div>
                            </div>

                            {/* Phone */}
                            <div className="md:col-span-1">
                                <label htmlFor="phoneAdmin" className="block text-sm font-medium text-gray-700">
                                    رقم الهاتف
                                </label>
                                <div className="mt-1">
                                    <input
                                        id="phoneAdmin"
                                        name="phoneAdmin"
                                        type="text"
                                        required
                                        value={formData.phoneAdmin}
                                        onChange={handleChange}
                                        placeholder="05XXXXXXXX"
                                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    />
                                </div>
                            </div>

                            {/* Email */}
                            <div className="md:col-span-1">
                                <label htmlFor="emailAdmin" className="block text-sm font-medium text-gray-700">
                                    البريد الإلكتروني
                                </label>
                                <div className="mt-1">
                                    <input
                                        id="emailAdmin"
                                        name="emailAdmin"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        value={formData.emailAdmin}
                                        onChange={handleChange}
                                        placeholder="example@store.com"
                                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    />
                                </div>
                            </div>

                            {/* Password - Full Width */}
                            <div className="md:col-span-2">
                                <label htmlFor="passwordAdmin" className="block text-sm font-medium text-gray-700">
                                    كلمة المرور
                                </label>
                                <div className="mt-1">
                                    <input
                                        id="passwordAdmin"
                                        name="passwordAdmin"
                                        type="password"
                                        autoComplete="new-password"
                                        required
                                        value={formData.passwordAdmin}
                                        onChange={handleChange}
                                        placeholder="••••••••"
                                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    />
                                </div>
                            </div>

                        </div>

                        <div>
                            <Button
                                type="submit"
                                fullWidth
                                loading={isLoading}
                                className="w-full justify-center"
                            >
                                إنشاء حساب
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default SignupPage;
