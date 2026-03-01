// ---------------------------------------------------------------------------
// CollabToolbarButton — "Share" button in the toolbar
//
// Shows a Users icon. When collaborating, shows a green dot indicator.
// Clicking toggles the CollabPanel dropdown. Displays a brief notification
// when a remote user joins or leaves the session.
// ---------------------------------------------------------------------------

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Users, LogIn, LogOut as LogOutIcon } from 'lucide-react';
import { useCollabStore } from '../../store/collabStore';
import { useStyleStore } from '../../store/styleStore';
import CollabPanel from './CollabPanel';
import UserAvatars from './UserAvatars';

interface JoinNotification {
  id: number;
  name: string;
  color: string;
  type: 'joined' | 'left';
}

let _notifId = 0;

const CollabToolbarButton: React.FC = () => {
  const [open, setOpen] = useState(false);
  const isCollaborating = useCollabStore((s) => s.isCollaborating);
  const connectionStatus = useCollabStore((s) => s.connectionStatus);
  const remoteUsers = useCollabStore((s) => s.remoteUsers);
  const darkMode = useStyleStore((s) => s.darkMode);

  const [notifications, setNotifications] = useState<JoinNotification[]>([]);
  const prevUserIdsRef = useRef<Set<number>>(new Set());

  const dismissNotification = useCallback((id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  // Detect user joins and leaves
  useEffect(() => {
    if (!isCollaborating) {
      prevUserIdsRef.current = new Set();
      return;
    }

    const currentIds = new Set(remoteUsers.map((u) => u.clientId));
    const prevIds = prevUserIdsRef.current;

    // New joins
    for (const user of remoteUsers) {
      if (!prevIds.has(user.clientId)) {
        const id = ++_notifId;
        setNotifications((prev) => [...prev, { id, name: user.name, color: user.color, type: 'joined' }]);
        setTimeout(() => dismissNotification(id), 4000);
      }
    }

    // Departures
    for (const prevId of prevIds) {
      if (!currentIds.has(prevId)) {
        // We don't have the user object anymore, but we can track it
        // Only show if we had users before (avoid initial load noise)
        if (prevIds.size > 0) {
          const id = ++_notifId;
          setNotifications((prev) => [...prev, { id, name: 'A user', color: '#94a3b8', type: 'left' }]);
          setTimeout(() => dismissNotification(id), 3000);
        }
      }
    }

    prevUserIdsRef.current = currentIds;
  }, [remoteUsers, isCollaborating, dismissNotification]);

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

      {/* Join/leave notifications */}
      {notifications.length > 0 && (
        <div className="absolute top-full right-0 mt-1 z-50 flex flex-col gap-1 pointer-events-none">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className={`
                flex items-center gap-1.5 px-2.5 py-1.5 rounded-md shadow-lg text-[11px] font-medium
                whitespace-nowrap pointer-events-auto animate-in slide-in-from-top-1 fade-in duration-200
                ${darkMode ? 'bg-dk-surface border border-dk-border' : 'bg-white border border-slate-200'}
              `}
            >
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: notif.color }}
              />
              <span className={darkMode ? 'text-dk-text' : 'text-slate-700'}>
                {notif.name}
              </span>
              <span className={`text-[10px] ${darkMode ? 'text-dk-muted' : 'text-slate-400'}`}>
                {notif.type === 'joined' ? 'joined' : 'left'}
              </span>
              {notif.type === 'joined' ? (
                <LogIn size={10} className="text-green-500 shrink-0" />
              ) : (
                <LogOutIcon size={10} className="text-slate-400 shrink-0" />
              )}
            </div>
          ))}
        </div>
      )}

      {open && <CollabPanel onClose={() => setOpen(false)} />}
    </div>
  );
};

export default React.memo(CollabToolbarButton);
