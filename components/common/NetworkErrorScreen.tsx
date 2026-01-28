import React from 'react';
import { WifiOff, AlertTriangle, RefreshCcw } from 'lucide-react';

interface NetworkErrorScreenProps {
    error: {
        title: string;
        message: string;
        details?: string;
    } | null;
    onRetry: () => void;
}

const NetworkErrorScreen: React.FC<NetworkErrorScreenProps> = ({ error, onRetry }) => {
    if (!error) return null;

    return (
        <div className="w-full h-full min-h-[60vh] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="max-w-md w-full overflow-hidden">
                <div className="p-8 text-center space-y-6">
                    <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto animate-in zoom-in duration-300">
                        <WifiOff className="w-10 h-10" />
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                            {error.title}
                        </h2>
                        <p className="text-slate-500 font-medium leading-relaxed">
                            {error.message}
                        </p>
                    </div>

                    {error.details && (
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-500 font-mono text-left break-all overflow-hidden">
                            <div className="flex items-center gap-2 mb-2 text-rose-500 font-bold uppercase tracking-wider text-[10px]">
                                <AlertTriangle className="w-3 h-3" />
                                Error Details
                            </div>
                            {error.details}
                        </div>
                    )}

                    <button
                        onClick={onRetry}
                        className="w-full py-3.5 bg-indigo-600 text-white rounded-xl font-black text-sm uppercase tracking-widest shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-[0.98] flex items-center justify-center gap-2 group"
                    >
                        <RefreshCcw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                        إعادة المحاولة
                    </button>
                </div>

                <div className="p-4 text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        يرجى التأكد من اتصالك بالإنترنت
                    </p>
                </div>
            </div>
        </div>
    );
};

export default NetworkErrorScreen;
