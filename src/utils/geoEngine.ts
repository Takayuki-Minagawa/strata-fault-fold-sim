/**
 * geoEngine.ts
 * 地質変形ロジック（純粋関数）
 * すべての関数は既存の state を変更せず、新しい Layer[] を返す。
 */

import type {
  Layer,
  Point,
  GeoState,
  AddLayerAction,
  ApplyFaultAction,
  ApplyFoldAction,
  ApplyStressAction,
} from '../types/geology';

// ─── ユーティリティ ──────────────────────────────────────────────────

function newId(): string {
  return Math.random().toString(36).slice(2, 10);
}

/** 頂点リストをディープコピー */
function cloneVertices(verts: Point[]): Point[] {
  return verts.map(p => ({ ...p }));
}

/** 地層を水平方向に分割する区間数（褶曲・断層を滑らかに描くため） */
const SEGMENTS = 96;

/** 地層を画面の左右外側まで延ばす幅（断層や変形で端に隙間が見えないように） */
const SIDE_MARGIN = 200;

/** 最下層を画面外まで延ばす深さ（逆断層で持ち上がっても下端が見えないように） */
const BASEMENT_DEPTH = 300;

/** 断層で地層を切断するときの微小オフセット（px） */
const FAULT_EPS = 0.01;

/** 地層の上面・下面の折れ線を返す（上面は左→右、下面は右→左） */
export function layerEdges(layer: Layer): { top: Point[]; bottom: Point[] } {
  const n = layer.topCount ?? 2;
  return { top: layer.vertices.slice(0, n), bottom: layer.vertices.slice(n) };
}

/** 折れ線上の x における最も高い位置（最小 y）を返す。範囲外なら null */
export function polylineYAt(line: Point[], x: number): number | null {
  let best: number | null = null;
  for (let i = 0; i < line.length - 1; i++) {
    const a = line[i];
    const b = line[i + 1];
    const lo = Math.min(a.x, b.x);
    const hi = Math.max(a.x, b.x);
    if (x < lo || x > hi) continue;
    const y = hi === lo ? Math.min(a.y, b.y) : a.y + ((b.y - a.y) * (x - a.x)) / (b.x - a.x);
    if (best === null || y < best) best = y;
  }
  return best;
}


// ─── 1. 地層追加（堆積） ───────────────────────────────────────────

/**
 * 現在の地層群の上面に新しい層を一枚追加する。
 * 初回は viewHeight の下端から厚さ分だけ積む。
 */
export function addLayer(state: GeoState, action: AddLayerAction): GeoState {
  const { viewWidth, viewHeight, layers } = state;

  const xs = Array.from({ length: SEGMENTS + 1 },
    (_, i) => -SIDE_MARGIN + ((viewWidth + SIDE_MARGIN * 2) * i) / SEGMENTS);

  // 現在の地表面（全層の上面のうち最も高い位置。層がなければ画面下端）
  const surface = xs.map(x => {
    let y = viewHeight;
    for (const l of layers) {
      const top = polylineYAt(layerEdges(l).top, x);
      if (top !== null && top < y) y = top;
    }
    return y;
  });

  // 堆積物はくぼみを埋めて上面が水平になる。平らな地表ではそのまま厚さ分だけ積む
  // （厚さの基準は画面内に見えている地表の最高点）
  const visibleSurface = surface.filter((_, i) => xs[i] >= 0 && xs[i] <= viewWidth);
  const newTopY = Math.min(...visibleSurface) - action.thickness;
  const bottom = layers.length === 0
    ? xs.map(x => ({ x, y: viewHeight + BASEMENT_DEPTH }))
    : xs.map((x, i) => ({ x, y: surface[i] }));

  const vertices: Point[] = [
    ...xs.map(x => ({ x, y: newTopY })),  // 上面（左→右）
    ...bottom.reverse(),                   // 下面（右→左）
  ];

  const newLayer: Layer = {
    id: newId(),
    vertices,
    topCount: xs.length,
    rockId: action.rockId,
    order: layers.length + 1,
    unconformityAbove: false,
    label: action.label,
  };

  return {
    ...state,
    layers: [...layers, newLayer],
  };
}

// ─── 2. 応力変形 ─────────────────────────────────────────────────

/**
 * 水平圧縮（compression > 0）: 両端を内側に押しながら上方に膨らませる（背斜的変形）。
 * 水平伸張（extension > 0）: 両端を外側に引きながら正断層的に沈降。
 * せん断（shear > 0）: 上面を右方向にずらす。
 */
export function applyStress(state: GeoState, action: ApplyStressAction): GeoState {
  const { layers, viewWidth, viewHeight } = state;
  const { compression, extension, shear } = action.params;

  if (layers.length === 0) return state;

  const newLayers = layers.map(layer => {
    const verts = cloneVertices(layer.vertices);
    // 各頂点に変形を適用
    for (const p of verts) {
      const nx = p.x / viewWidth;   // 0〜1 に正規化した X 位置
      const ny = p.y / viewHeight;  // 0〜1 に正規化した Y 位置

      // --- 圧縮：両端を中央に寄せ、上面が弓なりに盛り上がる ---
      if (compression !== 0) {
        // X 方向: 左端(nx=0)は右に、右端(nx=1)は左にシフト
        const xShift = compression * (0.5 - nx);
        // Y 方向: 上面(ny小)ほど持ち上がる、sin カーブで中央が最大
        const yLift = compression * 0.4 * Math.sin(Math.PI * nx) * (1 - ny);
        p.x += xShift;
        p.y -= yLift;
      }

      // --- 伸張：両端を外側に広げ、中央付近が沈降 ---
      if (extension !== 0) {
        const xShift = extension * (nx - 0.5);
        const yDrop = extension * 0.3 * Math.sin(Math.PI * nx) * ny;
        p.x += xShift;
        p.y += yDrop;
      }

      // --- せん断：上面ほど右にずれる ---
      if (shear !== 0) {
        const xShift = shear * (1 - ny);
        p.x += xShift;
      }
    }
    return { ...layer, vertices: verts };
  });

  return { ...state, layers: newLayers };
}

// ─── 3. 断層変位 ─────────────────────────────────────────────────

/**
 * 断層線の左側（上盤）ブロックを変位させる。
 * 正断層: 上盤が断層面に沿って下がる。
 * 逆断層: 上盤が断層面に沿って上がる。
 * 横ずれ: 上盤が水平にずれる（断面に垂直な動きのため見かけの変化は小さい）。
 *
 * 断層が傾いている場合は断層面に沿った向きに動かし、上盤と下盤の間に
 * 隙間や重なりができないようにする（垂直断層では純粋な上下変位になる）。
 * 各層の上面・下面は断層との交点で切断し、段差がくっきり出るようにする。
 */
export function applyFault(state: GeoState, action: ApplyFaultAction): GeoState {
  const { fault } = action;
  const { layers } = state;
  if (layers.length === 0) return state;

  const { start, end, type, displacement } = fault;

  // 点が断層線のどちら側かを判定（外積の符号）
  const sideOf = (p: Point) =>
    (p.x - start.x) * (end.y - start.y) - (p.y - start.y) * (end.x - start.x);

  // 断層面に沿って y が 1 増えるときの x の変化量
  const dipX = end.y !== start.y ? (end.x - start.x) / (end.y - start.y) : 0;

  /** 折れ線を断層との交点で切断し、交点の両側に頂点を挿入する */
  const splitAtFault = (line: Point[]): Point[] => {
    const out: Point[] = [];
    for (let i = 0; i < line.length; i++) {
      const a = line[i];
      out.push({ ...a });
      const b = line[i + 1];
      if (!b) break;
      const sa = sideOf(a);
      const sb = sideOf(b);
      if (sa === 0 || sb === 0 || (sa > 0) === (sb > 0)) continue;
      const len = Math.hypot(b.x - a.x, b.y - a.y);
      if (len < FAULT_EPS * 4) continue;
      const t = sa / (sa - sb);
      const te = FAULT_EPS / len;
      for (const tt of [t - te, t + te]) {
        out.push({ x: a.x + (b.x - a.x) * tt, y: a.y + (b.y - a.y) * tt });
      }
    }
    return out;
  };

  const newLayers = layers.map(layer => {
    const edges = layerEdges(layer);
    const top = splitAtFault(edges.top);
    const verts = [...top, ...splitAtFault(edges.bottom)];
    for (const p of verts) {
      if (sideOf(p) > 0) continue; // 断層右側は動かさない

      if (type === 'normal') {
        // 正断層: 上盤が下方に滑る（Y 増加）
        p.y += displacement;
        p.x += displacement * dipX;
      } else if (type === 'reverse') {
        // 逆断層: 上盤が上方に乗り上げる（Y 減少）
        p.y -= displacement;
        p.x -= displacement * dipX;
      } else if (type === 'strike-slip') {
        // 横ずれ断層: 上盤が左方向に水平移動
        p.x -= displacement;
      }
    }
    return { ...layer, vertices: verts, topCount: top.length };
  });

  const newFaults = [...state.faults, fault];
  return { ...state, layers: newLayers, faults: newFaults };
}

// ─── 4. 褶曲変形 ─────────────────────────────────────────────────

/**
 * sin 波で頂点の Y 座標を歪ませる。
 * 背斜（anticline）: 山型（中央が盛り上がる）。
 * 向斜（syncline）: 谷型（中央が沈む）。
 */
export function applyFold(state: GeoState, action: ApplyFoldAction): GeoState {
  const { params } = action;
  const { layers } = state;
  if (layers.length === 0) return state;

  const { type, wavelength, amplitude, centerX } = params;
  const sign = type === 'anticline' ? -1 : 1; // 背斜は上方向（Y 減少）

  const newLayers = layers.map(layer => {
    const verts = cloneVertices(layer.vertices);
    for (const p of verts) {
      const relX = p.x - centerX;
      // cos を使うことで relX=0（= centerX）で最大変位になる
      const wave = Math.cos((relX / wavelength) * Math.PI * 2);
      p.y += sign * amplitude * wave;
    }
    return { ...layer, vertices: verts };
  });

  return { ...state, layers: newLayers };
}

// ─── 5. 削剥 ────────────────────────────────────────────────────

/**
 * 現在の最上面を水平にカットする（全層の上面を同じ Y 座標に揃える）。
 * カット後、最上層を「不整合面あり」にマークする。
 */
export function erode(state: GeoState): GeoState {
  const { layers } = state;
  if (layers.length === 0) return state;

  // 各層の上面頂点の Y 平均を侵食面とする。
  // Math.min() では「最高点」になって何も削れないため平均値を使う。
  const topYValues = layers.flatMap(l => layerEdges(l).top.map(p => p.y));
  const cutY = topYValues.reduce((s, y) => s + y, 0) / topYValues.length;

  const newLayers: Layer[] = [];
  for (const layer of layers) {
    const verts = cloneVertices(layer.vertices);
    // 上面頂点の Y を cutY にクランプ
    for (const p of verts) {
      if (p.y < cutY) p.y = cutY;
    }
    // 全頂点が cutY 以下になった層は削除（完全に削剥）
    const visible = verts.some(p => p.y > cutY);
    if (visible) {
      newLayers.push({ ...layer, vertices: verts, unconformityAbove: true });
    }
  }

  // 最上層だけに unconformityAbove を立てる
  if (newLayers.length > 0) {
    for (let i = 0; i < newLayers.length - 1; i++) {
      newLayers[i] = { ...newLayers[i], unconformityAbove: false };
    }
  }

  return { ...state, layers: newLayers };
}

// ─── 6. Action ディスパッチャ ─────────────────────────────────────

import type { GeoAction } from '../types/geology';

export function applyAction(state: GeoState, action: GeoAction): GeoState {
  switch (action.type) {
    case 'ADD_LAYER':    return addLayer(state, action);
    case 'APPLY_STRESS': return applyStress(state, action);
    case 'APPLY_FAULT':  return applyFault(state, action);
    case 'APPLY_FOLD':   return applyFold(state, action);
    case 'ERODE':        return erode(state);
    default:             return state;
  }
}

/** 初期状態から Action 列を順に再計算して最終状態を得る */
export function replayActions(actions: GeoAction[], viewWidth: number, viewHeight: number): GeoState {
  const initial: GeoState = { layers: [], faults: [], viewWidth, viewHeight };
  return actions.reduce<GeoState>((s, a) => applyAction(s, a), initial);
}
