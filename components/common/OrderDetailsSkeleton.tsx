import React from 'react';

const OrderDetailsSkeleton: React.FC = () => {
    return (
        <div className="space-y-6 animate-pulse pb-20">
            {/* Header Skeleton */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="w-10 h-10 rounded-xl bg-slate-200"></div>
                    <div className="flex flex-col gap-2">
                        <div className="h-6 w-32 bg-slate-200 rounded"></div>
                        <div className="h-3 w-24 bg-slate-200 rounded"></div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <div className="h-9 w-24 bg-slate-200 rounded-xl"></div>
                    <div className="h-9 w-32 bg-slate-200 rounded-xl"></div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content Column */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Customer Info Skeleton */}
                    <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-8">
                        <div className="flex items-center gap-3 border-b border-slate-50 pb-5">
                            <div className="w-5 h-5 bg-slate-200 rounded"></div>
                            <div className="h-4 w-40 bg-slate-200 rounded"></div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="space-y-2">
                                    <div className="h-3 w-20 bg-slate-200 rounded"></div>
                                    <div className="h-12 w-full bg-slate-100 rounded-2xl"></div>
                                </div>
                            ))}
                            <div className="md:col-span-2 space-y-2">
                                <div className="h-3 w-20 bg-slate-200 rounded"></div>
                                <div className="h-24 w-full bg-slate-100 rounded-2xl"></div>
                            </div>
                        </div>
                    </div>

                    {/* Cart Skeleton */}
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col h-[400px]">
                        <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-slate-200"></div>
                                <div>
                                    <div className="h-4 w-32 bg-slate-200 rounded mb-2"></div>
                                    <div className="h-3 w-20 bg-slate-200 rounded"></div>
                                </div>
                            </div>
                        </div>
                        <div className="p-5 space-y-4 flex-1">
                            {[...Array(2)].map((_, i) => (
                                <div key={i} className="h-24 w-full bg-slate-50 rounded-xl"></div>
                            ))}
                        </div>
                        <div className="p-8 border-t border-slate-100 h-32 bg-slate-50"></div>
                    </div>
                </div>

                {/* Sidebar Column */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Order Meta Skeleton */}
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm h-64 p-5">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-5 h-5 bg-slate-200 rounded"></div>
                            <div className="h-4 w-32 bg-slate-200 rounded"></div>
                        </div>
                        <div className="space-y-4">
                            <div className="h-10 w-full bg-slate-100 rounded-xl"></div>
                            <div className="h-20 w-full bg-slate-100 rounded-xl"></div>
                        </div>
                    </div>

                    {/* Timeline Skeleton */}
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm h-96 p-5">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-5 h-5 bg-slate-200 rounded"></div>
                            <div className="h-4 w-32 bg-slate-200 rounded"></div>
                        </div>
                        <div className="space-y-4">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="h-20 w-full bg-slate-50 rounded-xl"></div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderDetailsSkeleton;
