/**
 * Zod validation schema for EntitySchema
 */

import { z } from "zod";

const DbConstraintsSchema = z.object({
  type: z.string().min(1),
  length: z.number().positive().optional(),
  precision: z.number().positive().optional(),
  scale: z.number().nonnegative().optional(),
  nullable: z.boolean().optional(),
  default: z.union([z.string(), z.number(), z.boolean()]).optional(),
  primaryKey: z.boolean().optional(),
  unique: z.boolean().optional(),
  references: z.object({
    table: z.string().min(1),
    column: z.string().min(1),
    onDelete: z.enum(["cascade", "restrict", "set null"]).optional(),
  }).optional(),
});

const ValidationRulesSchema = z.object({
  required: z.boolean().optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  email: z.boolean().optional(),
  url: z.boolean().optional(),
  pattern: z.string().optional(),
}).refine((data) => {
  if (data.email && data.pattern) {
    return false;
  }
  return true;
}, {
  message: "Cannot use both 'email: true' and 'pattern' together",
  path: ["email"],
});

const UiMetadataSchema = z.object({
  label: z.string().optional(),
  placeholder: z.string().optional(),
  helpText: z.string().optional(),
  section: z.string().optional(),
  readonly: z.boolean().optional(),
  type: z.string().optional(),
  accept: z.string().optional(),
  format: z.enum(["datetime", "currency"]).optional(),
});

const EntityColumnSchema = z.object({
  dbConstraints: DbConstraintsSchema,
  validation: ValidationRulesSchema.optional(),
  ui: UiMetadataSchema.optional(),
});

const EntityIndexSchema = z.object({
  columns: z.array(z.string().min(1)).min(1),
  unique: z.boolean().optional(),
});

const EntityRelationshipSchema = z.object({
  type: z.enum(["many-to-one", "one-to-many"]),
  table: z.string().min(1),
  foreignKey: z.string().optional(),
});

const FormSectionSchema = z.object({
  name: z.string().min(1),
  title: z.string().min(1),
  fields: z.array(z.string().min(1)).min(1),
  collapsible: z.boolean().optional(),
  defaultOpen: z.boolean().optional(),
});

const EntityVisibilitySchema = z.object({
  form: z.object({
    create: z.array(z.string()).optional(),
    edit: z.array(z.string()).optional(),
    hidden: z.array(z.string()).optional(),
  }).optional(),
  table: z.object({
    list: z.array(z.string()).optional(),
    hidden: z.array(z.string()).optional(),
  }).optional(),
});

const EntityUiSchema = z.object({
  listFields: z.array(z.string()).optional(),
  searchFields: z.array(z.string()).optional(),
  sortField: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  formSections: z.array(FormSectionSchema).optional(),
  visibility: EntityVisibilitySchema.optional(),
});

export const EntitySchemaValidator = z.object({
  tableName: z.string().min(1).regex(/^[a-z][a-z0-9_]*$/, "Table name must be lowercase with underscores"),
  displayName: z.string().min(1),
  icon: z.string().optional(),
  description: z.string().optional(),
  generateForm: z.boolean().optional(),
  generateTable: z.boolean().optional(),
  generateAPI: z.boolean().optional(),
  generatePages: z.boolean().optional(),
  columns: z.record(z.string().min(1), EntityColumnSchema).refine((columns) => {
    const primaryKeys = Object.values(columns).filter(col => col.dbConstraints.primaryKey);
    return primaryKeys.length <= 1;
  }, {
    message: "Only one primary key is allowed per entity",
  }),
  indexes: z.record(z.string().min(1), EntityIndexSchema).optional(),
  relationships: z.record(z.string().min(1), EntityRelationshipSchema).optional(),
  ui: EntityUiSchema.optional(),
  seedData: z.array(z.record(z.string(), z.unknown())).optional(),
});

export type EntitySchemaValidationType = z.infer<typeof EntitySchemaValidator>;