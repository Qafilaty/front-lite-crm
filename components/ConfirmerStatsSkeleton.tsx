import React from 'react';

export const ConfirmerStatsSkeleton: React.FC = () => {
    return (
        <div className="space-y-6 animate-pulse pb-20 max-w-[1400px] mx-auto text-right">

            {/* 1. Page Header Skeleton */}
            <div className="flex justify-between items-center border-b border-slate-200 pb-4">
                <div className="space-y-2">
                    <div className="h-6 w-48 bg-slate-200 rounded"></div>
                    <div className="h-4 w-64 bg-slate-100 rounded"></div>
                </div>
                <div className="h-8 w-32 bg-indigo-50 rounded-lg border border-indigo-100"></div>
            </div>

            {/* 2. Top Financial Cards Skeleton (3 Cards) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className={`p-6 rounded-lg shadow-sm flex flex-col justify-between h-36 ${i === 2 ? 'bg-slate-900' : 'bg-white border border-slate-200'}`}>
                        <div className="flex justify-between items-center">
                            <div className={`h-3 w-24 rounded ${i === 2 ? 'bg-slate-700' : 'bg-slate-200'}`}></div>
                            <div className={`w-8 h-8 rounded ${i === 2 ? 'bg-slate-700' : 'bg-slate-100'}`}></div>
                        </div>
                        <div className="space-y-2">
                            <div className={`h-8 w-20 rounded ${i === 2 ? 'bg-slate-700' : 'bg-slate-200'}`}></div>
                            <div className={`h-3 w-32 rounded ${i === 2 ? 'bg-slate-800' : 'bg-slate-100'}`}></div>
                        </div>
                    </div>
                ))}
            </div>

            {/* 3. Performance Alerts Placeholder (Optional) */}
            <div className="h-0 md:h-20 w-full"></div>

            {/* 4. Status Breakdown Skeleton (2 Pie Charts) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[...Array(2)].map((_, i) => (
                    <div key={i} className="bg-white border border-slate-200 p-6 rounded-lg shadow-sm space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                            <div className="h-4 w-32 bg-slate-200 rounded"></div>
                            <div className="h-3 w-20 bg-slate-100 rounded"></div>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center gap-6">
                            <div className="flex-1 space-y-3 w-full">
                                {[...Array(3)].map((_, j) => (
                                    <div key={j} className="h-8 w-full bg-slate-50 rounded border border-slate-100"></div>
                                ))}
                            </div>
                            <div className="w-36 h-36 rounded-full bg-slate-100 shrink-0 border-4 border-slate-50"></div>
                        </div>
                    </div>
                ))}
            </div>

            {/* 5. Payments History Skeleton */}
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                    <div className="h-4 w-40 bg-slate-200 rounded"></div>
                    <div className="h-3 w-32 bg-slate-100 rounded"></div>
                </div>
                <div className="p-0">
                    <div className="h-10 bg-slate-50 border-b border-slate-100"></div>
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-14 border-b border-slate-50 last:border-0 flex items-center px-6 gap-4">
                            <div className="h-3 w-20 bg-slate-200 rounded"></div>
                            <div className="h-3 w-24 bg-slate-100 rounded ml-auto"></div>
                            <div className="h-3 w-16 bg-slate-100 rounded"></div>
                            <div className="h-6 w-16 bg-emerald-50 rounded"></div>
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
};
