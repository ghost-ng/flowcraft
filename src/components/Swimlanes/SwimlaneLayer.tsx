import React, { useMemo } from 'react';
import { useViewport } from '@xyflow/react';

import {
  useSwimlaneStore,
  type SwimlaneItem,
} from '../../store/swimlaneStore';
import { useStyleStore } from '../../store/styleStore';
import LaneHeader from './LaneHeader';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const H_HEADER_WIDTH = 40; // px - width of horizontal lane headers (left column)
const V_HEADER_HEIGHT = 32; // px - height of vertical lane headers (top row)
const TITLE_HEIGHT = 28; // px - container title bar height

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build an array of lane bounds from the lane items. */
function computeBounds(
  lanes: SwimlaneItem[],
  _direction: 'horizontal' | 'vertical',
  headerOffset: number,
): Array<{ lane: SwimlaneItem; offset: number; size: number }> {
  const sorted = [...lanes].sort((a, b) => a.order - b.order);
  const result: Array<{ lane: SwimlaneItem; offset: number; size: number }> = [];
  let cursor = headerOffset;

  for (const lane of sorted) {
    const effectiveSize = lane.collapsed ? 32 : lane.size;
    result.push({ lane, offset: cursor, size: effectiveSize });
    cursor += effectiveSize;
  }

  return result;
}

// ---------------------------------------------------------------------------
// SwimlaneLayer
// ---------------------------------------------------------------------------

const SwimlaneLayer: React.FC = () => {
  const config = useSwimlaneStore((s) => s.config);
  const containerOffset = useSwimlaneStore((s) => s.containerOffset);
  const darkMode = useStyleStore((s) => s.darkMode);
  const viewport = useViewport();

  const hLanes = config.horizontal;
  const vLanes = config.vertical;
  const hasHLanes = hLanes.length > 0;
  const hasVLanes = vLanes.length > 0;

  // Determine the active rendering mode
  const isMatrix = hasHLanes && hasVLanes;

  // Compute lane bounds
  const hBounds = useMemo(() => {
    if (!hasHLanes) return [];
    const headerOffset = hasVLanes ? V_HEADER_HEIGHT : 0;
    return computeBounds(hLanes, 'horizontal', headerOffset);
  }, [hLanes, hasVLanes, hasHLanes]);

  const vBounds = useMemo(() => {
    if (!hasVLanes) return [];
    const headerOffset = hasHLanes ? H_HEADER_WIDTH : 0;
    return computeBounds(vLanes, 'vertical', headerOffset);
  }, [vLanes, hasHLanes, hasVLanes]);

  // If no lanes at all, render nothing
  if (!hasHLanes && !hasVLanes) return null;

  // Total dimensions
  const totalWidth = hasVLanes
    ? vBounds.reduce((sum, b) => Math.max(sum, b.offset + b.size), 0)
    : 2000;
  const totalHeight = hasHLanes
    ? hBounds.reduce((sum, b) => Math.max(sum, b.offset + b.size), 0)
    : 2000;

  return (
    <div
      className="absolute inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 0 }}
    >
      {/* This inner div transforms with the ReactFlow viewport */}
      <div
        style={{
          position: 'absolute',
          transformOrigin: '0 0',
          transform: `translate(${viewport.x + containerOffset.x * viewport.zoom}px, ${viewport.y + containerOffset.y * viewport.zoom}px) scale(${viewport.zoom})`,
          width: totalWidth,
          height: totalHeight,
        }}
      >
        {/* ---- Container title ---- */}
        {config.containerTitle && (
          <div
            style={{
              position: 'absolute',
              top: -TITLE_HEIGHT,
              left: hasHLanes ? H_HEADER_WIDTH : 0,
              height: TITLE_HEIGHT,
              display: 'flex',
              alignItems: 'center',
              paddingLeft: 8,
              fontSize: 13,
              fontWeight: 700,
              color: darkMode ? '#f1f5f9' : '#0f172a',
              whiteSpace: 'nowrap',
              userSelect: 'none',
            }}
          >
            {config.containerTitle}
          </div>
        )}

        {/* ---- Horizontal lane backgrounds and dividers ---- */}
        {hasHLanes &&
          hBounds.map(({ lane, offset, size }, idx) => (
            <React.Fragment key={`h-${lane.id}`}>
              {/* Background band */}
              <div
                style={{
                  position: 'absolute',
                  left: hasVLanes ? H_HEADER_WIDTH : H_HEADER_WIDTH,
                  top: offset,
                  width: totalWidth - (hasVLanes ? H_HEADER_WIDTH : H_HEADER_WIDTH),
                  height: size,
                  backgroundColor: lane.color,
                  opacity: darkMode ? 0.12 : 0.15,
                  pointerEvents: 'none',
                }}
              />
              {/* Divider line (between lanes, not before the first) */}
              {idx > 0 && (
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: offset,
                    width: totalWidth,
                    height: 1,
                    backgroundColor: darkMode
                      ? 'rgba(148,163,184,0.3)'
                      : 'rgba(100,116,139,0.25)',
                    pointerEvents: 'none',
                  }}
                />
              )}
            </React.Fragment>
          ))}

        {/* ---- Vertical lane backgrounds and dividers ---- */}
        {hasVLanes &&
          vBounds.map(({ lane, offset, size }, idx) => (
            <React.Fragment key={`v-${lane.id}`}>
              {/* Background band */}
              <div
                style={{
                  position: 'absolute',
                  left: offset,
                  top: hasHLanes ? V_HEADER_HEIGHT : V_HEADER_HEIGHT,
                  width: size,
                  height: totalHeight - (hasHLanes ? V_HEADER_HEIGHT : V_HEADER_HEIGHT),
                  backgroundColor: lane.color,
                  opacity: darkMode ? 0.1 : 0.12,
                  pointerEvents: 'none',
                }}
              />
              {/* Divider line */}
              {idx > 0 && (
                <div
                  style={{
                    position: 'absolute',
                    left: offset,
                    top: 0,
                    width: 1,
                    height: totalHeight,
                    backgroundColor: darkMode
                      ? 'rgba(148,163,184,0.3)'
                      : 'rgba(100,116,139,0.25)',
                    pointerEvents: 'none',
                  }}
                />
              )}
            </React.Fragment>
          ))}

        {/* ---- Matrix cell borders (when both H and V exist) ---- */}
        {isMatrix &&
          hBounds.map(({ lane: hLane, offset: hOffset, size: hSize }) =>
            vBounds.map(({ lane: vLane, offset: vOffset, size: vSize }) => (
              <div
                key={`cell-${hLane.id}-${vLane.id}`}
                style={{
                  position: 'absolute',
                  left: vOffset,
                  top: hOffset,
                  width: vSize,
                  height: hSize,
                  border: `1px solid ${
                    darkMode
                      ? 'rgba(148,163,184,0.12)'
                      : 'rgba(100,116,139,0.1)'
                  }`,
                  pointerEvents: 'none',
                }}
              />
            )),
          )}

        {/* ---- Horizontal lane headers (left side) ---- */}
        {hasHLanes &&
          hBounds.map(({ lane, offset, size }) => (
            <LaneHeader
              key={`hdr-h-${lane.id}`}
              laneId={lane.id}
              label={lane.label}
              color={lane.color}
              orientation="horizontal"
              offset={offset}
              size={size}
              darkMode={darkMode}
            />
          ))}

        {/* ---- Vertical lane headers (top side) ---- */}
        {hasVLanes &&
          vBounds.map(({ lane, offset, size }) => (
            <LaneHeader
              key={`hdr-v-${lane.id}`}
              laneId={lane.id}
              label={lane.label}
              color={lane.color}
              orientation="vertical"
              offset={offset}
              size={size}
              darkMode={darkMode}
            />
          ))}

        {/* ---- Outer border ---- */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: totalWidth,
            height: totalHeight,
            border: `1px solid ${
              darkMode ? 'rgba(148,163,184,0.25)' : 'rgba(100,116,139,0.2)'
            }`,
            borderRadius: 4,
            pointerEvents: 'none',
          }}
        />
      </div>
    </div>
  );
};

export default React.memo(SwimlaneLayer);
