// ---------------------------------------------------------------------------
// cursorUrls.ts -- Custom cursor URLs for edge interactions
// ---------------------------------------------------------------------------

import cursorCrosshair from '../../assets/cursors/cursor_crosshair.png';
import cursorElbowMove from '../../assets/cursors/cursor_elbow_move.png';

/** Crosshair cursor for connection/reconnection handles (hotspot at center of 32x32) */
export const CURSOR_CROSSHAIR = `url(${cursorCrosshair}) 16 16, crosshair`;

/** Elbow-move cursor for drag-to-cycle connector type (hotspot at center of 32x32) */
export const CURSOR_ELBOW_MOVE = `url(${cursorElbowMove}) 16 16, grab`;
