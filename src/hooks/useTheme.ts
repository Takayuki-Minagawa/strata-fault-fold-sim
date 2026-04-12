import { create } from 'zustand';

type Theme = 'light' | 'dark';

interface ThemeStore {
  theme: Theme;
  toggle: () => void;
  setTheme: (theme: Theme) => void;
}

export const useTheme = create<ThemeStore>((set) => {
  const initial: Theme =
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

  // 初期適用
  document.documentElement.classList.toggle('dark', initial === 'dark');

  return {
    theme: initial,
    toggle() {
      set(state => {
        const next: Theme = state.theme === 'light' ? 'dark' : 'light';
        document.documentElement.classList.toggle('dark', next === 'dark');
        return { theme: next };
      });
    },
    setTheme(theme) {
      document.documentElement.classList.toggle('dark', theme === 'dark');
      set({ theme });
    },
  };
});
