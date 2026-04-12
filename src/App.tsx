import { useI18n } from './i18n/useI18n';
import { CrossSectionView } from './components/CrossSection/CrossSectionView';
import { Toolbar } from './components/Toolbar/Toolbar';
import { Timeline } from './components/Timeline/Timeline';
import { LearningPanel } from './components/LearningPanel/LearningPanel';
// テーマストアを初期化するため import する
import './hooks/useTheme';

export default function App() {
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100
                    flex flex-col">
      {/* ヘッダー */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700
                         shadow-sm px-4 py-3">
        <h1 className="text-lg font-bold text-gray-800 dark:text-gray-100 leading-tight">
          {t.appTitle}
        </h1>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t.appSubtitle}</p>
      </header>

      {/* メインコンテンツ */}
      <main className="flex-1 flex flex-col lg:flex-row gap-0 overflow-hidden">

        {/* 左サイドバー: ツールバー + タイムライン */}
        <aside className="w-full lg:w-72 xl:w-80 flex flex-col
                          bg-white dark:bg-gray-800
                          border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-gray-700
                          overflow-y-auto">
          {/* ツールバー */}
          <div className="p-4 border-b border-gray-100 dark:border-gray-700">
            <Toolbar />
          </div>
          {/* タイムライン */}
          <div className="flex-1 p-4 min-h-32">
            <Timeline />
          </div>
        </aside>

        {/* 中央: 断面ビュー */}
        <section className="flex-1 flex flex-col p-4 min-w-0 overflow-hidden">
          <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
            {t.crossSection.title}
          </h2>
          <div className="flex-1 min-h-0">
            <CrossSectionView width={800} height={500} />
          </div>
        </section>

        {/* 右サイドバー: 学習パネル */}
        <aside className="w-full lg:w-72 xl:w-80 flex flex-col
                          bg-white dark:bg-gray-800
                          border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-gray-700
                          overflow-y-auto">
          <div className="flex-1 p-4">
            <LearningPanel />
          </div>
        </aside>

      </main>
    </div>
  );
}
