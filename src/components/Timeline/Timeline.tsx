import { useGeoStore } from '../../store/useGeoStore';
import { useI18n } from '../../i18n/useI18n';

export function Timeline() {
  const { history, currentStep, jumpTo } = useGeoStore();
  const { t, lang } = useI18n();

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-2 px-1">
        {t.timeline.title}
      </h2>
      <div className="flex-1 overflow-y-auto space-y-1 pr-1">
        {/* 初期状態 */}
        <TimelineItem
          label={t.timeline.initial}
          stepNum={-1}
          isActive={currentStep === -1}
          onClick={() => jumpTo(-1)}
        />
        {/* 各操作 */}
        {history.map((entry, idx) => (
          <TimelineItem
            key={entry.id}
            label={`${t.timeline.step} ${idx + 1}: ${lang === 'ja' ? entry.labelJa : entry.labelEn}`}
            stepNum={idx}
            isActive={currentStep === idx}
            onClick={() => jumpTo(idx)}
          />
        ))}
      </div>
    </div>
  );
}

function TimelineItem({
  label,
  stepNum,
  isActive,
  onClick,
}: {
  label: string;
  stepNum: number;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        'w-full text-left px-3 py-2 rounded-lg text-xs transition-colors',
        isActive
          ? 'bg-blue-500 text-white font-semibold shadow-sm'
          : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300',
      ].join(' ')}
    >
      <span className={`inline-block w-5 text-center mr-1 rounded font-mono ${
        isActive ? 'text-blue-200' : 'text-gray-400 dark:text-gray-500'
      }`}>
        {stepNum === -1 ? '●' : stepNum + 1}
      </span>
      {label}
    </button>
  );
}
