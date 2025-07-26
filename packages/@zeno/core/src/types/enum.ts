/**
 * Enum schema type definitions for enum types
 */

export interface EnumValue {
  label: string;
  color?: string;
  icon?: string;
}

export interface EnumSchema {
  description?: string;
  values: Record<string, EnumValue>;
}