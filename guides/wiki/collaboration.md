# Live Collaboration

Chart Hero supports real-time peer-to-peer collaboration so multiple people can edit the same diagram simultaneously. No server or account is required -- everything runs directly between browsers using WebRTC.

![Collaboration Panel](../../assets/readme/collab-panel.png)

---

## How It Works

Chart Hero uses **Yjs** (a CRDT library) and **y-webrtc** to synchronize diagram state between peers. When you create or join a room, your browser connects directly to other participants via WebRTC. A lightweight signaling server is used only for the initial handshake -- all diagram data flows peer-to-peer.

- **No server stores your data** -- diagrams never leave participants' browsers
- **No account required** -- just share a room link
- **Lazy-loaded** -- collaboration code only loads when you use it; solo mode is unaffected
- **Zero memory footprint** -- rooms are fully ephemeral with no server-side state

---

## Starting a Session

1. Click the **Users** icon in the toolbar (or look for the collaboration button near the AI assistant)
2. Enter your **display name** (saved for future sessions)
3. Click **Start New Session**
4. A unique room link is generated with a random 32-character ID
5. Share the link with collaborators

---

## Joining a Session

1. Open the room link shared by another user -- you'll join automatically
2. Or click the **Users** icon, paste the room link or ID into the **Room Link or ID** field, and click **Join Session**

When joining via URL, a name prompt appears if you haven't set one before.

---

## What Syncs

Everything in the diagram syncs in real time:

| Data | Sync Behavior |
|------|---------------|
| **Nodes** | Position, size, color, label, shape, icons, status pucks, all properties |
| **Edges** | Source, target, type, color, label, thickness, arrowheads |
| **Swimlanes** | Lanes, orientation, colors, collapsed state, borders, labels |
| **Legends** | Both node and swimlane legends with items, position, visibility |
| **Banners** | Top and bottom banner text, colors, height, font |
| **Layers** | Layer order, visibility, lock state, opacity |
| **Styles** | Active diagram style, palette, auto-color mode |

---

## Presence Features

### Remote Cursors

Other users' mouse positions appear on the canvas as colored arrows with name labels. Cursors update at ~20 frames per second and stay correctly positioned regardless of zoom or pan.

### Selection Highlighting

When another user selects a node, you'll see a colored ring around that node with their name badge. This lets you know what others are working on.

### Join / Leave / Rename Notifications

A small notification briefly appears below the collaboration icon when a user joins, leaves, or changes their display name. Notifications auto-dismiss after a few seconds. Name changes show the old and new name side by side.

### User Avatars

When collaborating, colored initial circles appear next to the collaboration button showing who's connected (up to 6 visible, with an overflow count).

---

## Editing Your Name

You can change your display name during a session:

1. Open the collaboration panel (click the Users icon)
2. Hover over your name in the **Connected Users** list
3. Click the pencil icon that appears
4. Type your new name and press **Enter** (or click away to save)

Your name updates instantly for all connected users. Other participants see a notification showing the old and new name.

---

## Refreshing the Room URL

You can generate a new room link at any time during a session:

1. Open the collaboration panel
2. Click the **refresh** button (circular arrows icon) next to the share link
3. A new 32-character room ID is generated, the old room is left, and you rejoin a fresh room automatically

Your diagram state carries over -- only the room ID changes. Share the new link with collaborators. Participants still in the old room will need the new link to reconnect.

---

## Conflict Resolution

Chart Hero uses CRDTs (Conflict-free Replicated Data Types) to merge simultaneous edits:

| Scenario | Resolution |
|----------|-----------|
| Two users move the same node | Last writer wins (per coordinate) |
| Two users edit the same label | Last writer wins |
| One user deletes a node another is editing | Delete wins |
| Two users add different nodes | Both appear (no conflict) |
| Two users change different properties of the same node | Both changes apply |

---

## Leaving a Session

Click the **Leave Session** button in the collaboration panel, or simply close the browser tab. Other users will see you disconnect.

When all users leave, the room is destroyed. Your local diagram remains saved in browser storage via auto-save.

---

## Technical Details

- **Protocol**: WebRTC (peer-to-peer) via y-webrtc
- **Data format**: Yjs CRDT document with Y.Map and Y.Array shared types
- **Room IDs**: Random 32-character hexadecimal strings (MD5-style)
- **Signaling**: Public Yjs signaling servers (used only for initial peer discovery)
- **Bundle impact**: ~58 KB gzip, loaded only when collaboration is activated
- **Max peers**: 20 simultaneous connections per room
- **Optional room password**: Supported via y-webrtc encryption

---

## Room Lifecycle & Memory

Rooms are **fully ephemeral** -- there is no server-side storage or allocation:

- **One room per browser** -- the Y.Doc and WebRTC provider are singletons. Each user can only be in one room at a time. Starting or joining a new room automatically cleans up the previous one.
- **No server persistence** -- the Yjs signaling servers (`wss://signaling.yjs.dev`) only relay WebRTC handshake messages. They do not store room state, track room existence, or allocate resources per room. A "room" is just a string ID that peers agree on.
- **Rooms vanish when empty** -- when all participants leave (or close their browser tabs), the room ceases to exist. There is nothing to clean up because nothing was stored.
- **Refresh is free** -- the refresh-room-URL button leaves the old room (destroying the local Y.Doc and WebRTC connections) and creates a new one. The old room ID becomes immediately orphaned and unreachable.
- **Memory is bounded by diagram size** -- the only in-browser memory footprint is the single Y.Doc for the current session. CRDT operation history grows with the number of edits, but this is inherently bounded by what fits on a diagram canvas.
- **Zero overhead when not collaborating** -- all collaboration code is lazy-loaded. Solo-mode users never download or execute any Yjs/WebRTC code.

In short, rooms cannot proliferate or leak memory. Each browser holds at most one room, and that room disappears entirely when left.

---

## Limitations

- **No persistence** -- rooms exist only while at least one user is connected. Rely on auto-save or manual export for backups.
- **No offline sync** -- if you disconnect and reconnect, changes made while offline will attempt to merge, but extended offline editing may cause unexpected results.
- **Signaling dependency** -- the initial connection requires access to public signaling servers. Once connected, data flows peer-to-peer.
