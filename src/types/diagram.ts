// ---------------------------------------------------------------------------
// diagram.ts -- Complete diagram file schema (save / load / JSON)
// ---------------------------------------------------------------------------

import type { Viewport } from '@xyflow/react';
import type { FlowNode } from './nodes';
import type { FlowEdge } from './edges';
import type { DiagramStyleId, PaletteId, AutoColorMode } from './styles';
import type { SwimlaneConfig } from './swimlanes';
import type { Layer } from './layers';
import type { CustomBlockDefinition } from './customBlocks';
import type { CustomFieldDefinition, ConditionalFormatRule } from './metadata';
import type { CommentThread } from './comments';
import type { AppSettings } from './settings';

// ---- Schema version -------------------------------------------------------

/**
 * Increment this whenever the DiagramFile shape changes in a
 * backwards-incompatible way. Migrations can key off this value.
 */
export type DiagramSchemaVersion = 1;

// ---- Diagram metadata -----------------------------------------------------

export interface DiagramMeta {
  /** Human-readable diagram title. */
  title: string;
  /** Optional description / summary. */
  description?: string;
  /** Author display name. */
  author?: string;
  /** ISO 8601 creation timestamp. */
  createdAt: string;
  /** ISO 8601 last-saved timestamp. */
  updatedAt: string;
  /** Arbitrary key-value tags for categorization. */
  tags?: string[];
  /** Application version that produced this file. */
  appVersion: string;
}

// ---- Undo / redo snapshot -------------------------------------------------

export interface HistoryEntry {
  /** Snapshot of nodes at this point. */
  nodes: FlowNode[];
  /** Snapshot of edges at this point. */
  edges: FlowEdge[];
  /** ISO 8601 timestamp of when this snapshot was taken. */
  timestamp: string;
  /** Short description of the action (e.g. "Add node"). */
  label?: string;
}

// ---- Full diagram file ----------------------------------------------------

export interface DiagramFile {
  /** Schema version for forward-compatible parsing. */
  schemaVersion: DiagramSchemaVersion;

  /** Diagram metadata. */
  meta: DiagramMeta;

  // -- Core graph data ------------------------------------------------------

  /** All nodes in the diagram. */
  nodes: FlowNode[];
  /** All edges in the diagram. */
  edges: FlowEdge[];

  // -- Visual configuration -------------------------------------------------

  /** Active diagram style preset id. */
  diagramStyleId: DiagramStyleId;
  /** Active color palette id. */
  paletteId: PaletteId;
  /** Auto-coloring strategy. */
  autoColorMode: AutoColorMode;

  /** Viewport / camera state at save time. */
  viewport?: Viewport;

  // -- Structural features --------------------------------------------------

  /** Swimlane configuration (if any). */
  swimlanes?: SwimlaneConfig;
  /** Layer definitions. */
  layers?: Layer[];

  // -- Custom content -------------------------------------------------------

  /** User-created custom block definitions. */
  customBlocks?: CustomBlockDefinition[];
  /** Custom field schemas applied to node metadata. */
  customFieldDefinitions?: CustomFieldDefinition[];
  /** Conditional formatting rules. */
  conditionalFormatRules?: ConditionalFormatRule[];

  // -- Collaboration --------------------------------------------------------

  /** Comment threads anchored to the diagram. */
  commentThreads?: CommentThread[];

  // -- Settings snapshot ----------------------------------------------------

  /** Diagram-level settings (subset of AppSettings). */
  settings?: Partial<AppSettings>;

  // -- History (optional, not persisted to JSON by default) -----------------

  /** Undo history stack. */
  undoStack?: HistoryEntry[];
  /** Redo history stack. */
  redoStack?: HistoryEntry[];
}
