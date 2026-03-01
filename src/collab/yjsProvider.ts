// WebRTC provider management
import { WebrtcProvider } from 'y-webrtc';
import type * as Y from 'yjs';
import type { RoomConfig } from './types';
import { DEFAULT_SIGNALING_SERVERS, ROOM_PREFIX } from './constants';

let _provider: WebrtcProvider | null = null;

export function createProvider(doc: Y.Doc, config: RoomConfig): WebrtcProvider {
  destroyProvider();

  _provider = new WebrtcProvider(
    `${ROOM_PREFIX}${config.roomId}`,
    doc,
    {
      signaling: DEFAULT_SIGNALING_SERVERS,
      password: config.password ?? undefined,
      maxConns: 20,
    },
  );

  return _provider;
}

export function getProvider(): WebrtcProvider | null {
  return _provider;
}

export function destroyProvider(): void {
  if (_provider) {
    _provider.destroy();
    _provider = null;
  }
}
