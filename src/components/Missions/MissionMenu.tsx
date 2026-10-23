import { useEffect, useRef, useState } from 'react';
import { useProgressStore } from '../../store/useProgressStore';
import { useI18n } from '../../i18n/useI18n';
import { MISSIONS } from '../../data/missions';
import { CheckIcon, CompassIcon } from '../icons';

/** ヘッダーの進捗表示と、ミッション一覧のポップオーバー */
export function MissionMenu() {
  const { t, lang } = useI18n();
  const { achieved, resetProgress } = useProgressStore();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const done = achieved.length;
  const total = MISSIONS.length;
  const pct = Math.round((done / total) * 100);

  // 外側クリック・Escape で閉じる
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button type="button" onClick={() => setOpen(o => !o)}
        aria-expanded={open} aria-haspopup="dialog" aria-label={`${t.missions.open} (${t.missions.progress(done, total)})`}
        className="flex h-9 items-center gap-2 rounded-xl px-2.5 text-xs font-semibold text-stone-700 ring-1 ring-stone-900/10 transition-all hover:bg-white hover:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-teal-600 dark:text-stone-200 dark:ring-white/10 dark:hover:bg-stone-800">
        <CompassIcon className="text-base text-amber-600 dark:text-amber-400" />
        <span className="hidden sm:inline">{t.missions.title}</span>
        <span className="relative hidden h-1.5 w-14 overflow-hidden rounded-full bg-stone-200 sm:block dark:bg-stone-700" aria-hidden="true">
          <span className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-amber-400 to-teal-500 transition-all duration-700"
            style={{ width: `${pct}%` }} />
        </span>
        <span className="tabular-nums">{done}/{total}</span>
      </button>

      {open && (
        <div role="dialog" aria-label={t.missions.title}
          className="animate-pop-in absolute right-0 top-full z-50 mt-2 w-[min(22rem,calc(100vw-1.5rem))] rounded-2xl bg-white p-4 shadow-2xl ring-1 ring-stone-900/10 dark:bg-stone-800 dark:ring-white/10">
          <div className="mb-3">
            <p className="text-sm font-bold text-stone-900 dark:text-stone-50">{t.missions.title}</p>
            <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">
              {done === total ? t.missions.allDone : t.missions.lead}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-stone-100 dark:bg-stone-700">
                <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-teal-500 transition-all duration-700"
                  style={{ width: `${pct}%` }} />
              </div>
              <span className="text-xs font-semibold tabular-nums text-stone-600 dark:text-stone-300">
                {t.missions.progress(done, total)}
              </span>
            </div>
          </div>
          <ul className="max-h-[60vh] space-y-1 overflow-y-auto">
            {MISSIONS.map(m => {
              const ok = achieved.includes(m.id);
              return (
                <li key={m.id} className={`flex gap-2.5 rounded-xl p-2 ${ok ? 'bg-teal-50/70 dark:bg-teal-400/5' : ''}`}>
                  <span className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full text-xs ${
                    ok ? 'bg-teal-600 text-white dark:bg-teal-400 dark:text-stone-900'
                       : 'border-2 border-dashed border-stone-300 dark:border-stone-600'}`}>
                    {ok && <CheckIcon />}
                  </span>
                  <div className="min-w-0">
                    <p className={`text-xs font-semibold ${ok ? 'text-teal-900 dark:text-teal-100' : 'text-stone-800 dark:text-stone-100'}`}>
                      {lang === 'ja' ? m.titleJa : m.titleEn}
                    </p>
                    <p className="text-[11px] leading-snug text-stone-500 dark:text-stone-400">
                      {lang === 'ja' ? m.hintJa : m.hintEn}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
          {done > 0 && (
            <button type="button" onClick={resetProgress}
              className="mt-2 text-[11px] text-stone-400 underline-offset-2 hover:text-stone-600 hover:underline dark:hover:text-stone-300">
              {t.missions.reset}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
