import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  variant?: 'danger' | 'warning' | 'info';
}

/**
 * Confirm Dialog Component
 * مكون تأكيد الإجراءات الحساسة
 */
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'تأكيد',
  cancelText = 'إلغاء',
  loading = false,
  variant = 'danger',
}) => {
  const variantColors = {
    danger: 'text-rose-600',
    warning: 'text-amber-600',
    info: 'text-indigo-600',
  };

  const variantBgColors = {
    danger: 'bg-rose-50',
    warning: 'bg-amber-50',
    info: 'bg-indigo-50',
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      showCloseButton={!loading}
    >
      <div className="p-6 md:p-8 space-y-6">
        {/* Icon */}
        <div className={`w-16 h-16 rounded-xl ${variantBgColors[variant]} flex items-center justify-center mx-auto`}>
          <AlertTriangle className={`w-8 h-8 ${variantColors[variant]}`} />
        </div>

        {/* Message */}
        <p className="text-slate-600 text-sm text-center font-medium leading-relaxed">
          {message}
        </p>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button
            onClick={onClose}
            variant="secondary"
            fullWidth
            disabled={loading}
          >
            {cancelText}
          </Button>
          <Button
            onClick={onConfirm}
            variant={variant === 'info' ? 'primary' : 'danger'}
            loading={loading}
            fullWidth
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
