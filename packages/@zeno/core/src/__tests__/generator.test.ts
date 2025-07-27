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
    const filtered = this.filterSupportedSchemas(context.schemas);
    const files: GeneratedFile[] = [];

    for (const [name, _entity] of filtered.entities) {
      files.push({
        path: `${context.outputDir}/${name}.ts`,
        content: `export const ${name} = { type: "entity" };`,
      });
    }

    for (const [name, _enumSchema] of filtered.enums) {
      files.push({
        path: `${context.outputDir}/${name}.ts`,
        content: `export const ${name} = { type: "enum" };`,
      });
    }

    for (const [name, _page] of filtered.pages) {
      files.push({
        path: `${context.outputDir}/${name}.tsx`,
        content: `export const ${name} = { type: "page" };`,
      });
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
        ["users", { name: "users", columns: [] }],
        ["posts", { name: "posts", columns: [] }],
      ]),
      enums: new Map([["status", { name: "status", values: [] }]]),
      pages: new Map([["home", { name: "home", path: "/", sections: [] }]]),
      app: { name: "TestApp", version: "1.0.0" },
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

  describe("validateContext", () => {
    it("should pass with valid context", () => {
      expect(() => {
        generator.validateContext(mockContext);
      }).not.toThrow();
    });

    it("should throw when schemas are missing", () => {
      const invalidContext = { ...mockContext, schemas: undefined as any };
      expect(() => {
        generator.validateContext(invalidContext);
      }).toThrow("Generator test-generator: schemas are required in context");
    });

    it("should throw when outputDir is missing", () => {
      const invalidContext = { ...mockContext, outputDir: "" };
      expect(() => {
        generator.validateContext(invalidContext);
      }).toThrow("Generator test-generator: outputDir is required in context");
    });

    it("should throw when schemaDir is missing", () => {
      const invalidContext = { ...mockContext, schemaDir: "" };
      expect(() => {
        generator.validateContext(invalidContext);
      }).toThrow("Generator test-generator: schemaDir is required in context");
    });
  });

  describe("filterSupportedSchemas", () => {
    it("should filter only supported schema types", () => {
      generator.setSupportedTypes(["entity"]);
      const filtered = generator.filterSupportedSchemas(mockSchemas);

      expect(filtered.entities.size).toBe(2);
      expect(filtered.enums.size).toBe(0);
      expect(filtered.pages.size).toBe(0);
    });

    it("should filter multiple schema types", () => {
      generator.setSupportedTypes(["entity", "enum"]);
      const filtered = generator.filterSupportedSchemas(mockSchemas);

      expect(filtered.entities.size).toBe(2);
      expect(filtered.enums.size).toBe(1);
      expect(filtered.pages.size).toBe(0);
    });

    it("should return empty maps when no types are supported", () => {
      generator.setSupportedTypes([]);
      const filtered = generator.filterSupportedSchemas(mockSchemas);

      expect(filtered.entities.size).toBe(0);
      expect(filtered.enums.size).toBe(0);
      expect(filtered.pages.size).toBe(0);
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
        app: { name: "TestApp", version: "1.0.0" },
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
      const invalidContext = { ...mockContext, schemas: undefined as any };
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
