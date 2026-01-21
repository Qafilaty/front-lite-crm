import React, { useState, useEffect } from 'react';
import {
    ChevronRight,
    ChevronLeft,
    ChevronsRight,
    ChevronsLeft,
    ChevronDown,
    MoreHorizontal
} from 'lucide-react';

interface PaginationControlProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    limit: number;
    onLimitChange: (limit: number) => void;
    totalItems?: number;
    isLoading?: boolean;
}

const PaginationControl: React.FC<PaginationControlProps> = ({
    currentPage,
    totalPages,
    onPageChange,
    limit,
    onLimitChange,
    totalItems,
    isLoading = false
}) => {
    const limits = [5, 10, 20, 50, 100];
    const [jumpPage, setJumpPage] = useState<string>('');

    // Update jumpPage input when currentPage changes externally
    useEffect(() => {
        setJumpPage('');
    }, [currentPage]);

    const handleJumpToPage = (e: React.FormEvent) => {
        e.preventDefault();
        const pageNum = parseInt(jumpPage);
        if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
            onPageChange(pageNum);
            setJumpPage('');
        }
    };

    // Calculate range
    const startItem = (currentPage - 1) * limit + 1;
    const endItem = totalItems ? Math.min(currentPage * limit, totalItems) : currentPage * limit;

    // Helper to generate page numbers with ellipsis
    const getPageNumbers = () => {
        const pages = [];
        const maxGenericButtons = 5; // How many buttons to show (excluding first/last)

        if (totalPages <= maxGenericButtons + 2) {
            // If few pages, show all
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            // Logic for ellipsis
            if (currentPage <= 4) {
                // Near start: 1 2 3 4 5 ... 100
                pages.push(1, 2, 3, 4, 5, '...', totalPages);
            } else if (currentPage >= totalPages - 3) {
                // Near end: 1 ... 96 97 98 99 100
                pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
            } else {
                // Middle: 1 ... 49 50 51 ... 100
                pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
            }
        }
        return pages;
    };

    if (totalPages <= 0 && !totalItems) return null;

    return (
        <div className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm flex flex-col xl:flex-row justify-between items-center gap-4 animate-in slide-in-from-bottom-2">

            {/* Left Section: Info & Limit */}
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full xl:w-auto justify-between xl:justify-start">

                {/* Total Info */}
                {totalItems !== undefined && (
                    <div className="text-[11px] font-bold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 whitespace-nowrap">
                        عرض <span className="text-indigo-600 font-black">{startItem}</span> - <span className="text-indigo-600 font-black">{endItem}</span> من <span className="text-slate-800 font-black">{totalItems}</span>
                    </div>
                )}

                {/* Limit Selector */}
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden sm:inline">صفوف:</span>
                    <div className="relative group">
                        <select
                            value={limit}
                            onChange={(e) => {
                                onLimitChange(Number(e.target.value));
                                onPageChange(1);
                            }}
                            disabled={isLoading}
                            className="appearance-none bg-white border border-slate-200 text-slate-700 text-[11px] font-black rounded-lg pl-3 pr-8 py-1.5 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 cursor-pointer disabled:opacity-50 transition-all hover:border-indigo-300 w-16 text-center"
                        >
                            {limits.map(l => (
                                <option key={l} value={l}>{l}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none group-hover:text-indigo-500 transition-colors" />
                    </div>
                </div>
            </div>

            {/* Right Section: Navigation */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto justify-between xl:justify-end">

                {/* Pagination Buttons */}
                <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-100">

                    {/* First Page */}
                    <button
                        disabled={currentPage === 1 || isLoading}
                        onClick={() => onPageChange(1)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-white hover:shadow-sm disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 transition-all"
                        title="الصفحة الأولى"
                    >
                        <ChevronsRight className="w-4 h-4" />
                    </button>

                    {/* Prev Page */}
                    <button
                        disabled={currentPage === 1 || isLoading}
                        onClick={() => onPageChange(currentPage - 1)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-white hover:shadow-sm disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 transition-all"
                        title="السابق"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>

                    {/* Page Numbers (Hidden on very small screens) */}
                    <div className="hidden sm:flex items-center gap-1 mx-1">
                        {getPageNumbers().map((page, i) => (
                            <React.Fragment key={i}>
                                {page === '...' ? (
                                    <span className="w-8 flex justify-center text-slate-300">
                                        <MoreHorizontal className="w-4 h-4" />
                                    </span>
                                ) : (
                                    <button
                                        onClick={() => onPageChange(Number(page))}
                                        disabled={isLoading}
                                        className={`w-8 h-8 rounded-lg text-[11px] font-black transition-all shadow-sm active:scale-95 flex items-center justify-center ${currentPage === page
                                            ? 'bg-indigo-600 text-white shadow-indigo-600/20 ring-2 ring-indigo-600 ring-offset-2'
                                            : 'bg-white text-slate-500 border border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
                                            }`}
                                    >
                                        {page}
                                    </button>
                                )}
                            </React.Fragment>
                        ))}
                    </div>

                    {/* Mobile Only: Simple Current/Total */}
                    <div className="sm:hidden flex items-center px-2 text-[10px] font-bold text-slate-600">
                        {currentPage} / {totalPages}
                    </div>

                    {/* Next Page */}
                    <button
                        disabled={currentPage === totalPages || isLoading}
                        onClick={() => onPageChange(currentPage + 1)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-white hover:shadow-sm disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 transition-all"
                        title="التالي"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>

                    {/* Last Page */}
                    <button
                        disabled={currentPage === totalPages || isLoading}
                        onClick={() => onPageChange(totalPages)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-white hover:shadow-sm disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 transition-all"
                        title="الصفحة الأخيرة"
                    >
                        <ChevronsLeft className="w-4 h-4" />
                    </button>

                </div>

                {/* Jump to Page (Optional) - Only show if many pages */}
                {totalPages > 5 && (
                    <form onSubmit={handleJumpToPage} className="flex items-center gap-2 hidden lg:flex">
                        <input
                            type="text"
                            placeholder="اذهب..."
                            value={jumpPage}
                            onChange={(e) => setJumpPage(e.target.value.replace(/[^0-9]/g, ''))}
                            className="w-14 h-9 rounded-lg bg-slate-50 border border-slate-200 text-center text-[11px] font-bold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-300"
                        />
                    </form>
                )}

            </div>
        </div>
    );
};

export default PaginationControl;
