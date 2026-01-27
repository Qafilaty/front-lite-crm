
import React from 'react';
import ReactDOM from 'react-dom';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface DeleteConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    isDeleting?: boolean;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    isDeleting = false,
}) => {
    if (!isOpen) return null;

    return (
        <React.Fragment>
            {typeof document !== 'undefined' && ReactDOM.createPortal(
                <div className="fixed inset-0 z-[100] grid place-items-center overflow-y-auto py-10 px-4">
                    <div
                        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
                        onClick={!isDeleting ? onClose : undefined}
                    ></div>
                    <div className="relative z-10 bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 p-6 sm:p-8 text-center">

                        <div className="w-20 h-20 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-6">
                            <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center animate-pulse">
                                <AlertTriangle className="w-6 h-6 text-rose-600" />
                            </div>
                        </div>

                        <h3 className="text-xl font-black text-slate-800 mb-2">{title}</h3>
                        <p className="text-slate-500 text-sm font-medium leading-relaxed mb-8">
                            {description}
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                disabled={isDeleting}
                                className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 rounded-lg font-black text-xs uppercase hover:bg-slate-50 transition-all disabled:opacity-50"
                            >
                                إلغاء
                            </button>
                            <button
                                onClick={onConfirm}
                                disabled={isDeleting}
                                className="flex-1 py-3 bg-rose-600 text-white rounded-lg font-black text-xs uppercase shadow-lg shadow-rose-600/30 hover:bg-rose-700 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isDeleting ? (
                                    <>جاري الحذف...</>
                                ) : (
                                    <>
                                        <Trash2 className="w-4 h-4" /> تأكيد الحذف
                                    </>
                                )}
                            </button>
                        </div>

                        {!isDeleting && (
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 text-slate-300 hover:text-slate-500 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        )}

                    </div>
                </div>,
                document.body
            )}
        </React.Fragment>
    );
};

export default DeleteConfirmationModal;
