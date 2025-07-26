/**
 * @fileoverview Core Zeno Framework package - schema loading, validation, and generation pipeline
 */

export const version = "0.0.1";

export function createZeno() {
  return {
    version,
  };
}

export * from "./types";
export * from "./validation";
export * from "./errors";
export { SchemaLoader, createSchemaLoader } from "./schemaLoader";
export { defineConfig, loadConfig, findConfigFile, mergeConfig, resolveConfig, validateConfig, DEFAULT_CONFIG } from "./config";