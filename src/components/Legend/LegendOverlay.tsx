import React, { useCallback, useRef } from 'react';
import { useViewport } from '@xyflow/react';
import { useLegendStore } from '../../store/legendStore';
import { useStyleStore } from '../../store/styleStore';

const LegendOverlay: React.FC = () => {
  const config = useLegendStore((s) => s.config);
  const setPosition = useLegendStore((s) => s.setPosition);
  const darkMode = useStyleStore((s) => s.darkMode);
  const viewport = useViewport();
  const dragRef = useRef<{ startX: number; startY: number; posX: number; posY: number } | null>(null);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        posX: config.position.x,
        posY: config.position.y,
      };

      const onMouseMove = (moveEvent: MouseEvent) => {
        if (!dragRef.current) return;
        const dx = (moveEvent.clientX - dragRef.current.startX) / viewport.zoom;
        const dy = (moveEvent.clientY - dragRef.current.startY) / viewport.zoom;
        setPosition({
          x: dragRef.current.posX + dx,
          y: dragRef.current.posY + dy,
        });
      };

      const onMouseUp = () => {
        dragRef.current = null;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        document.body.style.cursor = '';
      };

      document.body.style.cursor = 'grabbing';
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    },
    [config.position, viewport.zoom, setPosition],
  );

  if (!config.visible || config.items.length === 0) return null;

  const { style } = config;
  const bgColor = darkMode
    ? (style.bgColor === '#ffffff' ? '#1e293b' : style.bgColor)
    : style.bgColor;
  const borderColor = darkMode
    ? (style.borderColor === '#e2e8f0' ? '#334155' : style.borderColor)
    : style.borderColor;
  const textColor = darkMode ? '#f1f5f9' : '#0f172a';
  const titleColor = darkMode ? '#94a3b8' : '#64748b';

  return (
    <div
      className="absolute inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 1 }}
    >
      <div
        style={{
          position: 'absolute',
          transformOrigin: '0 0',
          transform: `translate(${viewport.x + config.position.x * viewport.zoom}px, ${viewport.y + config.position.y * viewport.zoom}px) scale(${viewport.zoom})`,
        }}
      >
        <div
          style={{
            width: style.width,
            backgroundColor: bgColor,
            border: `${style.borderWidth}px solid ${borderColor}`,
            borderRadius: 6,
            opacity: style.opacity,
            boxShadow: darkMode
              ? '0 2px 8px rgba(0,0,0,0.3)'
              : '0 2px 8px rgba(0,0,0,0.08)',
            pointerEvents: 'auto',
          }}
        >
          {/* Title bar (draggable) */}
          <div
            onMouseDown={handleMouseDown}
            style={{
              padding: '6px 10px',
              fontSize: style.fontSize + 1,
              fontWeight: 600,
              color: titleColor,
              borderBottom: `1px solid ${borderColor}`,
              cursor: 'grab',
              userSelect: 'none',
            }}
          >
            {config.title}
          </div>

          {/* Items */}
          <div style={{ padding: '6px 10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {[...config.items]
              .sort((a, b) => a.order - b.order)
              .map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <div
                    style={{
                      width: 12,
                      height: 12,
                      backgroundColor: item.color,
                      borderRadius: 2,
                      flexShrink: 0,
                      border: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                    }}
                  />
                  <span
                    style={{
                      fontSize: style.fontSize,
                      color: textColor,
                      lineHeight: 1.3,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {item.label}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(LegendOverlay);
