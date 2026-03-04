import React, { useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';

/**
 * Portal-based tooltip that renders to document.body, bypassing all
 * overflow clipping from scroll containers. Matches the app's dark pill style.
 *
 * Usage:
 *   <Tip label="Hide lane">
 *     <button> ... </button>
 *   </Tip>
 */

interface TipProps {
  label: string;
  children: React.ReactNode;
  /** Where to show relative to the element. Default: 'top' */
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

const Tip: React.FC<TipProps> = ({ label, children, placement = 'top' }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  const show = useCallback(() => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    switch (placement) {
      case 'top':
        setPos({ x: r.left + r.width / 2, y: r.top - 6 });
        break;
      case 'bottom':
        setPos({ x: r.left + r.width / 2, y: r.bottom + 6 });
        break;
      case 'left':
        setPos({ x: r.left - 6, y: r.top + r.height / 2 });
        break;
      case 'right':
        setPos({ x: r.right + 6, y: r.top + r.height / 2 });
        break;
    }
  }, [placement]);

  const hide = useCallback(() => setPos(null), []);

  const transformStyle = (() => {
    switch (placement) {
      case 'top': return 'translate(-50%, -100%)';
      case 'bottom': return 'translate(-50%, 0)';
      case 'left': return 'translate(-100%, -50%)';
      case 'right': return 'translate(0, -50%)';
    }
  })();

  return (
    <>
      <span
        ref={ref}
        onMouseEnter={show}
        onMouseLeave={hide}
        style={{ display: 'inline-flex' }}
      >
        {children}
      </span>
      {pos && createPortal(
        <div
          style={{
            position: 'fixed',
            left: pos.x,
            top: pos.y,
            transform: transformStyle,
            padding: '2px 8px',
            fontSize: 11,
            fontWeight: 500,
            whiteSpace: 'nowrap',
            color: 'white',
            background: '#1e293b',
            borderRadius: 4,
            pointerEvents: 'none',
            zIndex: 99999,
          }}
        >
          {label}
        </div>,
        document.body,
      )}
    </>
  );
};

export default React.memo(Tip);
