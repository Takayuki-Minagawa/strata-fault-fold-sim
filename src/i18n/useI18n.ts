import { create } from 'zustand';
import { ja } from './ja';
import { en } from './en';
import type { I18nKeys } from './ja';
import { loadItem, saveItem } from '../utils/storage';

export type Lang = 'ja' | 'en';

const STORAGE_KEY = 'strata-sim:lang';

interface I18nStore {
  lang: Lang;
  t: I18nKeys;
  setLang: (lang: Lang) => void;
}

const initialLang: Lang = loadItem(STORAGE_KEY) === 'en' ? 'en' : 'ja';
document.documentElement.lang = initialLang;

export const useI18n = create<I18nStore>((set) => ({
  lang: initialLang,
  t: initialLang === 'ja' ? ja : en,
  setLang(lang) {
    document.documentElement.lang = lang;
    saveItem(STORAGE_KEY, lang);
    set({ lang, t: lang === 'ja' ? ja : en });
  },
}));
