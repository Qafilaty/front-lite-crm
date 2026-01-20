import React from 'react';

interface TableSkeletonProps {
    rows?: number;
    columns?: number;
}

const TableSkeleton: React.FC<TableSkeletonProps> = ({ rows = 5, columns = 6 }) => {
    return (
        <div className="w-full overflow-hidden animate-pulse">
            {/* Header Skeleton */}
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4">
                {[...Array(columns)].map((_, i) => (
                    <div key={`head-${i}`} className="h-4 bg-slate-200 rounded w-20" />
                ))}
            </div>

            {/* Rows Skeleton */}
            <div className="divide-y divide-slate-50">
                {[...Array(rows)].map((_, rowIndex) => (
                    <div key={`row-${rowIndex}`} className="flex items-center justify-between px-6 py-5">
                        {[...Array(columns)].map((_, colIndex) => (
                            <div
                                key={`cell-${rowIndex}-${colIndex}`}
                                className={`h-3 bg-slate-100 rounded ${colIndex === 0 ? 'w-16' : 'w-24'}`}
                            />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TableSkeleton;
