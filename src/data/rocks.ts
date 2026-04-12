export type RockId = 'sandstone' | 'mudstone' | 'limestone' | 'tuff' | 'conglomerate' | 'chert';

export interface RockType {
  id: RockId;
  nameJa: string;
  nameEn: string;
  descriptionJa: string;
  descriptionEn: string;
  color: string;       // ライトテーマ用
  darkColor: string;   // ダークテーマ用
  pattern?: 'dots' | 'lines' | 'cross' | 'none';
}

export const ROCKS: Record<RockId, RockType> = {
  sandstone: {
    id: 'sandstone',
    nameJa: '砂岩',
    nameEn: 'Sandstone',
    descriptionJa: '砂粒が固まった堆積岩。河川・浅海で堆積する。',
    descriptionEn: 'Sedimentary rock formed from sand-sized grains. Deposited in rivers and shallow seas.',
    color: '#d4a96a',
    darkColor: '#a07040',
    pattern: 'dots',
  },
  mudstone: {
    id: 'mudstone',
    nameJa: '泥岩',
    nameEn: 'Mudstone',
    descriptionJa: '泥が固まった堆積岩。深海・静水環境で堆積する。',
    descriptionEn: 'Sedimentary rock formed from mud. Deposited in deep water or calm environments.',
    color: '#7a8fa6',
    darkColor: '#4a6070',
    pattern: 'none',
  },
  limestone: {
    id: 'limestone',
    nameJa: '石灰岩',
    nameEn: 'Limestone',
    descriptionJa: '炭酸カルシウムを主成分とする堆積岩。浅海・サンゴ礁で堆積する。',
    descriptionEn: 'Sedimentary rock composed mainly of calcium carbonate. Forms in shallow seas and coral reefs.',
    color: '#c8c0a8',
    darkColor: '#88806a',
    pattern: 'lines',
  },
  tuff: {
    id: 'tuff',
    nameJa: '凝灰岩',
    nameEn: 'Tuff',
    descriptionJa: '火山灰が固まった岩石。火山噴火の証拠となる鍵層。',
    descriptionEn: 'Rock formed from volcanic ash. Acts as a key layer marking volcanic eruptions.',
    color: '#c4a8c8',
    darkColor: '#806080',
    pattern: 'cross',
  },
  conglomerate: {
    id: 'conglomerate',
    nameJa: '礫岩',
    nameEn: 'Conglomerate',
    descriptionJa: '礫（小石）が固まった堆積岩。河川・扇状地で堆積する。',
    descriptionEn: 'Sedimentary rock formed from pebbles. Deposited in rivers and alluvial fans.',
    color: '#c09060',
    darkColor: '#806040',
    pattern: 'dots',
  },
  chert: {
    id: 'chert',
    nameJa: 'チャート',
    nameEn: 'Chert',
    descriptionJa: '二酸化ケイ素からなる硬い岩石。深海の放散虫由来。',
    descriptionEn: 'Hard rock composed of silica. Derived from radiolarians in the deep sea.',
    color: '#d08080',
    darkColor: '#904040',
    pattern: 'none',
  },
};

export const ROCK_IDS: RockId[] = Object.keys(ROCKS) as RockId[];
