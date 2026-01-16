import React from 'react';

// --- Input Field ---
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({ label, error, icon, className, ...props }) => {
    return (
        <div className="w-full">
            {label && <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>}
            <div className="relative">
                {icon && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                        {icon}
                    </div>
                )}
                <input
                    className={`block w-full rounded-lg border-gray-300 border bg-white py-2.5 ${icon ? 'pr-10 pl-3' : 'px-3'} text-sm text-slate-900 shadow-sm focus:border-primary-500 focus:ring-primary-500 hover:border-gray-400 transition-colors disabled:bg-gray-100 disabled:text-gray-500 ${className}`}
                    {...props}
                />
            </div>
            {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>
    );
};

// --- Text Area ---
interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
}

export const TextArea: React.FC<TextAreaProps> = ({ label, className, ...props }) => {
    return (
        <div className="w-full">
            {label && <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>}
            <textarea
                className={`block w-full rounded-lg border-gray-300 border bg-white py-2 px-3 text-sm text-slate-900 shadow-sm focus:border-primary-500 focus:ring-primary-500 hover:border-gray-400 transition-colors ${className}`}
                {...props}
            />
        </div>
    );
};

// --- Toggle Switch ---
interface ToggleProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label?: string;
}

export const Toggle: React.FC<ToggleProps> = ({ checked, onChange, label }) => {
    return (
        <div className="flex items-center cursor-pointer" onClick={() => onChange(!checked)}>
            <div className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${checked ? 'bg-indigo-600' : 'bg-gray-200'}`}>
                <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${checked ? '-translate-x-5' : 'translate-x-0'}`}
                />
            </div>
            {label && <span className="mr-3 text-sm font-medium text-slate-700">{label}</span>}
        </div>
    );
};

// --- Button ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', isLoading, className, ...props }) => {
    const baseStyles = "inline-flex justify-center items-center rounded-lg px-4 py-2.5 text-sm font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed";

    const variants = {
        primary: "bg-indigo-600 text-white hover:bg-indigo-700 focus-visible:outline-indigo-600 active:scale-95",
        secondary: "bg-white text-slate-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 active:scale-95",
        danger: "bg-red-600 text-white hover:bg-red-700 focus-visible:outline-red-600",
        ghost: "bg-transparent text-indigo-600 hover:bg-indigo-50 shadow-none"
    };

    return (
        <button className={`${baseStyles} ${variants[variant]} ${className}`} disabled={isLoading} {...props}>
            {isLoading && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            )}
            {children}
        </button>
    );
};
