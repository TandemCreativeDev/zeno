/**
 * Core type definitions for schema loading and generation
 */

import type { AppSchema } from "../validation/appSchema";
import type { EntitySchema } from "../validation/entitySchema";
import type { EnumSchema } from "../validation/enumSchema";
import type { PageSchema } from "../validation/pageSchema";

export interface SchemaSet {
  entities: Map<string, EntitySchema>;
  enums: Map<string, EnumSchema>;
  pages: Map<string, PageSchema>;
  app: AppSchema;
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