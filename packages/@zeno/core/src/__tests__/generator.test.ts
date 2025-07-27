/**
 * Unit tests for Generator base class
 */

import { beforeEach, describe, expect, it } from "vitest";
import type { SchemaType } from "../Generator";
import { Generator } from "../Generator";
import type { GeneratedFile, GeneratorContext, SchemaSet } from "../types/core";

class TestGenerator extends Generator {
  readonly name = "test-generator";

  private supportedTypes: SchemaType[] = ["entity"];

  setSupportedTypes(types: SchemaType[]) {
    this.supportedTypes = types;
  }

  supports(schemaType: SchemaType): boolean {
    return this.supportedTypes.includes(schemaType);
  }

  async generate(context: GeneratorContext): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = [];

    if (this.supports("entity")) {
      for (const [name, _entity] of context.schemas.entities) {
        files.push({
          path: `${context.outputDir}/${name}.ts`,
          content: `export const ${name} = { type: "entity" };`,
        });
      }
    }

    if (this.supports("enum")) {
      for (const [name, _enumSchema] of context.schemas.enums) {
        files.push({
          path: `${context.outputDir}/${name}.ts`,
          content: `export const ${name} = { type: "enum" };`,
        });
      }
    }

    if (this.supports("page")) {
      for (const [name, _page] of context.schemas.pages) {
        files.push({
          path: `${context.outputDir}/${name}.tsx`,
          content: `export const ${name} = { type: "page" };`,
        });
      }
    }

    return files;
  }
}

describe("Generator", () => {
  let generator: TestGenerator;
  let mockContext: GeneratorContext;
  let mockSchemas: SchemaSet;

  beforeEach(() => {
    generator = new TestGenerator();

    mockSchemas = {
      entities: new Map([
        [
          "users",
          {
            tableName: "users",
            displayName: "Users",
            columns: {},
          },
        ],
        [
          "posts",
          {
            tableName: "posts",
            displayName: "Posts",
            columns: {},
          },
        ],
      ]),
      enums: new Map([
        [
          "status",
          {
            values: {
              ACTIVE: { label: "Active" },
              INACTIVE: { label: "Inactive" },
            },
          },
        ],
      ]),
      pages: new Map([
        [
          "home",
          {
            route: "/",
            title: "Home",
            sections: [
              {
                type: "hero" as const,
                title: "Welcome",
              },
            ],
          },
        ],
      ]),
      app: {
        name: "TestApp",
        description: "Test application",
        url: "https://example.com",
      },
    };

    mockContext = {
      schemas: mockSchemas,
      outputDir: "./output",
      schemaDir: "./schemas",
      config: {},
    };
  });

  describe("abstract properties and methods", () => {
    it("should have a name property", () => {
      expect(generator.name).toBe("test-generator");
    });

    it("should implement supports method", () => {
      expect(generator.supports("entity")).toBe(true);
      expect(generator.supports("enum")).toBe(false);
    });

    it("should implement generate method", async () => {
      const files = await generator.generate(mockContext);
      expect(files).toHaveLength(2); // 2 entities
      expect(files[0]).toMatchObject({
        path: "./output/users.ts",
        content: expect.stringContaining("users"),
      });
    });
  });

  describe("context validation through run method", () => {
    it("should pass with valid context", async () => {
      await expect(generator.run(mockContext)).resolves.toBeDefined();
    });

    it("should throw when schemas are missing", async () => {
      const invalidContext = { ...mockContext, schemas: undefined as never };
      await expect(generator.run(invalidContext)).rejects.toThrow(
        "Generator test-generator: schemas are required in context"
      );
    });

    it("should throw when outputDir is missing", async () => {
      const invalidContext = { ...mockContext, outputDir: "" };
      await expect(generator.run(invalidContext)).rejects.toThrow(
        "Generator test-generator: outputDir is required in context"
      );
    });

    it("should throw when schemaDir is missing", async () => {
      const invalidContext = { ...mockContext, schemaDir: "" };
      await expect(generator.run(invalidContext)).rejects.toThrow(
        "Generator test-generator: schemaDir is required in context"
      );
    });
  });

  describe("schema filtering through generation", () => {
    it("should generate only supported schema types", async () => {
      generator.setSupportedTypes(["entity"]);
      const files = await generator.generate(mockContext);

      expect(files).toHaveLength(2); // Only entities
      expect(files.every((f) => f.path.endsWith(".ts"))).toBe(true);
      expect(files.every((f) => f.content.includes("entity"))).toBe(true);
    });

    it("should generate multiple schema types", async () => {
      generator.setSupportedTypes(["entity", "enum"]);
      const files = await generator.generate(mockContext);

      expect(files).toHaveLength(3); // 2 entities + 1 enum
      const entityFiles = files.filter((f) => f.content.includes("entity"));
      const enumFiles = files.filter((f) => f.content.includes("enum"));
      expect(entityFiles).toHaveLength(2);
      expect(enumFiles).toHaveLength(1);
    });

    it("should generate no files when no types are supported", async () => {
      generator.setSupportedTypes([]);
      const files = await generator.generate(mockContext);

      expect(files).toHaveLength(0);
    });
  });

  describe("hasApplicableSchemas", () => {
    it("should return true when there are supported schemas", () => {
      generator.setSupportedTypes(["entity"]);
      expect(generator.hasApplicableSchemas(mockSchemas)).toBe(true);
    });

    it("should return false when there are no supported schemas", () => {
      generator.setSupportedTypes([]);
      expect(generator.hasApplicableSchemas(mockSchemas)).toBe(false);
    });

    it("should return true for app schema support", () => {
      generator.setSupportedTypes(["app"]);
      expect(generator.hasApplicableSchemas(mockSchemas)).toBe(true);
    });

    it("should return false when supported schemas are empty", () => {
      generator.setSupportedTypes(["entity"]);
      const emptySchemas = {
        entities: new Map(),
        enums: new Map(),
        pages: new Map(),
        app: {
          name: "TestApp",
          description: "Test application",
          url: "https://example.com",
        },
      };
      expect(generator.hasApplicableSchemas(emptySchemas)).toBe(false);
    });
  });

  describe("run", () => {
    it("should validate context and call generate", async () => {
      const files = await generator.run(mockContext);
      expect(files).toHaveLength(2);
      expect(files[0].path).toBe("./output/users.ts");
      expect(files[1].path).toBe("./output/posts.ts");
    });

    it("should throw validation errors", async () => {
      const invalidContext = { ...mockContext, schemas: undefined as never };
      await expect(generator.run(invalidContext)).rejects.toThrow(
        "schemas are required in context"
      );
    });
  });

  describe("schema type filtering integration", () => {
    it("should generate only files for supported schema types", async () => {
      generator.setSupportedTypes(["entity", "page"]);
      const files = await generator.generate(mockContext);

      // Should have 2 entities + 1 page
      expect(files).toHaveLength(3);
      expect(files.some((f) => f.path.includes("users"))).toBe(true);
      expect(files.some((f) => f.path.includes("posts"))).toBe(true);
      expect(files.some((f) => f.path.includes("home"))).toBe(true);
    });

    it("should handle generator with enum support", async () => {
      generator.setSupportedTypes(["enum"]);
      const files = await generator.generate(mockContext);

      expect(files).toHaveLength(1);
      expect(files[0].path).toBe("./output/status.ts");
      expect(files[0].content).toContain("enum");
    });
  });
});
