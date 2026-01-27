import React from 'react';
import { LucideIcon } from 'lucide-react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
}

/**
 * Reusable Button Component
 * مكون Button قابل لإعادة الاستخدام
 */
export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  disabled = false,
  loading = false,
  fullWidth = false,
  className = '',
}) => {
  const baseClasses =
    'inline-flex items-center justify-center gap-2 font-black uppercase tracking-widest rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed';

  const variantClasses = {
    primary:
      'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-600/20',
    secondary:
      'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200',
    danger:
      'bg-rose-600 text-white hover:bg-rose-700 shadow-lg shadow-rose-600/20',
    success:
      'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-600/20',
    ghost: 'bg-transparent text-slate-600 hover:bg-slate-100',
  };

  const sizeClasses = {
    sm: 'px-4 py-2 text-[10px]',
    md: 'px-6 py-3 text-xs',
    lg: 'px-8 py-4 text-sm',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
    >
      {loading ? (
        <>
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          جاري التحميل...
        </>
      ) : (
        <>
          {Icon && iconPosition === 'left' && <Icon className="w-4 h-4" />}
          {children}
          {Icon && iconPosition === 'right' && <Icon className="w-4 h-4" />}
        </>
      )}
    </button>
  );
};
