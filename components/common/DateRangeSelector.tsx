import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown, X, Clock, ChevronRight, ChevronLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type DateRange = {
  startDate: string | null;
  endDate: string | null;
  key: string;
};

interface DateRangeSelectorProps {
  onChange: (range: DateRange) => void;
  value?: DateRange;
  className?: string;
  label?: string;
  showLabel?: boolean; // Prop to control internal label vs external
}

export const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({ onChange, value, className, label }) => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const presets = [
    { label: t('common.date_ranges.all_time'), key: 'all' },
    { label: t('common.date_ranges.today'), key: 'today' },
    { label: t('common.date_ranges.yesterday'), key: 'yesterday' },
    { label: t('common.date_ranges.last_7_days'), key: '7days' },
    { label: t('common.date_ranges.last_30_days'), key: '30days' },
    { label: t('common.date_ranges.this_month'), key: 'this_month' },
    { label: t('common.date_ranges.last_month'), key: 'last_month' },
    { label: t('common.date_ranges.custom'), key: 'custom' },
  ];

  const [selectedKey, setSelectedKey] = useState(value?.key || 'all');
  const [customStart, setCustomStart] = useState(value?.startDate || '');
  const [customEnd, setCustomEnd] = useState(value?.endDate || '');

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (key: string) => {
    setSelectedKey(key);
    if (key !== 'custom') {
      const range = calculateRange(key);
      onChange({ ...range, key });
      setIsOpen(false);
    }
  };

  const calculateRange = (key: string): { startDate: string | null; endDate: string | null } => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (key) {
      case 'today':
        return {
          startDate: today.toISOString(),
          endDate: new Date(today.getTime() + 86399999).toISOString()
        };
      case 'yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        return {
          startDate: yesterday.toISOString(),
          endDate: new Date(yesterday.getTime() + 86399999).toISOString()
        };
      case '7days':
        const last7 = new Date(today);
        last7.setDate(last7.getDate() - 6);
        return { startDate: last7.toISOString(), endDate: now.toISOString() };
      case '30days':
        const last30 = new Date(today);
        last30.setDate(last30.getDate() - 29);
        return { startDate: last30.toISOString(), endDate: now.toISOString() };
      case 'this_month':
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        return { startDate: startOfMonth.toISOString(), endDate: now.toISOString() };
      case 'last_month':
        const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999);
        return { startDate: startOfLastMonth.toISOString(), endDate: endOfLastMonth.toISOString() };
      case 'all':
      default:
        return { startDate: null, endDate: null };
    }
  };

  const applyCustomRange = () => {
    if (customStart && customEnd) {
      onChange({
        startDate: new Date(customStart).toISOString(),
        endDate: new Date(new Date(customEnd).setHours(23, 59, 59, 999)).toISOString(),
        key: 'custom'
      });
      setIsOpen(false);
    }
  };

  const getDisplayLabel = () => {
    const preset = presets.find(p => p.key === selectedKey);
    if (selectedKey === 'custom' && customStart && customEnd) {
      return `${customStart} - ${customEnd}`;
    }
    return preset?.label || t('common.date_ranges.all_time');
  };

  return (
    <div className={cn("relative w-full", className)} ref={containerRef}>
      {label && <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide text-right">{label}</label>}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-right transition-all",
          "hover:bg-slate-100 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none font-bold text-slate-700",
          isOpen && "border-indigo-400 ring-2 ring-indigo-100 bg-white"
        )}
      >
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-indigo-500" />
          <span className="text-sm">
            {getDisplayLabel()}
          </span>
        </div>
        <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform duration-200", isOpen && "rotate-180 text-indigo-500")} />
      </button>

      {isOpen && (
        <div className={cn(
          "absolute top-full mt-2 w-72 bg-white border border-slate-100 rounded-2xl shadow-2xl z-[1000] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200",
          isRtl ? "right-0 origin-top-right" : "left-0 origin-top-left"
        )}>
          {/* Header */}
          <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t('common.date_ranges.select_period')}</span>
            </div>
            {selectedKey !== 'all' && (
              <button
                onClick={() => handleSelect('all')}
                className="text-[10px] font-black text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                {t('common.clear')}
              </button>
            )}
          </div>

          {/* List */}
          <div className="p-2 grid grid-cols-1 gap-1">
            {presets.filter(p => p.key !== 'custom').map((preset) => (
              <button
                key={preset.key}
                onClick={() => handleSelect(preset.key)}
                className={cn(
                  "flex items-center justify-between px-3 py-2.5 rounded-xl transition-all text-right group",
                  selectedKey === preset.key
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-600 hover:bg-slate-50"
                )}
              >
                <span className="text-xs font-bold">{preset.label}</span>
                {selectedKey === preset.key && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />}
              </button>
            ))}

            {/* Custom Range Toggle */}
            <div className="mt-1 pt-1 border-t border-slate-100">
              <button
                onClick={() => setSelectedKey('custom')}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all text-right",
                  selectedKey === 'custom'
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-600 hover:bg-slate-50"
                )}
              >
                <span className="text-xs font-bold">{t('common.date_ranges.custom')}</span>
                {isRtl ? <ChevronLeft className="w-4 h-4 opacity-50" /> : <ChevronRight className="w-4 h-4 opacity-50" />}
              </button>
            </div>
          </div>

          {/* Custom Range Inputs */}
          {selectedKey === 'custom' && (
            <div className="p-4 bg-slate-50 border-t border-slate-100 animate-in slide-in-from-bottom-2 duration-300">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-1">{t('common.date_ranges.start_date')}</label>
                  <input
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold outline-none focus:border-indigo-500 transition-all cursor-pointer"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-1">{t('common.date_ranges.end_date')}</label>
                  <input
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold outline-none focus:border-indigo-500 transition-all cursor-pointer"
                  />
                </div>
                <button
                  disabled={!customStart || !customEnd}
                  onClick={applyCustomRange}
                  className="w-full py-2.5 bg-slate-900 text-white rounded-lg text-xs font-black hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-2"
                >
                  {t('common.apply')}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
