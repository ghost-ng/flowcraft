// ---------------------------------------------------------------------------
// ConnectionBadge — Status indicator shown in the StatusBar when collaborating
// ---------------------------------------------------------------------------

import React from 'react';
import { useCollabStore } from '../../store/collabStore';
import { useStyleStore } from '../../store/styleStore';

const ConnectionBadge: React.FC = () => {
  const isCollaborating = useCollabStore((s) => s.isCollaborating);
  const connectionStatus = useCollabStore((s) => s.connectionStatus);
  const remoteUsers = useCollabStore((s) => s.remoteUsers);
  const darkMode = useStyleStore((s) => s.darkMode);

  if (!isCollaborating) return null;

  const dotColor =
    connectionStatus === 'connected'
      ? '#22c55e'
      : connectionStatus === 'connecting'
        ? '#eab308'
        : connectionStatus === 'error'
          ? '#ef4444'
          : '#94a3b8';

  const label =
    connectionStatus === 'connected'
      ? `Live (${remoteUsers.length + 1})`
      : connectionStatus === 'connecting'
        ? 'Connecting...'
        : connectionStatus === 'error'
          ? 'Error'
          : 'Offline';

  return (
    <div
      className={`flex items-center gap-1 px-2 text-[10px] font-mono ${
        darkMode ? 'text-dk-muted' : 'text-slate-500'
      }`}
      data-tooltip-top={`Collaboration: ${label}`}
    >
      <span
        className="inline-block w-1.5 h-1.5 rounded-full"
        style={{
          backgroundColor: dotColor,
          boxShadow: connectionStatus === 'connected' ? `0 0 4px ${dotColor}` : undefined,
        }}
      />
      {label}
    </div>
  );
};

export default React.memo(ConnectionBadge);
