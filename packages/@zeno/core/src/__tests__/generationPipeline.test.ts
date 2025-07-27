import { beforeEach, describe, expect, it } from "vitest";
import { GenerationPipeline } from "../GenerationPipeline";
import type { SchemaType } from "../Generator";
import { Generator } from "../Generator";
import type { GeneratedFile, GeneratorContext, SchemaSet } from "../types/core";
import { GenerationError } from "../utils/errors";

// Mock generators for testing
class MockModelGenerator extends Generator {
  readonly name = "models";

  supports(schemaType: SchemaType): boolean {
    return schemaType === "entity" || schemaType === "enum";
  }

  async generate(context: GeneratorContext): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = [];

    for (const [name] of context.schemas.entities) {
      files.push({
        path: `models/${name}.ts`,
        content: `export interface ${name} {}`,
      });
    }

    for (const [name] of context.schemas.enums) {
      files.push({
        path: `models/${name}.ts`,
        content: `export enum ${name} {}`,
      });
    }

    return files;
  }
}

class MockComponentGenerator extends Generator {
  readonly name = "components";

  supports(schemaType: SchemaType): boolean {
    return schemaType === "entity";
  }

  async generate(context: GeneratorContext): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = [];

    for (const [name] of context.schemas.entities) {
      files.push({
        path: `components/${name}Form.tsx`,
        content: `export function ${name}Form() {}`,
      });
    }

    return files;
  }
}

class MockPageGenerator extends Generator {
  readonly name = "pages";

  supports(schemaType: SchemaType): boolean {
    return schemaType === "page";
  }

  async generate(context: GeneratorContext): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = [];

    for (const [name] of context.schemas.pages) {
      files.push({
        path: `app/${name}/page.tsx`,
        content: `export default function ${name}Page() {}`,
      });
    }

    return files;
  }
}

class MockFailingGenerator extends Generator {
  readonly name = "failing";

  supports(schemaType: SchemaType): boolean {
    return schemaType === "entity";
  }

  async generate(_context: GeneratorContext): Promise<GeneratedFile[]> {
    throw new Error("Generation failed");
  }
}

class MockSlowGenerator extends Generator {
  readonly name = "slow";

  supports(schemaType: SchemaType): boolean {
    return schemaType === "entity";
  }

  async generate(_context: GeneratorContext): Promise<GeneratedFile[]> {
    // Simulate slow generation
    await new Promise((resolve) => setTimeout(resolve, 100));

    return [
      {
        path: "slow/output.ts",
        content: "// Slow generation output",
      },
    ];
  }
}

// Test fixtures
const createMockSchemaSet = (
  options: { entities?: string[]; enums?: string[]; pages?: string[] } = {}
): SchemaSet => ({
  entities: new Map(
    (options.entities || []).map((name) => [name, { name, columns: [] }])
  ),
  enums: new Map(
    (options.enums || []).map((name) => [name, { name, values: [] }])
  ),
  pages: new Map(
    (options.pages || []).map((name) => [name, { name, sections: [] }])
  ),
  app: { name: "test-app", description: "Test application" },
});

const createMockContext = (schemas: SchemaSet): GeneratorContext => ({
  schemas,
  outputDir: "./src",
  schemaDir: "./zeno",
  config: {
    outputDir: "./src",
    schemaDir: "./zeno",
  },
});

describe("GenerationPipeline", () => {
  let pipeline: GenerationPipeline;

  beforeEach(() => {
    pipeline = new GenerationPipeline();
  });

  describe("Generator Registration", () => {
    it("should register generators successfully", () => {
      const generator = new MockModelGenerator();

      const result = pipeline.register(generator);

      expect(result).toBe(pipeline); // Method chaining
      expect(pipeline.hasGenerator("models")).toBe(true);
      expect(pipeline.getRegisteredGenerators()).toContain("models");
    });

    it("should throw error when registering duplicate generator names", () => {
      const generator1 = new MockModelGenerator();
      const generator2 = new MockModelGenerator();

      pipeline.register(generator1);

      expect(() => pipeline.register(generator2)).toThrow(GenerationError);
      expect(() => pipeline.register(generator2)).toThrow(
        "Generator 'models' is already registered"
      );
    });

    it("should unregister generators successfully", () => {
      const generator = new MockModelGenerator();
      pipeline.register(generator);

      const removed = pipeline.unregister("models");

      expect(removed).toBe(true);
      expect(pipeline.hasGenerator("models")).toBe(false);
      expect(pipeline.getRegisteredGenerators()).not.toContain("models");
    });

    it("should return false when unregistering non-existent generator", () => {
      const removed = pipeline.unregister("nonexistent");

      expect(removed).toBe(false);
    });
  });

  describe("Generation Process", () => {
    it("should generate files from all applicable generators", async () => {
      const modelGen = new MockModelGenerator();
      const componentGen = new MockComponentGenerator();

      pipeline.register(modelGen).register(componentGen);

      const schemas = createMockSchemaSet({
        entities: ["User", "Post"],
        enums: ["Status"],
      });
      const context = createMockContext(schemas);

      const result = await pipeline.generate(schemas, context.config);

      expect(result.files).toHaveLength(5); // 2 entities + 1 enum + 2 components
      expect(result.generators).toContain("models");
      expect(result.generators).toContain("components");
      expect(result.duration).toBeGreaterThanOrEqual(0);
      expect(result.errors).toHaveLength(0);

      const modelFiles = result.files.filter((f) =>
        f.path.startsWith("models/")
      );
      const componentFiles = result.files.filter((f) =>
        f.path.startsWith("components/")
      );

      expect(modelFiles).toHaveLength(3);
      expect(componentFiles).toHaveLength(2);
    });

    it("should only use generators that support available schemas", async () => {
      const modelGen = new MockModelGenerator();
      const pageGen = new MockPageGenerator();

      pipeline.register(modelGen).register(pageGen);

      const schemas = createMockSchemaSet({
        entities: ["User"], // No pages
      });
      const context = createMockContext(schemas);

      const result = await pipeline.generate(schemas, context.config);

      expect(result.generators).toContain("models");
      expect(result.generators).not.toContain("pages");
      expect(result.files).toHaveLength(1);
    });

    it("should filter generators by names when specified", async () => {
      const modelGen = new MockModelGenerator();
      const componentGen = new MockComponentGenerator();

      pipeline.register(modelGen).register(componentGen);

      const schemas = createMockSchemaSet({
        entities: ["User"],
      });
      const context = createMockContext(schemas);

      const result = await pipeline.generate(schemas, context.config, {
        generators: ["models"],
      });

      expect(result.generators).toContain("models");
      expect(result.generators).not.toContain("components");
      expect(result.files).toHaveLength(1);
      expect(result.files[0].path).toBe("models/User.ts");
    });

    it("should return empty result when no applicable generators", async () => {
      const pageGen = new MockPageGenerator();
      pipeline.register(pageGen);

      const schemas = createMockSchemaSet({
        entities: ["User"], // Page generator only supports pages
      });
      const context = createMockContext(schemas);

      const result = await pipeline.generate(schemas, context.config);

      expect(result.files).toHaveLength(0);
      expect(result.generators).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe("Parallel Execution", () => {
    it("should execute generators in parallel by default", async () => {
      const slowGen1 = new MockSlowGenerator();
      const slowGen2 = new MockSlowGenerator();

      // Create distinct instances
      Object.defineProperty(slowGen2, "name", { value: "slow2" });

      pipeline.register(slowGen1).register(slowGen2);

      const schemas = createMockSchemaSet({
        entities: ["User"],
      });
      const context = createMockContext(schemas);

      const startTime = Date.now();
      const result = await pipeline.generate(schemas, context.config);
      const duration = Date.now() - startTime;

      expect(result.generators).toHaveLength(2);
      expect(result.files).toHaveLength(2);
      // Should be faster than sequential (2 * 100ms)
      expect(duration).toBeLessThan(180);
    });

    it("should execute generators sequentially when parallel is disabled", async () => {
      const slowGen1 = new MockSlowGenerator();
      const slowGen2 = new MockSlowGenerator();

      Object.defineProperty(slowGen2, "name", { value: "slow2" });

      pipeline.register(slowGen1).register(slowGen2);

      const schemas = createMockSchemaSet({
        entities: ["User"],
      });
      const context = createMockContext(schemas);

      const startTime = Date.now();
      const result = await pipeline.generate(schemas, context.config, {
        parallel: false,
      });
      const duration = Date.now() - startTime;

      expect(result.generators).toHaveLength(2);
      expect(result.files).toHaveLength(2);
      // Should take at least 200ms for sequential execution
      expect(duration).toBeGreaterThan(180);
    });
  });

  describe("Error Handling", () => {
    it("should collect errors from failing generators in parallel mode", async () => {
      const modelGen = new MockModelGenerator();
      const failingGen = new MockFailingGenerator();

      pipeline.register(modelGen).register(failingGen);

      const schemas = createMockSchemaSet({
        entities: ["User"],
      });
      const context = createMockContext(schemas);

      const result = await pipeline.generate(schemas, context.config);

      expect(result.generators).toContain("models");
      expect(result.generators).not.toContain("failing");
      expect(result.files).toHaveLength(1); // Only from successful generator
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toBe("Generation failed");
    });

    it("should collect errors from failing generators in sequential mode", async () => {
      const modelGen = new MockModelGenerator();
      const failingGen = new MockFailingGenerator();

      pipeline.register(modelGen).register(failingGen);

      const schemas = createMockSchemaSet({
        entities: ["User"],
      });
      const context = createMockContext(schemas);

      const result = await pipeline.generate(schemas, context.config, {
        parallel: false,
      });

      expect(result.generators).toContain("models");
      expect(result.generators).not.toContain("failing");
      expect(result.files).toHaveLength(1);
      expect(result.errors).toHaveLength(1);
    });
  });

  describe("Incremental Generation", () => {
    it("should throw error for incremental generation (not yet implemented)", async () => {
      const changes = [
        {
          type: "updated" as const,
          path: "entities/user.json",
          schemaType: "entity" as const,
          name: "User",
        },
      ];

      await expect(pipeline.generateChanges(changes, {})).rejects.toThrow(
        "Incremental generation not yet implemented"
      );
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty schema set", async () => {
      const modelGen = new MockModelGenerator();
      pipeline.register(modelGen);

      const schemas = createMockSchemaSet();
      const context = createMockContext(schemas);

      const result = await pipeline.generate(schemas, context.config);

      expect(result.files).toHaveLength(0);
      expect(result.generators).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
    });

    it("should handle generator with no applicable schemas", async () => {
      const pageGen = new MockPageGenerator();
      pipeline.register(pageGen);

      const schemas = createMockSchemaSet({
        entities: ["User"], // No pages for page generator
      });
      const context = createMockContext(schemas);

      const result = await pipeline.generate(schemas, context.config);

      expect(result.files).toHaveLength(0);
      expect(result.generators).toHaveLength(0);
    });

    it("should handle invalid generator filter names", async () => {
      const modelGen = new MockModelGenerator();
      pipeline.register(modelGen);

      const schemas = createMockSchemaSet({
        entities: ["User"],
      });
      const context = createMockContext(schemas);

      const result = await pipeline.generate(schemas, context.config, {
        generators: ["nonexistent"],
      });

      expect(result.files).toHaveLength(0);
      expect(result.generators).toHaveLength(0);
    });
  });
});
