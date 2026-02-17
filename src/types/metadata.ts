// ---------------------------------------------------------------------------
// metadata.ts -- Node metadata, custom fields, and conditional formatting
// ---------------------------------------------------------------------------

// ---- Supported field value types ------------------------------------------

export type FieldType =
  | 'text'
  | 'number'
  | 'date'
  | 'boolean'
  | 'url'
  | 'email'
  | 'select'
  | 'multiSelect'
  | 'color'
  | 'rating';

// ---- Custom field definition ----------------------------------------------

export interface CustomFieldDefinition {
  /** Unique field key. */
  id: string;
  /** Display label. */
  label: string;
  /** Data type of the field value. */
  type: FieldType;
  /** Whether this field is required on every node. */
  required?: boolean;
  /** Default value for new nodes. */
  defaultValue?: unknown;
  /** Allowed values (for 'select' / 'multiSelect' types). */
  options?: string[];
  /** Placeholder text shown in the input. */
  placeholder?: string;
  /** Ordering index in the metadata panel. */
  order?: number;
}

// ---- Custom field value (actual data stored on a node) --------------------

export interface CustomField {
  /** References CustomFieldDefinition.id. */
  fieldId: string;
  /** The stored value. Type depends on the field definition. */
  value: unknown;
}

// ---- Conditional formatting rule ------------------------------------------

export type ConditionalOperator =
  | 'equals'
  | 'notEquals'
  | 'contains'
  | 'greaterThan'
  | 'lessThan'
  | 'greaterThanOrEqual'
  | 'lessThanOrEqual'
  | 'isEmpty'
  | 'isNotEmpty'
  | 'between';

export interface ConditionalFormatRule {
  /** Unique rule identifier. */
  id: string;
  /** Human-readable rule name. */
  name?: string;
  /** The field id to evaluate. */
  fieldId: string;
  /** Comparison operator. */
  operator: ConditionalOperator;
  /** Value(s) to compare against. */
  value?: unknown;
  /** Second value for 'between' operator. */
  valueTo?: unknown;
  /** Style overrides to apply when the condition is met. */
  style: {
    fill?: string;
    stroke?: string;
    fontColor?: string;
    icon?: string;
    badge?: string;
  };
  /** Whether this rule is active. */
  enabled: boolean;
  /** Priority (lower = evaluated first, first match wins). */
  priority: number;
}

// ---- Full node metadata bag -----------------------------------------------

export interface NodeMetadata {
  /** Custom field values attached to this node. */
  customFields?: CustomField[];
  /** Tags for filtering / grouping. */
  tags?: string[];
  /** User who created the node. */
  createdBy?: string;
  /** ISO 8601 creation timestamp. */
  createdAt?: string;
  /** ISO 8601 last-modified timestamp. */
  updatedAt?: string;
  /** Arbitrary notes / rich-text description. */
  notes?: string;
  /** Priority level (application-defined). */
  priority?: 'low' | 'medium' | 'high' | 'critical';
  /** Status label (application-defined). */
  status?: string;
  /** URL reference for external linking. */
  url?: string;
  /** Numeric weight / duration used in dependency analysis. */
  weight?: number;
}
