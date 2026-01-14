import { OrderStatus } from '../types';

/**
 * Labels for all order statuses in Arabic
 */
export const statusLabels: Record<OrderStatus, string> = {
  pending: 'معلقة',
  failed_01: 'فاشلة 01',
  failed_02: 'فاشلة 02',
  failed_03: 'فاشلة 03',
  confirmed: 'مؤكدة',
  cancelled: 'ملغاة',
  postponed: 'مؤجلة',
  duplicate: 'مكررة',
  failed_04: 'فاشلة 04',
  failed_05: 'فاشلة 05',
  wrong_number: 'رقم خاطئ',
  wrong_order: 'طلب خاطئ',
  message_sent: 'تم إرسال الرسالة',
  out_of_stock: 'غير متوفر في المخزون',
  processing: 'جاري التجهيز',
  en_preparation: 'قيد التجهيز',
  ramasse: 'تم الاستلام من المتجر',
  sorti_livraison: 'خرج للتوصيل',
  delivered: 'تم التوصيل',
  annule: 'ملغى',
  tentative_01: 'محاولة 01',
  tentative_02: 'محاولة 02',
  tentative_03: 'محاولة 03',
  reporte_01: 'مؤجل 01',
  client_absent: 'العميل غائب',
  wrong_address: 'عنوان خاطئ',
  retour_vendeur: 'في طريق العودة للبائع',
  retourne_vendeur: 'تم الإرجاع للبائع',
  paid: 'تم الدفع',
  shipped: 'تم الشحن'
};

/**
 * Color schemes for each order status
 */
export const statusColors: Record<string, { 
  bg: string; 
  text: string; 
  border: string; 
  hover: string; 
  active: string 
}> = {
  pending: { 
    bg: 'bg-blue-50', 
    text: 'text-blue-600', 
    border: 'border-blue-100', 
    hover: 'hover:bg-blue-100', 
    active: 'bg-blue-600' 
  },
  confirmed: { 
    bg: 'bg-emerald-50', 
    text: 'text-emerald-600', 
    border: 'border-emerald-100', 
    hover: 'hover:bg-emerald-100', 
    active: 'bg-emerald-600' 
  },
  message_sent: { 
    bg: 'bg-indigo-50', 
    text: 'text-indigo-600', 
    border: 'border-indigo-100', 
    hover: 'hover:bg-indigo-100', 
    active: 'bg-indigo-600' 
  },
  postponed: { 
    bg: 'bg-amber-50', 
    text: 'text-amber-600', 
    border: 'border-amber-100', 
    hover: 'hover:bg-amber-100', 
    active: 'bg-amber-600' 
  },
  failed_01: { 
    bg: 'bg-rose-50', 
    text: 'text-rose-600', 
    border: 'border-rose-100', 
    hover: 'hover:bg-rose-100', 
    active: 'bg-rose-600' 
  },
  failed_02: { 
    bg: 'bg-rose-50', 
    text: 'text-rose-600', 
    border: 'border-rose-100', 
    hover: 'hover:bg-rose-100', 
    active: 'bg-rose-600' 
  },
  failed_03: { 
    bg: 'bg-rose-50', 
    text: 'text-rose-600', 
    border: 'border-rose-100', 
    hover: 'hover:bg-rose-100', 
    active: 'bg-rose-600' 
  },
  failed_04: { 
    bg: 'bg-rose-50', 
    text: 'text-rose-600', 
    border: 'border-rose-100', 
    hover: 'hover:bg-rose-100', 
    active: 'bg-rose-600' 
  },
  failed_05: { 
    bg: 'bg-rose-50', 
    text: 'text-rose-600', 
    border: 'border-rose-100', 
    hover: 'hover:bg-rose-100', 
    active: 'bg-rose-600' 
  },
  duplicate: { 
    bg: 'bg-purple-50', 
    text: 'text-purple-600', 
    border: 'border-purple-100', 
    hover: 'hover:bg-purple-100', 
    active: 'bg-purple-600' 
  },
  wrong_number: { 
    bg: 'bg-orange-50', 
    text: 'text-orange-600', 
    border: 'border-orange-100', 
    hover: 'hover:bg-orange-100', 
    active: 'bg-orange-600' 
  },
  wrong_order: { 
    bg: 'bg-orange-50', 
    text: 'text-orange-600', 
    border: 'border-orange-100', 
    hover: 'hover:bg-orange-100', 
    active: 'bg-orange-600' 
  },
  out_of_stock: { 
    bg: 'bg-red-50', 
    text: 'text-red-600', 
    border: 'border-red-100', 
    hover: 'hover:bg-red-100', 
    active: 'bg-red-600' 
  },
  cancelled: { 
    bg: 'bg-slate-100', 
    text: 'text-slate-500', 
    border: 'border-slate-200', 
    hover: 'hover:bg-slate-200', 
    active: 'bg-slate-600' 
  },
  delivered: { 
    bg: 'bg-emerald-100', 
    text: 'text-emerald-700', 
    border: 'border-emerald-200', 
    hover: 'hover:bg-emerald-200', 
    active: 'bg-emerald-700' 
  },
  paid: { 
    bg: 'bg-green-100', 
    text: 'text-green-700', 
    border: 'border-green-200', 
    hover: 'hover:bg-green-200', 
    active: 'bg-green-700' 
  },
  default: { 
    bg: 'bg-slate-50', 
    text: 'text-slate-600', 
    border: 'border-slate-100', 
    hover: 'hover:bg-slate-200', 
    active: 'bg-indigo-600' 
  }
};

/**
 * All available order statuses for filtering
 */
export const confirmationStatuses: (OrderStatus | 'all')[] = [
  'all', 'pending', 'confirmed', 'message_sent', 'postponed', 
  'failed_01', 'failed_02', 'failed_03', 'failed_04', 'failed_05', 
  'duplicate', 'wrong_number', 'wrong_order', 'out_of_stock', 'cancelled'
];

/**
 * Tracking statuses for delivery tracking
 */
export const trackingStatuses: (OrderStatus | 'all')[] = [
  'all', 'confirmed', 'en_preparation', 'ramasse', 'sorti_livraison', 
  'delivered', 'paid', 'annule', 'tentative_01', 'tentative_02', 'tentative_03', 
  'reporte_01', 'client_absent', 'wrong_address', 'retour_vendeur', 'retourne_vendeur'
];
