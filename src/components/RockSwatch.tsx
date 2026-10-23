import { useId } from 'react';
import { ROCKS } from '../data/rocks';
import type { RockId } from '../data/rocks';
import { useTheme } from '../hooks/useTheme';

/** 岩相の色と模様を小さく表示する見本 */
export function RockSwatch({ rockId, className = '' }: { rockId: RockId; className?: string }) {
  const id = useId();
  const { theme } = useTheme();
  const rock = ROCKS[rockId];
  const fill = theme === 'dark' ? rock.darkColor : rock.color;
  const ink = 'rgba(0,0,0,0.28)';

  return (
    <svg viewBox="0 0 24 16" className={className} aria-hidden="true" preserveAspectRatio="none">
      <defs>
        <pattern id={`${id}-p`} width="4" height="4" patternUnits="userSpaceOnUse">
          {rock.pattern === 'dots' && <circle cx="2" cy="2" r="0.7" fill={ink} />}
          {rock.pattern === 'lines' && <line x1="0" y1="2" x2="4" y2="2" stroke={ink} strokeWidth="0.7" />}
          {rock.pattern === 'cross' && (
            <>
              <line x1="0" y1="2" x2="4" y2="2" stroke={ink} strokeWidth="0.6" />
              <line x1="2" y1="0" x2="2" y2="4" stroke={ink} strokeWidth="0.6" />
            </>
          )}
        </pattern>
      </defs>
      <rect width="24" height="16" fill={fill} />
      {rock.pattern !== 'none' && <rect width="24" height="16" fill={`url(#${id}-p)`} />}
    </svg>
  );
}
