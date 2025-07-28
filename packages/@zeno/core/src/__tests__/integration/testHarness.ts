import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { GenerationPipeline } from "../../GenerationPipeline";
import type { SchemaType } from "../../Generator";
import { Generator } from "../../Generator";
import type { ZenoConfig } from "../../types/config";
import type {
  GeneratedFile,
  GeneratorContext,
  SchemaSet,
} from "../../types/core";
import { loadConfig } from "../../utils/config";
import { SchemaLoader } from "../../utils/schemaLoader";

/**
 * Integration test harness for end-to-end testing of the Zeno core pipeline.
 * Provides utilities for setting up test projects, running generation, and verifying outputs.
 */
export class IntegrationTestHarness {
  private tempDir: string | null = null;
  private pipeline: GenerationPipeline = new GenerationPipeline();
  private loader: SchemaLoader = new SchemaLoader();

  /**
   * Set up a temporary directory for test execution
   */
  async setup(): Promise<string> {
    this.tempDir = await mkdtemp(join(tmpdir(), "zeno-integration-"));
    return this.tempDir;
  }

  /**
   * Clean up temporary directory and resources
   */
  async cleanup(): Promise<void> {
    if (this.tempDir) {
      await rm(this.tempDir, { recursive: true, force: true });
      this.tempDir = null;
    }
    this.pipeline = new GenerationPipeline();
  }

  /**
   * Create a test project structure with schemas from JSON files
   */
  async createTestProjectFromJson(
    projectName: "blog" | "simple",
    config?: Partial<ZenoConfig>
  ): Promise<string> {
    if (!this.tempDir) {
      throw new Error("Test harness not set up. Call setup() first.");
    }

    const projectDir = join(this.tempDir, "test-project");
    const schemaDir = join(projectDir, "zeno");
    const sourceDir = join(
      __dirname,
      "../../../../../../docs/examples/projects",
      projectName
    );

    // Create directory structure
    await Promise.all([
      this.createDir(projectDir),
      this.createDir(schemaDir),
      this.createDir(join(schemaDir, "entities")),
      this.createDir(join(schemaDir, "enums")),
      this.createDir(join(schemaDir, "pages")),
      this.createDir(join(projectDir, "src")),
    ]);

    // Copy JSON files from docs/examples/projects
    const { readdir, readFile, writeFile } = await import("node:fs/promises");

    // Copy app.json
    const appContent = await readFile(join(sourceDir, "app.json"), "utf-8");
    await writeFile(join(schemaDir, "app.json"), appContent);

    // Copy entities
    try {
      const entities = await readdir(join(sourceDir, "entities"));
      for (const entity of entities) {
        const content = await readFile(
          join(sourceDir, "entities", entity),
          "utf-8"
        );
        await writeFile(join(schemaDir, "entities", entity), content);
      }
    } catch {
      // No entities directory
    }

    // Copy enums
    try {
      const enums = await readdir(join(sourceDir, "enums"));
      for (const enumFile of enums) {
        const content = await readFile(
          join(sourceDir, "enums", enumFile),
          "utf-8"
        );
        await writeFile(join(schemaDir, "enums", enumFile), content);
      }
    } catch {
      // No enums directory
    }

    // Copy pages
    try {
      const pages = await readdir(join(sourceDir, "pages"));
      for (const page of pages) {
        const content = await readFile(join(sourceDir, "pages", page), "utf-8");
        await writeFile(join(schemaDir, "pages", page), content);
      }
    } catch {
      // No pages directory
    }

    // Write config file if provided
    if (config) {
      const configContent = `export default ${JSON.stringify(
        {
          schemaDir: "./zeno",
          outputDir: "./src",
          ...config,
        },
        null,
        2
      )};`;

      await writeFile(join(projectDir, "zeno.config.ts"), configContent);
    }

    return projectDir;
  }

  /**
   * Create a test project structure with schemas (legacy method for backward compatibility)
   */
  async createTestProject(
    schemas: {
      app?: Record<string, unknown>;
      entities?: Record<string, Record<string, unknown>>;
      enums?: Record<string, Record<string, unknown>>;
      pages?: Record<string, Record<string, unknown>>;
    },
    config?: Partial<ZenoConfig>
  ): Promise<string> {
    if (!this.tempDir) {
      throw new Error("Test harness not set up. Call setup() first.");
    }

    const projectDir = join(this.tempDir, "test-project");
    const schemaDir = join(projectDir, "zeno");

    // Create directory structure
    await Promise.all([
      this.createDir(projectDir),
      this.createDir(schemaDir),
      this.createDir(join(schemaDir, "entities")),
      this.createDir(join(schemaDir, "enums")),
      this.createDir(join(schemaDir, "pages")),
      this.createDir(join(projectDir, "src")),
    ]);

    // Write schema files
    if (schemas.app) {
      await writeFile(
        join(schemaDir, "app.json"),
        JSON.stringify(schemas.app, null, 2)
      );
    }

    if (schemas.entities) {
      for (const [name, entity] of Object.entries(schemas.entities)) {
        await writeFile(
          join(schemaDir, "entities", `${name}.json`),
          JSON.stringify(entity, null, 2)
        );
      }
    }

    if (schemas.enums) {
      for (const [name, enumDef] of Object.entries(schemas.enums)) {
        await writeFile(
          join(schemaDir, "enums", `${name}.json`),
          JSON.stringify(enumDef, null, 2)
        );
      }
    }

    if (schemas.pages) {
      for (const [name, page] of Object.entries(schemas.pages)) {
        await writeFile(
          join(schemaDir, "pages", `${name}.json`),
          JSON.stringify(page, null, 2)
        );
      }
    }

    // Write config file if provided
    if (config) {
      const configContent = `export default ${JSON.stringify(
        {
          schemaDir: "./zeno",
          outputDir: "./src",
          ...config,
        },
        null,
        2
      )};`;

      await writeFile(join(projectDir, "zeno.config.ts"), configContent);
    }

    return projectDir;
  }

  /**
   * Register generators for testing
   */
  registerGenerator(generator: Generator): this {
    this.pipeline.register(generator);
    return this;
  }

  /**
   * Load schemas from a project directory
   */
  async loadSchemas(projectDir: string): Promise<SchemaSet> {
    const schemaDir = join(projectDir, "zeno");
    return this.loader.load(schemaDir);
  }

  /**
   * Load configuration from a project directory
   */
  async loadConfiguration(projectDir: string): Promise<ZenoConfig> {
    try {
      return await loadConfig(projectDir);
    } catch {
      // If no config file found, return default config
      const { DEFAULT_CONFIG } = await import("../../utils/config");
      return DEFAULT_CONFIG;
    }
  }

  /**
   * Run the generation pipeline on a test project
   */
  async runGeneration(
    projectDir: string,
    options?: { generators?: string[]; parallel?: boolean }
  ): Promise<{
    files: GeneratedFile[];
    schemas: SchemaSet;
    config: ZenoConfig;
    duration: number;
    errors: Error[];
  }> {
    const [schemas, config] = await Promise.all([
      this.loadSchemas(projectDir),
      this.loadConfiguration(projectDir),
    ]);

    const startTime = Date.now();
    const result = await this.pipeline.generate(schemas, config, options);
    const duration = Date.now() - startTime;

    return {
      files: result.files,
      schemas,
      config,
      duration,
      errors: result.errors,
    };
  }

  /**
   * Verify that generated files exist and have expected content
   */
  async verifyGeneratedFiles(
    projectDir: string,
    expectedFiles: Array<{
      path: string;
      contentIncludes?: string[];
      contentExcludes?: string[];
      exists?: boolean;
    }>
  ): Promise<void> {
    for (const expected of expectedFiles) {
      const fullPath = join(projectDir, expected.path);

      if (expected.exists === false) {
        try {
          await readFile(fullPath);
          throw new Error(`File ${expected.path} should not exist`);
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
            throw error;
          }
        }
        continue;
      }

      let content: string;
      try {
        content = await readFile(fullPath, "utf-8");
      } catch (error) {
        throw new Error(
          `Expected file ${expected.path} does not exist: ${error}`
        );
      }

      if (expected.contentIncludes) {
        for (const include of expected.contentIncludes) {
          if (!content.includes(include)) {
            throw new Error(
              `File ${expected.path} does not contain expected content: "${include}"`
            );
          }
        }
      }

      if (expected.contentExcludes) {
        for (const exclude of expected.contentExcludes) {
          if (content.includes(exclude)) {
            throw new Error(
              `File ${expected.path} contains unexpected content: "${exclude}"`
            );
          }
        }
      }
    }
  }

  /**
   * Create a directory, ensuring parent directories exist
   */
  private async createDir(path: string): Promise<void> {
    const { mkdir } = await import("node:fs/promises");
    await mkdir(path, { recursive: true });
  }

  /**
   * Get the current temporary directory
   */
  getTempDir(): string {
    if (!this.tempDir) {
      throw new Error("Test harness not set up. Call setup() first.");
    }
    return this.tempDir;
  }

  /**
   * Get registered generator names
   */
  getRegisteredGenerators(): string[] {
    return this.pipeline.getRegisteredGenerators();
  }

  /**
   * Check if generator is registered
   */
  hasGenerator(name: string): boolean {
    return this.pipeline.hasGenerator(name);
  }
}

/**
 * Mock generator for integration testing
 */
export class MockIntegrationGenerator extends Generator {
  constructor(
    public readonly name: string,
    private readonly supportedTypes: SchemaType[],
    private readonly fileGenerator: (
      context: GeneratorContext
    ) => GeneratedFile[]
  ) {
    super();
  }

  supports(schemaType: SchemaType): boolean {
    return this.supportedTypes.includes(schemaType);
  }

  async generate(context: GeneratorContext): Promise<GeneratedFile[]> {
    return this.fileGenerator(context);
  }
}

/**
 * Performance benchmark utilities
 */
export class PerformanceBenchmark {
  private measurements: Array<{
    name: string;
    duration: number;
    timestamp: number;
  }> = [];

  /**
   * Run a benchmark with timing
   */
  async benchmark<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = Date.now();
    const result = await fn();
    const duration = Date.now() - start;

    this.measurements.push({
      name,
      duration,
      timestamp: start,
    });

    return result;
  }

  /**
   * Get all measurements
   */
  getMeasurements(): Array<{
    name: string;
    duration: number;
    timestamp: number;
  }> {
    return [...this.measurements];
  }

  /**
   * Get measurement by name
   */
  getMeasurement(name: string): number | undefined {
    return this.measurements.find((m) => m.name === name)?.duration;
  }

  /**
   * Clear all measurements
   */
  clear(): void {
    this.measurements = [];
  }

  /**
   * Get performance summary
   */
  getSummary(): {
    total: number;
    average: number;
    min: number;
    max: number;
    count: number;
  } {
    if (this.measurements.length === 0) {
      return { total: 0, average: 0, min: 0, max: 0, count: 0 };
    }

    const durations = this.measurements.map((m) => m.duration);
    const total = durations.reduce((sum, d) => sum + d, 0);

    return {
      total,
      average: total / durations.length,
      min: Math.min(...durations),
      max: Math.max(...durations),
      count: durations.length,
    };
  }
}
