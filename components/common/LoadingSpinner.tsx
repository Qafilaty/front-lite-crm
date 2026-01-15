import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

interface LoadingSpinnerProps {
    className?: string;
    size?: number;
    text?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ className, size = 24, text }) => {
    return (
        <div className={cn("flex flex-col items-center justify-center p-4", className)}>
            <Loader2
                className="animate-spin text-indigo-600"
                size={size}
            />
            {text && (
                <p className="mt-2 text-xs font-bold text-slate-400 animate-pulse uppercase tracking-widest">
                    {text}
                </p>
            )}
        </div>
    );
};

export default LoadingSpinner;
