// ---------------------------------------------------------------------------
// awareness.ts — User presence, cursor tracking, and selection broadcasting
//
// Uses Yjs Awareness protocol to share ephemeral state between peers:
// - Cursor positions (mouse movement on canvas)
// - User selection (which nodes/edges each user has selected)
// - User metadata (name, color)
// ---------------------------------------------------------------------------

import type { Awareness } from 'y-protocols/awareness';
import type { CollabUser } from './types';
import { useCollabStore } from '../store/collabStore';
import { USER_COLORS } from './constants';

// ---------------------------------------------------------------------------
// Setup awareness for the local user
// ---------------------------------------------------------------------------

export function setupAwareness(
  awareness: Awareness,
  userName: string,
): () => void {
  const color = USER_COLORS[awareness.clientID % USER_COLORS.length];

  // Set initial local state
  awareness.setLocalStateField('user', {
    name: userName,
    color,
    cursor: null,
    selectedNodeIds: [],
    selectedEdgeIds: [],
    lastActive: Date.now(),
  });

  // Update collabStore with local user info
  useCollabStore.getState().setLocalUser({
    clientId: awareness.clientID,
    name: userName,
    color,
    cursor: null,
    selectedNodeIds: [],
    selectedEdgeIds: [],
    lastActive: Date.now(),
  });

  // Listen for awareness changes (remote users joining/leaving/updating)
  const onChange = () => {
    const states = awareness.getStates();
    const remoteUsers: CollabUser[] = [];

    states.forEach((state, clientId) => {
      if (clientId === awareness.clientID) return;
      if (state.user) {
        remoteUsers.push({
          clientId,
          ...state.user,
        });
      }
    });

    useCollabStore.getState().setRemoteUsers(remoteUsers);
  };

  awareness.on('change', onChange);
  onChange(); // Initial sync

  return () => {
    awareness.off('change', onChange);
  };
}

// ---------------------------------------------------------------------------
// Broadcast cursor position (called on mouse move, throttled externally)
// ---------------------------------------------------------------------------

let _cursorThrottleTimer: ReturnType<typeof setTimeout> | null = null;
let _pendingCursor: { x: number; y: number } | null = null;

export function broadcastCursorPosition(
  awareness: Awareness,
  position: { x: number; y: number },
): void {
  _pendingCursor = position;

  if (!_cursorThrottleTimer) {
    _cursorThrottleTimer = setTimeout(() => {
      _cursorThrottleTimer = null;
      if (_pendingCursor) {
        const current = awareness.getLocalState()?.user;
        if (current) {
          awareness.setLocalStateField('user', {
            ...current,
            cursor: _pendingCursor,
            lastActive: Date.now(),
          });
        }
        _pendingCursor = null;
      }
    }, 50); // ~20 updates/sec
  }
}

// ---------------------------------------------------------------------------
// Broadcast selection changes
// ---------------------------------------------------------------------------

export function broadcastSelection(
  awareness: Awareness,
  nodeIds: string[],
  edgeIds: string[],
): void {
  const current = awareness.getLocalState()?.user;
  if (current) {
    awareness.setLocalStateField('user', {
      ...current,
      selectedNodeIds: nodeIds,
      selectedEdgeIds: edgeIds,
      lastActive: Date.now(),
    });
  }
}

// ---------------------------------------------------------------------------
// Clear cursor (e.g., when mouse leaves canvas)
// ---------------------------------------------------------------------------

export function clearCursorPosition(awareness: Awareness): void {
  const current = awareness.getLocalState()?.user;
  if (current) {
    awareness.setLocalStateField('user', {
      ...current,
      cursor: null,
    });
  }
}
