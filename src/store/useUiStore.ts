import { create } from 'zustand';
import type { GeoAction } from '../types/geology';
import type { RockId } from '../data/rocks';

export type ToolPanel = 'addLayer' | 'stress' | 'fault' | 'fold';

interface UiStore {
  /** 開いている操作パネル */
  openPanel: ToolPanel | null;
  /** パネルで調整中の操作（断面図にプレビュー表示する） */
  draft: GeoAction | null;
  /** 削剥ボタンにカーソルが乗っている間は削剥結果をプレビューする */
  erodePreview: boolean;
  /** 凡例で強調表示している岩相 */
  highlightRock: RockId | null;

  setOpenPanel: (panel: ToolPanel | null) => void;
  togglePanel: (panel: ToolPanel) => void;
  setDraft: (draft: GeoAction | null) => void;
  setErodePreview: (on: boolean) => void;
  setHighlightRock: (rock: RockId | null) => void;
}

export const useUiStore = create<UiStore>((set) => ({
  openPanel: null,
  draft: null,
  erodePreview: false,
  highlightRock: null,

  setOpenPanel(panel) {
    set(panel === null ? { openPanel: null, draft: null } : { openPanel: panel });
  },
  togglePanel(panel) {
    set(state => state.openPanel === panel
      ? { openPanel: null, draft: null }
      : { openPanel: panel });
  },
  setDraft(draft) {
    set({ draft });
  },
  setErodePreview(on) {
    // カーソル移動のたびに呼ばれるので、値が変わるときだけ更新する
    set(state => (state.erodePreview === on ? state : { erodePreview: on }));
  },
  setHighlightRock(rock) {
    set({ highlightRock: rock });
  },
}));
