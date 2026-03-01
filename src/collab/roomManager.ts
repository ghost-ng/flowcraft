// Room creation and URL hash management

/**
 * Generate a random MD5-style room ID (32-char hex hash).
 * Uses Web Crypto API for randomness.
 */
export function generateRoomId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Extract room ID from URL hash (e.g., #room=abc123def456...) */
export function getRoomIdFromUrl(): string | null {
  const hash = window.location.hash;
  const match = hash.match(/room=([a-fA-F0-9]{32})/);
  return match ? match[1] : null;
}

/** Set the room ID in the URL hash */
export function setRoomIdInUrl(roomId: string): void {
  const url = new URL(window.location.href);
  url.hash = `room=${roomId}`;
  window.history.replaceState(null, '', url.toString());
}

/** Remove the room from the URL hash */
export function clearRoomFromUrl(): void {
  window.history.replaceState(null, '', window.location.pathname + window.location.search);
}

/** Build a full shareable URL for a room */
export function buildShareUrl(roomId: string): string {
  const url = new URL(window.location.href);
  url.hash = `room=${roomId}`;
  return url.toString();
}
