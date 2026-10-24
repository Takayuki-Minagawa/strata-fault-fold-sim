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
    sectionTitle: 'ツール',
    addLayerCaption: '岩相を選んで堆積させる',
    stressCaption: '押す・引く・ずらす',
    faultCaption: '地層を断ち切ってずらす',
    foldCaption: '地層を波打たせる',
    erodeCaption: '上面を削って平らにする',
    needLayer: 'まず地層を追加しよう',
    previewHint: 'スライダーを動かすと、断面図でリアルタイムにプレビューできます。',
    resetConfirm: 'もう一度押すとリセット',
    shortcutHint: 'Ctrl / ⌘ + Z で元に戻す',
  },

  // 地層追加ダイアログ
  addLayerDialog: {
    title: '地層を追加',
    rockType: '岩相',
    thickness: '厚さ (px)',
    confirm: '追加',
    cancel: 'キャンセル',
    environment: '堆積環境',
  },

  // 応力ダイアログ
  stressDialog: {
    title: '応力操作',
    compression: '水平圧縮',
    extension: '水平伸張',
    shear: 'せん断',
    apply: '適用',
    compressionCaption: '両側から押す',
    extensionCaption: '両側へ引っ張る',
    shearCaption: '上下で逆向きにずらす',
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
    normalCaption: '引っ張り → 上盤がずり下がる',
    reverseCaption: '圧縮 → 上盤がのし上がる',
    strikeSlipCaption: 'せん断 → 水平にすれ違う',
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
    anticlineCaption: '山型に盛り上がる',
    synclineCaption: '谷型にくぼむ',
  },

  // タイムライン
  timeline: {
    title: '操作履歴',
    initial: '初期状態',
    step: 'ステップ',
    scrubber: '時間をさかのぼる',
    stepOf: (step: number, total: number) => `ステップ ${step} / ${total}`,
    redoable: 'やり直し可能',
    now: 'いまここ',
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
    preview: 'プレビュー',
    previewHint: '「適用」で確定',
    erodePreview: 'クリックで削剥',
    younger: '新',
    older: '古',
    emptyTitle: '地球の歴史を、1 枚ずつ積み上げよう',
    emptyBody: '地層を積んで、押して、ずらして、削る。断層や褶曲がどうできるのか、手を動かして確かめよう。',
    startSample: 'サンプル地層で始める',
    startEmpty: '自分で地層を追加',
    ariaLabel: (layers: number, faults: number) => `地質断面図：地層 ${layers} 層、断層 ${faults} 本`,
    layerOrder: (n: number) => `下から ${n} 番目に堆積した地層`,
    unconformityNote: '上面は不整合面（侵食の跡）',
    anticlineAxis: '背斜軸',
    synclineAxis: '向斜軸',
    inspectHint: '地層にカーソルを合わせる／タップすると詳しく見られます',
    legend: '凡例',
    towardViewer: '手前へ',
    awayFromViewer: '奥へ',
    close: '閉じる',
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
    quizEmpty: '褶曲・断層・削剥・応力をつくると、その構造についてのクイズが出題されます。',
    quizLabel: '問題',
    keyTerms: ['地層累重の法則', '不整合面', '横ずれ断層', '正断層', '逆断層', '背斜', '向斜', '上盤', '水平圧縮', '水平伸張', 'せん断', '削剥'],
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
    switchToLight: 'ライトモードに切り替え',
    switchToDark: 'ダークモードに切り替え',
    switchLang: 'Switch to English',
  },

  // 探検ミッション
  missions: {
    title: '探検ミッション',
    lead: '断面をつくりながら、地質構造をひとつずつマスターしよう。',
    progress: (done: number, total: number) => `${done} / ${total} 達成`,
    achieved: 'ミッション達成',
    allDone: 'すべてのミッションを達成しました！',
    reset: '進捗をリセット',
    open: '探検ミッションを開く',
  },
};

export type I18nKeys = typeof ja;
