import { useState, useMemo } from 'react';
import { useGeoStore } from '../../store/useGeoStore';
import { useI18n } from '../../i18n/useI18n';
import type { HistoryEntry } from '../../types/geology';

type Tab = 'description' | 'quiz';

// ─── 解説文自動生成 ───────────────────────────────────────────────

function generateDescription(
  history: HistoryEntry[],
  currentStep: number,
  lang: 'ja' | 'en',
): string[] {
  const lines: string[] = [];
  const active = history.slice(0, currentStep + 1);

  if (active.length === 0) {
    return lang === 'ja'
      ? ['地層を追加すると、地質断面の解説が表示されます。', '左のツールバーから「地層を追加」を押してみましょう。']
      : ['Add layers to see geological cross-section explanations.', 'Click "Add Layer" in the toolbar on the left.'];
  }

  const layers   = active.filter((e: HistoryEntry) => e.action.type === 'ADD_LAYER');
  const faults   = active.filter((e: HistoryEntry) => e.action.type === 'APPLY_FAULT');
  const folds    = active.filter((e: HistoryEntry) => e.action.type === 'APPLY_FOLD');
  const erodes   = active.filter((e: HistoryEntry) => e.action.type === 'ERODE');
  const stresses = active.filter((e: HistoryEntry) => e.action.type === 'APPLY_STRESS');

  if (lang === 'ja') {
    if (layers.length > 0) {
      lines.push(`現在 ${layers.length} 層の地層が形成されています。`);
      lines.push('地層は下から順に堆積しており、上の地層ほど新しい（地層累重の法則）。');
    }
    if (erodes.length > 0) {
      lines.push(`${erodes.length} 回の削剥（侵食）が行われ、不整合面が形成されました。`);
      lines.push('不整合面（波線）は地層の形成に時間的なギャップがあることを示します。');
    }
    if (stresses.length > 0) {
      lines.push(`${stresses.length} 回の応力操作が加えられました。`);
    }
    if (folds.length > 0) {
      lines.push(`${folds.length} 箇所の褶曲構造が確認できます。`);
      lines.push('山型の盛り上がりを背斜、谷型のくぼみを向斜と呼びます。');
    }
    if (faults.length > 0) {
      lines.push(`${faults.length} 本の断層が形成されています。`);
      const types = faults.map((e: HistoryEntry) => (e.action as { type: 'APPLY_FAULT'; fault: { type: string } }).fault.type);
      if (types.includes('normal'))
        lines.push('正断層は水平伸張（引っ張り）によって形成され、上盤が下方向にずれます。');
      if (types.includes('reverse'))
        lines.push('逆断層は水平圧縮によって形成され、上盤が上方向にずれます。');
      if (types.includes('strike-slip'))
        lines.push('横ずれ断層はせん断応力によって形成され、水平方向にずれます。');
    }
  } else {
    if (layers.length > 0) {
      lines.push(`${layers.length} layer(s) have been deposited.`);
      lines.push('Layers are stacked in order — the upper layers are younger (law of superposition).');
    }
    if (erodes.length > 0) {
      lines.push(`${erodes.length} erosion event(s) created unconformity surface(s).`);
      lines.push('An unconformity (wavy line) indicates a time gap in the geological record.');
    }
    if (stresses.length > 0) {
      lines.push(`${stresses.length} stress event(s) have been applied.`);
    }
    if (folds.length > 0) {
      lines.push(`${folds.length} fold structure(s) are visible.`);
      lines.push('An upward arch is called an anticline; a downward trough is a syncline.');
    }
    if (faults.length > 0) {
      lines.push(`${faults.length} fault(s) have formed.`);
      const types = faults.map((e: HistoryEntry) => (e.action as { type: 'APPLY_FAULT'; fault: { type: string } }).fault.type);
      if (types.includes('normal'))
        lines.push('Normal faults form under tension — the hanging wall drops down.');
      if (types.includes('reverse'))
        lines.push('Reverse faults form under compression — the hanging wall moves up.');
      if (types.includes('strike-slip'))
        lines.push('Strike-slip faults form under shear stress — blocks move horizontally.');
    }
  }

  return lines;
}

// ─── クイズ生成 ───────────────────────────────────────────────────

interface QuizQuestion {
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
}

function generateQuiz(
  history: HistoryEntry[],
  currentStep: number,
  lang: 'ja' | 'en',
): QuizQuestion[] {
  const active = history.slice(0, currentStep + 1);
  const questions: QuizQuestion[] = [];

  const hasFold  = active.some((e: HistoryEntry) => e.action.type === 'APPLY_FOLD');
  const hasFault = active.some((e: HistoryEntry) => e.action.type === 'APPLY_FAULT');
  const hasErode = active.some((e: HistoryEntry) => e.action.type === 'ERODE');
  const hasStress = active.some((e: HistoryEntry) => e.action.type === 'APPLY_STRESS');

  if (lang === 'ja') {
    if (hasFold) {
      questions.push({
        question: '山型に盛り上がった褶曲構造の名称は？',
        options: ['背斜', '向斜', '正断層', '逆断層'],
        answerIndex: 0,
        explanation: '山型（アーチ型）の褶曲を背斜（anticline）と呼びます。谷型は向斜（syncline）です。',
      });
    }
    if (hasFault) {
      const faultAction = active.find((e: HistoryEntry) => e.action.type === 'APPLY_FAULT');
      const fType = faultAction
        ? (faultAction.action as { fault: { type: string } }).fault.type
        : 'normal';
      if (fType === 'normal') {
        questions.push({
          question: '上盤が下方にずれる断層の種類は？',
          options: ['正断層', '逆断層', '横ずれ断層', '背斜'],
          answerIndex: 0,
          explanation: '正断層は水平伸張（引っ張り力）によって形成され、上盤（断層面の上側ブロック）が下方向にずれます。',
        });
      } else if (fType === 'reverse') {
        questions.push({
          question: '水平圧縮によって形成される断層の種類は？',
          options: ['正断層', '逆断層', '横ずれ断層', '向斜'],
          answerIndex: 1,
          explanation: '逆断層は水平圧縮によって形成され、上盤が上方向にずれます。',
        });
      } else {
        questions.push({
          question: 'せん断応力によって形成される断層は？',
          options: ['正断層', '逆断層', '横ずれ断層', '背斜'],
          answerIndex: 2,
          explanation: '横ずれ断層はせん断力によって形成され、断層の両側が水平方向にずれます。',
        });
      }
    }
    if (hasErode) {
      questions.push({
        question: '地層の形成に時間的なギャップがあることを示す境界面は？',
        options: ['整合面', '不整合面', '断層面', '褶曲軸面'],
        answerIndex: 1,
        explanation: '不整合面は侵食（削剥）後に新たな地層が堆積したことを示し、波線で表します。',
      });
    }
    if (hasStress) {
      questions.push({
        question: '褶曲を形成する主な応力の方向は？',
        options: ['水平圧縮', '水平伸張', 'せん断', '垂直荷重'],
        answerIndex: 0,
        explanation: '水平方向の圧縮力が加わると、地層が波打つように変形し、背斜・向斜が形成されます。',
      });
    }
  } else {
    if (hasFold) {
      questions.push({
        question: 'What is the name of an arch-shaped fold structure?',
        options: ['Anticline', 'Syncline', 'Normal fault', 'Reverse fault'],
        answerIndex: 0,
        explanation: 'An arch-shaped upfold is called an anticline. A downfold (trough shape) is called a syncline.',
      });
    }
    if (hasFault) {
      questions.push({
        question: 'Which fault type is formed by horizontal tension?',
        options: ['Normal fault', 'Reverse fault', 'Strike-slip fault', 'Anticline'],
        answerIndex: 0,
        explanation: 'Normal faults form under tension. The hanging wall (upper block) moves downward.',
      });
    }
    if (hasErode) {
      questions.push({
        question: 'What surface indicates a time gap in the geological record?',
        options: ['Conformity', 'Unconformity', 'Fault plane', 'Axial plane'],
        answerIndex: 1,
        explanation: 'An unconformity represents a gap in geological time caused by erosion before new deposition.',
      });
    }
    if (hasStress) {
      questions.push({
        question: 'What stress direction mainly causes folding?',
        options: ['Horizontal compression', 'Horizontal extension', 'Shear', 'Vertical load'],
        answerIndex: 0,
        explanation: 'Horizontal compression causes layers to buckle and fold, forming anticlines and synclines.',
      });
    }
  }

  return questions;
}

// ─── コンポーネント ───────────────────────────────────────────────

export function LearningPanel() {
  const { history, currentStep } = useGeoStore();
  const { t, lang } = useI18n();
  const [tab, setTab] = useState<Tab>('description');
  const [quizIndex, setQuizIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);

  const description = useMemo(
    () => generateDescription(history, currentStep, lang),
    [history, currentStep, lang],
  );

  const quizzes = useMemo(
    () => generateQuiz(history, currentStep, lang),
    [history, currentStep, lang],
  );

  const quiz = quizzes[quizIndex] ?? null;

  const handleAnswer = (idx: number) => {
    if (selected !== null) return;
    setSelected(idx);
    if (quiz && idx === quiz.answerIndex) setScore(s => s + 1);
  };

  const nextQuiz = () => {
    setSelected(null);
    setQuizIndex(i => (i + 1) % (quizzes.length || 1));
  };

  const tabClass = (active: boolean) =>
    `flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
      active
        ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
    }`;

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-2 px-1">
        {t.learning.title}
      </h2>

      {/* タブ */}
      <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5 mb-3">
        <button className={tabClass(tab === 'description')} onClick={() => setTab('description')}>
          {t.learning.description}
        </button>
        <button className={tabClass(tab === 'quiz')} onClick={() => setTab('quiz')}>
          {t.learning.quiz}
          {quizzes.length > 0 && (
            <span className="ml-1 text-[10px] bg-blue-500 text-white rounded-full px-1.5">
              {quizzes.length}
            </span>
          )}
        </button>
      </div>

      {/* 解説タブ */}
      {tab === 'description' && (
        <div className="flex-1 overflow-y-auto space-y-2">
          {description.map((line, i) => (
            <p key={i} className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed
                                  bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-2">
              {line}
            </p>
          ))}
        </div>
      )}

      {/* クイズタブ */}
      {tab === 'quiz' && (
        <div className="flex-1 overflow-y-auto">
          {quizzes.length === 0 ? (
            <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-8">
              {t.learning.noContent}
            </p>
          ) : quiz ? (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-gray-400">
                  {quizIndex + 1} / {quizzes.length}
                </span>
                <span className="text-[10px] text-blue-500">
                  {t.learning.quizScore}{score}
                </span>
              </div>
              <p className="text-xs font-medium text-gray-700 dark:text-gray-200 mb-3 leading-relaxed">
                {quiz.question}
              </p>
              <div className="space-y-2">
                {quiz.options.map((opt, i) => {
                  let cls = 'w-full text-left px-3 py-2 rounded-lg text-xs border transition-colors ';
                  if (selected === null) {
                    cls += 'border-gray-200 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300';
                  } else if (i === quiz.answerIndex) {
                    cls += 'border-green-500 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-semibold';
                  } else if (i === selected) {
                    cls += 'border-red-400 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400';
                  } else {
                    cls += 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-400 dark:text-gray-500 opacity-60';
                  }
                  return (
                    <button key={i} className={cls} onClick={() => handleAnswer(i)}>
                      {opt}
                    </button>
                  );
                })}
              </div>
              {selected !== null && (
                <div className="mt-3 space-y-2">
                  <p className={`text-xs font-semibold ${
                    selected === quiz.answerIndex
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-500 dark:text-red-400'
                  }`}>
                    {selected === quiz.answerIndex ? t.learning.correct : t.learning.incorrect}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-2 leading-relaxed">
                    {quiz.explanation}
                  </p>
                  <button
                    onClick={nextQuiz}
                    className="w-full py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium transition-colors">
                    {t.learning.nextQuiz} →
                  </button>
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
