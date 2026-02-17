import React, { useMemo } from 'react';
import { useViewport } from '@xyflow/react';
import { useStyleStore } from '../../store/styleStore';

interface RulerProps {
  orientation: 'horizontal' | 'vertical';
}

const RULER_SIZE = 24; // px height for horizontal, width for vertical
const TICK_MAJOR = 100; // Major tick every 100px
const TICK_MINOR = 10;  // Minor tick every 10px

const Ruler: React.FC<RulerProps> = ({ orientation }) => {
  const viewport = useViewport();
  const darkMode = useStyleStore((s) => s.darkMode);

  const isH = orientation === 'horizontal';

  // Calculate visible range in flow coordinates
  const viewportSize = isH ? window.innerWidth : window.innerHeight;
  const offset = isH ? viewport.x : viewport.y;
  const zoom = viewport.zoom;

  // Start and end in flow coordinates
  const start = Math.floor(-offset / zoom / TICK_MINOR) * TICK_MINOR - TICK_MINOR * 5;
  const end = Math.ceil((-offset + viewportSize) / zoom / TICK_MINOR) * TICK_MINOR + TICK_MINOR * 5;

  const ticks = useMemo(() => {
    const result: Array<{ pos: number; label?: string; major: boolean }> = [];
    for (let i = start; i <= end; i += TICK_MINOR) {
      const isMajor = i % TICK_MAJOR === 0;
      result.push({
        pos: i * zoom + offset,
        label: isMajor ? `${i}` : undefined,
        major: isMajor,
      });
    }
    return result;
  }, [start, end, zoom, offset]);

  const bg = darkMode ? '#1e293b' : '#f8fafc';
  const borderColor = darkMode ? '#334155' : '#e2e8f0';
  const tickColor = darkMode ? '#64748b' : '#94a3b8';
  const textColor = darkMode ? '#94a3b8' : '#64748b';

  if (isH) {
    return (
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: RULER_SIZE, // offset for corner square
          right: 0,
          height: RULER_SIZE,
          backgroundColor: bg,
          borderBottom: `1px solid ${borderColor}`,
          overflow: 'hidden',
          zIndex: 10,
          userSelect: 'none',
          pointerEvents: 'none',
        }}
      >
        <svg width="100%" height={RULER_SIZE}>
          {ticks.map((tick, i) => (
            <React.Fragment key={i}>
              <line
                x1={tick.pos}
                y1={tick.major ? 8 : 16}
                x2={tick.pos}
                y2={RULER_SIZE}
                stroke={tickColor}
                strokeWidth={tick.major ? 1 : 0.5}
              />
              {tick.label && (
                <text
                  x={tick.pos + 3}
                  y={12}
                  fontSize={9}
                  fill={textColor}
                  fontFamily="'Inter', sans-serif"
                >
                  {tick.label}
                </text>
              )}
            </React.Fragment>
          ))}
        </svg>
      </div>
    );
  }

  // Vertical ruler
  return (
    <div
      style={{
        position: 'absolute',
        top: RULER_SIZE,
        left: 0,
        bottom: 0,
        width: RULER_SIZE,
        backgroundColor: bg,
        borderRight: `1px solid ${borderColor}`,
        overflow: 'hidden',
        zIndex: 10,
        userSelect: 'none',
        pointerEvents: 'none',
      }}
    >
      <svg width={RULER_SIZE} height="100%">
        {ticks.map((tick, i) => (
          <React.Fragment key={i}>
            <line
              x1={tick.major ? 8 : 16}
              y1={tick.pos}
              x2={RULER_SIZE}
              y2={tick.pos}
              stroke={tickColor}
              strokeWidth={tick.major ? 1 : 0.5}
            />
            {tick.label && (
              <text
                x={2}
                y={tick.pos - 3}
                fontSize={9}
                fill={textColor}
                fontFamily="'Inter', sans-serif"
                writingMode="vertical-rl"
                transform={`rotate(180, 6, ${tick.pos - 3})`}
              >
                {tick.label}
              </text>
            )}
          </React.Fragment>
        ))}
      </svg>
    </div>
  );
};

// Corner square where rulers meet
export const RulerCorner: React.FC = () => {
  const darkMode = useStyleStore((s) => s.darkMode);
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: RULER_SIZE,
        height: RULER_SIZE,
        backgroundColor: darkMode ? '#1e293b' : '#f8fafc',
        borderRight: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`,
        borderBottom: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`,
        zIndex: 11,
      }}
    />
  );
};

export default React.memo(Ruler);
