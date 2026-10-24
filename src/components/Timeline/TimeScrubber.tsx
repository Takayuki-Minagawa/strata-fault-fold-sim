import type { CSSProperties } from 'react';
import { useGeoStore } from '../../store/useGeoStore';
import { useI18n } from '../../i18n/useI18n';
import { HistoryIcon } from '../icons';

/** 地質の歴史をスライダーでさかのぼる */
export function TimeScrubber() {
  const { history, currentStep, jumpTo } = useGeoStore();
  const { t } = useI18n();

  if (history.length === 0) return null;

  const max = history.length - 1;
  const pct = ((currentStep + 1) / history.length) * 100;

  return (
    <label className="flex items-center gap-3 rounded-xl bg-white/70 px-3 py-1.5 ring-1 ring-stone-900/5 dark:bg-stone-800/60 dark:ring-white/5">
      <span className="flex shrink-0 items-center gap-1.5 text-xs font-semibold text-stone-600 dark:text-stone-300">
        <HistoryIcon className="text-sm text-teal-600 dark:text-teal-400" />
        {t.timeline.scrubber}
      </span>
      <input type="range" min={-1} max={max} step={1} value={currentStep}
        onChange={e => jumpTo(Number(e.target.value))}
        aria-valuetext={currentStep === -1 ? t.timeline.initial : t.timeline.stepOf(currentStep + 1, history.length)}
        className="range min-w-0 flex-1"
        style={{ '--pct': `${pct}%`, '--range-color': '#0d9488' } as CSSProperties} />
      <span className="w-12 shrink-0 text-right font-mono text-[11px] font-semibold tabular-nums text-stone-500 dark:text-stone-400">
        {currentStep + 1}/{history.length}
      </span>
    </label>
  );
}
