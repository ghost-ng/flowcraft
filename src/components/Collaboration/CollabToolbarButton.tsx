// ---------------------------------------------------------------------------
// CollabToolbarButton — "Share" button in the toolbar
//
// Shows a Users icon. When collaborating, shows a green dot indicator.
// Clicking toggles the CollabPanel dropdown.
// ---------------------------------------------------------------------------

import React, { useState } from 'react';
import { Users } from 'lucide-react';
import { useCollabStore } from '../../store/collabStore';
import { useStyleStore } from '../../store/styleStore';
import CollabPanel from './CollabPanel';
import UserAvatars from './UserAvatars';

const CollabToolbarButton: React.FC = () => {
  const [open, setOpen] = useState(false);
  const isCollaborating = useCollabStore((s) => s.isCollaborating);
  const connectionStatus = useCollabStore((s) => s.connectionStatus);
  const darkMode = useStyleStore((s) => s.darkMode);

  return (
    <div className="relative flex items-center gap-1">
      {/* User avatars (visible when collaborating) */}
      {isCollaborating && <UserAvatars />}

      <button
        data-tooltip="Live Collaboration"
        onClick={() => setOpen(!open)}
        className={`
          relative flex items-center gap-1 px-1.5 py-1 rounded text-xs
          transition-all duration-150 cursor-pointer
          ${isCollaborating
            ? darkMode
              ? 'bg-green-600/20 text-green-400 hover:bg-green-600/30'
              : 'bg-green-50 text-green-600 hover:bg-green-100'
            : darkMode
              ? 'text-dk-muted hover:bg-dk-hover'
              : 'text-toolbar-fg hover:bg-toolbar-hover'
          }
        `}
      >
        <Users size={15} />
        {/* Connection indicator dot */}
        {isCollaborating && (
          <span
            className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full"
            style={{
              backgroundColor:
                connectionStatus === 'connected'
                  ? '#22c55e'
                  : connectionStatus === 'connecting'
                    ? '#eab308'
                    : '#ef4444',
              boxShadow: connectionStatus === 'connected'
                ? '0 0 4px #22c55e'
                : undefined,
            }}
          />
        )}
      </button>

      {open && <CollabPanel onClose={() => setOpen(false)} />}
    </div>
  );
};

export default React.memo(CollabToolbarButton);
