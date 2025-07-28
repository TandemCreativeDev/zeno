import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { GeneratorContext } from "../../types/core";
import {
  IntegrationTestHarness,
  MockIntegrationGenerator,
} from "./testHarness";

describe("Core Integration Tests", () => {
  let harness: IntegrationTestHarness;

  beforeEach(async () => {
    harness = new IntegrationTestHarness();
    await harness.setup();
  });

  afterEach(async () => {
    await harness.cleanup();
  });

  describe("Schema Loading and Validation", () => {
    it("should load and validate simple project schemas", async () => {
      const projectDir = await harness.createTestProjectFromJson("simple");

      const schemas = await harness.loadSchemas(projectDir);

      expect(schemas.entities.size).toBe(1);
      expect(schemas.enums.size).toBe(1);
      expect(schemas.pages.size).toBe(1);
      expect(schemas.app.name).toBe("Simple App");

      const userEntity = schemas.entities.get("users");
      expect(userEntity).toBeDefined();
      expect(userEntity?.tableName).toBe("users");
      expect(userEntity?.displayName).toBe("Users");
      expect(Object.keys(userEntity?.columns || {})).toHaveLength(4);

      const statusEnum = schemas.enums.get("status");
      expect(statusEnum).toBeDefined();
      expect(Object.keys(statusEnum?.values || {})).toHaveLength(3);

      const homePage = schemas.pages.get("home");
      expect(homePage).toBeDefined();
      expect(homePage?.route).toBe("/");
      expect(homePage?.sections).toHaveLength(2);
    });

    it("should load and validate complex blog project schemas", async () => {
      const projectDir = await harness.createTestProjectFromJson("blog");

      const schemas = await harness.loadSchemas(projectDir);

      expect(schemas.entities.size).toBe(2);
      expect(schemas.enums.size).toBe(3);
      expect(schemas.pages.size).toBe(4);
      expect(schemas.app.name).toBe("My Blog");

      // Verify entities
      const userEntity = schemas.entities.get("users");
      const postEntity = schemas.entities.get("posts");
      expect(userEntity).toBeDefined();
      expect(postEntity).toBeDefined();
      expect(Object.keys(userEntity?.columns || {})).toHaveLength(8);
      expect(Object.keys(postEntity?.columns || {})).toHaveLength(10);

      // Verify enums
      const userRoleEnum = schemas.enums.get("userRole");
      const userStatusEnum = schemas.enums.get("userStatus");
      const postStatusEnum = schemas.enums.get("postStatus");
      expect(userRoleEnum).toBeDefined();
      expect(userStatusEnum).toBeDefined();
      expect(postStatusEnum).toBeDefined();

      // Verify pages
      const pages = ["home", "blog", "dashboard", "about"];
      for (const pageName of pages) {
        const page = schemas.pages.get(pageName);
        expect(page, `Page ${pageName} should exist`).toBeDefined();
        expect(
          page?.sections?.length,
          `Page ${pageName} should have sections`
        ).toBeGreaterThan(0);
      }
    });

    it("should handle cross-schema references correctly", async () => {
      const projectDir = await harness.createTestProjectFromJson("blog");

      const schemas = await harness.loadSchemas(projectDir);

      // Verify foreign key reference
      const postEntity = schemas.entities.get("posts");
      const authorIdColumn = postEntity?.columns?.authorId;
      expect(authorIdColumn?.dbConstraints?.references).toEqual({
        table: "users",
        column: "id",
      });

      // Verify enum references
      const userEntity = schemas.entities.get("users");
      const roleColumn = userEntity?.columns?.role;
      const statusColumn = userEntity?.columns?.status;
      expect(roleColumn?.validation?.enum).toBe("userRole");
      expect(statusColumn?.validation?.enum).toBe("userStatus");

      // Verify page entity references
      const homePage = schemas.pages.get("home");
      const tableSection = homePage?.sections?.find((s) => s.type === "table");
      expect(tableSection?.entity).toBe("posts");
    });
  });

  describe("Configuration Loading", () => {
    it("should load configuration from project", async () => {
      const config = {
        schemaDir: "./zeno",
        outputDir: "./src",
        database: {
          provider: "postgresql" as const,
          connection: "postgresql://localhost:5432/simple_test",
        },
        generate: {
          models: true,
          components: true,
          pages: true,
          api: true,
        },
      };

      const projectDir = await harness.createTestProjectFromJson(
        "simple",
        config
      );

      const loadedConfig = await harness.loadConfiguration(projectDir);

      expect(loadedConfig.schemaDir).toBe("./zeno");
      expect(loadedConfig.outputDir).toBe("./src");
      expect(loadedConfig.database?.provider).toBe("postgresql");
      expect(loadedConfig.generate?.models).toBe(true);
      expect(loadedConfig.generate?.components).toBe(true);
      expect(loadedConfig.generate?.pages).toBe(true);
      expect(loadedConfig.generate?.api).toBe(true);
    });

    it("should use defaults when no config provided", async () => {
      const projectDir = await harness.createTestProjectFromJson("simple");

      const config = await harness.loadConfiguration(projectDir);

      expect(config.schemaDir).toBe("./zeno");
      expect(config.outputDir).toBe("./src");
    });
  });

  describe("Generation Pipeline", () => {
    it("should run end-to-end generation with mock generators", async () => {
      // Register mock generators
      const modelGenerator = new MockIntegrationGenerator(
        "models",
        ["entity", "enum"],
        (context: GeneratorContext) => {
          const files = [];
          for (const [name] of context.schemas.entities) {
            files.push({
              path: `models/${name}.ts`,
              content: `export interface ${name} { id: string; }`,
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
                content: `export function ${name}Form() { return <div>${name} Form</div>; }`,
              });
            }
            if (entity.generateTable) {
              files.push({
                path: `components/${name}Table.tsx`,
                content: `export function ${name}Table() { return <div>${name} Table</div>; }`,
              });
            }
          }
          return files;
        }
      );

      harness
        .registerGenerator(modelGenerator)
        .registerGenerator(componentGenerator);

      const projectDir = await harness.createTestProjectFromJson("simple");

      const result = await harness.runGeneration(projectDir);

      expect(result.errors).toHaveLength(0);
      expect(result.files).toHaveLength(4); // 1 entity + 1 enum + 1 form + 1 table
      expect(result.duration).toBeGreaterThanOrEqual(0);

      // Verify generated files
      const modelFiles = result.files.filter((f) =>
        f.path.startsWith("models/")
      );
      const componentFiles = result.files.filter((f) =>
        f.path.startsWith("components/")
      );

      expect(modelFiles).toHaveLength(2); // users.ts + status.ts
      expect(componentFiles).toHaveLength(2); // UsersForm.tsx + UsersTable.tsx

      const userModel = modelFiles.find((f) => f.path === "models/users.ts");
      expect(userModel?.content).toContain("export interface users");

      const userForm = componentFiles.find(
        (f) => f.path === "components/usersForm.tsx"
      );
      expect(userForm?.content).toContain("users Form");
    });

    it("should handle selective generation", async () => {
      const modelGenerator = new MockIntegrationGenerator(
        "models",
        ["entity"],
        (_context: GeneratorContext) => [
          {
            path: "models/generated.ts",
            content: "// Models generated",
          },
        ]
      );

      const componentGenerator = new MockIntegrationGenerator(
        "components",
        ["entity"],
        (_context: GeneratorContext) => [
          {
            path: "components/generated.tsx",
            content: "// Components generated",
          },
        ]
      );

      harness
        .registerGenerator(modelGenerator)
        .registerGenerator(componentGenerator);

      const projectDir = await harness.createTestProjectFromJson("simple");

      // Generate only models
      const result = await harness.runGeneration(projectDir, {
        generators: ["models"],
      });

      expect(result.files).toHaveLength(1);
      expect(result.files[0].path).toBe("models/generated.ts");
      expect(result.files[0].content).toBe("// Models generated");
    });

    it("should handle generation errors gracefully", async () => {
      const failingGenerator = new MockIntegrationGenerator(
        "failing",
        ["entity"],
        () => {
          throw new Error("Generation failed");
        }
      );

      const workingGenerator = new MockIntegrationGenerator(
        "working",
        ["entity"],
        () => [
          {
            path: "working/output.ts",
            content: "// Working generator output",
          },
        ]
      );

      harness
        .registerGenerator(failingGenerator)
        .registerGenerator(workingGenerator);

      const projectDir = await harness.createTestProjectFromJson("simple");

      const result = await harness.runGeneration(projectDir);

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toBe("Generation failed");
      expect(result.files).toHaveLength(1); // Only from working generator
      expect(result.files[0].path).toBe("working/output.ts");
    });
  });

  describe("File System Operations", () => {
    it("should verify generated file structure", async () => {
      const generator = new MockIntegrationGenerator(
        "test",
        ["entity", "enum", "page"],
        (context: GeneratorContext) => {
          const files = [];

          // Generate model files
          for (const [name] of context.schemas.entities) {
            files.push({
              path: `src/models/${name}.ts`,
              content: `// Model: ${name}\nexport interface ${name} {}`,
            });
          }

          // Generate enum files
          for (const [name] of context.schemas.enums) {
            files.push({
              path: `src/types/${name}.ts`,
              content: `// Enum: ${name}\nexport enum ${name} {}`,
            });
          }

          // Generate page files
          for (const [name] of context.schemas.pages) {
            files.push({
              path: `src/app/${name}/page.tsx`,
              content: `// Page: ${name}\nexport default function ${name}Page() {}`,
            });
          }

          return files;
        }
      );

      harness.registerGenerator(generator);

      const projectDir = await harness.createTestProjectFromJson("blog");

      const result = await harness.runGeneration(projectDir);

      // Write generated files to disk for verification
      const fs = await import("node:fs/promises");
      for (const file of result.files) {
        const fullPath = `${projectDir}/${file.path}`;
        const dir = fullPath.substring(0, fullPath.lastIndexOf("/"));
        await fs.mkdir(dir, { recursive: true });
        await fs.writeFile(fullPath, file.content);
      }

      // Use the test harness to verify files
      await harness.verifyGeneratedFiles(projectDir, [
        {
          path: "src/models/users.ts",
          contentIncludes: ["// Model: users", "export interface users"],
        },
        {
          path: "src/types/userRole.ts",
          contentIncludes: ["// Enum: userRole", "export enum userRole"],
        },
        {
          path: "src/app/home/page.tsx",
          contentIncludes: [
            "// Page: home",
            "export default function homePage",
          ],
        },
        {
          path: "src/nonexistent.ts",
          exists: false,
        },
      ]);
    });
  });

  describe("Schema Set Integrity", () => {
    it("should maintain schema relationships during generation", async () => {
      const analyzerGenerator = new MockIntegrationGenerator(
        "analyzer",
        ["entity", "enum", "page"],
        (context: GeneratorContext) => {
          const analysis = {
            entities: Array.from(context.schemas.entities.keys()),
            enums: Array.from(context.schemas.enums.keys()),
            pages: Array.from(context.schemas.pages.keys()),
            appName: context.schemas.app.name,
            totalSchemas:
              context.schemas.entities.size +
              context.schemas.enums.size +
              context.schemas.pages.size,
          };

          return [
            {
              path: "analysis/schema-report.json",
              content: JSON.stringify(analysis, null, 2),
            },
          ];
        }
      );

      harness.registerGenerator(analyzerGenerator);

      const projectDir = await harness.createTestProjectFromJson("blog");

      const result = await harness.runGeneration(projectDir);

      expect(result.files).toHaveLength(1);

      const reportContent = JSON.parse(result.files[0].content);
      expect(reportContent.entities).toEqual(
        expect.arrayContaining(["users", "posts"])
      );
      expect(reportContent.enums).toEqual(
        expect.arrayContaining(["userRole", "userStatus", "postStatus"])
      );
      expect(reportContent.pages).toEqual(
        expect.arrayContaining(["home", "blog", "dashboard", "about"])
      );
      expect(reportContent.appName).toBe("My Blog");
      expect(reportContent.totalSchemas).toBe(9); // 2 entities + 3 enums + 4 pages
    });
  });
});
