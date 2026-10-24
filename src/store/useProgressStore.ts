import { create } from 'zustand';
import type { GeoAction } from '../types/geology';
import { MISSIONS } from '../data/missions';
import type { MissionId } from '../data/missions';
import { loadItem, saveItem } from '../utils/storage';

const STORAGE_KEY = 'strata-sim:progress:v1';

interface SavedProgress {
  achieved: MissionId[];
  /** 正解したクイズの id（同じ問題は 1 回だけ数える） */
  correctQuizIds: string[];
}

export interface Toast {
  id: number;
  missionId: MissionId;
}

interface ProgressStore {
  /** 達成済みミッション（一度達成したら保持する） */
  achieved: MissionId[];
  /** 正解したクイズの id */
  correctQuizIds: string[];
  /** 達成通知 */
  toasts: Toast[];
  /** 最後に評価した操作列（クイズ正解時の再評価用） */
  lastActions: GeoAction[];

  /** 現在の操作列でミッション達成を判定する */
  evaluate: (actions: GeoAction[]) => void;
  recordCorrect: (quizId: string) => void;
  dismissToasts: () => void;
  resetProgress: () => void;
}

function loadProgress(): SavedProgress {
  const raw = loadItem(STORAGE_KEY);
  if (!raw) return { achieved: [], correctQuizIds: [] };
  try {
    const parsed = JSON.parse(raw) as Partial<SavedProgress>;
    const known = new Set(MISSIONS.map(m => m.id));
    return {
      achieved: (parsed.achieved ?? []).filter((id): id is MissionId => known.has(id)),
      correctQuizIds: Array.isArray(parsed.correctQuizIds)
        ? parsed.correctQuizIds.filter((id): id is string => typeof id === 'string')
        : [],
    };
  } catch {
    return { achieved: [], correctQuizIds: [] };
  }
}

function persist(progress: SavedProgress) {
  saveItem(STORAGE_KEY, JSON.stringify(progress));
}

let toastSeq = 0;

export const useProgressStore = create<ProgressStore>((set, get) => ({
  ...loadProgress(),
  toasts: [],
  lastActions: [],

  evaluate(actions) {
    const { achieved, correctQuizIds, toasts } = get();
    const ctx = { actions, quizCorrect: correctQuizIds.length };
    const newly = MISSIONS
      .filter(m => !achieved.includes(m.id) && m.check(ctx))
      .map(m => m.id);
    if (newly.length === 0) {
      set({ lastActions: actions });
      return;
    }
    const nextAchieved = [...achieved, ...newly];
    persist({ achieved: nextAchieved, correctQuizIds });
    set({
      achieved: nextAchieved,
      lastActions: actions,
      toasts: [...toasts, ...newly.map(missionId => ({ id: ++toastSeq, missionId }))],
    });
  },

  recordCorrect(quizId) {
    const { achieved, correctQuizIds } = get();
    if (correctQuizIds.includes(quizId)) return;
    const next = [...correctQuizIds, quizId];
    persist({ achieved, correctQuizIds: next });
    set({ correctQuizIds: next });
    get().evaluate(get().lastActions);
  },

  dismissToasts() {
    set({ toasts: [] });
  },

  resetProgress() {
    persist({ achieved: [], correctQuizIds: [] });
    set({ achieved: [], correctQuizIds: [], toasts: [] });
  },
}));
