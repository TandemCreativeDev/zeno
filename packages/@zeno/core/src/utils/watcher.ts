/**
 * File watching system for development mode with debounced change detection
 *
 * @fileoverview Provides file watching capabilities for schema directories,
 * implementing debounced change detection and schema diffing to trigger
 * incremental generation efficiently.
 */

import { EventEmitter } from "node:events";
import { basename, extname, join, relative } from "node:path";
import { watch } from "chokidar";
import type {
  DetailedSchemaChange,
  SchemaChange,
  SchemaSet,
  WatchOptions,
} from "../types/core";
import { GenerationError } from "./errors";
import { createSchemaDiffer } from "./schemaDiff";
import { createSchemaLoader } from "./schemaLoader";

interface WatcherEvents {
  change: [changes: DetailedSchemaChange[]];
  error: [error: Error];
  ready: [];
}

/**
 * File watcher for schema directories with intelligent change detection
 *
 * Monitors schema files for changes and provides debounced notifications
 * with detailed change information for incremental generation.
 */
export class Watcher extends EventEmitter<WatcherEvents> {
  private chokidarWatcher: ReturnType<typeof watch> | undefined;
  private debounceTimer: NodeJS.Timeout | undefined;
  private pendingChanges = new Map<string, SchemaChange>();
  private schemaLoader = createSchemaLoader();
  private schemaDiffer = createSchemaDiffer();
  private currentSchemas?: SchemaSet;
  private isWatching = false;

  constructor(
    private readonly schemaDir: string,
    private readonly options: WatchOptions = {}
  ) {
    super();
    this.setMaxListeners(20); // Allow multiple listeners for different generators
  }

  /**
   * Start watching the schema directory
   *
   * @throws {GenerationError} When already watching or directory doesn't exist
   */
  async start(): Promise<void> {
    if (this.isWatching) {
      throw new GenerationError("Watcher is already running", "Watcher");
    }

    try {
      // Load initial schemas for comparison
      this.currentSchemas = await this.schemaLoader.load(this.schemaDir);
    } catch (error) {
      throw new GenerationError(
        `Failed to load initial schemas: ${error instanceof Error ? error.message : String(error)}`,
        "Watcher"
      );
    }

    const watchPaths = [
      join(this.schemaDir, "entities/**/*.json"),
      join(this.schemaDir, "enums/**/*.json"),
      join(this.schemaDir, "pages/**/*.json"),
      join(this.schemaDir, "app.json"),
    ];

    const defaultIgnored = [
      "**/node_modules/**",
      "**/.git/**",
      "**/dist/**",
      "**/*.tmp",
      "**/*.temp",
    ];

    this.chokidarWatcher = watch(watchPaths, {
      ignoreInitial: this.options.ignoreInitial ?? true,
      ignored: [...defaultIgnored, ...(this.options.ignored ?? [])],
      persistent: true,
      depth: 10,
    });

    this.chokidarWatcher
      .on("add", (path) => this.handleFileChange("created", path))
      .on("change", (path) => this.handleFileChange("updated", path))
      .on("unlink", (path) => this.handleFileChange("deleted", path))
      .on("error", (error) => this.emit("error", error as Error))
      .on("ready", () => {
        this.isWatching = true;
        this.emit("ready");
      });
  }

  /**
   * Stop watching and cleanup resources
   */
  async stop(): Promise<void> {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = undefined;
    }

    if (this.chokidarWatcher) {
      await this.chokidarWatcher.close();
      this.chokidarWatcher = undefined;
    }

    this.isWatching = false;
    this.pendingChanges.clear();
    this.removeAllListeners();
  }

  /**
   * Check if the watcher is currently active
   */
  get watching(): boolean {
    return this.isWatching;
  }

  /**
   * Get the current schema directory being watched
   */
  get watchedDirectory(): string {
    return this.schemaDir;
  }

  private handleFileChange(type: SchemaChange["type"], filePath: string): void {
    const change = this.createSchemaChange(type, filePath);

    if (change) {
      this.pendingChanges.set(filePath, change);

      // Clear existing timer and set new one
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer);
      }

      this.debounceTimer = setTimeout(() => {
        this.flushPendingChanges();
      }, this.options.debounceMs ?? 300);
    }
  }

  private createSchemaChange(
    type: SchemaChange["type"],
    filePath: string
  ): SchemaChange | null {
    const relativePath = relative(this.schemaDir, filePath);

    // Only process JSON files
    if (extname(filePath) !== ".json") {
      return null;
    }

    // Determine schema type from path
    let schemaType: SchemaChange["schemaType"];
    let name: string;

    if (relativePath.startsWith("entities/")) {
      schemaType = "entity";
      name = basename(filePath, ".json");
    } else if (relativePath.startsWith("enums/")) {
      schemaType = "enum";
      name = basename(filePath, ".json");
    } else if (relativePath.startsWith("pages/")) {
      schemaType = "page";
      name = basename(filePath, ".json");
    } else if (relativePath === "app.json") {
      schemaType = "app";
      name = "app";
    } else {
      // Unknown file, ignore
      return null;
    }

    return {
      type,
      path: filePath,
      schemaType,
      name,
    };
  }

  private async flushPendingChanges(): Promise<void> {
    const changes = Array.from(this.pendingChanges.values());
    this.pendingChanges.clear();

    if (changes.length === 0) {
      return;
    }

    try {
      // Perform schema diffing to enhance change information
      const enhancedChanges = await this.enhanceChangesWithDiff(changes);
      this.emit("change", enhancedChanges);
    } catch (error) {
      this.emit("error", error as Error);
    }
  }

  private async enhanceChangesWithDiff(
    changes: SchemaChange[]
  ): Promise<DetailedSchemaChange[]> {
    if (!this.currentSchemas) {
      // If we don't have previous schemas, treat all as simple changes
      return changes.map((change) => ({ ...change }));
    }

    try {
      // Load new schemas
      const newSchemas = await this.schemaLoader.load(this.schemaDir);

      // Perform diff against current schemas
      const diffResult = this.schemaDiffer.compareSchemaSet(
        this.currentSchemas,
        newSchemas
      );

      // Update current schemas
      this.currentSchemas = newSchemas;

      // Return enhanced changes from diff
      return diffResult.changes;
    } catch (_error) {
      // If diffing fails, return basic changes
      return changes.map((change) => ({ ...change }));
    }
  }
}

/**
 * Create a new watcher instance
 *
 * @param schemaDir - Directory to watch for schema changes
 * @param options - Watcher configuration options
 * @returns New Watcher instance
 */
export function createWatcher(
  schemaDir: string,
  options: WatchOptions = {}
): Watcher {
  return new Watcher(schemaDir, options);
}
