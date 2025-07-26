/**
 * Zod validation schema for PageSchema
 */

import { z } from "zod";

export const PageNavigationSchema = z.object({
  header: z.object({
    include: z.boolean().optional(),
    icon: z.string().optional(),
    order: z.number().int().optional(),
  }).optional(),
  footer: z.object({
    include: z.boolean().optional(),
    section: z.string().optional(),
  }).optional(),
});

export const PageStatSchema = z.object({
  title: z.string().min(1),
  value: z.string().min(1),
  icon: z.string().optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Color must be a valid hex color").optional(),
});

export const PageSectionFiltersSchema = z.object({
  limit: z.number().int().positive().optional(),
  orderBy: z.string().optional(),
});

export const PageSectionSchema = z.object({
  type: z.enum(["hero", "stats", "table", "content", "custom"]),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  entity: z.string().optional(),
  content: z.string().optional(),
  columns: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]).optional(),
  padding: z.enum(["none", "sm", "md", "lg"]).optional(),
  background: z.enum(["base", "neutral", "primary", "secondary"]).optional(),
  stats: z.array(PageStatSchema).optional(),
  filters: PageSectionFiltersSchema.optional(),
  display: z.enum(["cards", "table"]).optional(),
}).refine((section) => {
  if (section.type === "table" && !section.entity) {
    return false;
  }
  if (section.type === "stats" && (!section.stats || section.stats.length === 0)) {
    return false;
  }
  if (section.type === "content" && !section.content) {
    return false;
  }
  return true;
}, {
  message: "Section type requirements not met",
});

export const PageMetadataSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  keywords: z.array(z.string()).optional(),
});

export const PageAuthSchema = z.object({
  required: z.boolean().optional(),
  roles: z.array(z.string()).optional(),
  redirect: z.string().optional(),
});

export const PageSchemaValidator = z.object({
  route: z.string().min(1).regex(/^\/[a-z0-9\-\/]*$/, "Route must start with / and contain only lowercase letters, numbers, hyphens, and slashes"),
  title: z.string().min(1),
  description: z.string().optional(),
  layout: z.enum(["default", "auth", "minimal"]).optional(),
  navigation: PageNavigationSchema.optional(),
  sections: z.array(PageSectionSchema).min(1),
  metadata: PageMetadataSchema.optional(),
  auth: PageAuthSchema.optional(),
});

export type PageSchema = z.infer<typeof PageSchemaValidator>;
export type PageNavigation = z.infer<typeof PageNavigationSchema>;
export type PageStat = z.infer<typeof PageStatSchema>;
export type PageSectionFilters = z.infer<typeof PageSectionFiltersSchema>;
export type PageSection = z.infer<typeof PageSectionSchema>;
export type PageMetadata = z.infer<typeof PageMetadataSchema>;
export type PageAuth = z.infer<typeof PageAuthSchema>;