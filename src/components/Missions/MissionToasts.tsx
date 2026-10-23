import { useEffect } from 'react';
import { useProgressStore } from '../../store/useProgressStore';
import { useI18n } from '../../i18n/useI18n';
import { MISSIONS } from '../../data/missions';
import { CheckIcon, CloseIcon } from '../icons';

/** ミッション達成の通知。同時に達成したものは 1 枚にまとめる */
export function MissionToasts() {
  const { t, lang } = useI18n();
  const { toasts, achieved, dismissToasts } = useProgressStore();
  const latestId = toasts[toasts.length - 1]?.id;

  // 新しい達成があるたびに表示時間を延長する
  useEffect(() => {
    if (latestId === undefined) return;
    const timer = window.setTimeout(dismissToasts, 4000);
    return () => window.clearTimeout(timer);
  }, [latestId, dismissToasts]);

  const missions = toasts
    .map(toast => MISSIONS.find(m => m.id === toast.missionId))
    .filter(m => m !== undefined);
  const allDone = achieved.length === MISSIONS.length;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4 md:inset-x-auto md:right-5 md:bottom-5"
      aria-live="polite">
      {missions.length > 0 && (
        <div key={latestId} role="status"
          className="animate-toast-in pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl bg-stone-900 p-3 pr-2 text-white shadow-2xl ring-1 ring-white/10 dark:bg-stone-50 dark:text-stone-900">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-amber-300 to-amber-500 text-lg text-stone-900 shadow-inner">
            <CheckIcon />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-amber-300 dark:text-amber-600">
              {t.missions.achieved} · {achieved.length}/{MISSIONS.length}
            </p>
            {missions.slice(-3).map(m => (
              <p key={m.id} className="truncate text-sm font-semibold">{lang === 'ja' ? m.titleJa : m.titleEn}</p>
            ))}
            {missions.length > 3 && <p className="text-xs opacity-70">+{missions.length - 3}</p>}
            {allDone && <p className="mt-0.5 text-xs opacity-80">{t.missions.allDone}</p>}
          </div>
          <button type="button" onClick={dismissToasts} aria-label={t.crossSection.close}
            className="grid size-7 shrink-0 place-items-center rounded-full opacity-60 hover:bg-white/10 hover:opacity-100 dark:hover:bg-black/5">
            <CloseIcon className="text-sm" />
          </button>
        </div>
      )}
    </div>
  );
}
