import { i18n } from 'i18next';

export const getTranslatedName = (obj: any, currentLang: string): string => {
  if (!obj) return '';

  if (currentLang === 'ar') {
    return obj.arName || obj.nameAR || obj.name || '';
  } else if (currentLang === 'fr') {
    return obj.nameFR || obj.name || obj.arName || '';
  } else if (currentLang === 'en') {
    return obj.nameEN || obj.name || obj.arName || '';
  }

  return obj.name || obj.arName || '';
};
