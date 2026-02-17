// ---------------------------------------------------------------------------
// comments.ts -- Commenting and annotation types
// ---------------------------------------------------------------------------

// ---- Annotation visual types ----------------------------------------------

export type AnnotationType =
  | 'comment'
  | 'note'
  | 'warning'
  | 'question'
  | 'approval'
  | 'rejection';

// ---- Where a comment is anchored ------------------------------------------

export type CommentAnchorTarget = 'node' | 'edge' | 'canvas';

export interface CommentAnchor {
  /** What kind of element the comment is attached to. */
  targetType: CommentAnchorTarget;
  /** Id of the node or edge. Null when targetType === 'canvas'. */
  targetId: string | null;
  /** Canvas position where the comment marker is placed. */
  position: { x: number; y: number };
}

// ---- Individual comment ---------------------------------------------------

export interface Comment {
  /** Unique comment identifier. */
  id: string;
  /** The comment text (supports basic markdown). */
  body: string;
  /** Author display name. */
  author: string;
  /** Optional author avatar URL. */
  avatarUrl?: string;
  /** ISO 8601 creation timestamp. */
  createdAt: string;
  /** ISO 8601 last-edited timestamp (undefined if never edited). */
  editedAt?: string;
  /** Whether this comment has been resolved. */
  resolved: boolean;
  /** Visual annotation type. */
  annotationType: AnnotationType;
}

// ---- Threaded conversation ------------------------------------------------

export interface CommentThread {
  /** Unique thread identifier. */
  id: string;
  /** Where on the diagram this thread is anchored. */
  anchor: CommentAnchor;
  /** The root comment that started the thread. */
  rootComment: Comment;
  /** Replies in chronological order. */
  replies: Comment[];
  /** Whether the entire thread is resolved. */
  resolved: boolean;
  /** Whether the thread is collapsed in the UI. */
  collapsed?: boolean;
  /** ISO 8601 timestamp of the most recent activity. */
  lastActivityAt: string;
}
