import { useState } from 'react';
import { useGeoStore } from '../../store/useGeoStore';
import { useI18n } from '../../i18n/useI18n';
import { useTheme } from '../../hooks/useTheme';
import { ROCK_IDS, ROCKS } from '../../data/rocks';
import type { RockId } from '../../data/rocks';
import type { FaultType, FoldType } from '../../types/geology';

type Panel = 'addLayer' | 'stress' | 'fault' | 'fold' | null;

export function Toolbar() {
  const { t, lang, setLang } = useI18n();
  const { theme, toggle: toggleTheme } = useTheme();
  const { dispatch, undo, redo, reset, history, currentStep, geoState } = useGeoStore();

  const [openPanel, setOpenPanel] = useState<Panel>(null);

  // --- 地層追加フォーム ---
  const [layerRock, setLayerRock] = useState<RockId>('sandstone');
  const [layerThick, setLayerThick] = useState(60);

  // --- 応力フォーム ---
  const [compression, setCompression] = useState(40);
  const [extension, setExtension] = useState(40);
  const [shear, setShear] = useState(40);
  const [stressMode, setStressMode] = useState<'compression' | 'extension' | 'shear'>('compression');

  // --- 断層フォーム ---
  const [faultType, setFaultType] = useState<FaultType>('normal');
  const [faultDisp, setFaultDisp] = useState(40);
  const [faultX, setFaultX] = useState(400);

  // --- 褶曲フォーム ---
  const [foldType, setFoldType] = useState<FoldType>('anticline');
  const [wavelength, setWavelength] = useState(300);
  const [amplitude, setAmplitude] = useState(40);
  const [foldCenterX, setFoldCenterX] = useState(400);

  const togglePanel = (p: Panel) => setOpenPanel(prev => prev === p ? null : p);

  const btnBase = 'px-3 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1';
  const btnPrimary = `${btnBase} bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500`;
  const btnSecondary = `${btnBase} bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 focus:ring-gray-400`;
  const btnDanger = `${btnBase} bg-red-500 hover:bg-red-600 text-white focus:ring-red-400`;
  const btnActive = `${btnBase} bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 ring-2 ring-blue-400`;

  const canUndo = currentStep >= 0;
  const canRedo = currentStep < history.length - 1;

  return (
    <div className="flex flex-col gap-2">
      {/* メインボタン群 */}
      <div className="flex flex-wrap gap-2">
        <button className={openPanel === 'addLayer' ? btnActive : btnPrimary}
          onClick={() => togglePanel('addLayer')}>
          + {t.toolbar.addLayer}
        </button>
        <button className={openPanel === 'stress' ? btnActive : btnSecondary}
          disabled={geoState.layers.length === 0}
          onClick={() => togglePanel('stress')}>
          {t.toolbar.stress}
        </button>
        <button className={openPanel === 'fault' ? btnActive : btnSecondary}
          disabled={geoState.layers.length === 0}
          onClick={() => togglePanel('fault')}>
          {t.toolbar.fault}
        </button>
        <button className={openPanel === 'fold' ? btnActive : btnSecondary}
          disabled={geoState.layers.length === 0}
          onClick={() => togglePanel('fold')}>
          {t.toolbar.fold}
        </button>
        <button className={btnSecondary}
          disabled={geoState.layers.length === 0}
          onClick={() => { dispatch({ type: 'ERODE' }); setOpenPanel(null); }}>
          {t.toolbar.erode}
        </button>
      </div>

      {/* アンドゥ/リドゥ/リセット */}
      <div className="flex gap-2">
        <button className={btnSecondary} disabled={!canUndo} onClick={undo}>← {t.toolbar.undo}</button>
        <button className={btnSecondary} disabled={!canRedo} onClick={redo}>{t.toolbar.redo} →</button>
        <button className={btnDanger} onClick={() => { reset(); setOpenPanel(null); }}>
          {t.toolbar.reset}
        </button>

        {/* テーマ切替 */}
        <button className={btnSecondary} onClick={toggleTheme}>
          {theme === 'light' ? '🌙' : '☀️'} {theme === 'light' ? t.ui.darkMode : t.ui.lightMode}
        </button>
        {/* 言語切替 */}
        <button className={btnSecondary} onClick={() => setLang(lang === 'ja' ? 'en' : 'ja')}>
          {lang === 'ja' ? t.ui.langEn : t.ui.langJa}
        </button>
      </div>

      {/* 地層追加パネル */}
      {openPanel === 'addLayer' && (
        <Panel title={t.addLayerDialog.title} onClose={() => setOpenPanel(null)}>
          <label className="block text-sm mb-1">{t.addLayerDialog.rockType}</label>
          <select className="w-full border rounded px-2 py-1 text-sm dark:bg-gray-700 dark:border-gray-600 mb-3"
            value={layerRock} onChange={e => setLayerRock(e.target.value as RockId)}>
            {ROCK_IDS.map(id => (
              <option key={id} value={id}>
                {lang === 'ja' ? ROCKS[id].nameJa : ROCKS[id].nameEn}
              </option>
            ))}
          </select>
          <label className="block text-sm mb-1">{t.addLayerDialog.thickness}: {layerThick}px</label>
          <input type="range" min={20} max={150} value={layerThick}
            onChange={e => setLayerThick(Number(e.target.value))}
            className="w-full mb-3" />
          <div className="flex gap-2 justify-end">
            <button className={btnSecondary} onClick={() => setOpenPanel(null)}>
              {t.addLayerDialog.cancel}
            </button>
            <button className={btnPrimary} onClick={() => {
              dispatch({ type: 'ADD_LAYER', rockId: layerRock, thickness: layerThick });
              setOpenPanel(null);
            }}>
              {t.addLayerDialog.confirm}
            </button>
          </div>
        </Panel>
      )}

      {/* 応力パネル */}
      {openPanel === 'stress' && (
        <Panel title={t.stressDialog.title} onClose={() => setOpenPanel(null)}>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{t.stressDialog.hint}</p>
          <div className="flex gap-2 mb-3">
            {(['compression', 'extension', 'shear'] as const).map(m => (
              <button key={m} onClick={() => setStressMode(m)}
                className={stressMode === m ? btnActive : btnSecondary}>
                {m === 'compression' ? t.stressDialog.compression
                  : m === 'extension' ? t.stressDialog.extension
                  : t.stressDialog.shear}
              </button>
            ))}
          </div>
          {stressMode === 'compression' && (
            <SliderField label={`${t.stressDialog.compression}: ${compression}px`}
              min={10} max={120} value={compression} onChange={setCompression} />
          )}
          {stressMode === 'extension' && (
            <SliderField label={`${t.stressDialog.extension}: ${extension}px`}
              min={10} max={120} value={extension} onChange={setExtension} />
          )}
          {stressMode === 'shear' && (
            <SliderField label={`${t.stressDialog.shear}: ${shear}px`}
              min={10} max={120} value={shear} onChange={setShear} />
          )}
          <div className="flex justify-end mt-3">
            <button className={btnPrimary} onClick={() => {
              dispatch({
                type: 'APPLY_STRESS',
                params: {
                  compression: stressMode === 'compression' ? compression : 0,
                  extension:   stressMode === 'extension'   ? extension   : 0,
                  shear:       stressMode === 'shear'       ? shear       : 0,
                },
              });
              setOpenPanel(null);
            }}>
              {t.stressDialog.apply}
            </button>
          </div>
        </Panel>
      )}

      {/* 断層パネル */}
      {openPanel === 'fault' && (
        <Panel title={t.faultDialog.title} onClose={() => setOpenPanel(null)}>
          <label className="block text-sm mb-1">{t.faultDialog.type}</label>
          <select className="w-full border rounded px-2 py-1 text-sm dark:bg-gray-700 dark:border-gray-600 mb-3"
            value={faultType} onChange={e => setFaultType(e.target.value as FaultType)}>
            <option value="normal">{t.faultDialog.normal}</option>
            <option value="reverse">{t.faultDialog.reverse}</option>
            <option value="strike-slip">{t.faultDialog.strikeSlip}</option>
          </select>
          <SliderField label={`${t.faultDialog.displacement}: ${faultDisp}px`}
            min={10} max={120} value={faultDisp} onChange={setFaultDisp} />
          <SliderField label={`${t.faultDialog.positionX}: ${faultX}px`}
            min={100} max={700} value={faultX} onChange={setFaultX} />
          <div className="flex justify-end mt-3">
            <button className={btnPrimary} onClick={() => {
              dispatch({
                type: 'APPLY_FAULT',
                fault: {
                  id: Math.random().toString(36).slice(2),
                  type: faultType,
                  start: { x: faultX, y: 0 },
                  end:   { x: faultX, y: 500 },
                  displacement: faultDisp,
                },
              });
              setOpenPanel(null);
            }}>
              {t.faultDialog.apply}
            </button>
          </div>
        </Panel>
      )}

      {/* 褶曲パネル */}
      {openPanel === 'fold' && (
        <Panel title={t.foldDialog.title} onClose={() => setOpenPanel(null)}>
          <label className="block text-sm mb-1">{t.foldDialog.type}</label>
          <select className="w-full border rounded px-2 py-1 text-sm dark:bg-gray-700 dark:border-gray-600 mb-3"
            value={foldType} onChange={e => setFoldType(e.target.value as FoldType)}>
            <option value="anticline">{t.foldDialog.anticline}</option>
            <option value="syncline">{t.foldDialog.syncline}</option>
          </select>
          <SliderField label={`${t.foldDialog.wavelength}: ${wavelength}px`}
            min={100} max={600} value={wavelength} onChange={setWavelength} />
          <SliderField label={`${t.foldDialog.amplitude}: ${amplitude}px`}
            min={10} max={150} value={amplitude} onChange={setAmplitude} />
          <SliderField label={`${t.foldDialog.centerX}: ${foldCenterX}px`}
            min={100} max={700} value={foldCenterX} onChange={setFoldCenterX} />
          <div className="flex justify-end mt-3">
            <button className={btnPrimary} onClick={() => {
              dispatch({
                type: 'APPLY_FOLD',
                params: { type: foldType, wavelength, amplitude, centerX: foldCenterX },
              });
              setOpenPanel(null);
            }}>
              {t.foldDialog.apply}
            </button>
          </div>
        </Panel>
      )}
    </div>
  );
}

// ─── 補助コンポーネント ───────────────────────────────────────────

function Panel({ title, children, onClose }: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700
                    bg-white dark:bg-gray-800 p-4 shadow-lg mt-1">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-200">{title}</h3>
        <button onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-lg leading-none">
          ×
        </button>
      </div>
      {children}
    </div>
  );
}

function SliderField({ label, min, max, value, onChange }: {
  label: string;
  min: number;
  max: number;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="mb-2">
      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">{label}</label>
      <input type="range" min={min} max={max} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full accent-blue-500" />
    </div>
  );
}
