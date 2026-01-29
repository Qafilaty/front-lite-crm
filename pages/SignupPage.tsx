import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/apiService';
import { Button, ErrorMessage, LoadingSpinner } from '../components/common';

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
                // Login utilizing the context (this might need adjustment if context doesn't support direct token injection without re-login, 
                // but usually storing token and reloading or calling a user fetcher works. 
                // Here we assume simple token storage and redirect or a context refresh is needed)

                // Ideally, useAuth should expose a method to set user state from token/data without full re-login flow if possible, 
                // or we just rely on the token being in localStorage (backend handled by authService.signup) and reload/navigate.

                // Force a reload or leverage a way to update auth context. 
                // Since apiService.signup already sets localStorage, we might just need to trigger context update.
                // If useAuth checks token on mount, a navigate might be enough or a window.location.reload() to be safe.
                // Or better, assume login() method in context can take token/user or we just redirect to dashboard which triggers checks.

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

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    {error && <ErrorMessage message={error} />}

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div>
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

                        <div>
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

                        <div>
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

                        <div>
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

                        <div>
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

                        <div>
                            <Button
                                type="submit"
                                fullWidth
                                disabled={isLoading}
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                {isLoading ? <LoadingSpinner size="sm" color="white" /> : 'إنشاء حساب'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default SignupPage;
