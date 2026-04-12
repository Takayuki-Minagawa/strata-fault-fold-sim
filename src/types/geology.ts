import type { RockId } from '../data/rocks';

/** 2D 座標 */
export interface Point {
  x: number;
  y: number;
}

/** 地層一枚（多角形） */
export interface Layer {
  id: string;
  /** 多角形の頂点座標（左→右の順、上面→下面の順） */
  vertices: Point[];
  rockId: RockId;
  /** 堆積順（1 が最初） */
  order: number;
  /** 不整合面かどうか（この層の上面が不整合面） */
  unconformityAbove: boolean;
  /** 表示ラベル（省略可） */
  label?: string;
}

/** 断層種類 */
export type FaultType = 'normal' | 'reverse' | 'strike-slip';

/** 断層情報 */
export interface FaultLine {
  id: string;
  type: FaultType;
  /** 断層面の上端・下端 */
  start: Point;
  end: Point;
  /** 滑り量（ピクセル換算） */
  displacement: number;
}

/** 褶曲種類 */
export type FoldType = 'anticline' | 'syncline';

/** 褶曲パラメータ */
export interface FoldParams {
  type: FoldType;
  wavelength: number;   // px
  amplitude: number;    // px
  centerX: number;      // 変形中心 X
}

/** 応力操作パラメータ */
export interface StressParams {
  compression: number;  // 水平圧縮量（px、正値で内側に押す）
  extension: number;    // 水平伸張量（px、正値で外側に引く）
  shear: number;        // せん断量（px、正値で上方にずれ）
}

// ─── Action（操作履歴） ───────────────────────────────────────────────

export type ActionType =
  | 'ADD_LAYER'
  | 'APPLY_STRESS'
  | 'APPLY_FAULT'
  | 'APPLY_FOLD'
  | 'ERODE';

export interface AddLayerAction {
  type: 'ADD_LAYER';
  rockId: RockId;
  thickness: number;  // px
  label?: string;
}

export interface ApplyStressAction {
  type: 'APPLY_STRESS';
  params: StressParams;
}

export interface ApplyFaultAction {
  type: 'APPLY_FAULT';
  fault: FaultLine;
}

export interface ApplyFoldAction {
  type: 'APPLY_FOLD';
  params: FoldParams;
}

export interface ErodeAction {
  type: 'ERODE';
}

export type GeoAction =
  | AddLayerAction
  | ApplyStressAction
  | ApplyFaultAction
  | ApplyFoldAction
  | ErodeAction;

/** 操作履歴エントリ */
export interface HistoryEntry {
  id: string;
  action: GeoAction;
  labelJa: string;
  labelEn: string;
}

/** シミュレーション全体の状態 */
export interface GeoState {
  layers: Layer[];
  faults: FaultLine[];
  /** ビューポートの幅・高さ */
  viewWidth: number;
  viewHeight: number;
}
