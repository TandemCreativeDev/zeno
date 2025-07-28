/**
 * Schema change diffing utilities for incremental generation
 *
 * @fileoverview Provides functionality to compare schema versions
 * and determine what specific changes occurred, enabling intelligent
 * incremental generation strategies.
 */

import type {
  DetailedSchemaChange,
  FieldChange,
  SchemaDiffResult,
  SchemaSet,
} from "../types/core";
import type { EntitySchema } from "../types/entity";
import type { EnumSchema } from "../types/enum";
import type { PageSchema } from "../types/page";
import { createDependencyGraph } from "./dependencyGraph";

/**
 * Schema differ for detecting and analysing changes between schema versions
 */
export class SchemaDiffer {
  private dependencyGraph = createDependencyGraph();
  /**
   * Compare two schema sets and return detailed changes
   *
   * @param oldSchemas - Previous schema set
   * @param newSchemas - Current schema set
   * @returns Detailed diff result
   */
  compareSchemaSet(
    oldSchemas: SchemaSet,
    newSchemas: SchemaSet
  ): SchemaDiffResult {
    const changes: DetailedSchemaChange[] = [];

    // Compare entities
    changes.push(
      ...this.compareEntities(oldSchemas.entities, newSchemas.entities)
    );

    // Compare enums
    changes.push(...this.compareEnums(oldSchemas.enums, newSchemas.enums));

    // Compare pages
    changes.push(...this.comparePages(oldSchemas.pages, newSchemas.pages));

    // Compare app config
    if (!this.deepEqual(oldSchemas.app, newSchemas.app)) {
      changes.push({
        type: "updated",
        path: "app.json",
        schemaType: "app",
        name: "app",
        previousSchema: oldSchemas.app,
        currentSchema: newSchemas.app,
        fieldChanges: this.compareObjects(oldSchemas.app, newSchemas.app),
      });
    }

    const affectedFiles = this.dependencyGraph.getAffectedFiles(changes);

    return {
      changes,
      hasBreakingChanges: this.hasBreakingChanges(changes),
      affectedGenerators: this.getAffectedGenerators(changes),
      affectedFiles,
    };
  }

  private compareEntities(
    oldEntities: Map<string, EntitySchema>,
    newEntities: Map<string, EntitySchema>
  ): DetailedSchemaChange[] {
    const changes: DetailedSchemaChange[] = [];
    const allNames = new Set([...oldEntities.keys(), ...newEntities.keys()]);

    for (const name of allNames) {
      const oldEntity = oldEntities.get(name);
      const newEntity = newEntities.get(name);

      if (!oldEntity && newEntity) {
        // Created
        changes.push({
          type: "created",
          path: `entities/${name}.json`,
          schemaType: "entity",
          name,
          currentSchema: newEntity,
        });
      } else if (oldEntity && !newEntity) {
        // Deleted
        changes.push({
          type: "deleted",
          path: `entities/${name}.json`,
          schemaType: "entity",
          name,
          previousSchema: oldEntity,
        });
      } else if (
        oldEntity &&
        newEntity &&
        !this.deepEqual(oldEntity, newEntity)
      ) {
        // Updated
        changes.push({
          type: "updated",
          path: `entities/${name}.json`,
          schemaType: "entity",
          name,
          previousSchema: oldEntity,
          currentSchema: newEntity,
          fieldChanges: this.compareObjects(oldEntity, newEntity),
        });
      }
    }

    return changes;
  }

  private compareEnums(
    oldEnums: Map<string, EnumSchema>,
    newEnums: Map<string, EnumSchema>
  ): DetailedSchemaChange[] {
    const changes: DetailedSchemaChange[] = [];
    const allNames = new Set([...oldEnums.keys(), ...newEnums.keys()]);

    for (const name of allNames) {
      const oldEnum = oldEnums.get(name);
      const newEnum = newEnums.get(name);

      if (!oldEnum && newEnum) {
        changes.push({
          type: "created",
          path: `enums/${name}.json`,
          schemaType: "enum",
          name,
          currentSchema: newEnum,
        });
      } else if (oldEnum && !newEnum) {
        changes.push({
          type: "deleted",
          path: `enums/${name}.json`,
          schemaType: "enum",
          name,
          previousSchema: oldEnum,
        });
      } else if (oldEnum && newEnum && !this.deepEqual(oldEnum, newEnum)) {
        changes.push({
          type: "updated",
          path: `enums/${name}.json`,
          schemaType: "enum",
          name,
          previousSchema: oldEnum,
          currentSchema: newEnum,
          fieldChanges: this.compareObjects(oldEnum, newEnum),
        });
      }
    }

    return changes;
  }

  private comparePages(
    oldPages: Map<string, PageSchema>,
    newPages: Map<string, PageSchema>
  ): DetailedSchemaChange[] {
    const changes: DetailedSchemaChange[] = [];
    const allNames = new Set([...oldPages.keys(), ...newPages.keys()]);

    for (const name of allNames) {
      const oldPage = oldPages.get(name);
      const newPage = newPages.get(name);

      if (!oldPage && newPage) {
        changes.push({
          type: "created",
          path: `pages/${name}.json`,
          schemaType: "page",
          name,
          currentSchema: newPage,
        });
      } else if (oldPage && !newPage) {
        changes.push({
          type: "deleted",
          path: `pages/${name}.json`,
          schemaType: "page",
          name,
          previousSchema: oldPage,
        });
      } else if (oldPage && newPage && !this.deepEqual(oldPage, newPage)) {
        changes.push({
          type: "updated",
          path: `pages/${name}.json`,
          schemaType: "page",
          name,
          previousSchema: oldPage,
          currentSchema: newPage,
          fieldChanges: this.compareObjects(oldPage, newPage),
        });
      }
    }

    return changes;
  }

  private compareObjects(oldObj: unknown, newObj: unknown): FieldChange[] {
    const changes: FieldChange[] = [];

    if (
      typeof oldObj !== "object" ||
      typeof newObj !== "object" ||
      oldObj === null ||
      newObj === null
    ) {
      return changes;
    }

    const oldRecord = oldObj as Record<string, unknown>;
    const newRecord = newObj as Record<string, unknown>;
    const allKeys = new Set([
      ...Object.keys(oldRecord),
      ...Object.keys(newRecord),
    ]);

    for (const key of allKeys) {
      const oldValue = oldRecord[key];
      const newValue = newRecord[key];

      if (!(key in oldRecord) && key in newRecord) {
        changes.push({
          field: key,
          type: "added",
          newValue,
        });
      } else if (key in oldRecord && !(key in newRecord)) {
        changes.push({
          field: key,
          type: "removed",
          oldValue,
        });
      } else if (!this.deepEqual(oldValue, newValue)) {
        changes.push({
          field: key,
          type: "modified",
          oldValue,
          newValue,
        });
      }
    }

    return changes;
  }

  private hasBreakingChanges(changes: DetailedSchemaChange[]): boolean {
    return changes.some((change) => {
      // Entity/enum deletions are breaking
      if (
        change.type === "deleted" &&
        (change.schemaType === "entity" || change.schemaType === "enum")
      ) {
        return true;
      }

      // Field changes that affect database schema
      if (change.fieldChanges) {
        return change.fieldChanges.some((fieldChange) => {
          // Only consider certain field changes as breaking
          if (fieldChange.type === "removed") {
            // Removing columns or core fields is breaking
            if (
              fieldChange.field === "columns" ||
              fieldChange.field === "values" ||
              fieldChange.field === "tableName"
            ) {
              return true;
            }
          }
          return false;
        });
      }

      return false;
    });
  }

  private getAffectedGenerators(changes: DetailedSchemaChange[]): string[] {
    const generators = new Set<string>();

    for (const change of changes) {
      switch (change.schemaType) {
        case "entity":
          generators.add("models");
          generators.add("components");
          generators.add("api");
          if (
            change.fieldChanges?.some(
              (fc) =>
                fc.field === "generateForm" ||
                fc.field === "generateTable" ||
                fc.field === "generatePages"
            )
          ) {
            generators.add("pages");
          }
          break;
        case "enum":
          generators.add("models");
          break;
        case "page":
          generators.add("pages");
          break;
        case "app":
          generators.add("pages");
          generators.add("api");
          break;
      }
    }

    return Array.from(generators);
  }

  private deepEqual(a: unknown, b: unknown): boolean {
    if (a === b) return true;

    if (a === null || b === null || a === undefined || b === undefined) {
      return a === b;
    }

    if (typeof a !== typeof b) return false;

    if (typeof a !== "object") return false;

    if (Array.isArray(a) !== Array.isArray(b)) return false;

    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      return a.every((item, index) => this.deepEqual(item, b[index]));
    }

    const aRecord = a as Record<string, unknown>;
    const bRecord = b as Record<string, unknown>;
    const aKeys = Object.keys(aRecord);
    const bKeys = Object.keys(bRecord);

    if (aKeys.length !== bKeys.length) return false;

    return aKeys.every(
      (key) => bKeys.includes(key) && this.deepEqual(aRecord[key], bRecord[key])
    );
  }
}

/**
 * Create a new schema differ instance
 */
export function createSchemaDiffer(): SchemaDiffer {
  return new SchemaDiffer();
}
