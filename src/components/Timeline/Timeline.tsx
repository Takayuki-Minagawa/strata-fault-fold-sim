import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { useGeoStore } from '../../store/useGeoStore';
import { useI18n } from '../../i18n/useI18n';
import type { GeoAction } from '../../types/geology';
import { RockSwatch } from '../RockSwatch';
import {
  AddLayerToolIcon, StressToolIcon, FaultToolIcon, FoldToolIcon, ErodeToolIcon,
} from '../icons';

/** 操作の種類ごとのアイコン */
function ActionBadge({ action }: { action: GeoAction | null }) {
  const base = 'grid size-7 shrink-0 place-items-center rounded-full text-[18px] ring-4 ring-[var(--tl-bg)]';
  if (!action) {
    return <span className={`${base} bg-stone-200 text-stone-500 dark:bg-stone-700 dark:text-stone-300`}>
      <span className="size-2 rounded-full bg-current" />
    </span>;
  }
  switch (action.type) {
    case 'ADD_LAYER':
      return <span className={`${base} overflow-hidden bg-amber-100 dark:bg-amber-400/15`}>
        <RockSwatch rockId={action.rockId} className="size-full" />
      </span>;
    case 'APPLY_STRESS':
      return <span className={`${base} bg-violet-100 text-violet-700 dark:bg-violet-400/15 dark:text-violet-300`}><StressToolIcon /></span>;
    case 'APPLY_FAULT':
      return <span className={`${base} bg-rose-100 text-rose-700 dark:bg-rose-400/15 dark:text-rose-300`}><FaultToolIcon /></span>;
    case 'APPLY_FOLD':
      return <span className={`${base} bg-teal-100 text-teal-700 dark:bg-teal-400/15 dark:text-teal-300`}><FoldToolIcon /></span>;
    case 'ERODE':
      return <span className={`${base} bg-sky-100 text-sky-700 dark:bg-sky-400/15 dark:text-sky-300`}><ErodeToolIcon /></span>;
    default:
      return <span className={base}><AddLayerToolIcon /></span>;
  }
}

export function Timeline() {
  const { history, currentStep, jumpTo } = useGeoStore();
  const { t, lang } = useI18n();
  const listRef = useRef<HTMLOListElement>(null);

  // 現在のステップが見えるように一覧だけをスクロールする（ページ全体は動かさない）
  useEffect(() => {
    const list = listRef.current;
    const item = list?.querySelector<HTMLElement>('[aria-current="step"]');
    if (!list || !item) return;
    const top = item.offsetTop - list.offsetTop;
    if (top < list.scrollTop || top + item.offsetHeight > list.scrollTop + list.clientHeight) {
      list.scrollTo({ top: top - list.clientHeight / 2 + item.offsetHeight / 2, behavior: 'smooth' });
    }
  }, [currentStep, history.length]);

  return (
    <div className="flex h-full flex-col [--tl-bg:#fff] dark:[--tl-bg:#1c1917]">
      <div className="mb-2 flex items-baseline justify-between px-1">
        <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-stone-500 dark:text-stone-400">
          {t.timeline.title}
        </h2>
        <span className="text-[11px] text-stone-400 dark:text-stone-500">{t.toolbar.shortcutHint}</span>
      </div>
      <ol ref={listRef} className="relative max-h-80 flex-1 overflow-y-auto pr-1">
        {/* 縦のつなぎ線 */}
        <span className="absolute bottom-4 left-[1.375rem] top-4 w-px bg-stone-200 dark:bg-stone-700" aria-hidden="true" />
        <TimelineItem
          label={t.timeline.initial}
          badge={<ActionBadge action={null} />}
          state={currentStep === -1 ? 'current' : 'past'}
          onClick={() => jumpTo(-1)}
          nowLabel={t.timeline.now}
        />
        {history.map((entry, idx) => (
          <TimelineItem
            key={entry.id}
            label={`${t.timeline.step} ${idx + 1}: ${lang === 'ja' ? entry.labelJa : entry.labelEn}`}
            badge={<ActionBadge action={entry.action} />}
            state={idx === currentStep ? 'current' : idx < currentStep ? 'past' : 'future'}
            onClick={() => jumpTo(idx)}
            nowLabel={t.timeline.now}
            futureLabel={t.timeline.redoable}
          />
        ))}
      </ol>
    </div>
  );
}

function TimelineItem({
  label,
  badge,
  state,
  onClick,
  nowLabel,
  futureLabel,
}: {
  label: string;
  badge: ReactNode;
  state: 'past' | 'current' | 'future';
  onClick: () => void;
  nowLabel: string;
  futureLabel?: string;
}) {
  return (
    <li className="animate-pop-in relative">
      <button
        type="button"
        onClick={onClick}
        aria-current={state === 'current' ? 'step' : undefined}
        className={[
          'group flex w-full items-center gap-2.5 rounded-xl px-2 py-1.5 text-left text-xs transition-colors',
          'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-teal-600',
          state === 'current'
            ? 'bg-teal-50 font-semibold text-teal-900 ring-1 ring-teal-600/30 dark:bg-teal-400/10 dark:text-teal-100 dark:ring-teal-400/30'
            : state === 'future'
              ? 'text-stone-400 hover:bg-stone-100 dark:text-stone-500 dark:hover:bg-stone-800'
              : 'text-stone-700 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800',
        ].join(' ')}
      >
        <span className={`relative transition-opacity ${state === 'future' ? 'opacity-40 grayscale' : ''}`}>{badge}</span>
        <span className="min-w-0 flex-1 leading-snug">{label}</span>
        {state === 'current' && (
          <span className="shrink-0 rounded-full bg-teal-600 px-1.5 py-0.5 text-[10px] font-bold text-white dark:bg-teal-400 dark:text-stone-900">
            {nowLabel}
          </span>
        )}
        {state === 'future' && futureLabel && (
          <span className="shrink-0 text-[10px] italic opacity-0 transition-opacity group-hover:opacity-100">{futureLabel}</span>
        )}
      </button>
    </li>
  );
}
