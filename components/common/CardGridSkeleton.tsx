import React from 'react';

interface CardGridSkeletonProps {
    count?: number;
}

const CardGridSkeleton: React.FC<CardGridSkeletonProps> = ({ count = 8 }) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 animate-pulse">
            {[...Array(count)].map((_, i) => (
                <div key={i} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm h-[250px] flex flex-col items-center justify-between">
                    <div className="w-full flex justify-end">
                        <div className="w-8 h-8 rounded-full bg-slate-200"></div>
                    </div>
                    <div className="flex flex-col items-center w-full space-y-4">
                        <div className="w-20 h-20 rounded-3xl bg-slate-200"></div>
                        <div className="h-4 w-32 bg-slate-200 rounded"></div>
                        <div className="h-2 w-24 bg-slate-200 rounded"></div>
                    </div>
                    <div className="w-full flex gap-2 mt-4">
                        <div className="h-10 flex-1 bg-slate-200 rounded-xl"></div>
                        <div className="h-10 w-10 bg-slate-200 rounded-xl"></div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default CardGridSkeleton;
