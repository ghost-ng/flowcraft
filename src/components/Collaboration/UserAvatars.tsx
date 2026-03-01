// ---------------------------------------------------------------------------
// UserAvatars — Colored avatar pills showing connected users
// Shown in the toolbar when collaborating.
// ---------------------------------------------------------------------------

import React from 'react';
import { useCollabStore } from '../../store/collabStore';
import { useStyleStore } from '../../store/styleStore';

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

const UserAvatars: React.FC = () => {
  const localUser = useCollabStore((s) => s.localUser);
  const remoteUsers = useCollabStore((s) => s.remoteUsers);
  const darkMode = useStyleStore((s) => s.darkMode);

  const allUsers = [
    ...(localUser ? [{ ...localUser, isLocal: true }] : []),
    ...remoteUsers.map((u) => ({ ...u, isLocal: false })),
  ];

  if (allUsers.length === 0) return null;

  return (
    <div className="flex items-center gap-0.5 px-1">
      {allUsers.slice(0, 6).map((user) => (
        <div
          key={user.clientId}
          data-tooltip={`${user.name}${user.isLocal ? ' (you)' : ''}`}
          className="relative flex items-center justify-center rounded-full text-[9px] font-bold text-white shrink-0 cursor-default"
          style={{
            width: 22,
            height: 22,
            backgroundColor: user.color,
            border: user.isLocal ? '2px solid white' : '2px solid transparent',
            boxShadow: user.isLocal
              ? `0 0 0 1px ${user.color}`
              : undefined,
          }}
        >
          {getInitials(user.name)}
        </div>
      ))}
      {allUsers.length > 6 && (
        <div
          className={`flex items-center justify-center rounded-full text-[9px] font-bold shrink-0 ${
            darkMode ? 'bg-dk-surface text-dk-muted' : 'bg-slate-200 text-slate-600'
          }`}
          style={{ width: 22, height: 22 }}
        >
          +{allUsers.length - 6}
        </div>
      )}
    </div>
  );
};

export default React.memo(UserAvatars);
