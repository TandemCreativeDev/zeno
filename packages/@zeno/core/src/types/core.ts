/**
 * Core type definitions for schema loading and generation
 */

import type { AppSchema } from "./app";
import type { EntitySchema } from "./entity";
import type { EnumSchema } from "./enum";
import type { PageSchema } from "./page";

export interface SchemaSet {
  entities: Map<string, EntitySchema>;
  enums: Map<string, EnumSchema>;
  pages: Map<string, PageSchema>;
  app: AppSchema;
}

export interface SchemaChange {
  type: "created" | "updated" | "deleted";
  path: string;
  schemaType: "entity" | "enum" | "page" | "app";
  name: string;
}

export interface FieldChange {
  field: string;
  type: "added" | "removed" | "modified";
  oldValue?: unknown;
  newValue?: unknown;
}

export interface GeneratedFile {
  path: string;
  content: string;
}

export interface GeneratorContext {
  schemas: SchemaSet;
  outputDir: string;
  schemaDir: string;
  config: Record<string, unknown>;
}

export interface GenerationOptions {
  generators?: string[];
  parallel?: boolean;
  dryRun?: boolean;
}

export interface GenerationResult {
  files: GeneratedFile[];
  generators: string[];
  duration: number;
  errors: Error[];
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  message: string;
  path: string;
  line?: number;
  column?: number;
}

export type TemplateHelper = (...args: unknown[]) => unknown;

export interface TemplateEngine {
  registerHelper(name: string, fn: TemplateHelper): void;
  registerPartial(name: string, template: string): void;
  render(template: string, data: unknown): string;
}

export interface WatchOptions {
  debounceMs?: number;
  ignoreInitial?: boolean;
  ignored?: string[];
}

export interface DetailedSchemaChange extends SchemaChange {
  fieldChanges?: FieldChange[];
  previousSchema?: unknown;
  currentSchema?: unknown;
}

export interface SchemaDiffResult {
  changes: DetailedSchemaChange[];
  hasBreakingChanges: boolean;
  affectedGenerators: string[];
  affectedFiles: AffectedFile[];
}

export interface AffectedFile {
  path: string;
  generator: string;
  reason: string[];
  dependencies: string[];
}

export interface DependencyGraph {
  getAffectedFiles(changes: DetailedSchemaChange[]): AffectedFile[];
  addDependency(from: string, to: string): void;
  getDependents(file: string): string[];
}
