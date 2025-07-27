/**
 * @fileoverview Core Zeno Framework package - schema loading, validation, and generation pipeline
 */

export const version = "0.0.1";

export function createZeno() {
  return {
    version,
  };
}

export { GenerationPipeline } from "./GenerationPipeline";
export type { SchemaType } from "./Generator";
export { Generator } from "./Generator";
export { createTemplateEngine, TemplateEngine } from "./TemplateEngine";
export * from "./types";
export * from "./utils";
export * from "./validation";
