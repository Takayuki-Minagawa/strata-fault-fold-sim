import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { useGeoStore } from '../../store/useGeoStore';
import { useUiStore } from '../../store/useUiStore';
import { useTheme } from '../../hooks/useTheme';
import { useI18n } from '../../i18n/useI18n';
import { ROCKS } from '../../data/rocks';
import type { RockId } from '../../data/rocks';
import type { FaultLine, GeoAction, GeoState, Layer, Point } from '../../types/geology';
import { applyAction, layerEdges, polylineYAt } from '../../utils/geoEngine';
import { RockSwatch } from '../RockSwatch';
import { CloseIcon, LayersIcon, SparkleIcon } from '../icons';

function pointsToSvgPath(vertices: Point[]): string {
  if (vertices.length === 0) return '';
  return vertices.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ') + ' Z';
}

/** 折れ線に沿って小さく波打つ線（不整合面用） */
function wavyAlong(line: Point[], amplitude = 3.5): string {
  const pts = line.filter((p, i) => i === 0 || Math.abs(p.x - line[i - 1].x) + Math.abs(p.y - line[i - 1].y) > 2);
  if (pts.length < 2) return '';
  let d = `M${pts[0].x},${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    const s = i % 2 === 0 ? amplitude : -amplitude;
    d += ` Q${(a.x + b.x) / 2},${(a.y + b.y) / 2 + s} ${b.x},${b.y}`;
  }
  return d;
}

/** 地表面（全層の上面のうち最も高い位置）の x における y */
function surfaceAt(layers: Layer[], x: number): number | null {
  let y: number | null = null;
  for (const l of layers) {
    const top = polylineYAt(layerEdges(l).top, x);
    if (top !== null && (y === null || top < y)) y = top;
  }
  return y;
}

/** 岩相ラベルの位置：中央寄りで層が最も厚く見え、断層線にかからない場所 */
function labelPosition(layer: Layer, faults: FaultLine[], width: number, height: number, minThick: number) {
  const { top, bottom } = layerEdges(layer);
  let best: { x: number; y: number; score: number; thick: number } | null = null;
  for (let x = 110; x <= width - 110; x += 15) {
    const ty = polylineYAt(top, x);
    const by = polylineYAt(bottom, x);
    if (ty === null || by === null) continue;
    const y0 = Math.max(ty, 0);
    const y1 = Math.min(by, height);
    const thick = y1 - y0;
    const y = (y0 + y1) / 2;
    const nearFault = faults.some(({ start, end }) =>
      Math.abs(x - (start.x + ((end.x - start.x) * (y - start.y)) / (end.y - start.y))) < 45);
    const score = thick - Math.abs(x - width / 2) * 0.03 - (nearFault ? 1000 : 0);
    if (!best || score > best.score) best = { x, y, score, thick };
  }
  return best && best.thick >= minThick && best.score > -500 ? best : null;
}

const FAULT_COLOR: Record<FaultLine['type'], string> = {
  normal: '#2563eb',
  reverse: '#e11d48',
  'strike-slip': '#059669',
};

const SAMPLE_LAYERS: { rockId: RockId; thickness: number }[] = [
  { rockId: 'conglomerate', thickness: 45 },
  { rockId: 'sandstone',    thickness: 60 },
  { rockId: 'mudstone',     thickness: 50 },
  { rockId: 'tuff',         thickness: 25 },
  { rockId: 'limestone',    thickness: 55 },
];

interface Props {
  width?: number;
  height?: number;
}

export function CrossSectionView({ width = 800, height = 500 }: Props) {
  const { geoState, dispatch } = useGeoStore();
  const { draft, erodePreview, highlightRock, setOpenPanel } = useUiStore();
  const { theme } = useTheme();
  const { t, lang } = useI18n();
  // 選んだ地層は「どの状態で選んだか」とともに記録し、元に戻す等で状態が変わったら解除する
  const [hovered, setHovered] = useState<{ idx: number; at: GeoState } | null>(null);
  const [pinned, setPinned] = useState<{ idx: number; at: GeoState } | null>(null);
  const [focused, setFocused] = useState<{ idx: number; at: GeoState } | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const keyboardHintId = useId();
  // 画面が狭いと SVG が縮小されて文字が小さくなるので、文字・線を拡大して読みやすさを保つ
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width;
      setScale(w > 0 ? Math.min(2.2, Math.max(1, 620 / w)) : 1);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const fs = 12 * scale;

  const isDark = theme === 'dark';
  const textColor = isDark ? '#f5f5f4' : '#1c1917';
  const haloColor = isDark ? 'rgba(20,19,15,0.85)' : 'rgba(255,255,255,0.85)';
  const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(87,83,78,0.10)';
  const patternInk = isDark ? 'rgba(0,0,0,0.32)' : 'rgba(0,0,0,0.18)';

  const baseCount = geoState.layers.length;
  const preview = useMemo<GeoAction | null>(
    () => (erodePreview && baseCount > 0 ? { type: 'ERODE' } : draft),
    [erodePreview, baseCount, draft],
  );
  const shown = useMemo(
    () => (preview ? applyAction(geoState, preview) : geoState),
    [geoState, preview],
  );
  const { layers, faults } = shown;
  const isAddPreview = preview?.type === 'ADD_LAYER';
  const showGhost = preview !== null && !isAddPreview && baseCount > 0;

  const pinnedIdx = pinned?.at === geoState ? pinned.idx : null;
  const hoveredIdx = hovered?.at === geoState ? hovered.idx : null;
  const focusedIdx = focused?.at === geoState ? focused.idx : null;
  const activeIdx = preview ? null : (pinnedIdx ?? focusedIdx ?? hoveredIdx);
  // キーボードでは地層を 1 つの Tab 位置にまとめ、矢印キーで層を移動する（ロービングタブインデックス）
  // （マウスのホバーでは動かさない）
  const tabStopIdx = preview ? null : (pinnedIdx ?? focusedIdx ?? (layers.length > 0 ? layers.length - 1 : null));
  // 凡例で強調中の岩相が断面から消えた場合（元に戻す等）は強調しない
  const effectiveHighlight = highlightRock !== null && layers.some(l => l.rockId === highlightRock)
    ? highlightRock : null;
  const activeLayer = activeIdx !== null ? layers[activeIdx] : undefined;

  // 画面内に見えている範囲での地表の最高点
  const visibleTops = layers.flatMap(l => layerEdges(l).top.filter(p => p.x >= 0 && p.x <= width).map(p => p.y));
  const rockTop = visibleTops.length > 0 ? Math.min(...visibleTops) : height;

  const rockName = (id: RockId) => (lang === 'ja' ? ROCKS[id].nameJa : ROCKS[id].nameEn);

  const togglePin = (idx: number) =>
    setPinned(p => (p?.idx === idx && p.at === geoState ? null : { idx, at: geoState }));

  const focusLayer = (idx: number) => {
    svgRef.current?.querySelector<SVGGElement>(`[data-layer-index="${idx}"]`)?.focus();
  };

  // ↑→ で上（新しい層）、↓← で下（古い層）、Home / End で最古 / 最新、Enter / Space で固定
  const handleLayerKey = (e: KeyboardEvent<SVGGElement>, idx: number) => {
    const last = layers.length - 1;
    const next =
      e.key === 'ArrowUp' || e.key === 'ArrowRight' ? Math.min(idx + 1, last)
      : e.key === 'ArrowDown' || e.key === 'ArrowLeft' ? Math.max(idx - 1, 0)
      : e.key === 'Home' ? 0
      : e.key === 'End' ? last
      : null;
    if (next !== null) {
      e.preventDefault();
      if (pinnedIdx !== null) setPinned({ idx: next, at: geoState });
      focusLayer(next);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      togglePin(idx);
    } else if (e.key === 'Escape') {
      setPinned(null);
    }
  };

  // 岩相パターン定義
  const renderDefs = () => (
    <defs>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={isDark ? '#0d1424' : '#d9e8f5'} />
        <stop offset="1" stopColor={isDark ? '#1c1a16' : '#f4eee3'} />
      </linearGradient>
      <pattern id="dots" width="6" height="6" patternUnits="userSpaceOnUse">
        <circle cx="3" cy="3" r="1" fill={patternInk} />
      </pattern>
      <pattern id="lines" width="6" height="6" patternUnits="userSpaceOnUse">
        <line x1="0" y1="3" x2="6" y2="3" stroke={patternInk} strokeWidth="1" />
      </pattern>
      <pattern id="cross" width="8" height="8" patternUnits="userSpaceOnUse">
        <line x1="0" y1="4" x2="8" y2="4" stroke={patternInk} strokeWidth="1" />
        <line x1="4" y1="0" x2="4" y2="8" stroke={patternInk} strokeWidth="1" />
      </pattern>
      {Object.entries(FAULT_COLOR).map(([type, color]) => (
        <marker key={type} id={`arrow-${type}`} markerWidth="6" markerHeight="6" refX="3" refY="3"
          orient="auto" markerUnits="strokeWidth">
          <path d="M0,0 L6,3 L0,6 Z" fill={color} />
        </marker>
      ))}
      <marker id="arrow-stress" markerWidth="4" markerHeight="4" refX="2" refY="2" orient="auto"
        markerUnits="strokeWidth">
        <path d="M0,0 L4,2 L0,4 Z" fill="#7c3aed" />
      </marker>
      {/* 断層線を岩盤の中だけに描くためのクリップ */}
      <clipPath id="rock-clip">
        {layers.map((l, i) => <path key={i} d={pointsToSvgPath(l.vertices)} />)}
      </clipPath>
    </defs>
  );

  const renderGrid = () => (
    <g>
      {Array.from({ length: Math.floor(width / 50) + 1 }, (_, i) => (
        <line key={`vg${i}`} x1={i * 50} y1={0} x2={i * 50} y2={height}
          stroke={gridColor} strokeWidth="1" />
      ))}
      {Array.from({ length: Math.floor(height / 50) + 1 }, (_, i) => (
        <line key={`hg${i}`} x1={0} y1={i * 50} x2={width} y2={i * 50}
          stroke={gridColor} strokeWidth="1" />
      ))}
    </g>
  );

  // 層は配列の位置で key を固定し、変形のたびに形が滑らかに補間されるようにする
  const renderLayer = (layer: Layer, idx: number) => {
    const rock = ROCKS[layer.rockId];
    const fill = isDark ? rock.darkColor : rock.color;
    const path = pointsToSvgPath(layer.vertices);
    const patternId = rock.pattern !== 'none' ? rock.pattern : undefined;
    const isNew = isAddPreview && idx >= baseCount;
    const isActive = activeIdx === idx;
    const isFocused = !preview && focusedIdx === idx;
    const interactive = !preview && idx < baseCount;
    const opacity = effectiveHighlight !== null && effectiveHighlight !== layer.rockId ? 0.22 : 1;
    const label = labelPosition(layer, faults, width, height, fs * 1.4);

    return (
      <g key={idx} className="layer-enter">
        <g className={`layer-hit ${isNew ? 'preview-layer' : ''}`}
          style={{ cursor: preview ? undefined : 'pointer' }}
          data-layer-index={idx}
          role={interactive ? 'button' : undefined}
          tabIndex={interactive ? (idx === tabStopIdx ? 0 : -1) : undefined}
          aria-pressed={interactive ? pinnedIdx === idx : undefined}
          aria-label={interactive
            ? `${rockName(layer.rockId)} — ${t.crossSection.layerOrder(layer.order)}${
                layer.unconformityAbove ? `${lang === 'ja' ? '。' : '. '}${t.crossSection.unconformityNote}` : ''}`
            : undefined}
          aria-describedby={interactive ? keyboardHintId : undefined}
          onPointerEnter={() => setHovered({ idx, at: geoState })}
          onPointerLeave={() => setHovered(h => (h?.idx === idx ? null : h))}
          onFocus={() => setFocused({ idx, at: geoState })}
          onBlur={() => setFocused(f => (f?.idx === idx ? null : f))}
          onKeyDown={interactive ? e => handleLayerKey(e, idx) : undefined}
          onClick={e => {
            e.stopPropagation();
            if (!preview) togglePin(idx);
          }}>
          <title>{`${rockName(layer.rockId)} — ${t.crossSection.layerOrder(layer.order)}`}</title>
          {/* 岩相色 */}
          <path className="layer-shape" d={path} fill={fill}
            stroke={isFocused ? '#0d9488' : isActive ? textColor : isDark ? 'rgba(0,0,0,0.55)' : 'rgba(41,37,36,0.4)'}
            strokeWidth={isFocused ? 3.5 : isActive ? 2.5 : 1}
            strokeDasharray={isNew ? '6 4' : undefined}
            style={{ opacity }} />
          {/* テクスチャパターン */}
          {patternId && (
            <path className="layer-shape" d={path} fill={`url(#${patternId})`}
              style={{ opacity: 0.7 * opacity, pointerEvents: 'none' }} />
          )}
          {/* 岩相ラベル */}
          {label && (
            <text className="layer-label" x={0} y={0} textAnchor="middle" dominantBaseline="middle"
              fontSize={fs} fontWeight="600" fill={textColor}
              stroke={haloColor} strokeWidth={3 * scale} paintOrder="stroke"
              style={{
                transform: `translate(${label.x}px, ${label.y}px)`,
                opacity: (isActive ? 1 : 0.85) * opacity,
                pointerEvents: 'none',
              }}>
              {rockName(layer.rockId)}
            </text>
          )}
        </g>
      </g>
    );
  };

  // 不整合面（波線）は層の上に重ねて描く
  const renderUnconformity = (layer: Layer, idx: number) => {
    if (!layer.unconformityAbove) return null;
    const d = wavyAlong(layerEdges(layer).top);
    return (
      <g key={`u${idx}`} style={{ pointerEvents: 'none' }}>
        <path d={d} fill="none" stroke={haloColor} strokeWidth="5" opacity="0.6" />
        <path d={d} fill="none" stroke="#f59e0b" strokeWidth="2.2" />
      </g>
    );
  };

  const renderFault = (fault: FaultLine) => {
    const { start, end, type } = fault;
    const color = FAULT_COLOR[type];
    const isPreviewFault = fault.id === 'preview';
    const label = type === 'normal' ? t.crossSection.labelNormal
                : type === 'reverse' ? t.crossSection.labelReverse
                : t.crossSection.labelStrikeSlip;

    const xAt = (y: number) => start.x + ((end.x - start.x) * (y - start.y)) / (end.y - start.y);
    const surfaceY = surfaceAt(layers, xAt(rockTop)) ?? rockTop;
    const midY = (Math.max(surfaceY, 0) + height) / 2;
    const fx = xAt(midY);

    // 断層面に沿った単位ベクトル（下向き）
    const len = Math.hypot(end.x - start.x, end.y - start.y);
    const vx = (end.x - start.x) / len;
    const vy = (end.y - start.y) / len;
    const arrow = (cx: number, cy: number, dir: 1 | -1) => (
      <line x1={cx - vx * 14 * dir} y1={cy - vy * 14 * dir} x2={cx + vx * 14 * dir} y2={cy + vy * 14 * dir}
        stroke={color} strokeWidth="2.5" strokeLinecap="round" markerEnd={`url(#arrow-${type})`} />
    );

    return (
      <g key={fault.id} style={{ pointerEvents: 'none' }}>
        <g clipPath="url(#rock-clip)">
          <line x1={start.x} y1={start.y} x2={end.x} y2={end.y}
            stroke={haloColor} strokeWidth="5" opacity="0.5" />
          <line x1={start.x} y1={start.y} x2={end.x} y2={end.y}
            className={isPreviewFault ? undefined : 'fault-draw'}
            stroke={color} strokeWidth="2.5" strokeDasharray="8 4" />
        </g>
        {/* 変位の向き：左側が上盤 */}
        {type === 'normal' && <>{arrow(fx - 18, midY, 1)}{arrow(fx + 18, midY, -1)}</>}
        {type === 'reverse' && <>{arrow(fx - 18, midY, -1)}{arrow(fx + 18, midY, 1)}</>}
        {type === 'strike-slip' && (
          <>
            <circle cx={fx - 18} cy={midY} r="7" fill={haloColor} stroke={color} strokeWidth="2" />
            <circle cx={fx - 18} cy={midY} r="2.2" fill={color} />
            <circle cx={fx + 18} cy={midY} r="7" fill={haloColor} stroke={color} strokeWidth="2" />
            <path d={`M${fx + 13.5},${midY - 4.5} l9,9 M${fx + 22.5},${midY - 4.5} l-9,9`}
              stroke={color} strokeWidth="2" strokeLinecap="round" />
          </>
        )}
        {/* ラベル（地表のすぐ上） */}
        <text x={xAt(surfaceY) + 6} y={Math.max(surfaceY - 10, fs + 2)} fontSize={fs} fontWeight="700"
          fill={color} stroke={haloColor} strokeWidth={3.5 * scale} paintOrder="stroke">
          {label}
        </text>
      </g>
    );
  };

  // 調整中の操作を図示するガイド
  const renderGuides = () => {
    if (!preview) return null;
    if (preview.type === 'APPLY_FOLD') {
      const { centerX, type } = preview.params;
      const axisTop = Math.max(rockTop - 24, fs + 8);
      return (
        <g style={{ pointerEvents: 'none' }}>
          <line x1={centerX} y1={axisTop} x2={centerX} y2={height}
            stroke="#0d9488" strokeWidth="1.5" strokeDasharray="3 4" />
          <text x={centerX} y={axisTop - 6} textAnchor="middle" fontSize={fs} fontWeight="700"
            fill="#0d9488" stroke={haloColor} strokeWidth={3.5 * scale} paintOrder="stroke">
            {type === 'anticline' ? t.crossSection.anticlineAxis : t.crossSection.synclineAxis}
          </text>
        </g>
      );
    }
    if (preview.type === 'APPLY_STRESS') {
      const { compression, extension } = preview.params;
      const y = (Math.max(rockTop, 0) + height) / 2;
      const props = {
        stroke: '#7c3aed', strokeWidth: 7, strokeLinecap: 'round' as const,
        markerEnd: 'url(#arrow-stress)', opacity: 0.85,
      };
      if (compression > 0) {
        return (
          <g style={{ pointerEvents: 'none' }}>
            <line x1={8} y1={y} x2={58} y2={y} {...props} />
            <line x1={width - 8} y1={y} x2={width - 58} y2={y} {...props} />
          </g>
        );
      }
      if (extension > 0) {
        return (
          <g style={{ pointerEvents: 'none' }}>
            <line x1={70} y1={y} x2={20} y2={y} {...props} />
            <line x1={width - 70} y1={y} x2={width - 20} y2={y} {...props} />
          </g>
        );
      }
      return (
        <g style={{ pointerEvents: 'none' }}>
          <line x1={width / 2 - 90} y1={Math.max(rockTop - 18, 20)} x2={width / 2 + 90} y2={Math.max(rockTop - 18, 20)} {...props} />
          <line x1={width / 2 + 90} y1={height - 18} x2={width / 2 - 90} y2={height - 18} {...props} />
        </g>
      );
    }
    return null;
  };

  const startSample = () => {
    for (const layer of SAMPLE_LAYERS) dispatch({ type: 'ADD_LAYER', ...layer });
  };

  const showHero = baseCount === 0 && !isAddPreview;

  return (
    <div ref={wrapRef} className="relative w-full overflow-hidden rounded-2xl bg-stone-100 shadow-sm ring-1 ring-stone-900/10 dark:bg-stone-900 dark:ring-white/10">
      <span id={keyboardHintId} className="sr-only">{t.crossSection.keyboardHint}</span>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        role="group"
        aria-label={t.crossSection.ariaLabel(geoState.layers.length, geoState.faults.length)}
        style={{ display: 'block', touchAction: 'manipulation' }}
        onClick={() => setPinned(null)}
      >
        {renderDefs()}
        <rect width={width} height={height} fill="url(#sky)" />
        {renderGrid()}
        {layers.map((l, i) => renderLayer(l, i))}
        {layers.map((l, i) => renderUnconformity(l, i))}
        {/* 変形前の輪郭（プレビュー時） */}
        {showGhost && (
          <g style={{ pointerEvents: 'none' }}>
            {geoState.layers.map((l, i) => (
              <path key={i} d={pointsToSvgPath(l.vertices)} fill="none"
                stroke={textColor} strokeOpacity="0.45" strokeWidth="1.2" strokeDasharray="4 4" />
            ))}
          </g>
        )}
        {faults.map(f => renderFault(f))}
        {renderGuides()}
      </svg>

      {/* プレビュー中バッジ */}
      {preview && baseCount + (isAddPreview ? 1 : 0) > 0 && (
        <div className="animate-pop-in pointer-events-none absolute left-2 top-2 flex items-center gap-1.5 rounded-full bg-stone-900/80 px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm backdrop-blur sm:left-3 sm:top-3 dark:bg-white/85 dark:text-stone-900">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-amber-400" />
          </span>
          {t.crossSection.preview}
          <span className="font-normal opacity-75">· {erodePreview ? t.crossSection.erodePreview : t.crossSection.previewHint}</span>
        </div>
      )}

      {/* 新旧の目安（地層累重の法則） */}
      {layers.length >= 2 && (
        <div aria-hidden="true"
          className="pointer-events-none absolute bottom-3 right-2 top-[38%] hidden w-5 flex-col items-center gap-1 text-[10px] font-bold text-stone-700 sm:flex dark:text-stone-200">
          <span>{t.crossSection.younger}</span>
          <span className="w-1 flex-1 rounded-full bg-gradient-to-b from-amber-300 to-stone-600 opacity-80 dark:from-amber-200 dark:to-stone-400" />
          <span>{t.crossSection.older}</span>
        </div>
      )}

      {/* 地層の詳細カード */}
      {activeLayer && (
        <div key={activeIdx} role="status"
          className="animate-pop-in absolute left-2 top-2 max-w-[min(18rem,calc(100%-1rem))] rounded-xl bg-white/95 p-2.5 shadow-lg ring-1 ring-stone-900/10 backdrop-blur sm:left-3 sm:top-3 sm:p-3 dark:bg-stone-800/95 dark:ring-white/10">
          <div className="flex items-start gap-2">
            <RockSwatch rockId={activeLayer.rockId} className="mt-0.5 h-5 w-7 shrink-0 rounded ring-1 ring-black/10" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold leading-tight text-stone-900 dark:text-stone-50">
                {rockName(activeLayer.rockId)}
              </p>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                {t.crossSection.layerOrder(activeLayer.order)}
              </p>
            </div>
            {pinnedIdx !== null && (
              <button type="button" onClick={() => setPinned(null)} aria-label={t.crossSection.close}
                className="pointer-events-auto -mr-1 -mt-1 grid size-6 place-items-center rounded-full text-stone-400 hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-stone-700">
                <CloseIcon className="text-sm" />
              </button>
            )}
          </div>
          <p className="mt-1.5 hidden text-xs leading-relaxed text-stone-600 sm:block dark:text-stone-300">
            {lang === 'ja' ? ROCKS[activeLayer.rockId].descriptionJa : ROCKS[activeLayer.rockId].descriptionEn}
          </p>
          {activeLayer.unconformityAbove && (
            <p className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
              <span aria-hidden="true">〰</span> {t.crossSection.unconformityNote}
            </p>
          )}
        </div>
      )}

      {/* 操作のヒント */}
      {layers.length > 0 && !preview && !activeLayer && (
        <p className="pointer-events-none absolute left-2 top-2 hidden rounded-full bg-white/70 px-2.5 py-1 text-[11px] text-stone-600 backdrop-blur sm:left-3 sm:top-3 sm:block dark:bg-stone-900/60 dark:text-stone-300">
          {t.crossSection.inspectHint}
        </p>
      )}

      {/* はじめての画面 */}
      {showHero && (
        <div className="absolute inset-0 flex items-center justify-center p-3 sm:p-6">
          <div className="animate-pop-in max-w-md rounded-2xl bg-white/85 p-4 text-center shadow-xl ring-1 ring-stone-900/5 backdrop-blur sm:p-6 dark:bg-stone-900/80 dark:ring-white/10">
            <div className="mx-auto mb-2 hidden size-12 place-items-center rounded-2xl bg-amber-100 text-2xl text-amber-700 sm:grid dark:bg-amber-400/15 dark:text-amber-300">
              <LayersIcon />
            </div>
            <h2 className="text-base font-bold text-stone-900 sm:text-xl dark:text-stone-50">
              {t.crossSection.emptyTitle}
            </h2>
            <p className="mt-1.5 hidden text-sm leading-relaxed text-stone-600 sm:block dark:text-stone-300">
              {t.crossSection.emptyBody}
            </p>
            <div className="mt-3 flex flex-col justify-center gap-2 sm:mt-4 sm:flex-row">
              <button type="button" onClick={startSample}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-stone-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 dark:bg-amber-400 dark:text-stone-900">
                <SparkleIcon /> {t.crossSection.startSample}
              </button>
              <button type="button" onClick={() => setOpenPanel('addLayer')}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-stone-700 ring-1 ring-stone-300 transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 dark:text-stone-200 dark:ring-stone-600 dark:hover:bg-stone-800">
                {t.crossSection.startEmpty}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
