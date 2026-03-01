// Default signaling servers for y-webrtc
export const DEFAULT_SIGNALING_SERVERS = [
  'wss://signaling.yjs.dev',
  'wss://y-webrtc-signaling-eu.herokuapp.com',
  'wss://y-webrtc-signaling-us.herokuapp.com',
];

// 12-color palette for user cursor colors
export const USER_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#8b5cf6', '#d946ef', '#ec4899', '#f43f5e',
  '#06b6d4', '#84cc16',
];

// Room ID prefix to namespace rooms
export const ROOM_PREFIX = 'charthero-';

// Position update throttle (ms)
export const POSITION_FLUSH_INTERVAL = 50;
