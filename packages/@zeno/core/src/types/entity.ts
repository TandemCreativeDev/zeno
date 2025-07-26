/**
 * Entity schema type definitions for database entities
 */

export interface DbConstraints {
  type: string;
  length?: number;
  precision?: number;
  scale?: number;
  nullable?: boolean;
  default?: string | number | boolean;
  primaryKey?: boolean;
  unique?: boolean;
  references?: {
    table: string;
    column: string;
    onDelete?: "cascade" | "restrict" | "set null";
  };
}

export interface ValidationRules {
  required?: boolean;
  min?: number;
  max?: number;
  email?: boolean;
  url?: boolean;
  pattern?: string;
}

export interface UiMetadata {
  label?: string;
  placeholder?: string;
  helpText?: string;
  section?: string;
  readonly?: boolean;
  type?: string;
  accept?: string;
  format?: "datetime" | "currency";
}

export interface EntityColumn {
  dbConstraints: DbConstraints;
  validation?: ValidationRules;
  ui?: UiMetadata;
}

export interface EntityIndex {
  columns: string[];
  unique?: boolean;
}

export interface EntityRelationship {
  type: "many-to-one" | "one-to-many";
  table: string;
  foreignKey?: string;
}

export interface FormSection {
  name: string;
  title: string;
  fields: string[];
  collapsible?: boolean;
  defaultOpen?: boolean;
}

export interface EntityVisibility {
  form?: {
    create?: string[];
    edit?: string[];
    hidden?: string[];
  };
  table?: {
    list?: string[];
    hidden?: string[];
  };
}

export interface EntityUi {
  listFields?: string[];
  searchFields?: string[];
  sortField?: string;
  sortOrder?: "asc" | "desc";
  formSections?: FormSection[];
  visibility?: EntityVisibility;
}

export interface EntitySchema {
  tableName: string;
  displayName: string;
  icon?: string;
  description?: string;
  generateForm?: boolean;
  generateTable?: boolean;
  generateAPI?: boolean;
  generatePages?: boolean;
  columns: Record<string, EntityColumn>;
  indexes?: Record<string, EntityIndex>;
  relationships?: Record<string, EntityRelationship>;
  ui?: EntityUi;
  seedData?: Record<string, unknown>[];
}