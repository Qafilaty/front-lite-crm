import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

export interface Option {
    value: string;
    label: string;
    color?: string;
}

interface ModernSelectProps {
    value: string;
    onChange: (value: string) => void;
    options: Option[];
    placeholder?: string;
    className?: string; // Additional classes for the container
    label?: string; // Optional label text
    disabled?: boolean;
    onOpen?: () => void;
}

export const ModernSelect: React.FC<ModernSelectProps> = ({ value, onChange, options, placeholder = 'Select...', className, label, disabled = false, onOpen }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const [searchQuery, setSearchQuery] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    const selectedOption = options.find(opt => opt.value === value);

    const filteredOptions = options.filter(opt =>
        (opt.label || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearchQuery(''); // Reset search on close
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (isOpen && options.length > 10 && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen, options.length]);

    const handleSelect = (val: string) => {
        onChange(val);
        setIsOpen(false);
        setSearchQuery('');
    };

    const showSearch = options.length > 10;

    return (
        <div className={twMerge("relative w-full", className)} ref={containerRef}>
            {label && <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">{label}</label>}

            <button
                type="button"
                onClick={() => {
                    if (!disabled) {
                        const nextState = !isOpen;
                        setIsOpen(nextState);
                        if (nextState && onOpen) {
                            onOpen();
                        }
                    }
                }}
                disabled={disabled}
                className={twMerge(
                    "w-full flex items-center justify-between px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-left transition-all",
                    "hover:bg-slate-100 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none",
                    disabled && "opacity-60 cursor-not-allowed",
                    isOpen && "border-indigo-400 ring-2 ring-indigo-100 bg-white",
                    "text-sm font-bold text-slate-700"
                )}
            >
                <span className={twMerge("flex items-center gap-2", !selectedOption ? "text-slate-400 font-medium" : "")}>
                    {selectedOption && selectedOption.color && (
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: selectedOption.color }}></span>
                    )}
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown className={twMerge("w-4 h-4 text-slate-400 transition-transform duration-200", isOpen && "rotate-180 text-indigo-500")} />
            </button>

            {isOpen && (
                <div className="absolute z-50 w-full mt-2 bg-white border border-slate-100 rounded-xl shadow-xl max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-150">

                    {/* Search Input */}
                    {showSearch && (
                        <div className="sticky top-0 bg-white p-2 border-b border-slate-50 z-10">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                <input
                                    ref={inputRef}
                                    type="text"
                                    placeholder="بحث..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-lg py-2 pl-9 pr-3 text-xs font-bold outline-none focus:bg-white focus:border-indigo-500 transition-all text-right"
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </div>
                        </div>
                    )}

                    <div className="p-1 space-y-0.5">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => handleSelect(option.value)}
                                    className={twMerge(
                                        "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-bold transition-colors text-right",
                                        value === option.value
                                            ? "bg-indigo-50 text-indigo-700"
                                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                    )}
                                >
                                    <span className="flex items-center gap-2">
                                        {option.color && (
                                            <span
                                                className="w-2.5 h-2.5 rounded-full border border-black/5"
                                                style={{ backgroundColor: option.color }}
                                            ></span>
                                        )}
                                        <span style={/*option.color ? { color: option.color } : {}*/ {}}>{option.label}</span>
                                    </span>
                                    {value === option.value && <Check className="w-4 h-4 text-indigo-600" />}
                                </button>
                            ))
                        ) : (
                            <div className="px-4 py-3 text-xs text-slate-400 text-center font-medium">
                                لا توجد نتائج
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
