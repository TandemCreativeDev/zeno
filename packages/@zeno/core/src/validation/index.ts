/**
 * Schema validation using Zod for all Zeno configuration types
 */

export type { ValidationError, ValidationResult } from "../types/core";
export type {
  AppFeatures,
  AppMetadata,
  AppSchema,
  AppTheme,
} from "./appSchema";
export { AppSchemaValidator } from "./appSchema";
export {
  databaseConfigSchema,
  devConfigSchema,
  emailConfigSchema,
  generateConfigSchema,
  zenoConfigInputSchema,
  zenoConfigSchema,
} from "./configSchema";
// Export all schema types
export type {
  DbConstraints,
  EntityColumn,
  EntityIndex,
  EntityRelationship,
  EntitySchema,
  EntityUi,
  EntityVisibility,
  FormSection,
  UiMetadata,
  ValidationRules,
} from "./entitySchema";
export { EntitySchemaValidator } from "./entitySchema";
export type {
  EnumSchema,
  EnumValue,
} from "./enumSchema";
export { EnumSchemaValidator } from "./enumSchema";
export type {
  PageAuth,
  PageMetadata,
  PageNavigation,
  PageSchema,
  PageSection,
  PageSectionFilters,
  PageStat,
} from "./pageSchema";
export { PageSchemaValidator } from "./pageSchema";
export { validateSchemaSet } from "./schemaSet";
