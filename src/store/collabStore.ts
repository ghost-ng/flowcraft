// ---------------------------------------------------------------------------
// Collaboration Store — local state for real-time collaboration session
// ---------------------------------------------------------------------------

import { create } from 'zustand';
import type { CollabUser, CollabState } from '../collab/types';

export interface CollabStoreState extends CollabState {
  // Actions
  setConnectionStatus: (status: CollabState['connectionStatus']) => void;
  setRoomId: (roomId: string | null) => void;
  setLocalUser: (user: CollabUser | null) => void;
  setRemoteUsers: (users: CollabUser[]) => void;
  updateRemoteUser: (clientId: number, patch: Partial<CollabUser>) => void;
  removeRemoteUser: (clientId: number) => void;
  setError: (error: string | null) => void;
  setIsCollaborating: (value: boolean) => void;
  reset: () => void;
}

const INITIAL_STATE: CollabState = {
  isCollaborating: false,
  roomId: null,
  connectionStatus: 'disconnected',
  localUser: null,
  remoteUsers: [],
  error: null,
};

export const useCollabStore = create<CollabStoreState>()((set) => ({
  ...INITIAL_STATE,

  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),

  setRoomId: (roomId) => set({ roomId }),

  setLocalUser: (localUser) => set({ localUser }),

  setRemoteUsers: (remoteUsers) => set({ remoteUsers }),

  updateRemoteUser: (clientId, patch) =>
    set((s) => ({
      remoteUsers: s.remoteUsers.map((u) =>
        u.clientId === clientId ? { ...u, ...patch } : u,
      ),
    })),

  removeRemoteUser: (clientId) =>
    set((s) => ({
      remoteUsers: s.remoteUsers.filter((u) => u.clientId !== clientId),
    })),

  setError: (error) => set({ error }),

  setIsCollaborating: (isCollaborating) => set({ isCollaborating }),

  reset: () => set(INITIAL_STATE),
}));
