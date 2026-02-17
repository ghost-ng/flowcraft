// ---------------------------------------------------------------------------
// types/index.ts -- Barrel re-export for all FlowCraft type definitions
// ---------------------------------------------------------------------------

// Nodes
export type {
  ShapeType,
  ArrowShapeType,
  DependencyStatus,
  LaneAssignment,
  FlowNodeData,
  FlowNode,
} from './nodes';

// Edges
export type {
  EdgePathType,
  DependencyType,
  ArrowheadType,
  ArrowheadSize,
  ArrowheadEndConfig,
  FlowEdgeData,
  FlowEdge,
} from './edges';

// Styles
export type {
  DiagramStyleId,
  PaletteId,
  GridStyle,
  CanvasStyle,
  NodeStyleDefaults,
  EdgeStyleDefaults,
  DiagramStyle,
  NodeStyleOverrides,
  EdgeStyleOverrides,
  AutoColorMode,
} from './styles';

// Swimlanes
export type {
  LaneOrientation,
  DividerStyle,
  Lane,
  SwimlaneConfig,
  MatrixCell,
} from './swimlanes';

// Dependencies
export type {
  DependencyLink,
  DependencyChain,
  CriticalPath,
  DependencyCounts,
  DependencyStats,
} from './dependencies';

// Export
export type {
  ExportFormat,
  ExportScope,
  ExportOptionsBase,
  PngExportOptions,
  JpgExportOptions,
  SvgExportOptions,
  PdfPageSize,
  PdfOrientation,
  PdfExportOptions,
  PptxExportOptions,
  JsonExportOptions,
  ExportOptions,
} from './export';

// Settings
export type {
  SnapSettings,
  InteractionSettings,
  CanvasSettings,
  LayoutDirection,
  LayoutAlgorithm,
  AutoLayoutSettings,
  EdgeSettings,
  AccessibilitySettings,
  AppSettings,
} from './settings';

// Custom blocks
export type {
  BlockCategory,
  HandlePosition,
  HandleDefinition,
  TextZone,
  PathPoint,
  CustomBlockDefinition,
} from './customBlocks';

// Arrowheads
export type {
  ArrowheadConfig,
  MarkerDef,
} from './arrowheads';

// Arrow shapes
export type {
  ArrowDirection,
  ArrowProperties,
  ArrowShapeDefinition,
} from './arrowShapes';

// Layers
export type { Layer } from './layers';

// Metadata
export type {
  FieldType,
  CustomFieldDefinition,
  CustomField,
  ConditionalOperator,
  ConditionalFormatRule,
  NodeMetadata,
} from './metadata';

// Comments
export type {
  AnnotationType,
  CommentAnchorTarget,
  CommentAnchor,
  Comment,
  CommentThread,
} from './comments';

// Diagram file
export type {
  DiagramSchemaVersion,
  DiagramMeta,
  HistoryEntry,
  DiagramFile,
} from './diagram';
