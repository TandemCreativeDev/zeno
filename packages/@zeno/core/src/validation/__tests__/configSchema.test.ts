/**
 * Tests for configuration schema validation
 */

import { describe, it, expect } from "vitest";
import {
  zenoConfigSchema,
  zenoConfigInputSchema,
  databaseConfigSchema,
  emailConfigSchema,
  generateConfigSchema,
  devConfigSchema,
} from "../configSchema";

describe("Configuration Schema Validation", () => {
  describe("databaseConfigSchema", () => {
    it("should validate valid database config", () => {
      const config = {
        provider: "postgresql" as const,
        connection: "postgresql://localhost/test",
        migrations: {
          dir: "./drizzle",
          auto: false,
        },
      };

      const result = databaseConfigSchema.parse(config);
      expect(result).toEqual(config);
    });

    it("should apply default migrations config", () => {
      const config = {
        provider: "postgresql" as const,
        connection: "postgresql://localhost/test",
      };

      const result = databaseConfigSchema.parse(config);
      expect(result.migrations).toEqual({
        dir: "./drizzle",
        auto: false,
      });
    });

    it("should reject invalid provider", () => {
      const config = {
        provider: "mysql",
        connection: "mysql://localhost/test",
      };

      expect(() => databaseConfigSchema.parse(config)).toThrow();
    });

    it("should reject empty connection string", () => {
      const config = {
        provider: "postgresql" as const,
        connection: "",
      };

      expect(() => databaseConfigSchema.parse(config)).toThrow();
    });

    it("should reject extra properties", () => {
      const config = {
        provider: "postgresql" as const,
        connection: "postgresql://localhost/test",
        extra: "property",
      };

      expect(() => databaseConfigSchema.parse(config)).toThrow();
    });
  });

  describe("emailConfigSchema", () => {
    it("should validate valid email config", () => {
      const config = {
        host: "smtp.example.com",
        port: 587,
        auth: {
          user: "test@example.com",
          pass: "password",
        },
      };

      const result = emailConfigSchema.parse(config);
      expect(result).toEqual(config);
    });

    it("should apply default port", () => {
      const config = {
        host: "smtp.example.com",
        auth: {
          user: "test@example.com",
          pass: "password",
        },
      };

      const result = emailConfigSchema.parse(config);
      expect(result.port).toBe(587);
    });

    it("should reject invalid port ranges", () => {
      const config = {
        host: "smtp.example.com",
        port: 99999,
        auth: {
          user: "test@example.com",
          pass: "password",
        },
      };

      expect(() => emailConfigSchema.parse(config)).toThrow();
    });

    it("should reject empty host", () => {
      const config = {
        host: "",
        auth: {
          user: "test@example.com",
          pass: "password",
        },
      };

      expect(() => emailConfigSchema.parse(config)).toThrow();
    });

    it("should reject missing auth credentials", () => {
      const config = {
        host: "smtp.example.com",
        auth: {
          user: "",
          pass: "password",
        },
      };

      expect(() => emailConfigSchema.parse(config)).toThrow();
    });
  });

  describe("generateConfigSchema", () => {
    it("should validate valid generate config", () => {
      const config = {
        models: true,
        components: false,
        pages: true,
        api: false,
        navigation: true,
      };

      const result = generateConfigSchema.parse(config);
      expect(result).toEqual(config);
    });

    it("should apply defaults for all generators", () => {
      const result = generateConfigSchema.parse({});
      expect(result).toEqual({
        models: true,
        components: true,
        pages: true,
        api: true,
        navigation: true,
      });
    });

    it("should allow partial configuration", () => {
      const config = {
        models: false,
        components: false,
      };

      const result = generateConfigSchema.parse(config);
      expect(result.models).toBe(false);
      expect(result.components).toBe(false);
      expect(result.pages).toBe(true); // default
      expect(result.api).toBe(true); // default
      expect(result.navigation).toBe(true); // default
    });
  });

  describe("devConfigSchema", () => {
    it("should validate valid dev config", () => {
      const config = {
        watch: true,
        verbose: false,
      };

      const result = devConfigSchema.parse(config);
      expect(result).toEqual(config);
    });

    it("should apply defaults", () => {
      const result = devConfigSchema.parse({});
      expect(result).toEqual({
        watch: false,
        verbose: false,
      });
    });
  });

  describe("zenoConfigSchema", () => {
    it("should validate complete valid config", () => {
      const config = {
        schemaDir: "./zeno",
        outputDir: "./src",
        database: {
          provider: "postgresql" as const,
          connection: "postgresql://localhost/test",
          migrations: {
            dir: "./drizzle",
            auto: false,
          },
        },
        email: {
          host: "smtp.example.com",
          port: 587,
          auth: {
            user: "test@example.com",
            pass: "password",
          },
        },
        generate: {
          models: true,
          components: true,
          pages: true,
          api: true,
          navigation: true,
        },
        dev: {
          watch: true,
          verbose: false,
        },
      };

      const result = zenoConfigSchema.parse(config);
      expect(result).toEqual(config);
    });

    it("should apply all defaults", () => {
      const config = {
        database: {
          provider: "postgresql" as const,
          connection: "postgresql://localhost/test",
        },
        email: {
          host: "smtp.example.com",
          auth: {
            user: "test@example.com",
            pass: "password",
          },
        },
      };

      const result = zenoConfigSchema.parse(config);
      
      expect(result.schemaDir).toBe("./zeno");
      expect(result.outputDir).toBe("./src");
      expect(result.database.migrations.dir).toBe("./drizzle");
      expect(result.database.migrations.auto).toBe(false);
      expect(result.email.port).toBe(587);
      expect(result.generate).toEqual({
        models: true,
        components: true,
        pages: true,
        api: true,
        navigation: true,
      });
      expect(result.dev).toEqual({
        watch: false,
        verbose: false,
      });
    });

    it("should reject incomplete config", () => {
      const config = {
        schemaDir: "./zeno",
        // missing required database and email
      };

      expect(() => zenoConfigSchema.parse(config)).toThrow();
    });

    it("should reject extra properties at root level", () => {
      const config = {
        schemaDir: "./zeno",
        outputDir: "./src",
        database: {
          provider: "postgresql" as const,
          connection: "postgresql://localhost/test",
        },
        email: {
          host: "smtp.example.com",
          auth: {
            user: "test@example.com",
            pass: "password",
          },
        },
        extraProperty: "not allowed",
      };

      expect(() => zenoConfigSchema.parse(config)).toThrow();
    });
  });

  describe("zenoConfigInputSchema", () => {
    it("should allow partial config", () => {
      const config = {
        schemaDir: "./custom-zeno",
        database: {
          provider: "postgresql" as const,
          connection: "postgresql://localhost/test",
        },
      };

      const result = zenoConfigInputSchema.parse(config);
      expect(result.schemaDir).toBe("./custom-zeno");
      expect(result.database?.provider).toBe("postgresql");
      expect(result.email).toBeUndefined();
    });

    it("should allow empty config", () => {
      const result = zenoConfigInputSchema.parse({});
      expect(result).toEqual({});
    });

    it("should allow deeply partial config", () => {
      const config = {
        database: {
          connection: "postgresql://localhost/partial",
        },
        generate: {
          models: false,
        },
      };

      const result = zenoConfigInputSchema.parse(config);
      expect(result.database?.connection).toBe("postgresql://localhost/partial");
      expect(result.database?.provider).toBeUndefined();
      expect(result.generate?.models).toBe(false);
      // Note: components will have default value since the schema has defaults
      expect(result.generate?.components).toBe(true);
    });

    it("should still validate types when provided", () => {
      const config = {
        database: {
          provider: "mysql", // invalid
          connection: "mysql://localhost/test",
        },
      };

      expect(() => zenoConfigInputSchema.parse(config)).toThrow();
    });
  });
});