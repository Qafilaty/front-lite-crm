import React from 'react';

const OrderStatsSkeleton: React.FC = () => {
    return (
        <div className="space-y-8 animate-pulse pb-20">

            {/* Header Skeleton */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-slate-200"></div>
                    <div className="space-y-2">
                        <div className="h-8 w-48 bg-slate-200 rounded-lg"></div>
                        <div className="h-3 w-32 bg-slate-200 rounded"></div>
                    </div>
                </div>
                <div className="flex gap-3 w-full xl:w-auto">
                    <div className="h-10 w-24 bg-slate-200 rounded-lg"></div>
                    <div className="h-10 w-48 bg-slate-200 rounded-lg"></div>
                    <div className="h-10 w-48 bg-slate-200 rounded-lg"></div>
                </div>
            </div>

            {/* KPIs Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className={`p-6 rounded-2xl border shadow-sm flex flex-col items-center justify-center relative overflow-hidden h-48 ${i === 2 ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
                        {i < 2 ? (
                            <>
                                {/* Pie Chart Skeleton */}
                                <div className="w-28 h-28 rounded-full border-8 border-slate-200 mb-2 box-border"></div>
                                <div className="h-3 w-20 bg-slate-200 rounded mt-2"></div>
                            </>
                        ) : (
                            <div className="w-full h-full flex flex-col justify-between">
                                <div className={`w-10 h-10 rounded-xl ${i === 2 ? 'bg-slate-700' : 'bg-slate-100'}`}></div>
                                <div>
                                    <div className={`h-3 w-24 rounded mb-2 ${i === 2 ? 'bg-slate-700' : 'bg-slate-200'}`}></div>
                                    <div className={`h-8 w-32 rounded ${i === 2 ? 'bg-slate-600' : 'bg-slate-200'}`}></div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* "Best Of" 3-Column Section Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, colIndex) => (
                    <div key={colIndex} className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm h-[400px]">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 rounded-xl bg-slate-200"></div>
                            <div className="h-4 w-32 bg-slate-200 rounded"></div>
                        </div>
                        <div className="space-y-6">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-8 h-8 rounded-lg bg-slate-100"></div>
                                        <div className="h-3 w-24 bg-slate-100 rounded"></div>
                                    </div>
                                    <div className="h-3 w-10 bg-slate-100 rounded"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Status Analysis Circles Skeleton */}
            <div className="bg-white p-10 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-4 mb-10">
                    <div className="w-12 h-12 rounded-xl bg-slate-200"></div>
                    <div>
                        <div className="h-5 w-48 bg-slate-200 rounded mb-2"></div>
                        <div className="h-3 w-32 bg-slate-200 rounded"></div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {[...Array(2)].map((_, i) => (
                        <div key={i} className="flex flex-col md:flex-row items-center gap-10 bg-slate-50/50 p-8 rounded-2xl border border-slate-100">
                            <div className="w-48 h-48 shrink-0 rounded-full border-[16px] border-slate-200 box-border"></div>
                            <div className="space-y-4 flex-1 w-full">
                                <div className="h-4 w-32 bg-slate-200 rounded mb-4"></div>
                                <div className="space-y-3">
                                    {[...Array(4)].map((_, j) => (
                                        <div key={j} className="flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2.5 h-2.5 rounded-full bg-slate-200"></div>
                                                <div className="h-3 w-20 bg-slate-200 rounded"></div>
                                            </div>
                                            <div className="h-3 w-8 bg-slate-200 rounded"></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default OrderStatsSkeleton;
