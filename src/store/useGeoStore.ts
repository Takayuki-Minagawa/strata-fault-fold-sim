import { create } from 'zustand';
import type { GeoAction, GeoState, HistoryEntry } from '../types/geology';
import { replayActions } from '../utils/geoEngine';
import { ROCKS } from '../data/rocks';

const VIEW_WIDTH  = 800;
const VIEW_HEIGHT = 500;

/** 操作ラベルを生成 */
function makeLabel(action: GeoAction): { ja: string; en: string } {
  switch (action.type) {
    case 'ADD_LAYER': {
      const rock = ROCKS[action.rockId];
      return {
        ja: `${rock.nameJa}層を堆積（厚さ ${action.thickness}px）`,
        en: `Deposit ${rock.nameEn} layer (${action.thickness}px thick)`,
      };
    }
    case 'APPLY_STRESS': {
      const { compression, extension, shear } = action.params;
      if (compression > 0)
        return { ja: `水平圧縮 (${compression}px)`, en: `Horizontal compression (${compression}px)` };
      if (extension > 0)
        return { ja: `水平伸張 (${extension}px)`, en: `Horizontal extension (${extension}px)` };
      if (shear !== 0)
        return { ja: `せん断 (${shear}px)`, en: `Shear (${shear}px)` };
      return { ja: '応力操作', en: 'Stress operation' };
    }
    case 'APPLY_FAULT': {
      const typeMap: Record<string, [string, string]> = {
        normal: ['正断層', 'Normal fault'],
        reverse: ['逆断層', 'Reverse fault'],
        'strike-slip': ['横ずれ断層', 'Strike-slip fault'],
      };
      const [ja, en] = typeMap[action.fault.type] ?? ['断層', 'Fault'];
      return { ja: `${ja}を形成`, en: `Form ${en}` };
    }
    case 'APPLY_FOLD': {
      const typeMap: Record<string, [string, string]> = {
        anticline: ['背斜', 'Anticline'],
        syncline: ['向斜', 'Syncline'],
      };
      const [ja, en] = typeMap[action.params.type] ?? ['褶曲', 'Fold'];
      return { ja: `${ja}を形成`, en: `Form ${en}` };
    }
    case 'ERODE':
      return { ja: '削剥（不整合面を形成）', en: 'Erosion (form unconformity)' };
    default:
      return { ja: '操作', en: 'Operation' };
  }
}

function newId() {
  return Math.random().toString(36).slice(2, 10);
}

// ─── Store 型定義 ─────────────────────────────────────────────────

interface GeoStore {
  /** 操作履歴 */
  history: HistoryEntry[];
  /** 現在表示中のステップ index（-1 = 初期状態） */
  currentStep: number;
  /** ビューポートサイズ */
  viewWidth: number;
  viewHeight: number;

  /** 現在の GeoState（history[0..currentStep] を再計算） */
  geoState: GeoState;

  /** 操作を追加して currentStep を進める */
  dispatch: (action: GeoAction) => void;
  /** 指定ステップに移動 */
  jumpTo: (step: number) => void;
  /** アンドゥ */
  undo: () => void;
  /** リドゥ */
  redo: () => void;
  /** 全リセット */
  reset: () => void;
  /** ビューポートサイズを更新 */
  setViewSize: (w: number, h: number) => void;
}

const initialGeoState: GeoState = {
  layers: [],
  faults: [],
  viewWidth:  VIEW_WIDTH,
  viewHeight: VIEW_HEIGHT,
};

export const useGeoStore = create<GeoStore>((set, get) => ({
  history: [],
  currentStep: -1,
  viewWidth:  VIEW_WIDTH,
  viewHeight: VIEW_HEIGHT,
  geoState: initialGeoState,

  dispatch(action) {
    const { history, currentStep, viewWidth, viewHeight, geoState: currentGeoState } = get();
    const requiresLayers = action.type !== 'ADD_LAYER';

    // 空状態では構造操作・削剥は no-op なので履歴に積まない。
    if (requiresLayers && currentGeoState.layers.length === 0) return;

    // リドゥ履歴を切り捨てる
    const trimmed = history.slice(0, currentStep + 1);
    const { ja, en } = makeLabel(action);
    const entry: HistoryEntry = {
      id: newId(),
      action,
      labelJa: ja,
      labelEn: en,
    };
    const newHistory = [...trimmed, entry];
    const newStep = newHistory.length - 1;
    const nextGeoState = replayActions(
      newHistory.map(e => e.action),
      viewWidth,
      viewHeight,
    );
    set({ history: newHistory, currentStep: newStep, geoState: nextGeoState });
  },

  jumpTo(step) {
    const { history, viewWidth, viewHeight } = get();
    const clamped = Math.max(-1, Math.min(step, history.length - 1));
    const actions = history.slice(0, clamped + 1).map(e => e.action);
    const geoState = replayActions(actions, viewWidth, viewHeight);
    set({ currentStep: clamped, geoState });
  },

  undo() {
    const { currentStep } = get();
    if (currentStep >= 0) get().jumpTo(currentStep - 1);
  },

  redo() {
    const { currentStep, history } = get();
    if (currentStep < history.length - 1) get().jumpTo(currentStep + 1);
  },

  reset() {
    const { viewWidth, viewHeight } = get();
    set({
      history: [],
      currentStep: -1,
      geoState: { layers: [], faults: [], viewWidth, viewHeight },
    });
  },

  setViewSize(w, h) {
    const { history, currentStep } = get();
    const actions = history.slice(0, currentStep + 1).map(e => e.action);
    const geoState = replayActions(actions, w, h);
    set({ viewWidth: w, viewHeight: h, geoState });
  },
}));
