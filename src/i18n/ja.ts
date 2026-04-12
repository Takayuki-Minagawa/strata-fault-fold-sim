export const ja = {
  appTitle: '地層・断層・褶曲シミュレーター',
  appSubtitle: '地質構造を体験して学ぼう',

  // ツールバー
  toolbar: {
    addLayer: '地層を追加',
    stress: '応力操作',
    fault: '断層',
    fold: '褶曲',
    erode: '削剥',
    reset: 'リセット',
    undo: '元に戻す',
    redo: 'やり直す',
  },

  // 地層追加ダイアログ
  addLayerDialog: {
    title: '地層を追加',
    rockType: '岩相',
    thickness: '厚さ (px)',
    confirm: '追加',
    cancel: 'キャンセル',
  },

  // 応力ダイアログ
  stressDialog: {
    title: '応力操作',
    compression: '水平圧縮',
    extension: '水平伸張',
    shear: 'せん断',
    apply: '適用',
    hint: '圧縮すると褶曲、伸張すると正断層、せん断すると横ずれ断層が形成されやすくなります。',
  },

  // 断層ダイアログ
  faultDialog: {
    title: '断層を追加',
    type: '断層の種類',
    normal: '正断層',
    reverse: '逆断層',
    strikeSlip: '横ずれ断層',
    displacement: '滑り量 (px)',
    positionX: '断層位置 X (px)',
    apply: '適用',
  },

  // 褶曲ダイアログ
  foldDialog: {
    title: '褶曲を追加',
    type: '褶曲の種類',
    anticline: '背斜',
    syncline: '向斜',
    wavelength: '波長 (px)',
    amplitude: '振幅 (px)',
    centerX: '中心 X (px)',
    apply: '適用',
  },

  // タイムライン
  timeline: {
    title: '操作履歴',
    initial: '初期状態',
    step: 'ステップ',
  },

  // 断面ビュー
  crossSection: {
    title: '地質断面図',
    labelNormal: '正断層',
    labelReverse: '逆断層',
    labelStrikeSlip: '横ずれ断層',
    labelAnticline: '背斜',
    labelSyncline: '向斜',
    labelUnconformity: '不整合面',
    empty: '左のパネルから地層を追加してください',
  },

  // 学習パネル
  learning: {
    title: '学習パネル',
    description: '解説',
    quiz: 'クイズ',
    correct: '正解！',
    incorrect: '不正解。',
    nextQuiz: '次の問題',
    showAnswer: '答えを見る',
    answer: '答え: ',
    noContent: '地層を追加すると解説が表示されます。',
    quizScore: '正解数: ',
  },

  // クイズ
  quiz: {
    identifyStructure: '以下の地質構造の名称を答えなさい。',
    identifyOrder: '地層が形成された順番として正しいものを選びなさい。',
    identifyStress: 'この地質構造を形成した応力の向きとして正しいものを選びなさい。',
    options: {
      anticline: '背斜',
      syncline: '向斜',
      normalFault: '正断層',
      reverseFault: '逆断層',
      strikeSlip: '横ずれ断層',
      unconformity: '不整合',
      compression: '水平圧縮',
      extension: '水平伸張',
      shear: 'せん断',
    },
  },

  // テーマ・言語切替
  ui: {
    lightMode: 'ライト',
    darkMode: 'ダーク',
    langJa: '日本語',
    langEn: 'English',
  },
};

export type I18nKeys = typeof ja;
