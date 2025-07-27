/**
 * Schema set validation and utility functions
 */

import { z } from "zod";
import type { ValidationError, ValidationResult } from "../types/core";
import { AppSchemaValidator } from "./appSchema";
import { EntitySchemaValidator } from "./entitySchema";
import { EnumSchemaValidator } from "./enumSchema";
import { PageSchemaValidator } from "./pageSchema";

/**
 * Validates an entity schema and returns detailed validation results
 */
export function validateEntitySchema(
  data: unknown,
  filePath: string
): ValidationResult {
  return validateWithZodSchema(EntitySchemaValidator, data, filePath);
}

/**
 * Validates an enum schema and returns detailed validation results
 */
export function validateEnumSchema(
  data: unknown,
  filePath: string
): ValidationResult {
  return validateWithZodSchema(EnumSchemaValidator, data, filePath);
}

/**
 * Validates a page schema and returns detailed validation results
 */
export function validatePageSchema(
  data: unknown,
  filePath: string
): ValidationResult {
  return validateWithZodSchema(PageSchemaValidator, data, filePath);
}

/**
 * Validates an app schema and returns detailed validation results
 */
export function validateAppSchema(
  data: unknown,
  filePath: string
): ValidationResult {
  return validateWithZodSchema(AppSchemaValidator, data, filePath);
}

/**
 * Validates a complete schema set for consistency and references
 */
export function validateSchemaSet(
  entities: Map<string, unknown>,
  enums: Map<string, unknown>,
  pages: Map<string, unknown>,
  app: unknown,
  basePath: string
): ValidationResult {
  const errors: ValidationError[] = [];

  for (const [name, entityData] of entities.entries()) {
    const result = validateEntitySchema(
      entityData,
      `${basePath}/entities/${name}.json`
    );
    errors.push(...result.errors);
  }

  for (const [name, enumData] of enums.entries()) {
    const result = validateEnumSchema(
      enumData,
      `${basePath}/enums/${name}.json`
    );
    errors.push(...result.errors);
  }

  for (const [name, pageData] of pages.entries()) {
    const result = validatePageSchema(
      pageData,
      `${basePath}/pages/${name}.json`
    );
    errors.push(...result.errors);
  }

  const appResult = validateAppSchema(app, `${basePath}/app.json`);
  errors.push(...appResult.errors);

  const crossReferenceErrors = validateCrossReferences(
    entities,
    enums,
    pages,
    basePath
  );
  errors.push(...crossReferenceErrors);

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Helper function to validate data against a Zod schema
 */
function validateWithZodSchema(
  schema: z.ZodSchema,
  data: unknown,
  filePath: string
): ValidationResult {
  try {
    schema.parse(data);
    return { valid: true, errors: [] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: ValidationError[] = error.issues.map((issue) => {
        const line = getLineNumber(issue.path.map(String));
        const errorObj: ValidationError = {
          message: issue.message,
          path: filePath,
        };
        if (line !== undefined) {
          errorObj.line = line;
        }
        return errorObj;
      });

      return { valid: false, errors };
    }

    return {
      valid: false,
      errors: [
        {
          message: "Unknown validation error",
          path: filePath,
        },
      ],
    };
  }
}

/**
 * Validates cross-references between entities, enums, and pages
 */
function validateCrossReferences(
  entities: Map<string, unknown>,
  _enums: Map<string, unknown>,
  pages: Map<string, unknown>,
  basePath: string
): ValidationError[] {
  const errors: ValidationError[] = [];
  const entityNames = new Set(entities.keys());

  for (const [entityName, entityData] of entities.entries()) {
    const filePath = `${basePath}/entities/${entityName}.json`;

    try {
      const entity = EntitySchemaValidator.parse(entityData);

      if (entity.relationships) {
        for (const [relName, relationship] of Object.entries(
          entity.relationships
        )) {
          if (!entityNames.has(relationship.table)) {
            const line = getLineNumber(["relationships", relName, "table"]);
            const errorObj: ValidationError = {
              message: `Referenced entity '${relationship.table}' not found`,
              path: filePath,
            };
            if (line !== undefined) {
              errorObj.line = line;
            }
            errors.push(errorObj);
          }
        }
      }

      if (entity.columns) {
        for (const [colName, column] of Object.entries(entity.columns)) {
          if (column.dbConstraints.references) {
            if (!entityNames.has(column.dbConstraints.references.table)) {
              const line = getLineNumber([
                "columns",
                colName,
                "dbConstraints",
                "references",
                "table",
              ]);
              const errorObj: ValidationError = {
                message: `Referenced entity '${column.dbConstraints.references.table}' not found`,
                path: filePath,
              };
              if (line !== undefined) {
                errorObj.line = line;
              }
              errors.push(errorObj);
            }
          }
        }
      }
    } catch {
      // Skip validation for invalid entities (already caught by individual validation)
    }
  }

  for (const [pageName, pageData] of pages.entries()) {
    const filePath = `${basePath}/pages/${pageName}.json`;

    try {
      const page = PageSchemaValidator.parse(pageData);

      for (const [sectionIndex, section] of page.sections.entries()) {
        if (section.entity && !entityNames.has(section.entity)) {
          const line = getLineNumber([
            "sections",
            sectionIndex.toString(),
            "entity",
          ]);
          const errorObj: ValidationError = {
            message: `Referenced entity '${section.entity}' not found`,
            path: filePath,
          };
          if (line !== undefined) {
            errorObj.line = line;
          }
          errors.push(errorObj);
        }
      }
    } catch {
      // Skip validation for invalid pages (already caught by individual validation)
    }
  }

  return errors;
}

/**
 * Helper function to estimate line number from Zod path
 * Note: This is a simplified implementation. In a real scenario,
 * you'd want to parse the JSON with position tracking.
 */
function getLineNumber(path: (string | number)[]): number | undefined {
  if (path.length === 0) return undefined;

  return Math.max(1, path.length * 2);
}
