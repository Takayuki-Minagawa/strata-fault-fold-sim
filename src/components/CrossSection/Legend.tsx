import { useGeoStore } from '../../store/useGeoStore';
import { useUiStore } from '../../store/useUiStore';
import { useI18n } from '../../i18n/useI18n';
import { ROCKS } from '../../data/rocks';
import type { RockId } from '../../data/rocks';
import type { FaultType } from '../../types/geology';
import { RockSwatch } from '../RockSwatch';

const FAULT_SWATCH: Record<FaultType, string> = {
  normal: 'border-blue-600',
  reverse: 'border-rose-600',
  'strike-slip': 'border-emerald-600',
};

/** 凡例。岩相にカーソルを合わせると断面図の同じ岩相が強調される */
export function Legend() {
  const { t, lang } = useI18n();
  const { geoState } = useGeoStore();
  const { highlightRock, setHighlightRock } = useUiStore();

  const rocks = [...new Set(geoState.layers.map(l => l.rockId))];
  const faultTypes = [...new Set(geoState.faults.map(f => f.type))];
  const hasUnconformity = geoState.layers.some(l => l.unconformityAbove);

  if (rocks.length === 0) return null;

  const faultLabel = (type: FaultType) =>
    type === 'normal' ? t.crossSection.labelNormal
    : type === 'reverse' ? t.crossSection.labelReverse
    : t.crossSection.labelStrikeSlip;

  const chip = 'flex items-center gap-1.5 rounded-full px-2 py-1 text-[11px] font-medium text-stone-700 dark:text-stone-200';

  return (
    <div className="flex flex-wrap items-center gap-1">
      <span className="mr-1 text-[11px] font-bold uppercase tracking-[0.12em] text-stone-400 dark:text-stone-500">
        {t.crossSection.legend}
      </span>
      {rocks.map((id: RockId) => (
        <button key={id} type="button"
          aria-pressed={highlightRock === id}
          onPointerEnter={() => setHighlightRock(id)}
          onPointerLeave={() => setHighlightRock(null)}
          onFocus={() => setHighlightRock(id)}
          onBlur={() => setHighlightRock(null)}
          className={`${chip} bg-white ring-1 ring-stone-900/10 transition-all hover:-translate-y-px hover:shadow-sm focus-visible:outline-2 focus-visible:outline-teal-600 dark:bg-stone-800 dark:ring-white/10 ${highlightRock === id ? 'ring-2 ring-stone-900/40 dark:ring-white/40' : ''}`}>
          <RockSwatch rockId={id} className="h-3 w-4 rounded-sm ring-1 ring-black/10" />
          {lang === 'ja' ? ROCKS[id].nameJa : ROCKS[id].nameEn}
        </button>
      ))}
      {faultTypes.map(type => (
        <span key={type} className={chip}>
          <span className={`w-4 border-t-2 border-dashed ${FAULT_SWATCH[type]}`} aria-hidden="true" />
          {faultLabel(type)}
          {type === 'strike-slip' && (
            <span className="text-stone-500 dark:text-stone-400">
              {lang === 'ja'
                ? `（⊙ ${t.crossSection.towardViewer} / ⊗ ${t.crossSection.awayFromViewer}）`
                : `(⊙ ${t.crossSection.towardViewer} / ⊗ ${t.crossSection.awayFromViewer})`}
            </span>
          )}
        </span>
      ))}
      {hasUnconformity && (
        <span className={chip}>
          <span className="font-bold text-amber-500" aria-hidden="true">〰</span>
          {t.crossSection.labelUnconformity}
        </span>
      )}
    </div>
  );
}
