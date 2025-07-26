import { describe, it, expect } from "vitest";
import { join } from "node:path";
import { SchemaLoader, SchemaValidationError } from "../schemaLoader";

describe("SchemaLoader", () => {
  const loader = new SchemaLoader();
  const fixturesPath = join(__dirname, "fixtures");
  const docsExamplesPath = join(__dirname, "../../../../../docs/examples");

  describe("load", () => {
    it("loads valid schemas successfully", async () => {
      const schemas = await loader.load(fixturesPath);

      expect(schemas.entities.size).toBe(1);
      expect(schemas.enums.size).toBe(1);
      expect(schemas.pages.size).toBe(1);
      expect(schemas.app).toBeDefined();

      const userEntity = schemas.entities.get("users");
      expect(userEntity).toBeDefined();
      expect(userEntity?.tableName).toBe("users");
      expect(userEntity?.displayName).toBe("Users");
      expect(userEntity?.columns).toBeDefined();

      const statusEnum = schemas.enums.get("status");
      expect(statusEnum).toBeDefined();
      expect(statusEnum?.description).toBe("Status enumeration for entities");
      expect(Object.keys(statusEnum?.values || {})).toHaveLength(3);
      expect(statusEnum?.values?.ACTIVE?.label).toBe("Active");

      const homePage = schemas.pages.get("home");
      expect(homePage).toBeDefined();
      expect(homePage?.title).toBe("Home");
      expect(homePage?.route).toBe("/");
      expect(homePage?.sections).toHaveLength(2);

      expect(schemas.app.name).toBe("test-app");
      expect(schemas.app.url).toBe("https://test-app.example.com");
      expect(schemas.app.features?.search).toBe(true);
    });

    it("throws SchemaValidationError for missing app.json", async () => {
      const nonExistentPath = join(__dirname, "non-existent");
      
      await expect(loader.load(nonExistentPath)).rejects.toThrow(SchemaValidationError);
    });

    it("handles missing subdirectories gracefully", async () => {
      const emptyPath = join(__dirname, "fixtures-empty");
      
      await expect(loader.load(emptyPath)).rejects.toThrow(SchemaValidationError);
    });

    it("provides descriptive error messages for invalid schemas", async () => {
      await expect(loader.load(docsExamplesPath)).rejects.toThrowError(
        "Only one primary key is allowed per entity"
      );
    });
  });

  describe("validate", () => {
    it("validates cross-references correctly", () => {
      const entities = new Map();
      entities.set("users", {
        tableName: "users",
        displayName: "Users",
        columns: {
          id: {
            dbConstraints: { 
              type: "text",
              primaryKey: true 
            },
            validation: { required: true }
          }
        }
      });

      const enums = new Map();
      const pages = new Map();
      pages.set("home", {
        route: "/",
        title: "Home",
        sections: [
          {
            type: "table",
            entity: "users"
          }
        ],
        navigation: { 
          header: { include: true } 
        },
        auth: { required: false }
      });

      const app = {
        name: "test",
        description: "Test app",
        url: "https://test.example.com",
        features: { search: false, darkMode: false }
      };

      const result = loader.validate(entities, enums, pages, app, "/test");
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("detects invalid entity references", () => {
      const entities = new Map();
      const enums = new Map();
      const pages = new Map();
      pages.set("home", {
        route: "/",
        title: "Home",
        sections: [
          {
            type: "table",
            entity: "non-existent-entity"
          }
        ],
        navigation: { 
          header: { include: true } 
        },
        auth: { required: false }
      });

      const app = {
        name: "test",
        description: "Test app",
        url: "https://test.example.com",
        features: { search: false, darkMode: false }
      };

      const result = loader.validate(entities, enums, pages, app, "/test");
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].message).toContain("non-existent-entity");
    });
  });
});