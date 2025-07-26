/**
 * Schema validation using Zod for all Zeno configuration types
 */

export { EntitySchemaValidator } from "./entitySchema";
export { EnumSchemaValidator } from "./enumSchema";
export { PageSchemaValidator } from "./pageSchema";
export { AppSchemaValidator } from "./appSchema";
export { validateSchemaSet } from "./schemaSet";

export type { ValidationResult, ValidationError } from "../types/core";

// Export all schema types
export type {
  EntitySchema,
  EntityColumn,
  EntityIndex,
  EntityRelationship,
  EntityUi,
  FormSection,
  EntityVisibility,
  DbConstraints,
  ValidationRules,
  UiMetadata,
} from "./entitySchema";

export type {
  EnumSchema,
  EnumValue,
} from "./enumSchema";

export type {
  PageSchema,
  PageNavigation,
  PageStat,
  PageSectionFilters,
  PageSection,
  PageMetadata,
  PageAuth,
} from "./pageSchema";

export type {
  AppSchema,
  AppTheme,
  AppFeatures,
  AppMetadata,
} from "./appSchema";