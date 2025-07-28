import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { GeneratorContext } from "../../types/core";
import {
  IntegrationTestHarness,
  MockIntegrationGenerator,
  PerformanceBenchmark,
} from "./testHarness";

describe("Performance Integration Tests", () => {
  let harness: IntegrationTestHarness;
  let benchmark: PerformanceBenchmark;

  beforeEach(async () => {
    harness = new IntegrationTestHarness();
    benchmark = new PerformanceBenchmark();
    await harness.setup();
  });

  afterEach(async () => {
    await harness.cleanup();
    benchmark.clear();
  });

  describe("Schema Loading Performance", () => {
    it("should load schemas within performance targets", async () => {
      const projectDir = await harness.createTestProjectFromJson("blog");

      const schemas = await benchmark.benchmark("schema-loading", async () => {
        return harness.loadSchemas(projectDir);
      });

      const loadTime = benchmark.getMeasurement("schema-loading");
      expect(loadTime).toBeLessThan(100); // Should load in under 100ms

      expect(schemas.entities.size).toBe(2);
      expect(schemas.enums.size).toBe(3);
      expect(schemas.pages.size).toBe(4);
    });

    it("should handle large schema sets efficiently", async () => {
      // Create a larger schema set for performance testing
      const largeEntitySet: Record<string, unknown> = {};
      const largeEnumSet: Record<string, unknown> = {};

      // Generate 20 entities
      for (let i = 1; i <= 20; i++) {
        largeEntitySet[`entity${i}`] = {
          tableName: `entity${i}`,
          displayName: `Entity ${i}`,
          columns: {
            id: {
              dbConstraints: { type: "text", primaryKey: true },
              validation: { required: true },
            },
            name: {
              dbConstraints: { type: "text" },
              validation: { required: true, min: 2 },
            },
            status: {
              dbConstraints: { type: "text", default: "ACTIVE" },
              validation: { required: true, enum: "status" },
            },
          },
          generateForm: true,
          generateTable: true,
          generateAPI: true,
          generatePages: true,
        };
      }

      // Add status enum that entities reference
      largeEnumSet.status = {
        description: "Status enumeration",
        values: {
          ACTIVE: { label: "Active" },
          INACTIVE: { label: "Inactive" },
        },
      };

      // Generate 10 more enums
      for (let i = 1; i <= 10; i++) {
        largeEnumSet[`enum${i}`] = {
          description: `Enum ${i} description`,
          values: {
            VALUE1: { label: "Value 1" },
            VALUE2: { label: "Value 2" },
            VALUE3: { label: "Value 3" },
          },
        };
      }

      const projectDir = await harness.createTestProject({
        app: {
          name: "Performance Test App",
          description: "Large schema performance test",
          url: "https://performance-test.example.com",
        },
        entities: largeEntitySet,
        enums: largeEnumSet,
      });

      const schemas = await benchmark.benchmark(
        "large-schema-loading",
        async () => {
          return harness.loadSchemas(projectDir);
        }
      );

      const loadTime = benchmark.getMeasurement("large-schema-loading");
      expect(loadTime).toBeLessThan(500); // Should load 30 schemas in under 500ms

      expect(schemas.entities.size).toBe(20);
      expect(schemas.enums.size).toBe(11);
    });
  });

  describe("Generation Performance", () => {
    it("should meet generation speed targets", async () => {
      // Create generators that simulate realistic file generation
      const modelGenerator = new MockIntegrationGenerator(
        "models",
        ["entity", "enum"],
        (context: GeneratorContext) => {
          const files = [];

          // Simulate Drizzle schema generation
          for (const [name, entity] of context.schemas.entities) {
            const columns = Object.keys(entity.columns || {});
            files.push({
              path: `models/${name}.ts`,
              content: `// Generated Drizzle schema for ${name}
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const ${name} = pgTable("${entity.tableName}", {
${columns.map((col) => `  ${col}: text("${col}"),`).join("\n")}
});

export type ${name} = typeof ${name}.$inferSelect;
export type New${name} = typeof ${name}.$inferInsert;
`,
            });

            // Simulate Zod schema generation
            files.push({
              path: `validation/${name}.ts`,
              content: `// Generated Zod schema for ${name}
import { z } from "zod";

export const ${name}Schema = z.object({
${columns.map((col) => `  ${col}: z.string(),`).join("\n")}
});

export type ${name}Input = z.infer<typeof ${name}Schema>;
`,
            });
          }

          for (const [name] of context.schemas.enums) {
            files.push({
              path: `types/${name}.ts`,
              content: `// Generated enum for ${name}
export enum ${name} {
  ACTIVE = "active",
  INACTIVE = "inactive",
}`,
            });
          }

          return files;
        }
      );

      const componentGenerator = new MockIntegrationGenerator(
        "components",
        ["entity"],
        (context: GeneratorContext) => {
          const files = [];

          for (const [name, entity] of context.schemas.entities) {
            if (entity.generateForm) {
              files.push({
                path: `components/${name}Form.tsx`,
                content: `// Generated form component for ${name}
import { useForm } from "react-hook-form";
import { FormField, Fieldset, FormActions } from "@zeno/templates";

export function ${name}Form() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  
  return (
    <form>
      <Fieldset legend="Basic Information">
        <FormField name="name" label="Name" register={register} errors={errors} />
        <FormField name="email" label="Email" type="email" register={register} errors={errors} />
      </Fieldset>
      <FormActions mode="create" />
    </form>
  );
}`,
              });
            }

            if (entity.generateTable) {
              files.push({
                path: `components/${name}Table.tsx`,
                content: `// Generated table component for ${name}
import { DataTable } from "@zeno/templates";

export function ${name}Table({ data }: { data: any[] }) {
  const columns = [
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
  ];
  
  return (
    <DataTable
      data={data}
      columns={columns}
      searchFields={["name", "email"]}
      title="${entity.displayName}"
    />
  );
}`,
              });
            }
          }

          return files;
        }
      );

      harness
        .registerGenerator(modelGenerator)
        .registerGenerator(componentGenerator);

      const projectDir = await harness.createTestProjectFromJson("blog");

      const result = await benchmark.benchmark("generation", async () => {
        return harness.runGeneration(projectDir);
      });

      const generationTime = benchmark.getMeasurement("generation");

      // Performance targets from CLAUDE.md
      expect(generationTime).toBeLessThan(50); // < 50ms per table generation (we have 2 entities)
      expect(result.files.length).toBeGreaterThan(0);
      expect(result.errors).toHaveLength(0);

      // Verify we generated expected files
      const modelFiles = result.files.filter((f) =>
        f.path.startsWith("models/")
      );
      const validationFiles = result.files.filter((f) =>
        f.path.startsWith("validation/")
      );
      const typeFiles = result.files.filter((f) => f.path.startsWith("types/"));
      const componentFiles = result.files.filter((f) =>
        f.path.startsWith("components/")
      );

      expect(modelFiles).toHaveLength(2); // users.ts, posts.ts
      expect(validationFiles).toHaveLength(2); // users.ts, posts.ts
      expect(typeFiles).toHaveLength(3); // 3 enums
      expect(componentFiles).toHaveLength(4); // 2 forms + 2 tables
    });

    it("should handle parallel vs sequential generation performance", async () => {
      // Create slow generators to test parallel performance
      const slowGenerator1 = new MockIntegrationGenerator(
        "slow1",
        ["entity"],
        async () => {
          await new Promise((resolve) => setTimeout(resolve, 50));
          return [{ path: "slow1/output.ts", content: "slow1 output" }];
        }
      );

      const slowGenerator2 = new MockIntegrationGenerator(
        "slow2",
        ["entity"],
        async () => {
          await new Promise((resolve) => setTimeout(resolve, 50));
          return [{ path: "slow2/output.ts", content: "slow2 output" }];
        }
      );

      harness
        .registerGenerator(slowGenerator1)
        .registerGenerator(slowGenerator2);

      const projectDir = await harness.createTestProject({
        app: {
          name: "Parallel Test App",
          description: "Testing parallel generation",
          url: "https://parallel-test.example.com",
        },
        entities: {
          users: {
            tableName: "users",
            displayName: "Users",
            columns: {
              id: {
                dbConstraints: { type: "text", primaryKey: true },
                validation: { required: true },
              },
              name: {
                dbConstraints: { type: "text" },
                validation: { required: true, min: 2 },
              },
            },
            generateForm: true,
            generateTable: true,
          },
        },
      });

      // Test parallel execution
      const parallelResult = await benchmark.benchmark(
        "parallel-generation",
        async () => {
          return harness.runGeneration(projectDir, { parallel: true });
        }
      );

      // Test sequential execution
      const sequentialResult = await benchmark.benchmark(
        "sequential-generation",
        async () => {
          return harness.runGeneration(projectDir, { parallel: false });
        }
      );

      const parallelTime = benchmark.getMeasurement("parallel-generation");
      const sequentialTime = benchmark.getMeasurement("sequential-generation");

      expect(parallelResult.files).toHaveLength(2);
      expect(sequentialResult.files).toHaveLength(2);
      expect(parallelResult.errors).toHaveLength(0);
      expect(sequentialResult.errors).toHaveLength(0);

      // Parallel should be faster than sequential
      expect(parallelTime).toBeLessThan(sequentialTime);
      expect(parallelTime).toBeLessThan(80); // Should be faster than 2 * 50ms
      expect(sequentialTime).toBeGreaterThan(90); // Should be close to 2 * 50ms
    });
  });

  describe("Memory Usage", () => {
    it("should stay within memory targets for large generations", async () => {
      // Create a large number of entities to test memory usage
      const largeEntitySet: Record<string, unknown> = {};

      for (let i = 1; i <= 50; i++) {
        largeEntitySet[`entity${i}`] = {
          tableName: `entity${i}`,
          displayName: `Entity ${i}`,
          columns: {
            id: {
              dbConstraints: { type: "text", primaryKey: true },
              validation: { required: true },
            },
            name: {
              dbConstraints: { type: "text" },
              validation: { required: true },
            },
            description: {
              dbConstraints: { type: "text" },
              validation: { required: false },
            },
          },
          generateForm: true,
          generateTable: true,
        };
      }

      const memoryGenerator = new MockIntegrationGenerator(
        "memory-test",
        ["entity"],
        (context: GeneratorContext) => {
          const files = [];

          for (const [name] of context.schemas.entities) {
            // Generate reasonably sized files
            files.push({
              path: `models/${name}.ts`,
              content: `// Model for ${name}\n`.repeat(100), // ~2KB per file
            });
          }

          return files;
        }
      );

      harness.registerGenerator(memoryGenerator);

      const projectDir = await harness.createTestProject({
        app: {
          name: "Memory Test App",
          description: "Testing memory usage with large schema sets",
          url: "https://memory-test.example.com",
        },
        entities: largeEntitySet,
      });

      const initialMemory = process.memoryUsage().heapUsed;

      const result = await benchmark.benchmark("memory-test", async () => {
        return harness.runGeneration(projectDir);
      });

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024; // MB

      // Performance target from CLAUDE.md: < 10MB memory per table
      expect(memoryIncrease).toBeLessThan(50 * 10); // 50 entities * 10MB = 500MB max
      expect(result.files).toHaveLength(50);
      expect(result.errors).toHaveLength(0);

      const generationTime = benchmark.getMeasurement("memory-test");
      // Should complete 50 entity generation in under 2s (target from CLAUDE.md)
      expect(generationTime).toBeLessThan(2000);
    });
  });

  describe("Performance Summary", () => {
    it("should provide performance summary", async () => {
      const generator = new MockIntegrationGenerator(
        "summary-test",
        ["entity"],
        () => [{ path: "test.ts", content: "test" }]
      );

      harness.registerGenerator(generator);

      const _projectDir = await harness.createTestProject({
        app: {
          name: "Summary Test App",
          description: "Testing performance summary",
          url: "https://summary-test.example.com",
        },
        entities: {
          users: {
            tableName: "users",
            displayName: "Users",
            columns: {
              id: {
                dbConstraints: { type: "text", primaryKey: true },
                validation: { required: true },
              },
            },
            generateForm: true,
          },
        },
      });

      // Run multiple benchmarks
      await benchmark.benchmark("test1", async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      await benchmark.benchmark("test2", async () => {
        await new Promise((resolve) => setTimeout(resolve, 20));
      });

      await benchmark.benchmark("test3", async () => {
        await new Promise((resolve) => setTimeout(resolve, 15));
      });

      const summary = benchmark.getSummary();

      expect(summary.count).toBe(3);
      expect(summary.total).toBeGreaterThan(40);
      expect(summary.average).toBeGreaterThan(10);
      expect(summary.min).toBeGreaterThan(5);
      expect(summary.max).toBeGreaterThan(15);
    });
  });
});
