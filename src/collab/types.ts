// Collaboration type definitions

export interface CollabUser {
  clientId: number;
  name: string;
  color: string;
  cursor: { x: number; y: number } | null;
  selectedNodeIds: string[];
  selectedEdgeIds: string[];
  lastActive: number;
}

export interface CollabState {
  isCollaborating: boolean;
  roomId: string | null;
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
  localUser: CollabUser | null;
  remoteUsers: CollabUser[];
  error: string | null;
}

export interface RoomConfig {
  roomId: string;
  userName: string;
  password?: string;
}
