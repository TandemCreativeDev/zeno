/**
 * Configuration system for Zeno Framework
 * Handles loading, validation, and merging of configuration
 */

import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import {
  zenoConfigSchema,
  zenoConfigInputSchema,
} from "../validation/configSchema";
import { ConfigurationError } from "./errors";

import type { ZenoConfig, ZenoConfigInput } from "../types/config";
import type { ValidationResult } from "../types/core";

/**
 * Helper function for defining configuration with type safety
 * @param config - Configuration object
 * @returns The same configuration object with type safety
 */
export function defineConfig(config: ZenoConfigInput): ZenoConfigInput {
  return config;
}

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG: ZenoConfig = {
  schemaDir: "./zeno",
  outputDir: "./src",
  database: {
    provider: "postgresql",
    connection: "postgresql://localhost:5432/zeno",
    migrations: {
      dir: "./drizzle",
      auto: false,
    },
  },
  email: {
    host: "localhost",
    port: 587,
    auth: {
      user: "user@example.com",
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
    watch: false,
    verbose: false,
  },
};

/**
 * Deep merge two objects, with the second object taking precedence
 * Handles partial nested objects properly
 */
function deepMerge(target: unknown, source: unknown): unknown {
  if (target === null || typeof target !== "object" || Array.isArray(target)) {
    return source !== undefined ? source : target;
  }

  if (source === null || typeof source !== "object" || Array.isArray(source)) {
    return source !== undefined ? source : target;
  }

  const result = { ...(target as Record<string, unknown>) };
  const sourceObj = source as Record<string, unknown>;

  for (const key in sourceObj) {
    const sourceValue = sourceObj[key];
    const targetValue = result[key];

    if (sourceValue !== undefined) {
      if (
        sourceValue !== null &&
        typeof sourceValue === "object" &&
        !Array.isArray(sourceValue) &&
        targetValue !== null &&
        typeof targetValue === "object" &&
        !Array.isArray(targetValue)
      ) {
        result[key] = deepMerge(targetValue, sourceValue);
      } else {
        result[key] = sourceValue;
      }
    }
  }

  return result;
}

/**
 * Validate configuration input
 * @param config - Configuration to validate
 * @returns Validation result
 */
export function validateConfig(config: unknown): ValidationResult {
  try {
    zenoConfigInputSchema.parse(config);
    return { valid: true, errors: [] };
  } catch (error: unknown) {
    if (error && typeof error === "object" && "issues" in error) {
      const zodError = error as {
        issues: Array<{ message: string; path: (string | number)[] }>;
      };
      return {
        valid: false,
        errors: zodError.issues.map((err) => ({
          message: err.message,
          path: err.path.join("."),
        })),
      };
    }

    return {
      valid: false,
      errors: [
        {
          message:
            error instanceof Error ? error.message : "Unknown validation error",
          path: "",
        },
      ],
    };
  }
}

/**
 * Load configuration from file
 * @param configPath - Path to configuration file
 * @returns Promise resolving to configuration
 * @throws {ConfigurationError} When configuration is invalid or cannot be loaded
 */
export async function loadConfig(configPath: string): Promise<ZenoConfig> {
  try {
    const absolutePath = resolve(configPath);
    const fileUrl = pathToFileURL(absolutePath).href;

    const configModule = await import(fileUrl);
    const configData = configModule.default || configModule;

    const validation = validateConfig(configData);
    if (!validation.valid) {
      const errorMessages = validation.errors
        .map((err) => (err.path ? `${err.path}: ${err.message}` : err.message))
        .join("\n");
      throw new ConfigurationError(
        `Configuration validation failed:\n${errorMessages}`,
        configPath
      );
    }

    return mergeConfig(configData);
  } catch (error: unknown) {
    if (error instanceof ConfigurationError) {
      throw error;
    }

    const message = error instanceof Error ? error.message : "Unknown error";
    throw new ConfigurationError(
      `Failed to load configuration: ${message}`,
      configPath
    );
  }
}

/**
 * Find configuration file in common locations
 * @param startDir - Directory to start searching from
 * @returns Promise resolving to configuration file path or null if not found
 */
export async function findConfigFile(
  startDir: string = process.cwd()
): Promise<string | null> {
  const configFileNames = [
    "zeno.config.ts",
    "zeno.config.js",
    "zeno.config.mjs",
  ];

  let currentDir = resolve(startDir);

  while (currentDir !== "/") {
    for (const fileName of configFileNames) {
      const configPath = join(currentDir, fileName);
      try {
        await readFile(configPath);
        return configPath;
      } catch {
        // File doesn't exist, continue searching
      }
    }

    const parentDir = resolve(currentDir, "..");
    if (parentDir === currentDir) break;
    currentDir = parentDir;
  }

  return null;
}

/**
 * Merge input configuration with defaults
 * @param input - Input configuration
 * @returns Complete configuration with defaults applied
 */
export function mergeConfig(input: ZenoConfigInput): ZenoConfig {
  const merged = deepMerge(DEFAULT_CONFIG, input);

  // Final validation to ensure required fields are present
  const result = zenoConfigSchema.parse(merged);
  return result;
}

/**
 * Load configuration from file or use defaults
 * @param configPath - Optional path to configuration file
 * @returns Promise resolving to configuration
 */
export async function resolveConfig(configPath?: string): Promise<ZenoConfig> {
  if (configPath) {
    return loadConfig(configPath);
  }

  const foundConfigPath = await findConfigFile();
  if (foundConfigPath) {
    return loadConfig(foundConfigPath);
  }

  // Return defaults if no config file found
  return DEFAULT_CONFIG;
}
