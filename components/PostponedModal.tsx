import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, X, Clock, AlertCircle, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

interface PostponedModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (date: string) => void;
    currentDate?: string;
}

export const PostponedModal: React.FC<PostponedModalProps> = ({
    isOpen, onClose, onConfirm, currentDate
}) => {
    const [selectedDate, setSelectedDate] = useState<string>(currentDate || '');

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (!selectedDate) {
            toast.error('الرجاء تحديد تاريخ التأجيل');
            return;
        }

        // Validate date is not in the past
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const picked = new Date(selectedDate);
        if (picked < today) {
            toast.error('لا يمكن تأجيل الطلب لتاريخ سابق');
            return;
        }

        onConfirm(selectedDate);
    };

    return createPortal(
        <div className="fixed inset-0 z-[100] grid place-items-center p-4">
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
            <div className="relative z-10 bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="bg-amber-50 p-6 pb-8 text-center relative border-b border-amber-100">
                    <button onClick={onClose} className="absolute top-4 left-4 w-8 h-8 rounded-full bg-white/50 hover:bg-white text-amber-800/50 hover:text-amber-600 transition-colors flex items-center justify-center">
                        <X className="w-4 h-4" />
                    </button>
                    <div className="w-16 h-16 rounded-2xl bg-white text-amber-500 mx-auto flex items-center justify-center shadow-lg shadow-amber-500/10 mb-3">
                        <Clock className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-black text-amber-950">تأجيل الطلب</h3>
                    <p className="text-xs font-bold text-amber-600/80 mt-1">متى يريد العميل استلام الطلب؟</p>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">تاريخ التأجيل</label>
                        <div className="relative">
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                                className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm font-bold rounded-2xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-center"
                            />
                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 px-1">
                            <AlertCircle className="w-3 h-3" />
                            سيتم تذكيرك بهذا الطلب في التاريخ المحدد
                        </p>
                    </div>

                    <div className="pt-2">
                        <button
                            onClick={handleSubmit}
                            disabled={!selectedDate}
                            className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-black text-xs shadow-xl shadow-amber-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
                        >
                            <span>تأكيد التأجيل</span>
                            <ArrowRight className="w-4 h-4 group-hover:-translate-x-1 transition-transform rtl:rotate-180" />
                        </button>
                    </div>
                </div>

            </div>
        </div>,
        document.body
    );
};
