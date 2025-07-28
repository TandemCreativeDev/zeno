/**
 * Unit tests for the SchemaDiffer class
 */

import { describe, expect, it } from "vitest";
import type { AppSchema } from "../../types/app";
import type { SchemaSet } from "../../types/core";
import type { EntitySchema } from "../../types/entity";
import type { EnumSchema } from "../../types/enum";
import type { PageSchema } from "../../types/page";
import { createSchemaDiffer } from "../schemaDiff";

describe("SchemaDiffer", () => {
  const differ = createSchemaDiffer();

  const mockEntityV1: EntitySchema = {
    tableName: "users",
    displayName: "Users",
    columns: {
      id: {
        dbConstraints: {
          type: "serial",
          primaryKey: true,
        },
      },
      email: {
        dbConstraints: {
          type: "varchar",
          length: 255,
          unique: true,
        },
      },
    },
  };

  const mockEntityV2: EntitySchema = {
    tableName: "users",
    displayName: "Users",
    columns: {
      id: {
        dbConstraints: {
          type: "serial",
          primaryKey: true,
        },
      },
      email: {
        dbConstraints: {
          type: "varchar",
          length: 255,
          unique: true,
        },
      },
      name: {
        dbConstraints: {
          type: "varchar",
          length: 100,
        },
      },
    },
  };

  const mockEnum: EnumSchema = {
    values: {
      ACTIVE: { label: "Active" },
      INACTIVE: { label: "Inactive" },
    },
  };

  const mockPage: PageSchema = {
    route: "/users",
    title: "Users",
    sections: [],
  };

  const mockApp: AppSchema = {
    name: "Test App",
    description: "A test application for schema diffing",
    url: "https://example.com",
  };

  const createSchemaSet = (overrides: Partial<SchemaSet> = {}): SchemaSet => ({
    entities: new Map([["users", mockEntityV1]]),
    enums: new Map([["status", mockEnum]]),
    pages: new Map([["users", mockPage]]),
    app: mockApp,
    ...overrides,
  });

  describe("compareSchemaSet", () => {
    it("should detect no changes when schemas are identical", () => {
      const schemaSet = createSchemaSet();
      const result = differ.compareSchemaSet(schemaSet, schemaSet);

      expect(result.changes).toHaveLength(0);
      expect(result.hasBreakingChanges).toBe(false);
      expect(result.affectedGenerators).toHaveLength(0);
      expect(result.affectedFiles).toHaveLength(0);
    });

    it("should detect entity creation", () => {
      const oldSchemas = createSchemaSet({
        entities: new Map(),
      });
      const newSchemas = createSchemaSet();

      const result = differ.compareSchemaSet(oldSchemas, newSchemas);

      expect(result.changes).toHaveLength(1);
      expect(result.changes[0]).toMatchObject({
        type: "created",
        schemaType: "entity",
        name: "users",
        path: "entities/users.json",
      });
      expect(result.affectedGenerators).toContain("models");
      expect(result.affectedGenerators).toContain("components");
      expect(result.affectedGenerators).toContain("api");
      expect(result.affectedFiles.length).toBeGreaterThan(0);
      expect(
        result.affectedFiles.some((f) => f.path === "src/models/users.ts")
      ).toBe(true);
    });

    it("should detect entity modification", () => {
      const oldSchemas = createSchemaSet();
      const newSchemas = createSchemaSet({
        entities: new Map([["users", mockEntityV2]]),
      });

      const result = differ.compareSchemaSet(oldSchemas, newSchemas);

      expect(result.changes).toHaveLength(1);
      expect(result.changes[0]).toMatchObject({
        type: "updated",
        schemaType: "entity",
        name: "users",
        path: "entities/users.json",
      });
      expect(result.changes[0].fieldChanges).toBeDefined();
      expect(result.changes[0].fieldChanges?.[0]).toMatchObject({
        field: "columns",
        type: "modified",
      });
    });

    it("should detect entity deletion", () => {
      const oldSchemas = createSchemaSet();
      const newSchemas = createSchemaSet({
        entities: new Map(),
      });

      const result = differ.compareSchemaSet(oldSchemas, newSchemas);

      expect(result.changes).toHaveLength(1);
      expect(result.changes[0]).toMatchObject({
        type: "deleted",
        schemaType: "entity",
        name: "users",
        path: "entities/users.json",
      });
      expect(result.hasBreakingChanges).toBe(true);
    });

    it("should detect enum changes", () => {
      const oldSchemas = createSchemaSet();
      const newSchemas = createSchemaSet({
        enums: new Map([
          [
            "status",
            {
              ...mockEnum,
              values: {
                ...mockEnum.values,
                PENDING: { label: "Pending" },
              },
            },
          ],
        ]),
      });

      const result = differ.compareSchemaSet(oldSchemas, newSchemas);

      expect(result.changes).toHaveLength(1);
      expect(result.changes[0]).toMatchObject({
        type: "updated",
        schemaType: "enum",
        name: "status",
        path: "enums/status.json",
      });
      expect(result.affectedGenerators).toContain("models");
    });

    it("should detect page changes", () => {
      const oldSchemas = createSchemaSet();
      const newSchemas = createSchemaSet({
        pages: new Map([["users", { ...mockPage, title: "User Management" }]]),
      });

      const result = differ.compareSchemaSet(oldSchemas, newSchemas);

      expect(result.changes).toHaveLength(1);
      expect(result.changes[0]).toMatchObject({
        type: "updated",
        schemaType: "page",
        name: "users",
        path: "pages/users.json",
      });
      expect(result.affectedGenerators).toContain("pages");
    });

    it("should detect app config changes", () => {
      const oldSchemas = createSchemaSet();
      const newSchemas = createSchemaSet({
        app: {
          ...mockApp,
          description: "Updated app description",
        },
      });

      const result = differ.compareSchemaSet(oldSchemas, newSchemas);

      expect(result.changes).toHaveLength(1);
      expect(result.changes[0]).toMatchObject({
        type: "updated",
        schemaType: "app",
        name: "app",
        path: "app.json",
      });
      expect(result.affectedGenerators).toContain("pages");
      expect(result.affectedGenerators).toContain("api");
    });

    it("should detect multiple changes", () => {
      const oldSchemas = createSchemaSet();
      const newSchemas = createSchemaSet({
        entities: new Map([["users", mockEntityV2]]),
        enums: new Map(),
        pages: new Map([
          ["users", { ...mockPage, title: "User Management" }],
          ["posts", { route: "/posts", title: "Posts", sections: [] }],
        ]),
      });

      const result = differ.compareSchemaSet(oldSchemas, newSchemas);

      // Should detect: entity update, enum deletion, page update, page creation
      expect(result.changes).toHaveLength(4);

      const changeTypes = result.changes.map(
        (c) => `${c.type}-${c.schemaType}`
      );
      expect(changeTypes).toContain("updated-entity");
      expect(changeTypes).toContain("deleted-enum");
      expect(changeTypes).toContain("updated-page");
      expect(changeTypes).toContain("created-page");
    });

    it("should identify breaking changes correctly", () => {
      const oldSchemas = createSchemaSet();

      // Test entity deletion (breaking)
      const newSchemasWithEntityDeletion = createSchemaSet({
        entities: new Map(),
      });

      const result1 = differ.compareSchemaSet(
        oldSchemas,
        newSchemasWithEntityDeletion
      );
      expect(result1.hasBreakingChanges).toBe(true);

      // Test enum deletion (breaking)
      const newSchemasWithEnumDeletion = createSchemaSet({
        enums: new Map(),
      });

      const result2 = differ.compareSchemaSet(
        oldSchemas,
        newSchemasWithEnumDeletion
      );
      expect(result2.hasBreakingChanges).toBe(true);

      // Test non-breaking change (adding field)
      const newSchemasWithAddition = createSchemaSet({
        entities: new Map([["users", mockEntityV2]]),
      });

      const result3 = differ.compareSchemaSet(
        oldSchemas,
        newSchemasWithAddition
      );
      expect(result3.hasBreakingChanges).toBe(false);
    });
  });

  describe("field-level changes", () => {
    it("should detect added fields", () => {
      const oldObj = { name: "test" };
      const newObj = { name: "test", description: "A test object" };

      const result = differ.compareSchemaSet(
        createSchemaSet({ app: oldObj as AppSchema }),
        createSchemaSet({ app: newObj as AppSchema })
      );

      expect(result.changes[0].fieldChanges).toContainEqual({
        field: "description",
        type: "added",
        newValue: "A test object",
      });
    });

    it("should detect removed fields", () => {
      const oldObj = { name: "test", description: "A test object" };
      const newObj = { name: "test" };

      const result = differ.compareSchemaSet(
        createSchemaSet({ app: oldObj as AppSchema }),
        createSchemaSet({ app: newObj as AppSchema })
      );

      expect(result.changes[0].fieldChanges).toContainEqual({
        field: "description",
        type: "removed",
        oldValue: "A test object",
      });
    });

    it("should detect modified fields", () => {
      const oldObj = {
        name: "test",
        description: "test app",
        url: "https://example.com",
        version: 1,
      };
      const newObj = {
        name: "test",
        description: "test app",
        url: "https://example.com",
        version: 2,
      };

      const result = differ.compareSchemaSet(
        createSchemaSet({ app: oldObj as AppSchema }),
        createSchemaSet({ app: newObj as AppSchema })
      );

      expect(result.changes[0].fieldChanges).toContainEqual({
        field: "version",
        type: "modified",
        oldValue: 1,
        newValue: 2,
      });
    });
  });

  describe("deep equality", () => {
    it("should handle nested objects correctly", () => {
      const oldApp = {
        ...mockApp,
        metadata: {
          author: "Original Author",
          language: "en",
        },
      };
      const newApp = {
        ...mockApp,
        metadata: {
          author: "Updated Author",
          language: "en",
        },
      };

      const result = differ.compareSchemaSet(
        createSchemaSet({ app: oldApp }),
        createSchemaSet({ app: newApp })
      );

      expect(result.changes).toHaveLength(1);
      expect(result.changes[0].fieldChanges).toBeDefined();
    });

    it("should handle arrays correctly", () => {
      const oldEnum = {
        values: {
          ACTIVE: { label: "Active" },
          INACTIVE: { label: "Inactive" },
        },
      };
      const newEnum = {
        values: {
          ACTIVE: { label: "Active" },
          INACTIVE: { label: "Inactive" },
          PENDING: { label: "Pending" },
        },
      };

      const result = differ.compareSchemaSet(
        createSchemaSet({ enums: new Map([["status", oldEnum]]) }),
        createSchemaSet({ enums: new Map([["status", newEnum]]) })
      );

      expect(result.changes).toHaveLength(1);
    });
  });

  describe("dependency graph integration", () => {
    it("should provide detailed affected files information", () => {
      const oldSchemas = createSchemaSet();
      const newSchemas = createSchemaSet({
        entities: new Map([["users", mockEntityV2]]),
      });

      const result = differ.compareSchemaSet(oldSchemas, newSchemas);

      expect(result.affectedFiles).toBeDefined();
      expect(result.affectedFiles.length).toBeGreaterThan(0);

      const modelFile = result.affectedFiles.find(
        (f) => f.path === "src/models/users.ts"
      );
      expect(modelFile).toBeDefined();
      expect(modelFile?.generator).toBe("models");
      expect(modelFile?.reason).toContain("Entity users updated");
      expect(modelFile?.dependencies).toContain("entities/users.json");
    });

    it("should identify migration files for database changes", () => {
      const oldSchemas = createSchemaSet();
      const newSchemas = createSchemaSet({
        entities: new Map([["users", mockEntityV2]]),
      });

      const result = differ.compareSchemaSet(oldSchemas, newSchemas);

      const migrationFile = result.affectedFiles.find((f) =>
        f.path.includes("migrations")
      );
      expect(migrationFile).toBeDefined();
      expect(migrationFile?.generator).toBe("models");
    });
  });
});
