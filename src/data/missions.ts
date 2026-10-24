import type { GeoAction } from '../types/geology';

/** ミッション判定に使う情報 */
export interface MissionContext {
  /** 現在表示中のステップまでの操作 */
  actions: GeoAction[];
  /** これまでに正解したクイズの種類数 */
  quizCorrect: number;
}

export type MissionId =
  | 'firstLayer'
  | 'variety'
  | 'stress'
  | 'fold'
  | 'fault'
  | 'allFaults'
  | 'unconformity'
  | 'quiz';

export interface Mission {
  id: MissionId;
  titleJa: string;
  titleEn: string;
  hintJa: string;
  hintEn: string;
  check: (ctx: MissionContext) => boolean;
}

export const MISSIONS: Mission[] = [
  {
    id: 'firstLayer',
    titleJa: '最初の地層を堆積させる',
    titleEn: 'Deposit your first layer',
    hintJa: '「地層を追加」で岩相を選んで積もう。',
    hintEn: 'Use "Add Layer" and pick a rock type.',
    check: ({ actions }) => actions.some(a => a.type === 'ADD_LAYER'),
  },
  {
    id: 'variety',
    titleJa: '3 種類以上の岩相を重ねる',
    titleEn: 'Stack 3 different rock types',
    hintJa: '砂岩・泥岩・凝灰岩…堆積環境の違いを想像してみよう。',
    hintEn: 'Sandstone, mudstone, tuff… each tells a different story.',
    check: ({ actions }) => {
      const rocks = new Set(actions.flatMap(a => a.type === 'ADD_LAYER' ? [a.rockId] : []));
      return rocks.size >= 3;
    },
  },
  {
    id: 'stress',
    titleJa: '応力を加えて地層を変形させる',
    titleEn: 'Deform layers with stress',
    hintJa: '圧縮・伸張・せん断で地層の形がどう変わるか見てみよう。',
    hintEn: 'See how compression, extension and shear change the layers.',
    check: ({ actions }) => actions.some(a => a.type === 'APPLY_STRESS'),
  },
  {
    id: 'fold',
    titleJa: '褶曲（背斜・向斜）をつくる',
    titleEn: 'Create a fold',
    hintJa: '山型が背斜、谷型が向斜。',
    hintEn: 'Arch = anticline, trough = syncline.',
    check: ({ actions }) => actions.some(a => a.type === 'APPLY_FOLD'),
  },
  {
    id: 'fault',
    titleJa: '断層で地層をずらす',
    titleEn: 'Offset layers with a fault',
    hintJa: '断層の両側で地層のつながりがどうずれるか観察しよう。',
    hintEn: 'Watch how layers stop matching across the fault.',
    check: ({ actions }) => actions.some(a => a.type === 'APPLY_FAULT'),
  },
  {
    id: 'allFaults',
    titleJa: '3 種類の断層を 1 つの断面に刻む',
    titleEn: 'Put all 3 fault types in one section',
    hintJa: '正断層・逆断層・横ずれ断層をすべて形成しよう。',
    hintEn: 'Form a normal, a reverse and a strike-slip fault.',
    check: ({ actions }) => {
      const types = new Set(actions.flatMap(a => a.type === 'APPLY_FAULT' ? [a.fault.type] : []));
      return types.size >= 3;
    },
  },
  {
    id: 'unconformity',
    titleJa: '不整合をつくる',
    titleEn: 'Create an unconformity',
    hintJa: '削剥したあとに新しい地層を堆積させると不整合になる。',
    hintEn: 'Erode, then deposit new layers on top.',
    check: ({ actions }) => {
      const erodeAt = actions.findIndex(a => a.type === 'ERODE');
      return erodeAt >= 0 && actions.slice(erodeAt + 1).some(a => a.type === 'ADD_LAYER');
    },
  },
  {
    id: 'quiz',
    titleJa: 'クイズで 3 種類の問題に正解する',
    titleEn: 'Correctly answer 3 different quiz questions',
    hintJa: '構造をつくると学習パネルにクイズが出題される。いろいろな構造をつくろう。',
    hintEn: 'Build different structures to unlock more quiz questions.',
    check: ({ quizCorrect }) => quizCorrect >= 3,
  },
];
