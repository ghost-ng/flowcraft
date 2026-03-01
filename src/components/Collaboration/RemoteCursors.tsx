// ---------------------------------------------------------------------------
// RemoteCursors — SVG overlay showing other users' cursor positions on canvas
//
// Positions are in flow-space. We apply the viewport transform (pan + zoom)
// to map them to screen-space, matching the ReactFlow viewport pane.
// ---------------------------------------------------------------------------

import React, { useMemo } from 'react';
import { useViewport } from '@xyflow/react';
import { useCollabStore } from '../../store/collabStore';
import { useStyleStore } from '../../store/styleStore';

const RemoteCursors: React.FC = () => {
  const remoteUsers = useCollabStore((s) => s.remoteUsers);
  const darkMode = useStyleStore((s) => s.darkMode);
  const viewport = useViewport();

  const usersWithCursors = useMemo(
    () => remoteUsers.filter((u) => u.cursor !== null),
    [remoteUsers],
  );

  if (usersWithCursors.length === 0) return null;

  return (
    <div
      className="pointer-events-none absolute inset-0 z-[100]"
      style={{ overflow: 'visible' }}
    >
      {/* Apply viewport transform so flow-space coords match the canvas */}
      <div
        style={{
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
          transformOrigin: '0 0',
          position: 'absolute',
          top: 0,
          left: 0,
        }}
      >
        {usersWithCursors.map((user) => (
          <div
            key={user.clientId}
            className="absolute"
            style={{
              left: user.cursor!.x,
              top: user.cursor!.y,
              transition: 'left 100ms ease-out, top 100ms ease-out',
            }}
          >
            {/* Cursor arrow SVG — use inverse scale so it stays constant screen-size */}
            <div style={{ transform: `scale(${1 / viewport.zoom})`, transformOrigin: '0 0' }}>
              <svg
                width="20"
                height="24"
                viewBox="0 0 20 24"
                fill="none"
                style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }}
              >
                <path
                  d="M2 2L18 12L10 13L7 22L2 2Z"
                  fill={user.color}
                  stroke={darkMode ? '#1e293b' : '#ffffff'}
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
              </svg>
              {/* Name label */}
              <div
                className="absolute left-4 top-4 px-1.5 py-0.5 rounded-md text-[10px] font-medium whitespace-nowrap shadow-sm"
                style={{
                  backgroundColor: user.color,
                  color: '#ffffff',
                  maxWidth: 120,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {user.name}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default React.memo(RemoteCursors);
