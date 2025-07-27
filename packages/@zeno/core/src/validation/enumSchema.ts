/**
 * Zod validation schema for EnumSchema
 */

import { z } from "zod";

export const EnumValueSchema = z.object({
  label: z.string().min(1),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Color must be a valid hex color")
    .optional(),
  icon: z.string().optional(),
});

export const EnumSchemaValidator = z.object({
  description: z.string().optional(),
  values: z
    .record(
      z
        .string()
        .min(1)
        .regex(
          /^[A-Z][A-Z0-9_]*$/,
          "Enum keys must be uppercase with underscores"
        ),
      EnumValueSchema
    )
    .refine(
      (values) => {
        return Object.keys(values).length > 0;
      },
      {
        message: "Enum must have at least one value",
      }
    ),
});

export type EnumSchema = z.infer<typeof EnumSchemaValidator>;
export type EnumValue = z.infer<typeof EnumValueSchema>;
