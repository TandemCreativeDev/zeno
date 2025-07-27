/**
 * Zod validation schemas for configuration
 */

import { z } from "zod";

// Define nested schemas separately for better partial handling
const migrationsSchema = z.object({
  dir: z.string().default("./drizzle"),
  auto: z.boolean().default(false),
});

const emailAuthSchema = z
  .object({
    user: z.string().min(1, "Email user is required"),
    pass: z.string().min(1, "Email password is required"),
  })
  .strict();

export const databaseConfigSchema = z
  .object({
    provider: z.literal("postgresql"),
    connection: z.string().min(1, "Database connection string is required"),
    migrations: migrationsSchema.default({ dir: "./drizzle", auto: false }),
  })
  .strict();

export const emailConfigSchema = z
  .object({
    host: z.string().min(1, "Email host is required"),
    port: z.number().int().min(1).max(65535).default(587),
    auth: emailAuthSchema,
  })
  .strict();

const generateConfigSchemaBase = z.object({
  models: z.boolean().default(true),
  components: z.boolean().default(true),
  pages: z.boolean().default(true),
  api: z.boolean().default(true),
  navigation: z.boolean().default(true),
});

export const generateConfigSchema = generateConfigSchemaBase.default({
  models: true,
  components: true,
  pages: true,
  api: true,
  navigation: true,
});

const devConfigSchemaBase = z.object({
  watch: z.boolean().default(false),
  verbose: z.boolean().default(false),
});

export const devConfigSchema = devConfigSchemaBase.default({
  watch: false,
  verbose: false,
});

export const zenoConfigSchema = z
  .object({
    schemaDir: z.string().default("./zeno"),
    outputDir: z.string().default("./src"),
    database: databaseConfigSchema,
    email: emailConfigSchema,
    generate: generateConfigSchema,
    dev: devConfigSchema,
  })
  .strict();

// Create schemas that allow partial input for nested objects
const partialMigrationsSchema = migrationsSchema.partial();
const partialEmailAuthSchema = emailAuthSchema.partial();

const partialDatabaseConfigSchema = z
  .object({
    provider: z.literal("postgresql").optional(),
    connection: z
      .string()
      .min(1, "Database connection string is required")
      .optional(),
    migrations: partialMigrationsSchema.optional(),
  })
  .strict();

const partialEmailConfigSchema = z
  .object({
    host: z.string().min(1, "Email host is required").optional(),
    port: z.number().int().min(1).max(65535).optional(),
    auth: partialEmailAuthSchema.optional(),
  })
  .strict();

const partialGenerateConfigSchema = generateConfigSchemaBase.partial();
const partialDevConfigSchema = devConfigSchemaBase.partial();

export const zenoConfigInputSchema = z
  .object({
    schemaDir: z.string().optional(),
    outputDir: z.string().optional(),
    database: partialDatabaseConfigSchema.optional(),
    email: partialEmailConfigSchema.optional(),
    generate: partialGenerateConfigSchema.optional(),
    dev: partialDevConfigSchema.optional(),
  })
  .strict();

// Infer types from Zod schemas for single source of truth
export type DatabaseConfig = z.infer<typeof databaseConfigSchema>;
export type EmailConfig = z.infer<typeof emailConfigSchema>;
export type GenerateConfig = z.infer<typeof generateConfigSchema>;
export type DevConfig = z.infer<typeof devConfigSchema>;
export type ZenoConfig = z.infer<typeof zenoConfigSchema>;
export type ZenoConfigInput = z.infer<typeof zenoConfigInputSchema>;
