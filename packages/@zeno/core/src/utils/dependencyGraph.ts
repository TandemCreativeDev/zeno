/**
 * Dependency graph for tracking file generation relationships
 *
 * @fileoverview Provides dependency tracking to determine which generated
 * files need regeneration when schemas change, enabling efficient
 * incremental generation.
 */

import type {
  AffectedFile,
  DependencyGraph,
  DetailedSchemaChange,
  FieldChange,
} from "../types/core";

/**
 * Implementation of dependency graph for file generation tracking
 *
 * Tracks relationships between schema files and generated output files,
 * enabling precise incremental regeneration when schemas change.
 */
export class GenerationDependencyGraph implements DependencyGraph {
  private dependencies = new Map<string, Set<string>>();
  private reverseDependencies = new Map<string, Set<string>>();

  /**
   * Add a dependency relationship between files
   *
   * @param from - Source file path
   * @param to - Dependent file path
   */
  addDependency(from: string, to: string): void {
    if (!this.dependencies.has(from)) {
      this.dependencies.set(from, new Set());
    }
    if (!this.reverseDependencies.has(to)) {
      this.reverseDependencies.set(to, new Set());
    }

    this.dependencies.get(from)?.add(to);
    this.reverseDependencies.get(to)?.add(from);
  }

  /**
   * Get all files that depend on the given file
   *
   * @param file - File path to check dependencies for
   * @returns Array of dependent file paths
   */
  getDependents(file: string): string[] {
    return Array.from(this.dependencies.get(file) || []);
  }

  /**
   * Get all files affected by schema changes
   *
   * @param changes - Schema changes to analyze
   * @returns Array of affected files with generation details
   */
  getAffectedFiles(changes: DetailedSchemaChange[]): AffectedFile[] {
    const affectedFiles = new Map<string, AffectedFile>();

    for (const change of changes) {
      const files = this.getFilesForSchemaChange(change);

      for (const file of files) {
        if (!affectedFiles.has(file.path)) {
          affectedFiles.set(file.path, file);
        } else {
          // Merge reasons for multiple changes affecting same file
          const existing = affectedFiles.get(file.path);
          if (!existing) continue;
          existing.reason.push(...file.reason);
          existing.dependencies = Array.from(
            new Set([...existing.dependencies, ...file.dependencies])
          );
        }
      }
    }

    return Array.from(affectedFiles.values());
  }

  private getFilesForSchemaChange(
    change: DetailedSchemaChange
  ): AffectedFile[] {
    const files: AffectedFile[] = [];
    const { schemaType } = change;

    switch (schemaType) {
      case "entity":
        files.push(...this.getEntityAffectedFiles(change));
        break;
      case "enum":
        files.push(...this.getEnumAffectedFiles(change));
        break;
      case "page":
        files.push(...this.getPageAffectedFiles(change));
        break;
      case "app":
        files.push(...this.getAppAffectedFiles(change));
        break;
    }

    return files;
  }

  private getEntityAffectedFiles(change: DetailedSchemaChange): AffectedFile[] {
    const { name, type, fieldChanges } = change;
    const files: AffectedFile[] = [];

    // Defensive check - ensure we have required data
    if (!name || !type) {
      return files;
    }

    // Model files always affected
    files.push({
      path: `src/models/${name}.ts`,
      generator: "models",
      reason: [`Entity ${name} ${type}`],
      dependencies: [`entities/${name}.json`],
    });

    // Migration files for schema changes
    if (this.isDbSchemaChange(fieldChanges)) {
      files.push({
        path: `drizzle/migrations/${Date.now()}_${name}_${type}.sql`,
        generator: "models",
        reason: [`Database schema change for entity ${name}`],
        dependencies: [`entities/${name}.json`],
      });
    }

    // Component files if form/table generation enabled
    if (this.hasUiChanges(fieldChanges)) {
      files.push(
        {
          path: `src/components/${name}/${name}Form.tsx`,
          generator: "components",
          reason: [`Form component for entity ${name} ${type}`],
          dependencies: [`entities/${name}.json`],
        },
        {
          path: `src/components/${name}/${name}Table.tsx`,
          generator: "components",
          reason: [`Table component for entity ${name} ${type}`],
          dependencies: [`entities/${name}.json`],
        },
        {
          path: `src/components/${name}/${name}Modal.tsx`,
          generator: "components",
          reason: [`Modal component for entity ${name} ${type}`],
          dependencies: [`entities/${name}.json`],
        }
      );
    }

    // API routes if enabled
    if (this.hasApiChanges(fieldChanges)) {
      files.push({
        path: `src/app/api/${name}/route.ts`,
        generator: "api",
        reason: [`API routes for entity ${name} ${type}`],
        dependencies: [`entities/${name}.json`],
      });
    }

    // Page files if page generation enabled
    if (this.hasPageChanges(fieldChanges)) {
      files.push(
        {
          path: `src/app/${name}/page.tsx`,
          generator: "pages",
          reason: [`List page for entity ${name} ${type}`],
          dependencies: [`entities/${name}.json`],
        },
        {
          path: `src/app/${name}/create/page.tsx`,
          generator: "pages",
          reason: [`Create page for entity ${name} ${type}`],
          dependencies: [`entities/${name}.json`],
        },
        {
          path: `src/app/${name}/[id]/page.tsx`,
          generator: "pages",
          reason: [`Detail page for entity ${name} ${type}`],
          dependencies: [`entities/${name}.json`],
        },
        {
          path: `src/app/${name}/[id]/edit/page.tsx`,
          generator: "pages",
          reason: [`Edit page for entity ${name} ${type}`],
          dependencies: [`entities/${name}.json`],
        }
      );
    }

    return files;
  }

  private getEnumAffectedFiles(change: DetailedSchemaChange): AffectedFile[] {
    const { name, type } = change;
    const files: AffectedFile[] = [];

    // Defensive check
    if (!name || !type) {
      return files;
    }

    // Enum model file
    files.push({
      path: `src/models/enums/${name}.ts`,
      generator: "models",
      reason: [`Enum ${name} ${type}`],
      dependencies: [`enums/${name}.json`],
    });

    // Check if any entities use this enum - would need additional logic
    // For now, assume it affects all related entity files
    files.push({
      path: `src/models/index.ts`,
      generator: "models",
      reason: [`Re-export updated due to enum ${name} ${type}`],
      dependencies: [`enums/${name}.json`],
    });

    return files;
  }

  private getPageAffectedFiles(change: DetailedSchemaChange): AffectedFile[] {
    const { name, type } = change;

    // Defensive check
    if (!name || !type) {
      return [];
    }

    return [
      {
        path: `src/app/${name}/page.tsx`,
        generator: "pages",
        reason: [`Custom page ${name} ${type}`],
        dependencies: [`pages/${name}.json`],
      },
    ];
  }

  private getAppAffectedFiles(change: DetailedSchemaChange): AffectedFile[] {
    const { type, fieldChanges } = change;
    const files: AffectedFile[] = [];

    // Defensive check
    if (!type) {
      return files;
    }

    // Root layout potentially affected
    files.push({
      path: "src/app/layout.tsx",
      generator: "pages",
      reason: [`App configuration ${type}`],
      dependencies: ["app.json"],
    });

    // Navigation if structure changes
    if (this.hasNavigationChanges(fieldChanges)) {
      files.push({
        path: "src/components/Navigation.tsx",
        generator: "pages",
        reason: [`Navigation updated due to app ${type}`],
        dependencies: ["app.json"],
      });
    }

    // Auth configuration if auth settings changed
    if (this.hasAuthChanges(fieldChanges)) {
      files.push({
        path: "src/app/api/auth/[...nextauth]/route.ts",
        generator: "api",
        reason: [`Auth configuration ${type}`],
        dependencies: ["app.json"],
      });
    }

    return files;
  }

  private isDbSchemaChange(fieldChanges?: FieldChange[]): boolean {
    if (!fieldChanges || !Array.isArray(fieldChanges)) return false;
    return fieldChanges.some(
      (change) =>
        change &&
        change.field &&
        (change.field === "columns" ||
          change.field === "tableName" ||
          change.field === "dbConstraints")
    );
  }

  private hasUiChanges(fieldChanges?: FieldChange[]): boolean {
    if (!fieldChanges || !Array.isArray(fieldChanges)) return true; // Default to regenerating UI
    return fieldChanges.some(
      (change) =>
        change &&
        change.field &&
        (change.field === "generateForm" ||
          change.field === "generateTable" ||
          change.field === "columns" ||
          change.field === "ui" ||
          change.field === "displayName" ||
          change.field === "tableName") // Table name changes can affect component names
    );
  }

  private hasApiChanges(fieldChanges?: FieldChange[]): boolean {
    if (!fieldChanges || !Array.isArray(fieldChanges)) return true; // Default to regenerating API
    return fieldChanges.some(
      (change) =>
        change &&
        change.field &&
        (change.field === "generateApi" ||
          change.field === "columns" ||
          change.field === "validation")
    );
  }

  private hasPageChanges(fieldChanges?: FieldChange[]): boolean {
    if (!fieldChanges || !Array.isArray(fieldChanges)) return true; // Default to regenerating pages
    return fieldChanges.some(
      (change) =>
        change &&
        change.field &&
        (change.field === "generatePages" ||
          change.field === "generateForm" ||
          change.field === "generateTable" ||
          change.field === "displayName")
    );
  }

  private hasNavigationChanges(fieldChanges?: FieldChange[]): boolean {
    if (!fieldChanges || !Array.isArray(fieldChanges)) return false;
    return fieldChanges.some(
      (change) =>
        change &&
        change.field &&
        (change.field === "navigation" || change.field === "name")
    );
  }

  private hasAuthChanges(fieldChanges?: FieldChange[]): boolean {
    if (!fieldChanges || !Array.isArray(fieldChanges)) return false;
    return fieldChanges.some(
      (change) =>
        change &&
        change.field &&
        (change.field === "auth" || change.field === "email")
    );
  }

  /**
   * Clear all dependencies
   */
  clear(): void {
    this.dependencies.clear();
    this.reverseDependencies.clear();
  }

  /**
   * Get dependency statistics
   */
  getStats(): { totalFiles: number; totalDependencies: number } {
    const totalFiles = this.dependencies.size;
    let totalDependencies = 0;
    for (const deps of this.dependencies.values()) {
      totalDependencies += deps.size;
    }
    return { totalFiles, totalDependencies };
  }
}

/**
 * Create a new dependency graph instance
 */
export function createDependencyGraph(): GenerationDependencyGraph {
  return new GenerationDependencyGraph();
}
