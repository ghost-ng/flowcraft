// ---------------------------------------------------------------------------
// collab/index.ts — Public API for the collaboration system
//
// Usage:
//   const { joinRoom, leaveRoom } = await import('../collab');
//   await joinRoom({ roomId: 'abc123...', userName: 'Alice' });
//   // ... collaborate ...
//   await leaveRoom();
// ---------------------------------------------------------------------------

import { getOrCreateDoc, destroyDoc, getNodesMap } from './yjsDoc';
import { createProvider, destroyProvider, getProvider } from './yjsProvider';
import { bindStores, seedDocFromStores, isRemoteUpdate } from './yjsBindings';
import { setupAwareness, broadcastCursorPosition, broadcastSelection, clearCursorPosition, updateUserName } from './awareness';
import { generateRoomId, getRoomIdFromUrl, setRoomIdInUrl, clearRoomFromUrl, buildShareUrl } from './roomManager';
import { useCollabStore } from '../store/collabStore';
import { registerRemoteUpdateCheck, unregisterRemoteUpdateCheck } from '../store/historyStore';
import type { RoomConfig } from './types';

let _unbindStores: (() => void) | null = null;
let _unbindAwareness: (() => void) | null = null;

/**
 * Join a collaborative room. This:
 * 1. Creates the Y.Doc
 * 2. Seeds it with current local state (if first peer)
 * 3. Starts the WebRTC provider
 * 4. Binds Zustand stores bidirectionally
 * 5. Sets up awareness for presence
 */
export async function joinRoom(config: RoomConfig): Promise<void> {
  const store = useCollabStore.getState();

  // Leave any existing room first
  if (store.isCollaborating) {
    await leaveRoom();
  }

  store.setConnectionStatus('connecting');
  store.setRoomId(config.roomId);
  store.setIsCollaborating(true);

  try {
    const doc = getOrCreateDoc();

    // Seed the Y.Doc with current local state if empty
    const nodesMap = getNodesMap(doc);
    if (nodesMap.size === 0) {
      seedDocFromStores(doc);
    }

    // Start WebRTC provider
    const provider = createProvider(doc, config);

    // Set up awareness for user presence
    _unbindAwareness = setupAwareness(provider.awareness, config.userName);

    // Bind stores bidirectionally
    _unbindStores = bindStores(doc);

    // Register remote update check so historyStore skips remote changes
    registerRemoteUpdateCheck(isRemoteUpdate);

    // Monitor connection state
    provider.on('synced', () => {
      useCollabStore.getState().setConnectionStatus('connected');
    });

    // Update URL with room hash
    setRoomIdInUrl(config.roomId);

    store.setConnectionStatus('connected');
    store.setError(null);
  } catch (err) {
    store.setError(err instanceof Error ? err.message : 'Connection failed');
    store.setConnectionStatus('error');
    store.setIsCollaborating(false);
    throw err;
  }
}

/**
 * Refresh the room URL — leave the current room, generate a new room ID,
 * and rejoin with the same diagram state. The new share link replaces the old.
 * Returns the new room ID.
 */
export async function refreshRoom(): Promise<string> {
  const store = useCollabStore.getState();
  const userName = store.localUser?.name || localStorage.getItem('charthero-collab-name') || 'Anonymous';

  // Leave current room (diagram state stays in Zustand stores)
  await leaveRoom();

  // Create new room with fresh ID
  const newRoomId = generateRoomId();
  await joinRoom({ roomId: newRoomId, userName });
  return newRoomId;
}

/**
 * Leave the current room and clean up all resources.
 */
export async function leaveRoom(): Promise<void> {
  _unbindStores?.();
  _unbindStores = null;
  _unbindAwareness?.();
  _unbindAwareness = null;
  unregisterRemoteUpdateCheck();
  destroyProvider();
  destroyDoc();
  clearRoomFromUrl();
  useCollabStore.getState().reset();
}

// Re-export utilities
export {
  generateRoomId,
  getRoomIdFromUrl,
  buildShareUrl,
  broadcastCursorPosition,
  broadcastSelection,
  clearCursorPosition,
  updateUserName,
  isRemoteUpdate,
  getProvider,
};
