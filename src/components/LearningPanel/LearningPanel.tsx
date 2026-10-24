import { useState, useMemo } from 'react';
import type { ComponentType, ReactNode, SVGProps } from 'react';
import { useGeoStore } from '../../store/useGeoStore';
import { useProgressStore } from '../../store/useProgressStore';
import { useI18n } from '../../i18n/useI18n';
import type { HistoryEntry } from '../../types/geology';
import {
  AddLayerToolIcon, ArrowRightIcon, BookIcon, CheckIcon, CloseIcon, ErodeToolIcon, FaultToolIcon,
  FoldToolIcon, InfoIcon, LockIcon, QuizIcon, SparkleIcon, StressToolIcon,
} from '../icons';

type Tab = 'description' | 'quiz';

// ─── 解説文自動生成 ───────────────────────────────────────────────

type DescriptionKind = 'intro' | 'layers' | 'erosion' | 'stress' | 'fold' | 'fault';

interface DescriptionLine {
  kind: DescriptionKind;
  text: string;
}

function generateDescription(
  history: HistoryEntry[],
  currentStep: number,
  lang: 'ja' | 'en',
): DescriptionLine[] {
  const lines: DescriptionLine[] = [];
  let kind: DescriptionKind = 'intro';
  const push = (text: string) => lines.push({ kind, text });
  const active = history.slice(0, currentStep + 1);

  if (active.length === 0) {
    return (lang === 'ja'
      ? ['地層を追加すると、地質断面の解説が表示されます。', '左のツールバーから「地層を追加」を押してみましょう。']
      : ['Add layers to see geological cross-section explanations.', 'Click "Add Layer" in the toolbar on the left.']
    ).map(text => ({ kind: 'intro', text }));
  }

  const layers   = active.filter((e: HistoryEntry) => e.action.type === 'ADD_LAYER');
  const faults   = active.filter((e: HistoryEntry) => e.action.type === 'APPLY_FAULT');
  const folds    = active.filter((e: HistoryEntry) => e.action.type === 'APPLY_FOLD');
  const erodes   = active.filter((e: HistoryEntry) => e.action.type === 'ERODE');
  const stresses = active.filter((e: HistoryEntry) => e.action.type === 'APPLY_STRESS');

  if (lang === 'ja') {
    if (layers.length > 0) {
      kind = 'layers';
      push(`現在 ${layers.length} 層の地層が形成されています。`);
      push('地層は下から順に堆積しており、上の地層ほど新しい（地層累重の法則）。');
    }
    if (erodes.length > 0) {
      kind = 'erosion';
      push(`${erodes.length} 回の削剥（侵食）が行われ、不整合面が形成されました。`);
      push('不整合面（波線）は地層の形成に時間的なギャップがあることを示します。');
    }
    if (stresses.length > 0) {
      kind = 'stress';
      push(`${stresses.length} 回の応力操作が加えられました。`);
    }
    if (folds.length > 0) {
      kind = 'fold';
      push(`${folds.length} 箇所の褶曲構造が確認できます。`);
      push('山型の盛り上がりを背斜、谷型のくぼみを向斜と呼びます。');
    }
    if (faults.length > 0) {
      kind = 'fault';
      push(`${faults.length} 本の断層が形成されています。`);
      const types = faults.map((e: HistoryEntry) => (e.action as { type: 'APPLY_FAULT'; fault: { type: string } }).fault.type);
      if (types.includes('normal'))
        push('正断層は水平伸張（引っ張り）によって形成され、上盤が下方向にずれます。');
      if (types.includes('reverse'))
        push('逆断層は水平圧縮によって形成され、上盤が上方向にずれます。');
      if (types.includes('strike-slip'))
        push('横ずれ断層はせん断応力によって形成され、水平方向にずれます。');
    }
  } else {
    if (layers.length > 0) {
      kind = 'layers';
      push(`${layers.length} layer(s) have been deposited.`);
      push('Layers are stacked in order — the upper layers are younger (law of superposition).');
    }
    if (erodes.length > 0) {
      kind = 'erosion';
      push(`${erodes.length} erosion event(s) created unconformity surface(s).`);
      push('An unconformity (wavy line) indicates a time gap in the geological record.');
    }
    if (stresses.length > 0) {
      kind = 'stress';
      push(`${stresses.length} stress event(s) have been applied.`);
    }
    if (folds.length > 0) {
      kind = 'fold';
      push(`${folds.length} fold structure(s) are visible.`);
      push('An upward arch is called an anticline; a downward trough is a syncline.');
    }
    if (faults.length > 0) {
      kind = 'fault';
      push(`${faults.length} fault(s) have formed.`);
      const types = faults.map((e: HistoryEntry) => (e.action as { type: 'APPLY_FAULT'; fault: { type: string } }).fault.type);
      if (types.includes('normal'))
        push('Normal faults form under tension — the hanging wall drops down.');
      if (types.includes('reverse'))
        push('Reverse faults form under compression — the hanging wall moves up.');
      if (types.includes('strike-slip'))
        push('Strike-slip faults form under shear stress — blocks move horizontally.');
    }
  }

  return lines;
}

// ─── クイズ生成 ───────────────────────────────────────────────────

interface QuizQuestion {
  /** 言語によらない問題の識別子（ミッションの正解数を重複なく数えるため） */
  id: string;
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
        id: 'fold-name',
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
          id: 'fault-normal',
          question: '上盤が下方にずれる断層の種類は？',
          options: ['正断層', '逆断層', '横ずれ断層', '背斜'],
          answerIndex: 0,
          explanation: '正断層は水平伸張（引っ張り力）によって形成され、上盤（断層面の上側ブロック）が下方向にずれます。',
        });
      } else if (fType === 'reverse') {
        questions.push({
          id: 'fault-reverse',
          question: '水平圧縮によって形成される断層の種類は？',
          options: ['正断層', '逆断層', '横ずれ断層', '向斜'],
          answerIndex: 1,
          explanation: '逆断層は水平圧縮によって形成され、上盤が上方向にずれます。',
        });
      } else {
        questions.push({
          id: 'fault-strike-slip',
          question: 'せん断応力によって形成される断層は？',
          options: ['正断層', '逆断層', '横ずれ断層', '背斜'],
          answerIndex: 2,
          explanation: '横ずれ断層はせん断力によって形成され、断層の両側が水平方向にずれます。',
        });
      }
    }
    if (hasErode) {
      questions.push({
        id: 'unconformity',
        question: '地層の形成に時間的なギャップがあることを示す境界面は？',
        options: ['整合面', '不整合面', '断層面', '褶曲軸面'],
        answerIndex: 1,
        explanation: '不整合面は侵食（削剥）後に新たな地層が堆積したことを示し、波線で表します。',
      });
    }
    if (hasStress) {
      questions.push({
        id: 'stress-fold',
        question: '褶曲を形成する主な応力の方向は？',
        options: ['水平圧縮', '水平伸張', 'せん断', '垂直荷重'],
        answerIndex: 0,
        explanation: '水平方向の圧縮力が加わると、地層が波打つように変形し、背斜・向斜が形成されます。',
      });
    }
  } else {
    if (hasFold) {
      questions.push({
        id: 'fold-name',
        question: 'What is the name of an arch-shaped fold structure?',
        options: ['Anticline', 'Syncline', 'Normal fault', 'Reverse fault'],
        answerIndex: 0,
        explanation: 'An arch-shaped upfold is called an anticline. A downfold (trough shape) is called a syncline.',
      });
    }
    if (hasFault) {
      questions.push({
        id: 'fault-normal',
        question: 'Which fault type is formed by horizontal tension?',
        options: ['Normal fault', 'Reverse fault', 'Strike-slip fault', 'Anticline'],
        answerIndex: 0,
        explanation: 'Normal faults form under tension. The hanging wall (upper block) moves downward.',
      });
    }
    if (hasErode) {
      questions.push({
        id: 'unconformity',
        question: 'What surface indicates a time gap in the geological record?',
        options: ['Conformity', 'Unconformity', 'Fault plane', 'Axial plane'],
        answerIndex: 1,
        explanation: 'An unconformity represents a gap in geological time caused by erosion before new deposition.',
      });
    }
    if (hasStress) {
      questions.push({
        id: 'stress-fold',
        question: 'What stress direction mainly causes folding?',
        options: ['Horizontal compression', 'Horizontal extension', 'Shear', 'Vertical load'],
        answerIndex: 0,
        explanation: 'Horizontal compression causes layers to buckle and fold, forming anticlines and synclines.',
      });
    }
  }

  return questions;
}

// ─── 表示用の補助 ─────────────────────────────────────────────────

const KIND_STYLE: Record<DescriptionKind, { icon: ComponentType<SVGProps<SVGSVGElement>>; tile: string }> = {
  intro:   { icon: SparkleIcon,      tile: 'bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300' },
  layers:  { icon: AddLayerToolIcon, tile: 'bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300' },
  erosion: { icon: ErodeToolIcon,    tile: 'bg-sky-100 text-sky-700 dark:bg-sky-400/15 dark:text-sky-300' },
  stress:  { icon: StressToolIcon,   tile: 'bg-violet-100 text-violet-700 dark:bg-violet-400/15 dark:text-violet-300' },
  fold:    { icon: FoldToolIcon,     tile: 'bg-teal-100 text-teal-700 dark:bg-teal-400/15 dark:text-teal-300' },
  fault:   { icon: FaultToolIcon,    tile: 'bg-rose-100 text-rose-700 dark:bg-rose-400/15 dark:text-rose-300' },
};

/** 文中の重要語句を強調する */
function highlightTerms(text: string, terms: string[]): ReactNode {
  if (terms.length === 0) return text;
  const escaped = [...terms].sort((a, b) => b.length - a.length)
    .map(term => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const parts = text.split(new RegExp(`(${escaped.join('|')})`, 'g'));
  return parts.map((part, i) =>
    i % 2 === 1
      ? <strong key={i} className="font-semibold text-stone-900 underline decoration-amber-400/70 decoration-2 underline-offset-2 dark:text-stone-50">{part}</strong>
      : part,
  );
}

// ─── コンポーネント ───────────────────────────────────────────────

export function LearningPanel() {
  const { history, currentStep } = useGeoStore();
  const { t, lang } = useI18n();
  const recordCorrect = useProgressStore(s => s.recordCorrect);
  const [tab, setTab] = useState<Tab>('description');
  const [quizIndex, setQuizIndex] = useState(0);
  // 回答は問題ごとに記録し、問題が入れ替わったら未回答に戻す
  const [answer, setAnswer] = useState<{ key: string; index: number } | null>(null);
  const [score, setScore] = useState(0);

  const description = useMemo(
    () => generateDescription(history, currentStep, lang),
    [history, currentStep, lang],
  );

  // 同じ話題の文を 1 枚のカードにまとめる
  const groups = useMemo(() => {
    const result: { kind: DescriptionKind; lines: string[] }[] = [];
    for (const line of description) {
      const last = result[result.length - 1];
      if (last && last.kind === line.kind) last.lines.push(line.text);
      else result.push({ kind: line.kind, lines: [line.text] });
    }
    return result;
  }, [description]);

  const quizzes = useMemo(
    () => generateQuiz(history, currentStep, lang),
    [history, currentStep, lang],
  );

  // 元に戻す等で問題数が減っても範囲外にならないようにする
  const currentIndex = quizzes.length > 0 ? quizIndex % quizzes.length : 0;
  const quiz = quizzes[currentIndex] ?? null;
  const quizKey = quiz ? `${currentIndex}:${quiz.id}` : '';
  const selected = answer && answer.key === quizKey ? answer.index : null;

  const handleAnswer = (idx: number) => {
    if (selected !== null || !quiz) return;
    setAnswer({ key: quizKey, index: idx });
    if (quiz && idx === quiz.answerIndex) {
      setScore(s => s + 1);
      recordCorrect(quiz.id);
    }
  };

  const nextQuiz = () => {
    setAnswer(null);
    setQuizIndex(i => (i + 1) % (quizzes.length || 1));
  };

  const tabClass = (active: boolean) =>
    `flex flex-1 items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all
     focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-teal-600 ${
      active
        ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-sm'
        : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
    }`;

  const isCorrect = quiz !== null && selected === quiz.answerIndex;

  return (
    <div className="flex h-full flex-col">
      <h2 className="mb-2 px-1 text-xs font-bold uppercase tracking-[0.14em] text-stone-500 dark:text-stone-400">
        {t.learning.title}
      </h2>

      {/* タブ */}
      <div className="mb-3 flex rounded-xl bg-stone-100 p-1 dark:bg-stone-800" role="tablist">
        <button role="tab" id="learning-tab-description" aria-controls="learning-panel-description"
          aria-selected={tab === 'description'} className={tabClass(tab === 'description')}
          onClick={() => setTab('description')}>
          <BookIcon className="text-sm" /> {t.learning.description}
        </button>
        <button role="tab" id="learning-tab-quiz" aria-controls="learning-panel-quiz"
          aria-selected={tab === 'quiz'} className={tabClass(tab === 'quiz')}
          onClick={() => setTab('quiz')}>
          <QuizIcon className="text-sm" /> {t.learning.quiz}
          {quizzes.length > 0 && (
            <span key={quizzes.length}
              className="animate-badge-glow grid h-4 min-w-4 place-items-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white">
              {quizzes.length}
            </span>
          )}
        </button>
      </div>

      {/* 解説タブ */}
      {tab === 'description' && (
        <div className="flex-1 space-y-2 overflow-y-auto" role="tabpanel"
          id="learning-panel-description" aria-labelledby="learning-tab-description">
          {groups.map((group, gi) => {
            const style = KIND_STYLE[group.kind];
            const Icon = style.icon;
            return (
              <article key={`${group.kind}-${gi}`}
                className="animate-pop-in flex gap-3 rounded-2xl bg-white p-3 ring-1 ring-stone-900/5 dark:bg-stone-800/70 dark:ring-white/5"
                style={{ animationDelay: `${gi * 50}ms` }}>
                <span className={`grid size-9 shrink-0 place-items-center rounded-xl text-[26px] ${style.tile}`}>
                  <Icon />
                </span>
                <div className="min-w-0 space-y-1">
                  {group.lines.map((line, i) => (
                    <p key={i} className={i === 0
                      ? 'text-[13px] font-semibold leading-snug text-stone-800 dark:text-stone-100'
                      : 'text-xs leading-relaxed text-stone-600 dark:text-stone-300'}>
                      {highlightTerms(line, t.learning.keyTerms)}
                    </p>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* クイズタブ */}
      {tab === 'quiz' && (
        <div className="flex-1 overflow-y-auto" role="tabpanel"
          id="learning-panel-quiz" aria-labelledby="learning-tab-quiz">
          {quizzes.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
              <span className="grid size-12 place-items-center rounded-2xl bg-stone-100 text-2xl text-stone-400 dark:bg-stone-800 dark:text-stone-500">
                <LockIcon />
              </span>
              <p className="text-xs leading-relaxed text-stone-500 dark:text-stone-400">
                {history.length === 0 ? t.learning.noContent : t.learning.quizEmpty}
              </p>
            </div>
          ) : quiz ? (
            <div key={`${currentIndex}-${quiz.question}`} className="animate-pop-in">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-stone-500 dark:text-stone-400">
                    {t.learning.quizLabel} {currentIndex + 1} / {quizzes.length}
                  </span>
                  <span className="flex gap-1" aria-hidden="true">
                    {quizzes.map((_, i) => (
                      <span key={i} className={`h-1.5 rounded-full transition-all ${i === currentIndex ? 'w-4 bg-amber-500' : 'w-1.5 bg-stone-300 dark:bg-stone-600'}`} />
                    ))}
                  </span>
                </div>
                <span className="flex items-center gap-1 rounded-full bg-teal-50 px-2 py-0.5 text-[11px] font-semibold text-teal-700 dark:bg-teal-400/10 dark:text-teal-300">
                  <CheckIcon className="text-xs" /> {t.learning.quizScore}{score}
                </span>
              </div>
              <p className="mb-3 text-sm font-bold leading-relaxed text-stone-800 dark:text-stone-100">
                {quiz.question}
              </p>
              <div className="space-y-2">
                {quiz.options.map((opt, i) => {
                  const answered = selected !== null;
                  const isAnswer = i === quiz.answerIndex;
                  const isPicked = i === selected;
                  let cls = 'flex w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left text-xs transition-all focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-teal-600 ';
                  if (!answered) {
                    cls += 'border-stone-200 bg-white text-stone-700 hover:-translate-y-px hover:border-teal-400 hover:shadow-sm dark:border-stone-700 dark:bg-stone-800 dark:text-stone-200 dark:hover:border-teal-500';
                  } else if (isAnswer) {
                    cls += `border-emerald-500 bg-emerald-50 font-semibold text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-300 ${isPicked ? 'animate-correct' : ''}`;
                  } else if (isPicked) {
                    cls += 'animate-shake border-rose-400 bg-rose-50 text-rose-700 dark:bg-rose-400/10 dark:text-rose-300';
                  } else {
                    cls += 'border-stone-200 bg-white text-stone-400 opacity-60 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-500';
                  }
                  return (
                    <button key={i} type="button" className={cls} onClick={() => handleAnswer(i)}
                      aria-disabled={answered}>
                      <span className={`grid size-6 shrink-0 place-items-center rounded-lg text-[11px] font-bold ${
                        answered && isAnswer ? 'bg-emerald-500 text-white'
                        : answered && isPicked ? 'bg-rose-500 text-white'
                        : 'bg-stone-100 text-stone-500 dark:bg-stone-700 dark:text-stone-300'}`}>
                        {answered && isAnswer ? <CheckIcon /> : answered && isPicked ? <CloseIcon /> : String.fromCharCode(65 + i)}
                      </span>
                      {opt}
                    </button>
                  );
                })}
              </div>
              {selected !== null && (
                <div className="animate-pop-in mt-3 space-y-2" aria-live="polite">
                  <p className={`flex items-center gap-1.5 text-sm font-bold ${
                    isCorrect ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'
                  }`}>
                    {isCorrect ? <SparkleIcon /> : <InfoIcon />}
                    {isCorrect ? t.learning.correct : t.learning.incorrect}
                  </p>
                  <p className="flex gap-2 rounded-xl bg-amber-50 px-3 py-2.5 text-xs leading-relaxed text-stone-700 dark:bg-amber-400/10 dark:text-stone-200">
                    <BookIcon className="mt-0.5 shrink-0 text-sm text-amber-600 dark:text-amber-400" />
                    <span>{highlightTerms(quiz.explanation, t.learning.keyTerms)}</span>
                  </p>
                  <button
                    type="button"
                    onClick={nextQuiz}
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-stone-900 py-2.5 text-xs font-semibold text-white transition-all hover:bg-stone-800 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 dark:bg-amber-400 dark:text-stone-900 dark:hover:bg-amber-300">
                    {t.learning.nextQuiz} <ArrowRightIcon />
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
