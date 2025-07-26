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

export type TemplateHelper = (...args: unknown[]) => unknown;

export interface TemplateEngine {
  registerHelper(name: string, fn: TemplateHelper): void;
  registerPartial(name: string, template: string): void;
  render(template: string, data: unknown): string;
}