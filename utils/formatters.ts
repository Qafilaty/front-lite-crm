import i18n from '../i18n';

/**
 * Format date to Arabic locale
 */
export const formatDate = (date: string | Date): string => {
  return new Date(date).toLocaleDateString(i18n.language === 'ar' ? 'ar' : (i18n.language === 'fr' ? 'fr-FR' : 'en-US'), {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

/**
 * Format currency to Algerian Dinar
 */
export const formatCurrency = (amount: number | undefined | null): string => {
  const safeAmount = amount || 0;
  const locale = i18n.language === 'ar' ? 'ar-DZ' : (i18n.language === 'fr' ? 'fr-DZ' : 'en-US');
  return `${safeAmount.toLocaleString(locale)} ${i18n.t('common.currency')}`;
};

/**
 * Generate random order ID
 */
export const generateOrderId = (): string => {
  return `DZD-${Math.floor(1000 + Math.random() * 9000)}`;
};

/**
 * Get current date in appropriate locale format
 */
export const getCurrentDate = (): string => {
  const locale = i18n.language === 'ar' ? 'ar' : (i18n.language === 'fr' ? 'fr-FR' : 'en-US');
  return new Date().toLocaleDateString(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });
};

/**
 * Calculate percentage
 */
export const calculatePercentage = (value: number, total: number): number => {
  if (total === 0) return 0;
  return (value / total) * 100;
};

/**
 * Format phone number
 */
export const formatPhoneNumber = (phone: string): string => {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');

  // Format as Algerian phone number (e.g., 0555 12 34 56)
  if (cleaned.length === 10 && cleaned.startsWith('0')) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 6)} ${cleaned.slice(6, 8)} ${cleaned.slice(8)}`;
  }

  return phone;
};
