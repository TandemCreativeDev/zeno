/**
 * @fileoverview Tests for SchemaSet validation and cross-reference validation
 */

import { describe, it, expect } from "vitest";
import { validateSchemaSet, validateEntitySchema, validateEnumSchema, validatePageSchema, validateAppSchema } from "../schemaSet";

describe("Schema validation functions", () => {
  describe("validateEntitySchema", () => {
    it("returns valid result for correct entity", () => {
      const validEntity = {
        tableName: "users",
        displayName: "Users",
        columns: {
          id: {
            dbConstraints: {
              type: "serial",
              primaryKey: true,
            },
          },
        },
      };

      const result = validateEntitySchema(validEntity, "entities/users.json");
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("returns invalid result with error details", () => {
      const invalidEntity = {
        tableName: "Users", // Invalid: should be lowercase
        displayName: "Users",
        columns: {
          id: {
            dbConstraints: {
              type: "serial",
              primaryKey: true,
            },
          },
        },
      };

      const result = validateEntitySchema(invalidEntity, "entities/users.json");
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]?.path).toBe("entities/users.json");
      expect(result.errors[0]?.message).toContain("lowercase with underscores");
    });
  });

  describe("validateEnumSchema", () => {
    it("returns valid result for correct enum", () => {
      const validEnum = {
        values: {
          ACTIVE: {
            label: "Active",
          },
        },
      };

      const result = validateEnumSchema(validEnum, "enums/status.json");
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("returns invalid result for empty enum", () => {
      const invalidEnum = {
        values: {},
      };

      const result = validateEnumSchema(invalidEnum, "enums/status.json");
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe("validatePageSchema", () => {
    it("returns valid result for correct page", () => {
      const validPage = {
        route: "/dashboard",
        title: "Dashboard",
        sections: [
          {
            type: "hero",
            title: "Welcome",
          },
        ],
      };

      const result = validatePageSchema(validPage, "pages/dashboard.json");
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("returns invalid result for page with invalid route", () => {
      const invalidPage = {
        route: "dashboard", // Missing leading slash
        title: "Dashboard",
        sections: [
          {
            type: "hero",
            title: "Welcome",
          },
        ],
      };

      const result = validatePageSchema(invalidPage, "pages/dashboard.json");
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe("validateAppSchema", () => {
    it("returns valid result for correct app", () => {
      const validApp = {
        name: "Test App",
        description: "A test application",
        url: "https://test.com",
      };

      const result = validateAppSchema(validApp, "app.json");
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("returns invalid result for app with invalid URL", () => {
      const invalidApp = {
        name: "Test App",
        description: "A test application",
        url: "not-a-url",
      };

      const result = validateAppSchema(invalidApp, "app.json");
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});

describe("validateSchemaSet", () => {
  it("validates complete schema set without cross-reference errors", () => {
    const entities = new Map([
      ["users", {
        tableName: "users",
        displayName: "Users",
        columns: {
          id: {
            dbConstraints: {
              type: "serial",
              primaryKey: true,
            },
          },
        },
      }],
      ["posts", {
        tableName: "posts",
        displayName: "Posts",
        columns: {
          id: {
            dbConstraints: {
              type: "serial",
              primaryKey: true,
            },
          },
          user_id: {
            dbConstraints: {
              type: "integer",
              references: {
                table: "users",
                column: "id",
              },
            },
          },
        },
        relationships: {
          author: {
            type: "many-to-one",
            table: "users",
          },
        },
      }],
    ]);

    const enums = new Map([
      ["status", {
        values: {
          ACTIVE: {
            label: "Active",
          },
        },
      }],
    ]);

    const pages = new Map([
      ["dashboard", {
        route: "/dashboard",
        title: "Dashboard",
        sections: [
          {
            type: "table",
            entity: "users",
          },
        ],
      }],
    ]);

    const app = {
      name: "Test App",
      description: "A test application",
      url: "https://test.com",
    };

    const result = validateSchemaSet(entities, enums, pages, app, "/test");
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("detects missing entity references in relationships", () => {
    const entities = new Map([
      ["posts", {
        tableName: "posts",
        displayName: "Posts",
        columns: {
          id: {
            dbConstraints: {
              type: "serial",
              primaryKey: true,
            },
          },
        },
        relationships: {
          author: {
            type: "many-to-one",
            table: "users", // users entity doesn't exist
          },
        },
      }],
    ]);

    const enums = new Map();
    const pages = new Map();
    const app = {
      name: "Test App",
      description: "A test application",
      url: "https://test.com",
    };

    const result = validateSchemaSet(entities, enums, pages, app, "/test");
    expect(result.valid).toBe(false);
    
    const referenceError = result.errors.find(error => 
      error.message.includes("Referenced entity 'users' not found")
    );
    expect(referenceError).toBeDefined();
    expect(referenceError?.path).toBe("/test/entities/posts.json");
  });

  it("detects missing entity references in foreign keys", () => {
    const entities = new Map([
      ["posts", {
        tableName: "posts",
        displayName: "Posts",
        columns: {
          id: {
            dbConstraints: {
              type: "serial",
              primaryKey: true,
            },
          },
          user_id: {
            dbConstraints: {
              type: "integer",
              references: {
                table: "users", // users entity doesn't exist
                column: "id",
              },
            },
          },
        },
      }],
    ]);

    const enums = new Map();
    const pages = new Map();
    const app = {
      name: "Test App",
      description: "A test application",
      url: "https://test.com",
    };

    const result = validateSchemaSet(entities, enums, pages, app, "/test");
    expect(result.valid).toBe(false);
    
    const referenceError = result.errors.find(error => 
      error.message.includes("Referenced entity 'users' not found")
    );
    expect(referenceError).toBeDefined();
  });

  it("detects missing entity references in page sections", () => {
    const entities = new Map();
    const enums = new Map();
    const pages = new Map([
      ["dashboard", {
        route: "/dashboard",
        title: "Dashboard",
        sections: [
          {
            type: "table",
            entity: "users", // users entity doesn't exist
          },
        ],
      }],
    ]);

    const app = {
      name: "Test App",
      description: "A test application",
      url: "https://test.com",
    };

    const result = validateSchemaSet(entities, enums, pages, app, "/test");
    expect(result.valid).toBe(false);
    
    const referenceError = result.errors.find(error => 
      error.message.includes("Referenced entity 'users' not found")
    );
    expect(referenceError).toBeDefined();
    expect(referenceError?.path).toBe("/test/pages/dashboard.json");
  });

  it("accumulates multiple validation errors", () => {
    const entities = new Map([
      ["invalid", {
        tableName: "Invalid", // Invalid table name
        displayName: "Invalid",
        columns: {},
      }],
    ]);

    const enums = new Map([
      ["empty", {
        values: {}, // Empty values
      }],
    ]);

    const pages = new Map([
      ["invalid", {
        route: "invalid", // Invalid route
        title: "Invalid",
        sections: [],
      }],
    ]);

    const app = {
      name: "",
      description: "",
      url: "invalid-url",
    };

    const result = validateSchemaSet(entities, enums, pages, app, "/test");
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(3); // Multiple errors from different schemas
  });
});