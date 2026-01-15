import React from 'react';
import { LucideIcon, PackageX } from 'lucide-react';
import { cn } from '../../utils/cn';

interface EmptyStateProps {
    icon?: LucideIcon;
    title: string;
    description?: string;
    actionLabel?: string;
    onAction?: () => void;
    className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
    icon: Icon = PackageX,
    title,
    description,
    actionLabel,
    onAction,
    className,
}) => {
    return (
        <div className={cn("flex flex-col items-center justify-center p-12 text-center animate-in fade-in duration-500", className)}>
            <div className="w-16 h-16 rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-4 shadow-sm">
                <Icon className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="font-black text-slate-800 text-sm mb-1 tracking-tight">{title}</h3>
            {description && (
                <p className="text-xs text-slate-400 font-bold mb-6 max-w-xs leading-relaxed">
                    {description}
                </p>
            )}
            {actionLabel && onAction && (
                <button
                    onClick={onAction}
                    className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-black hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
                >
                    {actionLabel}
                </button>
            )}
        </div>
    );
};

export default EmptyState;
