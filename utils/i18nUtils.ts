import { i18n } from 'i18next';

export const getTranslatedName = (obj: any, currentLang: string): string => {
  if (!obj) return '';
  if (typeof obj === 'string') return obj;

  const lang = currentLang?.toLowerCase().substring(0, 2) || 'ar';

  const ar = obj.nameAR || obj.arName || obj.name || '';
  const fr = obj.nameFR || obj.frName || obj.name || '';
  const en = obj.nameEN || obj.enName || obj.name || '';

  if (lang === 'ar') {
    return ar || fr || en;
  } else if (lang === 'fr') {
    return fr || ar || en;
  } else if (lang === 'en') {
    return en || ar || fr;
  }

  return ar || fr || en;
};

export const getWilayaName = (stateVal: any, wilayasData: any, currentLang: string): string => {
  if (!stateVal) return '-';
  if (typeof stateVal === 'object') return getTranslatedName(stateVal, currentLang);
  
  if (wilayasData?.allWilayas) {
    const wilaya = wilayasData.allWilayas.find((w: any) => 
      w.code == stateVal || 
      w.name?.toLowerCase() === String(stateVal).toLowerCase() ||
      w.id === stateVal
    );
    if (wilaya) return getTranslatedName(wilaya, currentLang);
  }
  
  return String(stateVal);
};

