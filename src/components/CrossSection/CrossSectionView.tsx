import { useRef } from 'react';
import { useGeoStore } from '../../store/useGeoStore';
import { useTheme } from '../../hooks/useTheme';
import { useI18n } from '../../i18n/useI18n';
import { ROCKS } from '../../data/rocks';
import type { Layer, FaultLine, Point } from '../../types/geology';

function pointsToSvgPath(vertices: Point[]): string {
  if (vertices.length === 0) return '';
  return vertices.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + ' Z';
}

/** 波線パス（不整合面用） */
function wavyLine(x1: number, x2: number, y: number, amplitude = 4, freq = 20): string {
  let d = `M${x1},${y}`;
  for (let x = x1; x <= x2; x += freq) {
    const cx1 = x + freq / 3;
    const cx2 = x + (freq * 2) / 3;
    const nx  = Math.min(x + freq, x2);
    const up  = y - amplitude;
    const dn  = y + amplitude;
    d += ` C${cx1},${up} ${cx2},${dn} ${nx},${y}`;
  }
  return d;
}

/** 断層線矢印用パス */
function arrowPath(x: number, y: number, up: boolean): string {
  const h = up ? -10 : 10;
  return `M${x},${y} L${x - 5},${y + h} M${x},${y} L${x + 5},${y + h}`;
}

interface Props {
  width?: number;
  height?: number;
}

export function CrossSectionView({ width = 800, height = 500 }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const { geoState } = useGeoStore();
  const { theme } = useTheme();
  const { t } = useI18n();

  const isDark = theme === 'dark';
  const bg = isDark ? '#1a1b23' : '#f0f4f8';
  const textColor = isDark ? '#e2e8f0' : '#1a202c';
  const gridColor = isDark ? '#2d3748' : '#e2e8f0';

  const { layers, faults } = geoState;

  // 岩相パターン定義
  const renderDefs = () => (
    <defs>
      <pattern id="dots" width="6" height="6" patternUnits="userSpaceOnUse">
        <circle cx="3" cy="3" r="1" fill={isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.2)'} />
      </pattern>
      <pattern id="lines" width="6" height="6" patternUnits="userSpaceOnUse">
        <line x1="0" y1="3" x2="6" y2="3" stroke={isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.2)'} strokeWidth="1" />
      </pattern>
      <pattern id="cross" width="8" height="8" patternUnits="userSpaceOnUse">
        <line x1="0" y1="4" x2="8" y2="4" stroke={isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.2)'} strokeWidth="1" />
        <line x1="4" y1="0" x2="4" y2="8" stroke={isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.2)'} strokeWidth="1" />
      </pattern>
      <marker id="arrowhead" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
        <path d="M0,0 L8,4 L0,8 Z" fill="#ef4444" />
      </marker>
    </defs>
  );

  const renderGrid = () => (
    <g>
      {Array.from({ length: Math.floor(width / 50) + 1 }, (_, i) => (
        <line key={`vg${i}`} x1={i * 50} y1={0} x2={i * 50} y2={height}
          stroke={gridColor} strokeWidth="0.5" />
      ))}
      {Array.from({ length: Math.floor(height / 50) + 1 }, (_, i) => (
        <line key={`hg${i}`} x1={0} y1={i * 50} x2={width} y2={i * 50}
          stroke={gridColor} strokeWidth="0.5" />
      ))}
    </g>
  );

  const renderLayer = (layer: Layer, idx: number) => {
    const rock = ROCKS[layer.rockId];
    const fill = isDark ? rock.darkColor : rock.color;
    const path = pointsToSvgPath(layer.vertices);
    const patternId = rock.pattern !== 'none' ? rock.pattern : undefined;

    // 不整合面：上面の頂点 2 点（vertices[0], vertices[1]）
    const unconformityPath = layer.unconformityAbove
      ? wavyLine(layer.vertices[0].x, layer.vertices[1].x,
          (layer.vertices[0].y + layer.vertices[1].y) / 2)
      : null;

    // 岩相ラベル位置（中央）
    const cx = layer.vertices.reduce((s, p) => s + p.x, 0) / layer.vertices.length;
    const cy = layer.vertices.reduce((s, p) => s + p.y, 0) / layer.vertices.length;

    return (
      <g key={layer.id} style={{ animation: `fadeIn 0.4s ease ${idx * 0.05}s both` }}>
        {/* 岩相色 */}
        <path d={path} fill={fill} stroke={isDark ? '#374151' : '#6b7280'} strokeWidth="1" />
        {/* テクスチャパターン */}
        {patternId && (
          <path d={path} fill={`url(#${patternId})`} opacity="0.6" />
        )}
        {/* 不整合面（波線） */}
        {unconformityPath && (
          <path d={unconformityPath} fill="none"
            stroke="#f59e0b" strokeWidth="2" strokeDasharray="4,2" />
        )}
        {/* 岩相ラベル */}
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle"
          fontSize="11" fill={textColor} opacity="0.8" style={{ pointerEvents: 'none' }}>
          {isDark ? rock.nameJa : rock.nameJa}
        </text>
      </g>
    );
  };

  const renderFault = (fault: FaultLine) => {
    const { start, end, type } = fault;
    const color = type === 'normal' ? '#3b82f6'
                : type === 'reverse' ? '#ef4444'
                : '#10b981';
    const label = type === 'normal' ? t.crossSection.labelNormal
                : type === 'reverse' ? t.crossSection.labelReverse
                : t.crossSection.labelStrikeSlip;
    const mx = (start.x + end.x) / 2;
    const my = (start.y + end.y) / 2;

    return (
      <g key={fault.id}>
        <line x1={start.x} y1={start.y} x2={end.x} y2={end.y}
          stroke={color} strokeWidth="2.5" strokeDasharray="6,3" />
        {/* 変位矢印 */}
        <path d={arrowPath(start.x - 15, start.y, type === 'normal')}
          stroke={color} strokeWidth="1.5" fill="none" />
        <path d={arrowPath(end.x + 15, end.y, type !== 'normal')}
          stroke={color} strokeWidth="1.5" fill="none" />
        {/* ラベル */}
        <text x={mx + 8} y={my - 6} fontSize="11" fill={color} fontWeight="600">
          {label}
        </text>
      </g>
    );
  };

  return (
    <div className="relative w-full overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
      {layers.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center
                        text-gray-400 dark:text-gray-600 text-sm pointer-events-none z-10">
          {t.crossSection.empty}
        </div>
      )}
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        style={{ display: 'block', background: bg }}
      >
        {renderDefs()}
        {renderGrid()}
        {layers.map((l, i) => renderLayer(l, i))}
        {faults.map(f => renderFault(f))}
      </svg>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
