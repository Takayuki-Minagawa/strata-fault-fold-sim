import { useEffect, useState } from 'react';
import { useGeoStore } from '../../store/useGeoStore';
import { useUiStore } from '../../store/useUiStore';
import { useI18n } from '../../i18n/useI18n';
import { RedoIcon, ResetIcon, UndoIcon } from '../icons';

const iconButton =
  'grid size-9 place-items-center rounded-xl text-lg text-stone-600 transition-all hover:bg-stone-900/5 hover:text-stone-900 active:scale-95 ' +
  'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-teal-600 ' +
  'disabled:pointer-events-none disabled:opacity-30 dark:text-stone-300 dark:hover:bg-white/10 dark:hover:text-white';

/** 断面図の見出しと、元に戻す／やり直す／リセット */
export function SectionHeader() {
  const { t } = useI18n();
  const { undo, redo, reset, history, currentStep } = useGeoStore();
  const setOpenPanel = useUiStore(s => s.setOpenPanel);
  const [confirming, setConfirming] = useState(false);

  // リセットは 2 回押しで確定（3 秒で取り消し）
  useEffect(() => {
    if (!confirming) return;
    const timer = window.setTimeout(() => setConfirming(false), 3000);
    return () => window.clearTimeout(timer);
  }, [confirming]);

  const canUndo = currentStep >= 0;
  const canRedo = currentStep < history.length - 1;

  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex min-w-0 items-baseline gap-2">
        <h2 className="truncate text-sm font-bold text-stone-800 dark:text-stone-100">{t.crossSection.title}</h2>
        {history.length > 0 && (
          <span className="shrink-0 rounded-full bg-stone-900/5 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-stone-600 dark:bg-white/10 dark:text-stone-300">
            {t.timeline.stepOf(currentStep + 1, history.length)}
          </span>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-0.5">
        <button type="button" className={iconButton} disabled={!canUndo} onClick={undo}
          aria-label={t.toolbar.undo} title={`${t.toolbar.undo} (Ctrl+Z)`}>
          <UndoIcon />
        </button>
        <button type="button" className={iconButton} disabled={!canRedo} onClick={redo}
          aria-label={t.toolbar.redo} title={`${t.toolbar.redo} (Ctrl+Shift+Z)`}>
          <RedoIcon />
        </button>
        <span className="mx-1 h-5 w-px bg-stone-300 dark:bg-stone-700" aria-hidden="true" />
        <button type="button"
          disabled={history.length === 0}
          onClick={() => {
            if (confirming) {
              reset();
              setOpenPanel(null);
              setConfirming(false);
            } else {
              setConfirming(true);
            }
          }}
          aria-label={confirming ? t.toolbar.resetConfirm : t.toolbar.reset}
          className={[
            'flex h-9 items-center gap-1.5 rounded-xl px-2.5 text-xs font-semibold transition-all active:scale-95',
            'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-rose-600',
            'disabled:pointer-events-none disabled:opacity-30',
            confirming
              ? 'bg-rose-600 text-white shadow-sm'
              : 'text-stone-600 hover:bg-rose-50 hover:text-rose-700 dark:text-stone-300 dark:hover:bg-rose-500/15 dark:hover:text-rose-300',
          ].join(' ')}>
          <ResetIcon className="text-base" />
          <span className={confirming ? undefined : 'hidden sm:inline'}>
            {confirming ? t.toolbar.resetConfirm : t.toolbar.reset}
          </span>
        </button>
      </div>
    </div>
  );
}
