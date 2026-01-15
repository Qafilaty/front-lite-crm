import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '../../utils/cn';

interface ErrorMessageProps {
    message?: string;
    onRetry?: () => void;
    className?: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({
    message = "حدث خطأ غير متوقع",
    onRetry,
    className
}) => {
    return (
        <div className={cn("p-4 rounded-xl bg-rose-50 border border-rose-100 flex items-start gap-3", className)}>
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <div className="flex-1">
                <h4 className="text-xs font-black text-rose-700 uppercase tracking-widest mb-1">خطأ</h4>
                <p className="text-xs text-rose-600 font-bold leading-relaxed">{message}</p>

                {onRetry && (
                    <button
                        onClick={onRetry}
                        className="mt-3 flex items-center gap-2 text-[10px] font-black text-rose-700 bg-white px-3 py-1.5 rounded-lg border border-rose-100 hover:bg-rose-50 transition-all shadow-sm"
                    >
                        <RefreshCw className="w-3 h-3" /> إعادة المحاولة
                    </button>
                )}
            </div>
        </div>
    );
};

export default ErrorMessage;
