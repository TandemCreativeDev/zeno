/**
 * Page schema type definitions for custom pages
 */

export interface PageNavigation {
  header?: {
    include?: boolean;
    icon?: string;
    order?: number;
  };
  footer?: {
    include?: boolean;
    section?: string;
  };
}

export interface PageStat {
  title: string;
  value: string;
  icon?: string;
  color?: string;
}

export interface PageSectionFilters {
  limit?: number;
  orderBy?: string;
}

export interface PageSection {
  type: "hero" | "stats" | "table" | "content" | "custom";
  title?: string;
  subtitle?: string;
  entity?: string;
  content?: string;
  columns?: 1 | 2 | 3 | 4;
  padding?: "none" | "sm" | "md" | "lg";
  background?: "base" | "neutral" | "primary" | "secondary";
  stats?: PageStat[];
  filters?: PageSectionFilters;
  display?: "cards" | "table";
}

export interface PageMetadata {
  title?: string;
  description?: string;
  keywords?: string[];
}

export interface PageAuth {
  required?: boolean;
  roles?: string[];
  redirect?: string;
}

export interface PageSchema {
  route: string;
  title: string;
  description?: string;
  layout?: "default" | "auth" | "minimal";
  navigation?: PageNavigation;
  sections: PageSection[];
  metadata?: PageMetadata;
  auth?: PageAuth;
}