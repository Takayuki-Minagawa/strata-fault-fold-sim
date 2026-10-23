import { useI18n } from '../../i18n/useI18n';
import { useTheme } from '../../hooks/useTheme';
import { MissionMenu } from '../Missions/MissionMenu';
import { GlobeIcon, MoonIcon, SunIcon } from '../icons';

const iconButton =
  'flex h-9 items-center justify-center gap-1.5 rounded-xl px-2.5 text-xs font-semibold text-stone-600 transition-all ' +
  'hover:bg-white hover:text-stone-900 hover:shadow-sm active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-teal-600 ' +
  'dark:text-stone-300 dark:hover:bg-stone-800 dark:hover:text-white';

export function Header() {
  const { t, lang, setLang } = useI18n();
  const { theme, toggle: toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-40 border-b border-stone-900/5 bg-[#f7f4ee]/85 backdrop-blur-md dark:border-white/5 dark:bg-[#14130f]/85">
      <div className="flex items-center gap-3 px-3 py-2.5 sm:px-5">
        <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" width="36" height="36"
          className="size-9 shrink-0 rounded-xl shadow-sm" />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[15px] font-bold leading-tight tracking-tight text-stone-900 sm:text-lg dark:text-stone-50">
            {t.appTitle}
          </h1>
          <p className="hidden truncate text-xs text-stone-500 sm:block dark:text-stone-400">{t.appSubtitle}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <MissionMenu />
          <button type="button" className={iconButton}
            onClick={() => setLang(lang === 'ja' ? 'en' : 'ja')}
            aria-label={t.ui.switchLang} title={t.ui.switchLang}>
            <GlobeIcon className="text-base" />
            <span className="hidden sm:inline">{lang === 'ja' ? t.ui.langEn : t.ui.langJa}</span>
          </button>
          <button type="button" className={`${iconButton} w-9 px-0`} onClick={toggleTheme}
            aria-label={theme === 'light' ? t.ui.switchToDark : t.ui.switchToLight}
            title={theme === 'light' ? t.ui.darkMode : t.ui.lightMode}>
            {theme === 'light' ? <MoonIcon className="text-base" /> : <SunIcon className="text-base" />}
          </button>
        </div>
      </div>
    </header>
  );
}
