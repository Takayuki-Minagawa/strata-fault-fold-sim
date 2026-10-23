import { useEffect } from 'react';
import { useI18n } from './i18n/useI18n';
import { useGeoStore } from './store/useGeoStore';
import { useUiStore } from './store/useUiStore';
import { useProgressStore } from './store/useProgressStore';
import { Header } from './components/Header/Header';
import { CrossSectionView } from './components/CrossSection/CrossSectionView';
import { SectionHeader } from './components/CrossSection/SectionHeader';
import { Legend } from './components/CrossSection/Legend';
import { Toolbar } from './components/Toolbar/Toolbar';
import { Timeline } from './components/Timeline/Timeline';
import { TimeScrubber } from './components/Timeline/TimeScrubber';
import { LearningPanel } from './components/LearningPanel/LearningPanel';
import { MissionToasts } from './components/Missions/MissionToasts';
// テーマストアを初期化するため import する
import './hooks/useTheme';

const card =
  'rounded-3xl bg-white p-3 shadow-sm shadow-stone-900/[0.03] ring-1 ring-stone-900/[0.06] sm:p-4 ' +
  'dark:bg-stone-900 dark:shadow-black/20 dark:ring-white/[0.06]';

export default function App() {
  const { t } = useI18n();
  const { history, currentStep, undo, redo } = useGeoStore();
  const openPanel = useUiStore(s => s.openPanel);
  const setOpenPanel = useUiStore(s => s.setOpenPanel);
  const evaluate = useProgressStore(s => s.evaluate);

  // 操作のたびにミッション達成を判定
  useEffect(() => {
    evaluate(history.slice(0, currentStep + 1).map(e => e.action));
  }, [history, currentStep, evaluate]);

  // キーボードショートカット
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest('textarea, select, [contenteditable="true"], input:not([type="range"])')) return;
      const mod = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();
      if (mod && key === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if (mod && key === 'y') {
        e.preventDefault();
        redo();
      } else if (e.key === 'Escape') {
        setOpenPanel(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo, redo, setOpenPanel]);

  return (
    <div className="flex min-h-svh flex-col bg-[#f7f4ee] text-stone-900 dark:bg-[#14130f] dark:text-stone-100">
      <Header />

      {/* スマホ: 1 カラム / タブレット〜小型 PC: 2 カラム / PC: 3 カラム */}
      <main className="flex flex-1 flex-col gap-3 p-3 sm:gap-4 sm:p-4
                       md:grid md:grid-cols-[17rem_minmax(0,1fr)] md:grid-rows-[auto_auto_1fr] md:items-start md:gap-4 lg:grid-cols-[18.5rem_minmax(0,1fr)] lg:gap-5 lg:p-5
                       xl:grid-cols-[19rem_minmax(0,1fr)_21rem] xl:grid-rows-[auto_1fr]
                       2xl:grid-cols-[20rem_minmax(0,1fr)_23rem]">

        {/* 断面ビュー（スマホでは操作パネルを開いている間、上部に固定してプレビューを見やすくする） */}
        <section id="cross-section" aria-label={t.crossSection.title}
          className={`order-1 scroll-mt-[4.2rem] md:col-start-2 md:row-start-1 ${
            openPanel ? 'max-md:sticky max-md:top-[3.6rem] max-md:z-30' : ''}`}>
          <div className={`${card} space-y-2 ${openPanel ? 'max-md:shadow-xl' : ''}`}>
            <SectionHeader />
            <CrossSectionView width={800} height={500} />
          </div>
        </section>

        {/* 凡例・タイムスライダー */}
        <div className="order-2 flex flex-col gap-2 empty:hidden md:col-start-2 md:row-start-2">
          <Legend />
          <TimeScrubber />
        </div>

        {/* 左: ツールバー + タイムライン */}
        <aside className="order-3 flex flex-col gap-3 md:sticky md:top-[4.75rem] md:col-start-1 md:row-span-3 md:row-start-1 xl:row-span-2
                          md:max-h-[calc(100svh-6rem)] md:overflow-y-auto md:pb-1">
          <div className={`${card} shrink-0`}>
            <Toolbar />
          </div>
          <div className={`${card} min-h-32 shrink-0`}>
            <Timeline />
          </div>
        </aside>

        {/* 右: 学習パネル */}
        <aside className="order-4 md:col-start-2 md:row-start-3
                          xl:sticky xl:top-[4.75rem] xl:col-start-3 xl:row-span-2 xl:row-start-1
                          xl:max-h-[calc(100svh-6rem)] xl:overflow-y-auto">
          <div className={`${card} min-h-64`}>
            <LearningPanel />
          </div>
        </aside>
      </main>

      <MissionToasts />
    </div>
  );
}
