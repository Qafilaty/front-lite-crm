import React from 'react';

const StatsSkeleton: React.FC = () => {
    return (
        <div className="space-y-8 animate-pulse">
            {/* Header Skeleton */}
            <div className="flex justify-between items-center">
                <div className="space-y-2">
                    <div className="h-4 w-32 bg-slate-200 rounded-lg"></div>
                    <div className="h-8 w-48 bg-slate-200 rounded-xl"></div>
                </div>
                <div className="h-10 w-32 bg-slate-200 rounded-xl"></div>
            </div>

            {/* Main Stats Area Skeleton */}
            <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100 h-[400px] flex gap-8">
                <div className="flex-1 space-y-8 py-4">
                    <div className="h-6 w-40 bg-slate-200 rounded-lg self-end ml-auto"></div>
                    <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <div className="h-4 w-20 bg-slate-200 rounded"></div>
                                <div className="h-6 w-12 bg-slate-200 rounded"></div>
                            </div>
                            <div className="h-2 w-full bg-slate-100 rounded-full"></div>
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <div className="h-4 w-20 bg-slate-200 rounded"></div>
                                <div className="h-6 w-12 bg-slate-200 rounded"></div>
                            </div>
                            <div className="h-2 w-full bg-slate-100 rounded-full"></div>
                        </div>
                    </div>
                    <div className="h-24 w-full bg-slate-100 rounded-3xl mt-auto"></div>
                </div>
                <div className="hidden lg:block w-[380px] bg-slate-200 rounded-[2.2rem]"></div>
            </div>

            {/* Grid Stats Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-100 h-40 flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                            <div className="h-10 w-10 bg-slate-200 rounded-xl"></div>
                            <div className="h-6 w-16 bg-slate-200 rounded-lg"></div>
                        </div>
                        <div>
                            <div className="h-8 w-24 bg-slate-200 rounded-lg mb-2"></div>
                            <div className="h-3 w-32 bg-slate-200 rounded"></div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-[2.5rem] h-80 border border-slate-100">
                    <div className="h-6 w-32 bg-slate-200 rounded-lg mb-8"></div>
                    <div className="h-48 w-full bg-slate-100 rounded-xl"></div>
                </div>
                <div className="bg-white p-8 rounded-[2.5rem] h-80 border border-slate-100">
                    <div className="h-6 w-32 bg-slate-200 rounded-lg mb-8"></div>
                    <div className="h-48 w-full bg-slate-100 rounded-xl"></div>
                </div>
            </div>
        </div>
    );
};

export default StatsSkeleton;
