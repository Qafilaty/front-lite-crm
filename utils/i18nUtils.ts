import { i18n } from 'i18next';

export const getTranslatedName = (obj: any, currentLang: string): string => {
  if (!obj) return '';

  const lang = currentLang?.toLowerCase().substring(0, 2) || 'ar';

  if (lang === 'ar') {
    return obj.nameAR || '';
  } else if (lang === 'fr') {
    return obj.nameFR || obj.nameAR || '';
  } else if (lang === 'en') {
    return obj.nameEN || obj.nameAR || '';
  }

  return obj.nameAR || obj.nameFR || obj.nameEN || '';
};
