/**
 * Loads and validates entity schemas from the specified directory.
 * @param schemaDir - Path to directory containing schema files
 * @returns Validated schema set ready for generation
 * @throws {SchemaValidationError} When schema files are invalid
 */

import { readFile, readdir, stat } from "node:fs/promises";
import { join, extname, basename } from "node:path";

import { validateSchemaSet } from "./validation";

import type { SchemaSet, ValidationResult } from "./types/core";
import type { AppSchema } from "./types/app";
import type { EntitySchema } from "./types/entity";
import type { EnumSchema } from "./types/enum";
import type { PageSchema } from "./types/page";

export class SchemaValidationError extends Error {
  constructor(
    message: string,
    public readonly filePath: string,
    public readonly lineNumber?: number
  ) {
    super(message);
    this.name = "SchemaValidationError";
  }
}

export class SchemaLoader {
  /**
   * Loads and validates all schemas from the specified directory
   */
  async load(schemaDir: string): Promise<SchemaSet> {
    const entities = new Map<string, EntitySchema>();
    const enums = new Map<string, EnumSchema>();
    const pages = new Map<string, PageSchema>();
    let app: AppSchema;

    const entitiesPath = join(schemaDir, "entities");
    const enumsPath = join(schemaDir, "enums");
    const pagesPath = join(schemaDir, "pages");
    const appPath = join(schemaDir, "app.json");

    try {
      const [entitiesData, enumsData, pagesData, appData] = await Promise.all([
        this.loadDirectory(entitiesPath),
        this.loadDirectory(enumsPath),
        this.loadDirectory(pagesPath),
        this.loadFile(appPath),
      ]);

      for (const [name, data] of entitiesData) {
        entities.set(name, data as EntitySchema);
      }

      for (const [name, data] of enumsData) {
        enums.set(name, data as EnumSchema);
      }

      for (const [name, data] of pagesData) {
        pages.set(name, data as PageSchema);
      }

      app = appData as AppSchema;

      const validation = this.validate(entities, enums, pages, app, schemaDir);

      if (!validation.valid) {
        const firstError = validation.errors[0];
        if (firstError) {
          throw new SchemaValidationError(
            firstError.message,
            firstError.path,
            firstError.line
          );
        }
        throw new SchemaValidationError(
          "Schema validation failed",
          schemaDir
        );
      }

      return { entities, enums, pages, app };
    } catch (error) {
      if (error instanceof SchemaValidationError) {
        throw error;
      }
      
      throw new SchemaValidationError(
        `Failed to load schemas: ${error instanceof Error ? error.message : String(error)}`,
        schemaDir
      );
    }
  }

  /**
   * Validates a complete schema set for consistency and references
   */
  validate(
    entities: Map<string, unknown>,
    enums: Map<string, unknown>,
    pages: Map<string, unknown>,
    app: unknown,
    basePath: string
  ): ValidationResult {
    return validateSchemaSet(entities, enums, pages, app, basePath);
  }

  /**
   * Loads all JSON files from a directory
   */
  private async loadDirectory(dirPath: string): Promise<Map<string, unknown>> {
    const files = new Map<string, unknown>();

    try {
      const dirStat = await stat(dirPath);
      if (!dirStat.isDirectory()) {
        return files;
      }

      const entries = await readdir(dirPath);

      for (const entry of entries) {
        if (extname(entry) === ".json") {
          const filePath = join(dirPath, entry);
          const name = basename(entry, ".json");
          const data = await this.loadFile(filePath);
          files.set(name, data);
        }
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return files;
      }
      throw error;
    }

    return files;
  }

  /**
   * Loads and parses a single JSON file
   */
  private async loadFile(filePath: string): Promise<unknown> {
    try {
      const content = await readFile(filePath, "utf-8");
      return JSON.parse(content);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        throw new SchemaValidationError(`Schema file not found`, filePath);
      }
      
      if (error instanceof SyntaxError) {
        throw new SchemaValidationError(`Invalid JSON syntax`, filePath);
      }
      
      throw new SchemaValidationError(
        `Failed to read file: ${error instanceof Error ? error.message : String(error)}`,
        filePath
      );
    }
  }
}

export function createSchemaLoader(): SchemaLoader {
  return new SchemaLoader();
}