/**
 * Zod validation schema for AppSchema
 */

import { z } from "zod";

export const AppThemeSchema = z.object({
  primary: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Primary color must be a valid hex color")
    .optional(),
  secondary: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Secondary color must be a valid hex color")
    .optional(),
  accent: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Accent color must be a valid hex color")
    .optional(),
  neutral: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Neutral color must be a valid hex color")
    .optional(),
});

export const AppFeaturesSchema = z.object({
  search: z.boolean().optional(),
  rounded: z.boolean().optional(),
  darkMode: z.boolean().optional(),
  highContrast: z.boolean().optional(),
  breadcrumbs: z.boolean().optional(),
  pagination: z.boolean().optional(),
  comments: z.boolean().optional(),
  analytics: z.boolean().optional(),
});

export const AppMetadataSchema = z.object({
  keywords: z.array(z.string().min(1)).optional(),
  author: z.string().min(1).optional(),
  language: z
    .string()
    .length(2, "Language must be a 2-character ISO code")
    .optional(),
});

export const AppSchemaValidator = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  url: z.url("URL must be a valid URL"),
  theme: AppThemeSchema.optional(),
  features: AppFeaturesSchema.optional(),
  metadata: AppMetadataSchema.optional(),
});

export type AppSchema = z.infer<typeof AppSchemaValidator>;
export type AppTheme = z.infer<typeof AppThemeSchema>;
export type AppFeatures = z.infer<typeof AppFeaturesSchema>;
export type AppMetadata = z.infer<typeof AppMetadataSchema>;
