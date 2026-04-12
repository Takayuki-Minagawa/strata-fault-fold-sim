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


// ─── 1. 地層追加（堆積） ───────────────────────────────────────────

/**
 * 現在の地層群の上面に新しい層を一枚追加する。
 * 初回は viewHeight の下端から厚さ分だけ積む。
 */
export function addLayer(state: GeoState, action: AddLayerAction): GeoState {
  const { viewWidth, viewHeight, layers } = state;

  // 現在の最上面 Y 座標（層がなければ画面下端）
  const topY = layers.length > 0
    ? Math.min(...layers[layers.length - 1].vertices.map(p => p.y))
    : viewHeight;

  const bottomY = topY;
  const newTopY = topY - action.thickness;

  // 矩形の4頂点（左上→右上→右下→左下 の順で上面・下面に分けて格納）
  const vertices: Point[] = [
    { x: 0,         y: newTopY  },  // 上面左
    { x: viewWidth, y: newTopY  },  // 上面右
    { x: viewWidth, y: bottomY  },  // 下面右
    { x: 0,         y: bottomY  },  // 下面左
  ];

  const newLayer: Layer = {
    id: newId(),
    vertices,
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
 * 正断層: 上盤が下がる（SVG Y 増加）。
 * 逆断層: 上盤が上がる（SVG Y 減少）。
 * 横ずれ: 上盤が水平にずれる。
 *
 * ツールバーは常に垂直断層（start.x === end.x）を生成するため、
 * 法線ベクトル経由では ny = 0 になり垂直変位がゼロになる問題があった。
 * 断層タイプに応じて変位を直接適用する方式に変更。
 */
export function applyFault(state: GeoState, action: ApplyFaultAction): GeoState {
  const { fault } = action;
  const { layers } = state;
  if (layers.length === 0) return state;

  const { start, end, type, displacement } = fault;

  const newLayers = layers.map(layer => {
    const verts = cloneVertices(layer.vertices);
    for (const p of verts) {
      // 点が断層線のどちら側かを判定（外積の符号）
      // 垂直断層では (p.x - start.x) * (end.y - start.y) の符号になる
      const side = (p.x - start.x) * (end.y - start.y) - (p.y - start.y) * (end.x - start.x);
      if (side > 0) continue; // 断層右側は動かさない

      if (type === 'normal') {
        // 正断層: 上盤が下方に滑る（Y 増加）
        p.y += displacement;
      } else if (type === 'reverse') {
        // 逆断層: 上盤が上方に乗り上げる（Y 減少）
        p.y -= displacement;
      } else if (type === 'strike-slip') {
        // 横ずれ断層: 上盤が左方向に水平移動
        p.x -= displacement;
      }
    }
    return { ...layer, vertices: verts };
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

  // 各層の上面頂点（vertices[0], vertices[1]）の Y 平均を侵食面とする。
  // Math.min() では「最高点」になって何も削れないため平均値を使う。
  const topYValues = layers.flatMap(l => [l.vertices[0].y, l.vertices[1].y]);
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
