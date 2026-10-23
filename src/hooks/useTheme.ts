import { create } from 'zustand';
import { loadItem, saveItem } from '../utils/storage';

type Theme = 'light' | 'dark';

const STORAGE_KEY = 'strata-sim:theme';

interface ThemeStore {
  theme: Theme;
  toggle: () => void;
  setTheme: (theme: Theme) => void;
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  saveItem(STORAGE_KEY, theme);
}

export const useTheme = create<ThemeStore>((set) => {
  const saved = loadItem(STORAGE_KEY);
  const initial: Theme =
    saved === 'light' || saved === 'dark' ? saved
    : window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

  // 初期適用
  document.documentElement.classList.toggle('dark', initial === 'dark');

  return {
    theme: initial,
    toggle() {
      set(state => {
        const next: Theme = state.theme === 'light' ? 'dark' : 'light';
        applyTheme(next);
        return { theme: next };
      });
    },
    setTheme(theme) {
      applyTheme(theme);
      set({ theme });
    },
  };
});
