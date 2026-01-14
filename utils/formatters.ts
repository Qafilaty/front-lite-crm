/**
 * Format date to Arabic locale
 */
export const formatDate = (date: string | Date): string => {
  return new Date(date).toLocaleDateString('ar-SA', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long',
    year: 'numeric'
  });
};

/**
 * Format currency to Algerian Dinar
 */
export const formatCurrency = (amount: number): string => {
  return `${amount.toLocaleString('ar-DZ')} دج`;
};

/**
 * Generate random order ID
 */
export const generateOrderId = (): string => {
  return `DZD-${Math.floor(1000 + Math.random() * 9000)}`;
};

/**
 * Get current date in Arabic format
 */
export const getCurrentDateArabic = (): string => {
  return new Date().toLocaleDateString('ar-SA', { 
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
