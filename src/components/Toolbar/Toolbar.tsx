import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties, ComponentType, ReactNode, SVGProps } from 'react';
import { useGeoStore } from '../../store/useGeoStore';
import { useUiStore } from '../../store/useUiStore';
import type { ToolPanel } from '../../store/useUiStore';
import { useI18n } from '../../i18n/useI18n';
import { ROCK_IDS, ROCKS } from '../../data/rocks';
import type { RockId } from '../../data/rocks';
import type { FaultLine, FaultType, FoldType, GeoAction } from '../../types/geology';
import { RockSwatch } from '../RockSwatch';
import {
  AddLayerToolIcon, StressToolIcon, FaultToolIcon, FoldToolIcon, ErodeToolIcon,
  CompressionDiagram, ExtensionDiagram, ShearDiagram,
  NormalFaultDiagram, ReverseFaultDiagram, StrikeSlipDiagram,
  AnticlineDiagram, SynclineDiagram, CloseIcon, SparkleIcon, LockIcon,
} from '../icons';

type StressMode = 'compression' | 'extension' | 'shear';
type ToolKey = ToolPanel | 'erode';
type Icon = ComponentType<SVGProps<SVGSVGElement>>;

/** 断層面の傾き（断面の上端と下端での X のずれ / 2）。正断層・逆断層は約 66° で傾ける */
const FAULT_DIP_OFFSET = 110;

/** ツールごとの配色（Tailwind のクラス名は静的に書く必要がある） */
const TOOL_STYLE: Record<ToolKey, {
  icon: Icon;
  tile: string;
  ring: string;
  bar: string;
  button: string;
  range: string;
}> = {
  addLayer: {
    icon: AddLayerToolIcon,
    tile: 'bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300',
    ring: 'ring-amber-500/80',
    bar: 'bg-amber-500',
    button: 'bg-amber-600 hover:bg-amber-700 focus-visible:outline-amber-600',
    range: '#d97706',
  },
  stress: {
    icon: StressToolIcon,
    tile: 'bg-violet-100 text-violet-700 dark:bg-violet-400/15 dark:text-violet-300',
    ring: 'ring-violet-500/80',
    bar: 'bg-violet-500',
    button: 'bg-violet-600 hover:bg-violet-700 focus-visible:outline-violet-600',
    range: '#7c3aed',
  },
  fault: {
    icon: FaultToolIcon,
    tile: 'bg-rose-100 text-rose-700 dark:bg-rose-400/15 dark:text-rose-300',
    ring: 'ring-rose-500/80',
    bar: 'bg-rose-500',
    button: 'bg-rose-600 hover:bg-rose-700 focus-visible:outline-rose-600',
    range: '#e11d48',
  },
  fold: {
    icon: FoldToolIcon,
    tile: 'bg-teal-100 text-teal-700 dark:bg-teal-400/15 dark:text-teal-300',
    ring: 'ring-teal-500/80',
    bar: 'bg-teal-500',
    button: 'bg-teal-600 hover:bg-teal-700 focus-visible:outline-teal-600',
    range: '#0d9488',
  },
  erode: {
    icon: ErodeToolIcon,
    tile: 'bg-sky-100 text-sky-700 dark:bg-sky-400/15 dark:text-sky-300',
    ring: 'ring-sky-500/80',
    bar: 'bg-sky-500',
    button: 'bg-sky-600 hover:bg-sky-700 focus-visible:outline-sky-600',
    range: '#0284c7',
  },
};

function buildFault(type: FaultType, displacement: number, x: number, id: string): FaultLine {
  const offset = type === 'strike-slip' ? 0 : FAULT_DIP_OFFSET;
  // 上端を右・下端を左にずらし、断層の左側が上盤になるように傾ける
  return {
    id,
    type,
    start: { x: x + offset, y: 0 },
    end:   { x: x - offset, y: 500 },
    displacement,
  };
}

/** スマホ等の 1 カラム表示では、操作後に断面図までスクロールして結果を見せる */
function revealCrossSection() {
  if (window.matchMedia('(min-width: 768px)').matches) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // パネルを閉じて断面図の固定表示が解除されてからスクロールする
  window.setTimeout(() => {
    document.getElementById('cross-section')?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  }, 0);
}

export function Toolbar() {
  const { t, lang } = useI18n();
  const { dispatch, geoState } = useGeoStore();
  const { openPanel, togglePanel, setOpenPanel, setDraft, setErodePreview } = useUiStore();

  // --- 地層追加フォーム ---
  const [layerRock, setLayerRock] = useState<RockId>('sandstone');
  const [layerThick, setLayerThick] = useState(60);

  // --- 応力フォーム ---
  const [compression, setCompression] = useState(40);
  const [extension, setExtension] = useState(40);
  const [shear, setShear] = useState(40);
  const [stressMode, setStressMode] = useState<StressMode>('compression');

  // --- 断層フォーム ---
  const [faultType, setFaultType] = useState<FaultType>('normal');
  const [faultDisp, setFaultDisp] = useState(40);
  const [faultX, setFaultX] = useState(400);

  // --- 褶曲フォーム ---
  const [foldType, setFoldType] = useState<FoldType>('anticline');
  const [wavelength, setWavelength] = useState(300);
  const [amplitude, setAmplitude] = useState(40);
  const [foldCenterX, setFoldCenterX] = useState(400);

  const hasLayers = geoState.layers.length > 0;

  // 開いているパネルの設定内容（断面図のプレビューと「適用」で共通に使う）
  const draft = useMemo<GeoAction | null>(() => {
    switch (openPanel) {
      case 'addLayer':
        return { type: 'ADD_LAYER', rockId: layerRock, thickness: layerThick };
      case 'stress':
        return {
          type: 'APPLY_STRESS',
          params: {
            compression: stressMode === 'compression' ? compression : 0,
            extension:   stressMode === 'extension'   ? extension   : 0,
            shear:       stressMode === 'shear'       ? shear       : 0,
          },
        };
      case 'fault':
        return { type: 'APPLY_FAULT', fault: buildFault(faultType, faultDisp, faultX, 'preview') };
      case 'fold':
        return {
          type: 'APPLY_FOLD',
          params: { type: foldType, wavelength, amplitude, centerX: foldCenterX },
        };
      default:
        return null;
    }
  }, [openPanel, layerRock, layerThick, stressMode, compression, extension, shear,
      faultType, faultDisp, faultX, foldType, wavelength, amplitude, foldCenterX]);

  useEffect(() => {
    setDraft(draft);
  }, [draft, setDraft]);

  const apply = () => {
    if (!draft) return;
    dispatch(draft.type === 'APPLY_FAULT'
      ? { type: 'APPLY_FAULT', fault: buildFault(faultType, faultDisp, faultX, Math.random().toString(36).slice(2)) }
      : draft);
    setOpenPanel(null);
    revealCrossSection();
  };

  const close = () => setOpenPanel(null);

  const tools: { key: ToolKey; label: string; caption: string }[] = [
    { key: 'addLayer', label: t.toolbar.addLayer, caption: t.toolbar.addLayerCaption },
    { key: 'stress',   label: t.toolbar.stress,   caption: t.toolbar.stressCaption },
    { key: 'fault',    label: t.toolbar.fault,    caption: t.toolbar.faultCaption },
    { key: 'fold',     label: t.toolbar.fold,     caption: t.toolbar.foldCaption },
    { key: 'erode',    label: t.toolbar.erode,    caption: t.toolbar.erodeCaption },
  ];

  const rock = ROCKS[layerRock];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between px-1">
        <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-stone-500 dark:text-stone-400">
          {t.toolbar.sectionTitle}
        </h2>
        {!hasLayers && (
          <span className="flex items-center gap-1 text-[11px] text-stone-500 dark:text-stone-400">
            <LockIcon className="text-xs" /> {t.toolbar.needLayer}
          </span>
        )}
      </div>

      {/* ツールカード（地層追加は主要操作なので横幅いっぱいに） */}
      <div className="grid grid-cols-2 gap-2">
        {tools.map(tool => {
          const style = TOOL_STYLE[tool.key];
          const Icon = style.icon;
          const isErode = tool.key === 'erode';
          const active = !isErode && openPanel === tool.key;
          const disabled = tool.key !== 'addLayer' && !hasLayers;
          return (
            <button
              key={tool.key}
              type="button"
              disabled={disabled}
              aria-pressed={isErode ? undefined : active}
              aria-expanded={isErode ? undefined : active}
              title={disabled ? t.toolbar.needLayer : tool.caption}
              onClick={() => {
                if (isErode) {
                  setErodePreview(false);
                  dispatch({ type: 'ERODE' });
                  setOpenPanel(null);
                  revealCrossSection();
                } else {
                  togglePanel(tool.key as ToolPanel);
                }
              }}
              onPointerEnter={isErode ? () => setErodePreview(true) : undefined}
              onPointerLeave={isErode ? () => setErodePreview(false) : undefined}
              onFocus={isErode ? () => setErodePreview(true) : undefined}
              onBlur={isErode ? () => setErodePreview(false) : undefined}
              className={[
                'group relative flex gap-2.5 rounded-2xl border p-2.5 text-left',
                'transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600',
                tool.key === 'addLayer' ? 'col-span-2' : '',
                active
                  ? `border-transparent bg-white shadow-md ring-2 ${style.ring} dark:bg-stone-800`
                  : 'border-stone-200 bg-white/70 hover:-translate-y-0.5 hover:border-stone-300 hover:bg-white hover:shadow-md dark:border-stone-700/70 dark:bg-stone-800/50 dark:hover:border-stone-600 dark:hover:bg-stone-800',
                'disabled:cursor-not-allowed disabled:border-dashed disabled:bg-transparent disabled:hover:translate-y-0 disabled:hover:border-stone-200 disabled:hover:bg-transparent disabled:hover:shadow-none',
                'dark:disabled:bg-transparent dark:disabled:hover:border-stone-700/70 dark:disabled:hover:bg-transparent',
                tool.key === 'addLayer' ? 'flex-row items-center' : 'flex-col items-start sm:max-md:flex-row sm:max-md:items-center',
              ].join(' ')}
            >
              <span className={[
                'grid size-11 shrink-0 place-items-center rounded-xl text-[30px] transition-transform duration-200 group-hover:scale-105',
                disabled ? 'scale-100 bg-stone-100 text-stone-300 dark:bg-stone-800 dark:text-stone-600' : style.tile,
              ].join(' ')}>
                <Icon />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-stone-800 group-disabled:text-stone-400 dark:text-stone-100 dark:group-disabled:text-stone-500">{tool.label}</span>
                <span className="block text-[11px] leading-snug text-stone-500 group-disabled:text-stone-400 dark:text-stone-400 dark:group-disabled:text-stone-600">{tool.caption}</span>
              </span>
            </button>
          );
        })}
      </div>

      {/* 地層追加パネル */}
      {openPanel === 'addLayer' && (
        <Panel tool="addLayer" title={t.addLayerDialog.title} onClose={close} hint={t.toolbar.previewHint}>
          <FieldLabel>{t.addLayerDialog.rockType}</FieldLabel>
          <div className="mb-2 grid grid-cols-3 gap-1.5" role="radiogroup" aria-label={t.addLayerDialog.rockType}>
            {ROCK_IDS.map(id => {
              const selected = id === layerRock;
              return (
                <button key={id} type="button" role="radio" aria-checked={selected}
                  onClick={() => setLayerRock(id)}
                  className={[
                    'flex flex-col items-stretch gap-1 rounded-xl border p-1.5 text-[11px] font-medium transition-all',
                    'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-amber-600',
                    selected
                      ? 'border-amber-500 bg-amber-50 text-amber-900 shadow-sm dark:bg-amber-400/10 dark:text-amber-100'
                      : 'border-stone-200 text-stone-600 hover:border-stone-300 hover:bg-stone-50 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-700/40',
                  ].join(' ')}>
                  <RockSwatch rockId={id} className="h-6 w-full rounded-md" />
                  {lang === 'ja' ? ROCKS[id].nameJa : ROCKS[id].nameEn}
                </button>
              );
            })}
          </div>
          <p className="mb-3 rounded-lg bg-stone-100 px-2.5 py-2 text-[11px] leading-relaxed text-stone-600 dark:bg-stone-900/60 dark:text-stone-300"
            aria-live="polite">
            <span className="font-semibold text-stone-700 dark:text-stone-200">
              {lang === 'ja' ? rock.nameJa : rock.nameEn}
            </span>
            {' — '}
            {lang === 'ja' ? rock.descriptionJa : rock.descriptionEn}
          </p>
          <SliderField tool="addLayer" label={t.addLayerDialog.thickness}
            min={20} max={150} value={layerThick} onChange={setLayerThick} />
          <PanelActions tool="addLayer" onCancel={close} onApply={apply}
            cancelLabel={t.addLayerDialog.cancel} applyLabel={t.addLayerDialog.confirm} />
        </Panel>
      )}

      {/* 応力パネル */}
      {openPanel === 'stress' && (
        <Panel tool="stress" title={t.stressDialog.title} onClose={close} hint={t.stressDialog.hint}>
          <ChoiceGroup tool="stress" label={t.stressDialog.title} value={stressMode} onChange={setStressMode}
            options={[
              { value: 'compression', label: t.stressDialog.compression, caption: t.stressDialog.compressionCaption, icon: CompressionDiagram },
              { value: 'extension',   label: t.stressDialog.extension,   caption: t.stressDialog.extensionCaption,   icon: ExtensionDiagram },
              { value: 'shear',       label: t.stressDialog.shear,       caption: t.stressDialog.shearCaption,       icon: ShearDiagram },
            ]} />
          {stressMode === 'compression' && (
            <SliderField tool="stress" label={t.stressDialog.compression}
              min={10} max={120} value={compression} onChange={setCompression} />
          )}
          {stressMode === 'extension' && (
            <SliderField tool="stress" label={t.stressDialog.extension}
              min={10} max={120} value={extension} onChange={setExtension} />
          )}
          {stressMode === 'shear' && (
            <SliderField tool="stress" label={t.stressDialog.shear}
              min={10} max={120} value={shear} onChange={setShear} />
          )}
          <PanelActions tool="stress" onCancel={close} onApply={apply}
            cancelLabel={t.addLayerDialog.cancel} applyLabel={t.stressDialog.apply} />
        </Panel>
      )}

      {/* 断層パネル */}
      {openPanel === 'fault' && (
        <Panel tool="fault" title={t.faultDialog.title} onClose={close} hint={t.toolbar.previewHint}>
          <ChoiceGroup tool="fault" label={t.faultDialog.type} value={faultType} onChange={setFaultType}
            options={[
              { value: 'normal',      label: t.faultDialog.normal,     caption: t.faultDialog.normalCaption,     icon: NormalFaultDiagram },
              { value: 'reverse',     label: t.faultDialog.reverse,    caption: t.faultDialog.reverseCaption,    icon: ReverseFaultDiagram },
              { value: 'strike-slip', label: t.faultDialog.strikeSlip, caption: t.faultDialog.strikeSlipCaption, icon: StrikeSlipDiagram },
            ]} />
          <SliderField tool="fault" label={t.faultDialog.displacement}
            min={10} max={120} value={faultDisp} onChange={setFaultDisp} />
          <SliderField tool="fault" label={t.faultDialog.positionX}
            min={100} max={700} value={faultX} onChange={setFaultX} />
          <PanelActions tool="fault" onCancel={close} onApply={apply}
            cancelLabel={t.addLayerDialog.cancel} applyLabel={t.faultDialog.apply} />
        </Panel>
      )}

      {/* 褶曲パネル */}
      {openPanel === 'fold' && (
        <Panel tool="fold" title={t.foldDialog.title} onClose={close} hint={t.toolbar.previewHint}>
          <ChoiceGroup tool="fold" label={t.foldDialog.type} value={foldType} onChange={setFoldType}
            options={[
              { value: 'anticline', label: t.foldDialog.anticline, caption: t.foldDialog.anticlineCaption, icon: AnticlineDiagram },
              { value: 'syncline',  label: t.foldDialog.syncline,  caption: t.foldDialog.synclineCaption,  icon: SynclineDiagram },
            ]} />
          <SliderField tool="fold" label={t.foldDialog.wavelength}
            min={100} max={600} value={wavelength} onChange={setWavelength} />
          <SliderField tool="fold" label={t.foldDialog.amplitude}
            min={10} max={150} value={amplitude} onChange={setAmplitude} />
          <SliderField tool="fold" label={t.foldDialog.centerX}
            min={100} max={700} value={foldCenterX} onChange={setFoldCenterX} />
          <PanelActions tool="fold" onCancel={close} onApply={apply}
            cancelLabel={t.addLayerDialog.cancel} applyLabel={t.foldDialog.apply} />
        </Panel>
      )}
    </div>
  );
}

// ─── 補助コンポーネント ───────────────────────────────────────────

function Panel({ tool, title, hint, children, onClose }: {
  tool: ToolKey;
  title: string;
  hint?: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const { t } = useI18n();
  return (
    <section aria-label={title}
      className="animate-pop-in relative overflow-hidden rounded-2xl border border-stone-200 bg-white p-4 pt-5 shadow-lg shadow-stone-900/5 dark:border-stone-700 dark:bg-stone-800 dark:shadow-black/30">
      <span className={`absolute inset-x-0 top-0 h-1 ${TOOL_STYLE[tool].bar}`} aria-hidden="true" />
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-bold text-stone-800 dark:text-stone-100">{title}</h3>
        <button type="button" onClick={onClose} aria-label={t.crossSection.close}
          className="grid size-7 place-items-center rounded-full text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700 focus-visible:outline-2 focus-visible:outline-teal-600 dark:hover:bg-stone-700 dark:hover:text-stone-200">
          <CloseIcon className="text-base" />
        </button>
      </div>
      {hint && (
        <p className="mb-3 flex gap-1.5 text-[11px] leading-relaxed text-stone-500 dark:text-stone-400">
          <SparkleIcon className="mt-0.5 shrink-0 text-xs text-amber-500" />
          <span>{hint}</span>
        </p>
      )}
      {children}
    </section>
  );
}

function FieldLabel({ children }: { children: ReactNode }) {
  return <p className="mb-1.5 text-xs font-semibold text-stone-600 dark:text-stone-300">{children}</p>;
}

function ChoiceGroup<T extends string>({ tool, label, value, onChange, options }: {
  tool: ToolKey;
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; caption: string; icon: Icon }[];
}) {
  const style = TOOL_STYLE[tool];
  return (
    <div className="mb-3">
      <FieldLabel>{label}</FieldLabel>
      <div role="radiogroup" aria-label={label}
        className={`grid gap-1.5 ${options.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
        {options.map(opt => {
          const selected = opt.value === value;
          const Icon = opt.icon;
          return (
            <button key={opt.value} type="button" role="radio" aria-checked={selected}
              onClick={() => onChange(opt.value)}
              title={opt.caption}
              className={[
                'flex flex-col items-center gap-1 rounded-xl border px-1 py-2 text-center transition-all',
                'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-teal-600',
                selected
                  ? `border-transparent ring-2 ${style.ring} bg-stone-50 dark:bg-stone-900/50`
                  : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50 dark:border-stone-700 dark:hover:bg-stone-700/40',
              ].join(' ')}>
              <span className={`grid size-10 place-items-center rounded-lg text-[32px] transition-colors ${selected ? style.tile : 'text-stone-400 dark:text-stone-500'}`}>
                <Icon />
              </span>
              <span className={`text-[11px] font-semibold leading-tight ${selected ? 'text-stone-800 dark:text-stone-100' : 'text-stone-600 dark:text-stone-300'}`}>
                {opt.label}
              </span>
            </button>
          );
        })}
      </div>
      <p className="mt-1.5 min-h-4 text-center text-[11px] text-stone-500 dark:text-stone-400" aria-live="polite">
        {options.find(o => o.value === value)?.caption}
      </p>
    </div>
  );
}

function SliderField({ tool, label, min, max, value, onChange }: {
  tool: ToolKey;
  label: string;
  min: number;
  max: number;
  value: number;
  onChange: (v: number) => void;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <label className="mb-2 block">
      <span className="mb-0.5 flex items-center justify-between text-xs text-stone-600 dark:text-stone-300">
        <span>{label}</span>
        <span className="rounded-md bg-stone-100 px-1.5 py-0.5 font-mono text-[11px] font-semibold tabular-nums text-stone-700 dark:bg-stone-900/70 dark:text-stone-200">
          {value}
        </span>
      </span>
      <input type="range" min={min} max={max} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="range"
        style={{ '--pct': `${pct}%`, '--range-color': TOOL_STYLE[tool].range } as CSSProperties} />
    </label>
  );
}

function PanelActions({ tool, onCancel, onApply, cancelLabel, applyLabel }: {
  tool: ToolKey;
  onCancel: () => void;
  onApply: () => void;
  cancelLabel: string;
  applyLabel: string;
}) {
  return (
    <div className="mt-3 flex justify-end gap-2">
      <button type="button" onClick={onCancel}
        className="rounded-xl px-3.5 py-2 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-100 focus-visible:outline-2 focus-visible:outline-teal-600 dark:text-stone-300 dark:hover:bg-stone-700">
        {cancelLabel}
      </button>
      <button type="button" onClick={onApply}
        className={`rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 ${TOOL_STYLE[tool].button}`}>
        {applyLabel}
      </button>
    </div>
  );
}
