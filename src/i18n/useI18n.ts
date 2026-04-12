import { create } from 'zustand';
import { ja } from './ja';
import { en } from './en';
import type { I18nKeys } from './ja';

export type Lang = 'ja' | 'en';

interface I18nStore {
  lang: Lang;
  t: I18nKeys;
  setLang: (lang: Lang) => void;
}

export const useI18n = create<I18nStore>((set) => ({
  lang: 'ja',
  t: ja,
  setLang(lang) {
    set({ lang, t: lang === 'ja' ? ja : en });
  },
}));
