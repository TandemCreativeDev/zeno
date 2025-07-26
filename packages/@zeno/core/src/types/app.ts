/**
 * Application schema type definitions for app configuration
 */

export interface AppTheme {
  primary?: string;
  secondary?: string;
  accent?: string;
  neutral?: string;
}

export interface AppFeatures {
  search?: boolean;
  rounded?: boolean;
  darkMode?: boolean;
  highContrast?: boolean;
  breadcrumbs?: boolean;
  pagination?: boolean;
  comments?: boolean;
  analytics?: boolean;
}

export interface AppMetadata {
  keywords?: string[];
  author?: string;
  language?: string;
}

export interface AppSchema {
  name: string;
  description: string;
  url: string;
  theme?: AppTheme;
  features?: AppFeatures;
  metadata?: AppMetadata;
}