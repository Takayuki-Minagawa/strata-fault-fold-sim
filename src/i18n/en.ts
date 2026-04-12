import type { I18nKeys } from './ja';

export const en: I18nKeys = {
  appTitle: 'Strata, Fault & Fold Simulator',
  appSubtitle: 'Explore geological structures interactively',

  toolbar: {
    addLayer: 'Add Layer',
    stress: 'Stress',
    fault: 'Fault',
    fold: 'Fold',
    erode: 'Erode',
    reset: 'Reset',
    undo: 'Undo',
    redo: 'Redo',
  },

  addLayerDialog: {
    title: 'Add Layer',
    rockType: 'Rock type',
    thickness: 'Thickness (px)',
    confirm: 'Add',
    cancel: 'Cancel',
  },

  stressDialog: {
    title: 'Stress Operation',
    compression: 'Horizontal Compression',
    extension: 'Horizontal Extension',
    shear: 'Shear',
    apply: 'Apply',
    hint: 'Compression tends to form folds, extension forms normal faults, and shear forms strike-slip faults.',
  },

  faultDialog: {
    title: 'Add Fault',
    type: 'Fault type',
    normal: 'Normal fault',
    reverse: 'Reverse fault',
    strikeSlip: 'Strike-slip fault',
    displacement: 'Displacement (px)',
    positionX: 'Fault position X (px)',
    apply: 'Apply',
  },

  foldDialog: {
    title: 'Add Fold',
    type: 'Fold type',
    anticline: 'Anticline',
    syncline: 'Syncline',
    wavelength: 'Wavelength (px)',
    amplitude: 'Amplitude (px)',
    centerX: 'Center X (px)',
    apply: 'Apply',
  },

  timeline: {
    title: 'Operation History',
    initial: 'Initial state',
    step: 'Step',
  },

  crossSection: {
    title: 'Geological Cross-section',
    labelNormal: 'Normal Fault',
    labelReverse: 'Reverse Fault',
    labelStrikeSlip: 'Strike-slip Fault',
    labelAnticline: 'Anticline',
    labelSyncline: 'Syncline',
    labelUnconformity: 'Unconformity',
    empty: 'Add layers from the panel on the left',
  },

  learning: {
    title: 'Learning Panel',
    description: 'Description',
    quiz: 'Quiz',
    correct: 'Correct!',
    incorrect: 'Incorrect.',
    nextQuiz: 'Next question',
    showAnswer: 'Show answer',
    answer: 'Answer: ',
    noContent: 'Add layers to see explanations.',
    quizScore: 'Score: ',
  },

  quiz: {
    identifyStructure: 'What is the name of the geological structure shown?',
    identifyOrder: 'Choose the correct order in which the layers were formed.',
    identifyStress: 'Choose the stress direction that formed this geological structure.',
    options: {
      anticline: 'Anticline',
      syncline: 'Syncline',
      normalFault: 'Normal fault',
      reverseFault: 'Reverse fault',
      strikeSlip: 'Strike-slip fault',
      unconformity: 'Unconformity',
      compression: 'Horizontal compression',
      extension: 'Horizontal extension',
      shear: 'Shear',
    },
  },

  ui: {
    lightMode: 'Light',
    darkMode: 'Dark',
    langJa: '日本語',
    langEn: 'English',
  },
};
