/**
 * Abstract Generator base class for all code generators
 *
 * @fileoverview Provides the foundation for all Zeno generators with common
 * lifecycle methods, validation, and file generation capabilities.
 */

import type { GeneratorContext, GeneratedFile, SchemaSet } from "./types/core";
import type { EntitySchema } from "./types/entity";
import type { EnumSchema } from "./types/enum";
import type { PageSchema } from "./types/page";

/**
 * Supported schema types for generator filtering
 */
export type SchemaType = "entity" | "enum" | "page" | "app";

/**
 * Abstract base class for all Zeno generators
 *
 * Each generator is responsible for transforming schema definitions into
 * specific output files (models, components, pages, API routes, etc.)
 */
export abstract class Generator {
  /**
   * Unique identifier for this generator
   */
  abstract readonly name: string;

  /**
   * Generate files from the provided schemas and context
   *
   * @param context - Generator context containing schemas, config, and paths
   * @returns Promise resolving to array of generated files
   */
  abstract generate(context: GeneratorContext): Promise<GeneratedFile[]>;

  /**
   * Determine if this generator supports the given schema type
   *
   * @param schemaType - Type of schema to check support for
   * @returns true if this generator can process the schema type
   */
  abstract supports(schemaType: SchemaType): boolean;

  /**
   * Validate generator configuration and context
   *
   * @param context - Generator context to validate
   * @throws {Error} When context is invalid or missing required configuration
   */
  protected validateContext(context: GeneratorContext): void {
    if (!context.schemas) {
      throw new Error(
        `Generator ${this.name}: schemas are required in context`
      );
    }

    if (!context.outputDir) {
      throw new Error(
        `Generator ${this.name}: outputDir is required in context`
      );
    }

    if (!context.schemaDir) {
      throw new Error(
        `Generator ${this.name}: schemaDir is required in context`
      );
    }
  }

  /**
   * Filter schemas by type that this generator supports
   *
   * @param schemas - Complete schema set to filter
   * @returns Filtered schemas that this generator can process
   */
  protected filterSupportedSchemas(schemas: SchemaSet): {
    entities: Map<string, EntitySchema>;
    enums: Map<string, EnumSchema>;
    pages: Map<string, PageSchema>;
  } {
    const result = {
      entities: new Map<string, EntitySchema>(),
      enums: new Map<string, EnumSchema>(),
      pages: new Map<string, PageSchema>(),
    };

    if (this.supports("entity")) {
      result.entities = schemas.entities;
    }

    if (this.supports("enum")) {
      result.enums = schemas.enums;
    }

    if (this.supports("page")) {
      result.pages = schemas.pages;
    }

    return result;
  }

  /**
   * Template method for the generation process
   *
   * Validates context, filters schemas, and delegates to the concrete generate method
   *
   * @param context - Generator context
   * @returns Promise resolving to array of generated files
   */
  async run(context: GeneratorContext): Promise<GeneratedFile[]> {
    this.validateContext(context);
    return this.generate(context);
  }

  /**
   * Check if the generator has any applicable schemas to process
   *
   * @param schemas - Schema set to check
   * @returns true if there are schemas this generator can process
   */
  hasApplicableSchemas(schemas: SchemaSet): boolean {
    const filtered = this.filterSupportedSchemas(schemas);
    return (
      filtered.entities.size > 0 ||
      filtered.enums.size > 0 ||
      filtered.pages.size > 0 ||
      (this.supports("app") && schemas.app !== undefined)
    );
  }
}
