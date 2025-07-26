/**
 * Tests for configuration system
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdir, writeFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

import {
  defineConfig,
  loadConfig,
  findConfigFile,
  mergeConfig,
  resolveConfig,
  validateConfig,
  DEFAULT_CONFIG,
} from "../config";
import { ConfigurationError } from "../errors";

import type { ZenoConfigInput } from "../types/config";

describe("Configuration System", () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = join(tmpdir(), `zeno-test-${Date.now()}`);
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  describe("defineConfig", () => {
    it("should return the same config object", () => {
      const config: ZenoConfigInput = {
        schemaDir: "./custom",
        database: {
          provider: "postgresql",
          connection: "postgresql://test",
        },
      };

      const result = defineConfig(config);
      expect(result).toBe(config);
      expect(result).toEqual(config);
    });

    it("should provide type safety", () => {
      const config = defineConfig({
        schemaDir: "./zeno",
        outputDir: "./src",
        database: {
          provider: "postgresql",
          connection: "postgresql://localhost/test",
        },
        generate: {
          models: true,
          components: false,
        },
      });

      expect(config.schemaDir).toBe("./zeno");
      expect(config.generate?.models).toBe(true);
      expect(config.generate?.components).toBe(false);
    });
  });

  describe("validateConfig", () => {
    it("should validate valid config", () => {
      const config: ZenoConfigInput = {
        database: {
          provider: "postgresql",
          connection: "postgresql://test",
        },
      };

      const result = validateConfig(config);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject invalid provider", () => {
      const config = {
        database: {
          provider: "mysql",
          connection: "mysql://test",
        },
      };

      const result = validateConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          message: expect.stringContaining('expected "postgresql"'),
          path: "database.provider",
        })
      );
    });

    it("should reject empty connection string", () => {
      const config = {
        database: {
          provider: "postgresql",
          connection: "",
        },
      };

      const result = validateConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          message: "Database connection string is required",
          path: "database.connection",
        })
      );
    });

    it("should validate email configuration", () => {
      const config = {
        email: {
          host: "smtp.example.com",
          port: 587,
          auth: {
            user: "test@example.com",
            pass: "password",
          },
        },
      };

      const result = validateConfig(config);
      expect(result.valid).toBe(true);
    });

    it("should reject invalid email port", () => {
      const config = {
        email: {
          host: "smtp.example.com",
          port: 99999,
          auth: {
            user: "test@example.com",
            pass: "password",
          },
        },
      };

      const result = validateConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          message: expect.stringContaining("<=65535"),
          path: "email.port",
        })
      );
    });

    it("should handle non-object input", () => {
      const result = validateConfig("invalid");
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
    });
  });

  describe("mergeConfig", () => {
    it("should merge with defaults", () => {
      const input: ZenoConfigInput = {
        schemaDir: "./custom",
        database: {
          provider: "postgresql",
          connection: "postgresql://test",
        },
        email: {
          host: "smtp.test.com",
          auth: {
            user: "test@test.com",
            pass: "testpass",
          },
        },
      };

      const result = mergeConfig(input);

      expect(result.schemaDir).toBe("./custom");
      expect(result.outputDir).toBe("./src"); // from defaults
      expect(result.database.connection).toBe("postgresql://test");
      expect(result.database.migrations.dir).toBe("./drizzle"); // from defaults
      expect(result.generate.models).toBe(true); // from defaults
    });

    it("should deep merge nested objects", () => {
      const input: ZenoConfigInput = {
        database: {
          provider: "postgresql",
          connection: "postgresql://test",
          migrations: {
            auto: true,
          },
        },
        email: {
          host: "smtp.test.com",
          auth: {
            user: "test@test.com",
            pass: "testpass",
          },
        },
      };

      const result = mergeConfig(input);

      expect(result.database.connection).toBe("postgresql://test");
      expect(result.database.migrations.auto).toBe(true);
      expect(result.database.migrations.dir).toBe("./drizzle"); // preserved from defaults
    });

    it("should override array values completely", () => {
      const input: ZenoConfigInput = {
        database: {
          provider: "postgresql",
          connection: "postgresql://test",
        },
        email: {
          host: "smtp.test.com",
          auth: {
            user: "test@test.com",
            pass: "testpass",
          },
        },
        generate: {
          models: false,
          components: false,
        },
      };

      const result = mergeConfig(input);

      expect(result.generate.models).toBe(false);
      expect(result.generate.components).toBe(false);
      expect(result.generate.pages).toBe(true); // from defaults
    });

    it("should throw on invalid merged config", () => {
      const input = {
        database: {
          provider: "invalid" as const,
          connection: "test",
        },
      };

      expect(() => mergeConfig(input as unknown as ZenoConfigInput)).toThrow();
    });
  });

  describe("findConfigFile", () => {
    it("should find zeno.config.ts", async () => {
      const configPath = join(testDir, "zeno.config.ts");
      await writeFile(configPath, "export default {};");

      const result = await findConfigFile(testDir);
      expect(result).toBe(configPath);
    });

    it("should find zeno.config.js", async () => {
      const configPath = join(testDir, "zeno.config.js");
      await writeFile(configPath, "module.exports = {};");

      const result = await findConfigFile(testDir);
      expect(result).toBe(configPath);
    });

    it("should find zeno.config.mjs", async () => {
      const configPath = join(testDir, "zeno.config.mjs");
      await writeFile(configPath, "export default {};");

      const result = await findConfigFile(testDir);
      expect(result).toBe(configPath);
    });

    it("should prioritize .ts over .js", async () => {
      const tsPath = join(testDir, "zeno.config.ts");
      const jsPath = join(testDir, "zeno.config.js");

      await writeFile(jsPath, "module.exports = {};");
      await writeFile(tsPath, "export default {};");

      const result = await findConfigFile(testDir);
      expect(result).toBe(tsPath);
    });

    it("should search parent directories", async () => {
      const parentConfigPath = join(testDir, "zeno.config.ts");
      const subDir = join(testDir, "sub", "dir");

      await mkdir(subDir, { recursive: true });
      await writeFile(parentConfigPath, "export default {};");

      const result = await findConfigFile(subDir);
      expect(result).toBe(parentConfigPath);
    });

    it("should return null if no config found", async () => {
      const result = await findConfigFile(testDir);
      expect(result).toBeNull();
    });
  });

  describe("loadConfig", () => {
    it("should load valid TypeScript config", async () => {
      const configPath = join(testDir, "zeno.config.ts");
      const configContent = `
        export default {
          schemaDir: "./custom-zeno",
          database: {
            provider: "postgresql",
            connection: "postgresql://localhost/test",
          },
          email: {
            host: "smtp.test.com",
            auth: {
              user: "test@test.com",
              pass: "testpass",
            },
          },
        };
      `;

      await writeFile(configPath, configContent);

      const result = await loadConfig(configPath);
      expect(result.schemaDir).toBe("./custom-zeno");
      expect(result.database.connection).toBe("postgresql://localhost/test");
      expect(result.outputDir).toBe("./src"); // from defaults
    });

    it("should load valid JavaScript config", async () => {
      const configPath = join(testDir, "zeno.config.js");
      const configContent = `
        module.exports = {
          schemaDir: "./js-zeno",
          database: {
            provider: "postgresql",
            connection: "postgresql://localhost/js-test",
          },
          email: {
            host: "smtp.test.com",
            auth: {
              user: "test@test.com",
              pass: "testpass",
            },
          },
        };
      `;

      await writeFile(configPath, configContent);

      const result = await loadConfig(configPath);
      expect(result.schemaDir).toBe("./js-zeno");
      expect(result.database.connection).toBe("postgresql://localhost/js-test");
    });

    it("should handle default export", async () => {
      const configPath = join(testDir, "zeno.config.mjs");
      const configContent = `
        export default {
          schemaDir: "./mjs-zeno",
          database: {
            provider: "postgresql",
            connection: "postgresql://localhost/mjs-test",
          },
          email: {
            host: "smtp.test.com",
            auth: {
              user: "test@test.com",
              pass: "testpass",
            },
          },
        };
      `;

      await writeFile(configPath, configContent);

      const result = await loadConfig(configPath);
      expect(result.schemaDir).toBe("./mjs-zeno");
    });

    it("should throw ConfigurationError for invalid config", async () => {
      const configPath = join(testDir, "invalid.config.ts");
      const configContent = `
        export default {
          database: {
            provider: "mysql",
            connection: "mysql://test",
          },
        };
      `;

      await writeFile(configPath, configContent);

      await expect(loadConfig(configPath)).rejects.toThrow(ConfigurationError);
    });

    it("should throw ConfigurationError for non-existent file", async () => {
      const configPath = join(testDir, "nonexistent.config.ts");

      await expect(loadConfig(configPath)).rejects.toThrow(ConfigurationError);
    });

    it("should throw ConfigurationError for syntax errors", async () => {
      const configPath = join(testDir, "syntax-error.config.ts");
      const configContent = "export default { invalid syntax";

      await writeFile(configPath, configContent);

      await expect(loadConfig(configPath)).rejects.toThrow(ConfigurationError);
    });
  });

  describe("resolveConfig", () => {
    it("should load specific config file", async () => {
      const configPath = join(testDir, "custom.config.ts");
      const configContent = `
        export default {
          schemaDir: "./resolve-test",
          database: {
            provider: "postgresql",
            connection: "postgresql://localhost/resolve",
          },
          email: {
            host: "smtp.test.com",
            auth: {
              user: "test@test.com",
              pass: "testpass",
            },
          },
        };
      `;

      await writeFile(configPath, configContent);

      const result = await resolveConfig(configPath);
      expect(result.schemaDir).toBe("./resolve-test");
    });

    it("should find and load config automatically", async () => {
      const configPath = join(testDir, "zeno.config.ts");
      const configContent = `
        export default {
          schemaDir: "./auto-found",
          database: {
            provider: "postgresql",
            connection: "postgresql://localhost/auto",
          },
          email: {
            host: "smtp.test.com",
            auth: {
              user: "test@test.com",
              pass: "testpass",
            },
          },
        };
      `;

      await writeFile(configPath, configContent);

      // Change to testDir for automatic discovery
      const originalCwd = process.cwd();
      process.chdir(testDir);

      try {
        const result = await resolveConfig();
        expect(result.schemaDir).toBe("./auto-found");
      } finally {
        process.chdir(originalCwd);
      }
    });

    it("should return defaults when no config found", async () => {
      const result = await resolveConfig();
      expect(result).toEqual(DEFAULT_CONFIG);
    });
  });

  describe("Integration tests", () => {
    it("should work with the example config structure", async () => {
      const configPath = join(testDir, "zeno.config.ts");
      const configContent = `
        export default {
          schemaDir: "./zeno",
          outputDir: "./src",
          database: {
            provider: "postgresql",
            connection: "postgresql://localhost/zenotest",
            migrations: {
              dir: "./drizzle",
              auto: false,
            },
          },
          generate: {
            models: true,
            components: true,
            pages: true,
            api: true,
            navigation: true,
          },
          email: {
            host: "smtp.example.com",
            port: 587,
            auth: {
              user: "test@example.com",
              pass: "password",
            },
          },
          dev: {
            watch: true,
            verbose: false,
          },
        };
      `;

      await writeFile(configPath, configContent);

      const result = await loadConfig(configPath);

      expect(result.schemaDir).toBe("./zeno");
      expect(result.outputDir).toBe("./src");
      expect(result.database.provider).toBe("postgresql");
      expect(result.database.connection).toBe(
        "postgresql://localhost/zenotest"
      );
      expect(result.database.migrations.dir).toBe("./drizzle");
      expect(result.database.migrations.auto).toBe(false);
      expect(result.generate.models).toBe(true);
      expect(result.generate.navigation).toBe(true);
      expect(result.email.host).toBe("smtp.example.com");
      expect(result.email.port).toBe(587);
      expect(result.dev.watch).toBe(true);
      expect(result.dev.verbose).toBe(false);
    });
  });
});
