/**
 * アイコン集（外部ライブラリを使わずインライン SVG で描く）。
 * UI アイコンは 24×24 の線画、ツールアイコンは操作内容を表す 40×40 の小さな図解。
 */
import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

function Line({ children, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      {children}
    </svg>
  );
}

// ─── UI アイコン ─────────────────────────────────────────────

export const UndoIcon = (p: IconProps) => (
  <Line {...p}><path d="M9 14 4 9l5-5" /><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" /></Line>
);
export const RedoIcon = (p: IconProps) => (
  <Line {...p}><path d="m15 14 5-5-5-5" /><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13" /></Line>
);
export const ResetIcon = (p: IconProps) => (
  <Line {...p}><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /></Line>
);
export const SunIcon = (p: IconProps) => (
  <Line {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </Line>
);
export const MoonIcon = (p: IconProps) => (
  <Line {...p}><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" /></Line>
);
export const GlobeIcon = (p: IconProps) => (
  <Line {...p}>
    <circle cx="12" cy="12" r="10" />
    <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10Z" />
  </Line>
);
export const CompassIcon = (p: IconProps) => (
  <Line {...p}>
    <circle cx="12" cy="12" r="10" />
    <path d="m16.2 7.8-2.1 6.3-6.3 2.1 2.1-6.3 6.3-2.1Z" />
  </Line>
);
export const CheckIcon = (p: IconProps) => (
  <Line {...p}><path d="M20 6 9 17l-5-5" /></Line>
);
export const CloseIcon = (p: IconProps) => (
  <Line {...p}><path d="M18 6 6 18M6 6l12 12" /></Line>
);
export const SparkleIcon = (p: IconProps) => (
  <Line {...p}>
    <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9Z" />
    <path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8Z" />
  </Line>
);
export const BookIcon = (p: IconProps) => (
  <Line {...p}>
    <path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2Z" />
    <path d="M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7Z" />
  </Line>
);
export const QuizIcon = (p: IconProps) => (
  <Line {...p}>
    <circle cx="12" cy="12" r="10" />
    <path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3" />
    <path d="M12 17h.01" />
  </Line>
);
export const HistoryIcon = (p: IconProps) => (
  <Line {...p}>
    <path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /><path d="M12 7v5l3 2" />
  </Line>
);
export const InfoIcon = (p: IconProps) => (
  <Line {...p}><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></Line>
);
export const LockIcon = (p: IconProps) => (
  <Line {...p}><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></Line>
);
export const ArrowRightIcon = (p: IconProps) => (
  <Line {...p}><path d="M5 12h14M13 6l6 6-6 6" /></Line>
);
export const LayersIcon = (p: IconProps) => (
  <Line {...p}>
    <path d="m12 2 10 5-10 5L2 7Z" /><path d="m2 17 10 5 10-5" /><path d="m2 12 10 5 10-5" />
  </Line>
);

// ─── ツールアイコン（操作の図解） ───────────────────────────────

function Tool({ children, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 40 40" width="1em" height="1em" fill="none" aria-hidden="true" {...props}>
      {children}
    </svg>
  );
}

export const AddLayerToolIcon = (p: IconProps) => (
  <Tool {...p}>
    <rect x="5" y="29" width="30" height="6" rx="2" fill="currentColor" opacity=".3" />
    <rect x="5" y="22" width="30" height="6" rx="2" fill="currentColor" opacity=".55" />
    <rect x="5" y="15" width="30" height="6" rx="2" fill="currentColor" />
    <path d="M20 3v8M16.5 7.5 20 11l3.5-3.5" stroke="currentColor" strokeWidth="2.4"
      strokeLinecap="round" strokeLinejoin="round" />
  </Tool>
);

export const StressToolIcon = (p: IconProps) => (
  <Tool {...p}>
    <rect x="13" y="11" width="14" height="18" rx="2" fill="currentColor" opacity=".25" />
    <path d="M13 17h14M13 23h14" stroke="currentColor" strokeWidth="2" opacity=".6" />
    <path d="M3 20h7M7 16.5 10.5 20 7 23.5M37 20h-7M33 16.5 29.5 20l3.5 3.5" stroke="currentColor"
      strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
  </Tool>
);

export const FaultToolIcon = (p: IconProps) => (
  <Tool {...p}>
    <path d="M4 20h16.2M4 26.5h14.6M4 33h13" stroke="currentColor" strokeWidth="3.6"
      strokeLinecap="round" opacity=".55" />
    <path d="M22.3 12H36M20.6 18.5H36M19 25h17" stroke="currentColor" strokeWidth="3.6"
      strokeLinecap="round" />
    <path d="M25 4 15.5 37" stroke="currentColor" strokeWidth="2" strokeDasharray="3 2.5"
      strokeLinecap="round" />
  </Tool>
);

export const FoldToolIcon = (p: IconProps) => (
  <Tool {...p}>
    <path d="M3 22c6-14 28-14 34 0" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" />
    <path d="M3 29c6-14 28-14 34 0" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" opacity=".65" />
    <path d="M3 36c6-14 28-14 34 0" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" opacity=".35" />
  </Tool>
);

export const ErodeToolIcon = (p: IconProps) => (
  <Tool {...p}>
    <path d="M4 35 36 23M4 28.5 36 17.5M4 22l20-6.5" stroke="currentColor" strokeWidth="3.4"
      strokeLinecap="round" opacity=".55" />
    <path d="M3 13c2.2-2.6 4.4-2.6 6.6 0s4.4 2.6 6.6 0 4.4-2.6 6.6 0 4.4 2.6 6.6 0 4.4-2.6 6.6 0"
      stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    <path d="M14 6.5h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity=".5" />
  </Tool>
);

// ─── 操作の種類を表す小図解（パネル内の選択肢用） ───────────────

export const CompressionDiagram = (p: IconProps) => (
  <Tool {...p}>
    <path d="M11 24c3-8 15-8 18 0" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    <path d="M11 30c3-8 15-8 18 0" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity=".55" />
    <path d="M2 27h6M5.5 24 8.5 27l-3 3M38 27h-6M34.5 24l-3 3 3 3" stroke="currentColor" strokeWidth="2.2"
      strokeLinecap="round" strokeLinejoin="round" />
  </Tool>
);

export const ExtensionDiagram = (p: IconProps) => (
  <Tool {...p}>
    <path d="M11 22c3 5 15 5 18 0" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    <path d="M11 28c3 5 15 5 18 0" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity=".55" />
    <path d="M8 25H2M5 22l-3 3 3 3M32 25h6M35 22l3 3-3 3" stroke="currentColor" strokeWidth="2.2"
      strokeLinecap="round" strokeLinejoin="round" />
  </Tool>
);

export const ShearDiagram = (p: IconProps) => (
  <Tool {...p}>
    <path d="M12 30 18 14h12l-6 16Z" fill="currentColor" opacity=".2" stroke="currentColor"
      strokeWidth="2" strokeLinejoin="round" />
    <path d="M17 9h13M26.5 6 30 9l-3.5 3M23 35H10M13.5 32 10 35l3.5 3" stroke="currentColor" strokeWidth="2.2"
      strokeLinecap="round" strokeLinejoin="round" />
  </Tool>
);

export const NormalFaultDiagram = (p: IconProps) => (
  <Tool {...p}>
    <path d="M3 17h16.5v19H3Z" fill="currentColor" opacity=".25" />
    <path d="M3 23h14.8M3 29h13.2" stroke="currentColor" strokeWidth="2" opacity=".6" />
    <path d="M23 10h14v26H14.5Z" fill="currentColor" opacity=".12" />
    <path d="M22 16h15M20.5 22H37" stroke="currentColor" strokeWidth="2" opacity=".6" />
    <path d="M24 5 13 38" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    <path d="M10 9v7M7.5 13.5 10 16l2.5-2.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
      strokeLinejoin="round" />
  </Tool>
);

export const ReverseFaultDiagram = (p: IconProps) => (
  <Tool {...p}>
    <path d="M3 8h20.5L17 36H3Z" fill="currentColor" opacity=".25" />
    <path d="M3 14h18.5M3 20h16.5" stroke="currentColor" strokeWidth="2" opacity=".6" />
    <path d="M24 16h13v20H19.5Z" fill="currentColor" opacity=".12" />
    <path d="M22.5 22H37M21 28h16" stroke="currentColor" strokeWidth="2" opacity=".6" />
    <path d="M26 5 15 38" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    <path d="M8 31v-7M5.5 26.5 8 24l2.5 2.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
      strokeLinejoin="round" />
  </Tool>
);

export const StrikeSlipDiagram = (p: IconProps) => (
  <Tool {...p}>
    <path d="M3 6h15v28H3ZM22 6h15v28H22Z" fill="currentColor" opacity=".18" />
    <path d="M20 3v34" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    <path d="M10 26V13M7 16l3-3 3 3M30 14v13M27 24l3 3 3-3" stroke="currentColor" strokeWidth="2.2"
      strokeLinecap="round" strokeLinejoin="round" />
  </Tool>
);

export const AnticlineDiagram = (p: IconProps) => (
  <Tool {...p}>
    <path d="M3 24c6-13 28-13 34 0" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" />
    <path d="M3 31c6-13 28-13 34 0" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" opacity=".55" />
    <path d="M20 6v30" stroke="currentColor" strokeWidth="1.4" strokeDasharray="2 2.5" opacity=".7" />
  </Tool>
);

export const SynclineDiagram = (p: IconProps) => (
  <Tool {...p}>
    <path d="M3 13c6 13 28 13 34 0" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" />
    <path d="M3 20c6 13 28 13 34 0" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" opacity=".55" />
    <path d="M20 4v32" stroke="currentColor" strokeWidth="1.4" strokeDasharray="2 2.5" opacity=".7" />
  </Tool>
);
