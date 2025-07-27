/**
 * Generation pipeline for coordinating multiple generators
 *
 * @fileoverview Manages the registration and execution of generators,
 * providing parallel processing and dependency management for optimal
 * performance during code generation.
 */

import type { Generator } from "./Generator";
import type { GeneratedFile, GeneratorContext, SchemaSet } from "./types/core";
import { GenerationError } from "./utils/errors";

/**
 * Generation result containing all generated files and metadata
 */
export interface GenerationResult {
  files: GeneratedFile[];
  generators: string[];
  duration: number;
  errors: Error[];
}

/**
 * Schema change information for incremental generation
 */
export interface SchemaChange {
  type: "created" | "updated" | "deleted";
  path: string;
  schemaType: "entity" | "enum" | "page" | "app";
  name: string;
}

/**
 * Generation pipeline options
 */
export interface GenerationOptions {
  generators?: string[];
  parallel?: boolean;
  dryRun?: boolean;
}

/**
 * Core pipeline for running generators with parallel execution support
 *
 * Coordinates multiple generators to transform schema definitions into
 * output files, providing performance optimizations through parallel
 * processing and intelligent dependency management.
 */
export class GenerationPipeline {
  private generators = new Map<string, Generator>();

  /**
   * Register a generator with the pipeline
   *
   * @param generator - Generator instance to register
   * @returns this for method chaining
   * @throws {GenerationError} When generator name conflicts
   */
  register(generator: Generator): this {
    if (this.generators.has(generator.name)) {
      throw new GenerationError(
        `Generator '${generator.name}' is already registered`,
        "GenerationPipeline"
      );
    }

    this.generators.set(generator.name, generator);
    return this;
  }

  /**
   * Unregister a generator from the pipeline
   *
   * @param name - Name of generator to remove
   * @returns true if generator was removed, false if not found
   */
  unregister(name: string): boolean {
    return this.generators.delete(name);
  }

  /**
   * Get list of registered generator names
   *
   * @returns Array of generator names
   */
  getRegisteredGenerators(): string[] {
    return Array.from(this.generators.keys());
  }

  /**
   * Check if a generator is registered
   *
   * @param name - Generator name to check
   * @returns true if generator is registered
   */
  hasGenerator(name: string): boolean {
    return this.generators.has(name);
  }

  /**
   * Generate files from schemas using all applicable generators
   *
   * @param schemas - Schema set to generate from
   * @param config - Generation configuration
   * @param options - Generation options for filtering and performance
   * @returns Promise resolving to generation result
   */
  async generate(
    schemas: SchemaSet,
    config: Record<string, unknown>,
    options: GenerationOptions = {}
  ): Promise<GenerationResult> {
    const startTime = Date.now();
    const context: GeneratorContext = {
      schemas,
      config,
      outputDir: config.outputDir as string,
      schemaDir: config.schemaDir as string,
    };

    const applicableGenerators = this.getApplicableGenerators(
      schemas,
      options.generators
    );

    if (applicableGenerators.length === 0) {
      return {
        files: [],
        generators: [],
        duration: Date.now() - startTime,
        errors: [],
      };
    }

    const files: GeneratedFile[] = [];
    const errors: Error[] = [];
    const usedGenerators: string[] = [];

    if (options.parallel !== false && applicableGenerators.length > 1) {
      // Parallel execution
      const results = await Promise.allSettled(
        applicableGenerators.map(async (generator) => {
          const generatedFiles = await generator.run(context);
          return { generator: generator.name, files: generatedFiles };
        })
      );

      for (const result of results) {
        if (result.status === "fulfilled") {
          files.push(...result.value.files);
          usedGenerators.push(result.value.generator);
        } else {
          errors.push(result.reason);
        }
      }
    } else {
      // Sequential execution
      for (const generator of applicableGenerators) {
        try {
          const generatedFiles = await generator.run(context);
          files.push(...generatedFiles);
          usedGenerators.push(generator.name);
        } catch (error) {
          errors.push(error as Error);
        }
      }
    }

    return {
      files,
      generators: usedGenerators,
      duration: Date.now() - startTime,
      errors,
    };
  }

  /**
   * Generate files for incremental changes only
   *
   * @param _changes - Array of schema changes
   * @param _config - Generation configuration
   * @param _options - Generation options
   * @returns Promise resolving to generation result
   */
  async generateChanges(
    _changes: SchemaChange[],
    _config: Record<string, unknown>,
    _options: GenerationOptions = {}
  ): Promise<GenerationResult> {
    // For now, this is a placeholder that would eventually implement
    // intelligent incremental generation based on dependency analysis
    // Currently falls back to full generation
    throw new GenerationError(
      "Incremental generation not yet implemented",
      "GenerationPipeline"
    );
  }

  /**
   * Get generators that can process the given schemas
   *
   * @param schemas - Schema set to check
   * @param filterNames - Optional array of generator names to filter by
   * @returns Array of applicable generators
   */
  private getApplicableGenerators(
    schemas: SchemaSet,
    filterNames?: string[]
  ): Generator[] {
    const candidates = filterNames
      ? (filterNames
          .map((name) => this.generators.get(name))
          .filter(Boolean) as Generator[])
      : Array.from(this.generators.values());

    return candidates.filter((generator) =>
      generator.hasApplicableSchemas(schemas)
    );
  }
}
