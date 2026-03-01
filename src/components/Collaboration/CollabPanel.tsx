// ---------------------------------------------------------------------------
// CollabPanel — Dropdown panel for creating/joining collaboration rooms
//
// Follows the existing toolbar dropdown pattern with fixed backdrop overlay
// for reliable dismiss (per CLAUDE.md instructions).
// ---------------------------------------------------------------------------

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Copy, LogOut, Users, Wifi, WifiOff, Check, Pencil } from 'lucide-react';
import { useCollabStore } from '../../store/collabStore';
import { useStyleStore } from '../../store/styleStore';

interface CollabPanelProps {
  onClose: () => void;
}

const CollabPanel: React.FC<CollabPanelProps> = ({ onClose }) => {
  const isCollaborating = useCollabStore((s) => s.isCollaborating);
  const connectionStatus = useCollabStore((s) => s.connectionStatus);
  const roomId = useCollabStore((s) => s.roomId);
  const localUser = useCollabStore((s) => s.localUser);
  const remoteUsers = useCollabStore((s) => s.remoteUsers);
  const error = useCollabStore((s) => s.error);
  const darkMode = useStyleStore((s) => s.darkMode);

  const [userName, setUserName] = useState(() => {
    // Restore name from localStorage
    return localStorage.getItem('charthero-collab-name') || '';
  });
  const [joinRoomId, setJoinRoomId] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [editName, setEditName] = useState('');
  const editNameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingName && editNameRef.current) {
      editNameRef.current.focus();
      editNameRef.current.select();
    }
  }, [editingName]);

  const handleStartEditName = useCallback(() => {
    setEditName(localUser?.name || '');
    setEditingName(true);
  }, [localUser]);

  const handleSaveName = useCallback(async () => {
    const newName = editName.trim();
    if (!newName || newName === localUser?.name) {
      setEditingName(false);
      return;
    }
    try {
      const { updateUserName, getProvider } = await import('../../collab');
      const provider = getProvider();
      if (provider) {
        updateUserName(provider.awareness, newName);
      }
    } catch (err) {
      console.error('Failed to update name:', err);
    }
    setEditingName(false);
  }, [editName, localUser]);

  const handleStartSession = useCallback(async () => {
    const name = userName.trim() || 'Anonymous';
    localStorage.setItem('charthero-collab-name', name);
    setLoading(true);
    try {
      const { joinRoom, generateRoomId } = await import('../../collab');
      const newRoomId = generateRoomId();
      await joinRoom({ roomId: newRoomId, userName: name });
    } catch (err) {
      console.error('Failed to start session:', err);
    } finally {
      setLoading(false);
    }
  }, [userName]);

  const handleJoinSession = useCallback(async () => {
    // Extract room ID from full URL or use as-is
    let id = joinRoomId.trim();
    const match = id.match(/room=([a-fA-F0-9]{32})/);
    if (match) id = match[1];
    if (!id || id.length !== 32) return;

    const name = userName.trim() || 'Anonymous';
    localStorage.setItem('charthero-collab-name', name);
    setLoading(true);
    try {
      const { joinRoom } = await import('../../collab');
      await joinRoom({ roomId: id, userName: name });
    } catch (err) {
      console.error('Failed to join session:', err);
    } finally {
      setLoading(false);
    }
  }, [joinRoomId, userName]);

  const handleLeaveSession = useCallback(async () => {
    try {
      const { leaveRoom } = await import('../../collab');
      await leaveRoom();
    } catch (err) {
      console.error('Failed to leave session:', err);
    }
  }, []);

  const handleCopyLink = useCallback(async () => {
    if (!roomId) return;
    try {
      const { buildShareUrl } = await import('../../collab');
      await navigator.clipboard.writeText(buildShareUrl(roomId));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  }, [roomId]);

  const bg = darkMode ? 'bg-dk-surface border-dk-border' : 'bg-white border-slate-200';
  const inputClass = `w-full px-2.5 py-1.5 rounded text-xs border outline-none ${
    darkMode
      ? 'bg-dk-surface-alt border-dk-border text-dk-text placeholder-dk-muted focus:border-blue-500'
      : 'bg-white border-slate-300 text-slate-800 placeholder-slate-400 focus:border-blue-500'
  }`;
  const btnPrimary = `w-full px-3 py-1.5 rounded text-xs font-medium transition-colors ${
    darkMode
      ? 'bg-blue-600 hover:bg-blue-500 text-white'
      : 'bg-blue-500 hover:bg-blue-600 text-white'
  } disabled:opacity-50 disabled:cursor-not-allowed`;
  const btnDanger = `w-full px-3 py-1.5 rounded text-xs font-medium transition-colors ${
    darkMode
      ? 'bg-red-600/80 hover:bg-red-500 text-white'
      : 'bg-red-500 hover:bg-red-600 text-white'
  }`;

  return (
    <>
      {/* Fixed backdrop for reliable dismiss */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      <div
        className={`absolute top-full right-0 mt-1 w-72 rounded-lg border shadow-lg z-50 ${bg}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`px-3 py-2 border-b ${darkMode ? 'border-dk-border' : 'border-slate-100'}`}>
          <div className={`text-xs font-semibold ${darkMode ? 'text-dk-text' : 'text-slate-700'}`}>
            <Users size={12} className="inline mr-1.5 -mt-0.5" />
            Live Collaboration
          </div>
        </div>

        <div className="p-3 space-y-3">
          {/* Error display */}
          {error && (
            <div className="px-2 py-1.5 rounded text-[10px] bg-red-500/10 text-red-500 border border-red-500/20">
              {error}
            </div>
          )}

          {!isCollaborating ? (
            <>
              {/* Name input */}
              <div>
                <label className={`block text-[10px] font-medium mb-1 ${darkMode ? 'text-dk-muted' : 'text-slate-500'}`}>
                  Your Name
                </label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Enter your name..."
                  className={inputClass}
                  maxLength={30}
                />
              </div>

              {/* Start new session */}
              <button
                onClick={handleStartSession}
                disabled={loading}
                className={btnPrimary}
              >
                {loading ? 'Starting...' : 'Start New Session'}
              </button>

              {/* Divider */}
              <div className="flex items-center gap-2">
                <div className={`flex-1 h-px ${darkMode ? 'bg-dk-border' : 'bg-slate-200'}`} />
                <span className={`text-[10px] ${darkMode ? 'text-dk-muted' : 'text-slate-400'}`}>or</span>
                <div className={`flex-1 h-px ${darkMode ? 'bg-dk-border' : 'bg-slate-200'}`} />
              </div>

              {/* Join existing session */}
              <div>
                <label className={`block text-[10px] font-medium mb-1 ${darkMode ? 'text-dk-muted' : 'text-slate-500'}`}>
                  Room Link or ID
                </label>
                <input
                  type="text"
                  value={joinRoomId}
                  onChange={(e) => setJoinRoomId(e.target.value)}
                  placeholder="Paste room link or ID..."
                  className={inputClass}
                  onKeyDown={(e) => e.key === 'Enter' && handleJoinSession()}
                />
              </div>

              <button
                onClick={handleJoinSession}
                disabled={loading || joinRoomId.trim().length === 0}
                className={btnPrimary}
              >
                {loading ? 'Joining...' : 'Join Session'}
              </button>
            </>
          ) : (
            <>
              {/* Connection status */}
              <div className="flex items-center gap-2">
                {connectionStatus === 'connected' ? (
                  <Wifi size={12} className="text-green-500" />
                ) : (
                  <WifiOff size={12} className="text-yellow-500" />
                )}
                <span className={`text-xs ${darkMode ? 'text-dk-text' : 'text-slate-700'}`}>
                  {connectionStatus === 'connected'
                    ? `Connected (${remoteUsers.length + 1} user${remoteUsers.length > 0 ? 's' : ''})`
                    : 'Connecting...'}
                </span>
              </div>

              {/* Share link */}
              <div>
                <label className={`block text-[10px] font-medium mb-1 ${darkMode ? 'text-dk-muted' : 'text-slate-500'}`}>
                  Share this link
                </label>
                <div className="flex gap-1">
                  <input
                    type="text"
                    readOnly
                    value={roomId ? `${window.location.origin}${window.location.pathname}#room=${roomId}` : ''}
                    className={`${inputClass} flex-1 text-[10px]`}
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                  />
                  <button
                    onClick={handleCopyLink}
                    className={`shrink-0 px-2 py-1.5 rounded text-xs border transition-colors ${
                      darkMode
                        ? 'border-dk-border hover:bg-dk-hover text-dk-muted'
                        : 'border-slate-300 hover:bg-slate-50 text-slate-600'
                    }`}
                    data-tooltip="Copy link"
                  >
                    {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                  </button>
                </div>
              </div>

              {/* Connected users */}
              <div>
                <label className={`block text-[10px] font-medium mb-1 ${darkMode ? 'text-dk-muted' : 'text-slate-500'}`}>
                  Connected Users
                </label>
                <div className="space-y-1">
                  {localUser && (
                    <div className="flex items-center gap-2 px-2 py-1 rounded text-xs group">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: localUser.color }}
                      />
                      {editingName ? (
                        <input
                          ref={editNameRef}
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onBlur={handleSaveName}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveName();
                            if (e.key === 'Escape') setEditingName(false);
                          }}
                          maxLength={30}
                          className={`flex-1 px-1.5 py-0.5 rounded text-xs border outline-none ${
                            darkMode
                              ? 'bg-dk-surface-alt border-dk-border text-dk-text focus:border-blue-500'
                              : 'bg-white border-slate-300 text-slate-800 focus:border-blue-500'
                          }`}
                        />
                      ) : (
                        <>
                          <span className={darkMode ? 'text-dk-text' : 'text-slate-700'}>
                            {localUser.name}
                          </span>
                          <span className={`text-[10px] ${darkMode ? 'text-dk-muted' : 'text-slate-400'}`}>(you)</span>
                          <button
                            onClick={handleStartEditName}
                            className={`ml-auto opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded ${
                              darkMode ? 'hover:bg-dk-hover text-dk-muted' : 'hover:bg-slate-100 text-slate-400'
                            }`}
                            data-tooltip="Edit name"
                          >
                            <Pencil size={10} />
                          </button>
                        </>
                      )}
                    </div>
                  )}
                  {remoteUsers.map((user) => (
                    <div key={user.clientId} className="flex items-center gap-2 px-2 py-1 rounded text-xs">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: user.color }}
                      />
                      <span className={darkMode ? 'text-dk-text' : 'text-slate-700'}>
                        {user.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Leave button */}
              <button onClick={handleLeaveSession} className={btnDanger}>
                <LogOut size={12} className="inline mr-1 -mt-0.5" />
                Leave Session
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default React.memo(CollabPanel);
