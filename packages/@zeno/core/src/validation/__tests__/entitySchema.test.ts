/**
 * @fileoverview Tests for EntitySchema validation
 */

import { describe, expect, it } from "vitest";
import { EntitySchemaValidator } from "../entitySchema";

describe("EntitySchemaValidator", () => {
  it("validates a valid entity schema", () => {
    const validEntity = {
      tableName: "users",
      displayName: "Users",
      description: "User accounts",
      generateForm: true,
      generateTable: true,
      generateAPI: true,
      generatePages: true,
      columns: {
        id: {
          dbConstraints: {
            type: "serial",
            primaryKey: true,
          },
        },
        email: {
          dbConstraints: {
            type: "varchar",
            length: 255,
            unique: true,
            nullable: false,
          },
          validation: {
            required: true,
            email: true,
          },
          ui: {
            label: "Email Address",
            placeholder: "Enter your email",
          },
        },
        name: {
          dbConstraints: {
            type: "varchar",
            length: 100,
            nullable: false,
          },
          validation: {
            required: true,
            min: 2,
            max: 100,
          },
        },
      },
    };

    const result = EntitySchemaValidator.safeParse(validEntity);
    expect(result.success).toBe(true);
  });

  it("rejects entity with invalid table name", () => {
    const invalidEntity = {
      tableName: "Users", // Should be lowercase
      displayName: "Users",
      columns: {
        id: {
          dbConstraints: {
            type: "serial",
            primaryKey: true,
          },
        },
      },
    };

    const result = EntitySchemaValidator.safeParse(invalidEntity);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain(
        "lowercase with underscores"
      );
    }
  });

  it("rejects entity with multiple primary keys", () => {
    const invalidEntity = {
      tableName: "users",
      displayName: "Users",
      columns: {
        id: {
          dbConstraints: {
            type: "serial",
            primaryKey: true,
          },
        },
        uuid: {
          dbConstraints: {
            type: "uuid",
            primaryKey: true, // Second primary key
          },
        },
      },
    };

    const result = EntitySchemaValidator.safeParse(invalidEntity);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain(
        "Only one primary key is allowed"
      );
    }
  });

  it("rejects email validation with pattern", () => {
    const invalidEntity = {
      tableName: "users",
      displayName: "Users",
      columns: {
        email: {
          dbConstraints: {
            type: "varchar",
            length: 255,
          },
          validation: {
            email: true,
            pattern: "^[a-z]+@example.com$", // Cannot have both
          },
        },
      },
    };

    const result = EntitySchemaValidator.safeParse(invalidEntity);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain("Cannot use both");
    }
  });

  it("validates entity with relationships", () => {
    const entityWithRelations = {
      tableName: "posts",
      displayName: "Posts",
      columns: {
        id: {
          dbConstraints: {
            type: "serial",
            primaryKey: true,
          },
        },
        user_id: {
          dbConstraints: {
            type: "integer",
            references: {
              table: "users",
              column: "id",
              onDelete: "cascade",
            },
          },
        },
      },
      relationships: {
        author: {
          type: "many-to-one",
          table: "users",
          foreignKey: "user_id",
        },
      },
    };

    const result = EntitySchemaValidator.safeParse(entityWithRelations);
    expect(result.success).toBe(true);
  });

  it("validates entity with indexes", () => {
    const entityWithIndexes = {
      tableName: "users",
      displayName: "Users",
      columns: {
        id: {
          dbConstraints: {
            type: "serial",
            primaryKey: true,
          },
        },
        email: {
          dbConstraints: {
            type: "varchar",
            length: 255,
          },
        },
        name: {
          dbConstraints: {
            type: "varchar",
            length: 100,
          },
        },
      },
      indexes: {
        email_idx: {
          columns: ["email"],
          unique: true,
        },
        name_email_idx: {
          columns: ["name", "email"],
        },
      },
    };

    const result = EntitySchemaValidator.safeParse(entityWithIndexes);
    expect(result.success).toBe(true);
  });

  it("rejects empty column names", () => {
    const invalidEntity = {
      tableName: "users",
      displayName: "Users",
      columns: {
        "": {
          // Empty column name
          dbConstraints: {
            type: "varchar",
          },
        },
      },
    };

    const result = EntitySchemaValidator.safeParse(invalidEntity);
    expect(result.success).toBe(false);
  });

  it("validates entity with UI configuration", () => {
    const entityWithUi = {
      tableName: "users",
      displayName: "Users",
      columns: {
        id: {
          dbConstraints: {
            type: "serial",
            primaryKey: true,
          },
        },
        email: {
          dbConstraints: {
            type: "varchar",
            length: 255,
          },
          ui: {
            label: "Email",
            placeholder: "Enter email",
            helpText: "We'll never share your email",
            section: "contact",
            readonly: false,
            type: "email",
          },
        },
      },
      ui: {
        listFields: ["email"],
        searchFields: ["email"],
        sortField: "email",
        sortOrder: "asc",
        formSections: [
          {
            name: "contact",
            title: "Contact Information",
            fields: ["email"],
            collapsible: true,
            defaultOpen: true,
          },
        ],
        visibility: {
          form: {
            create: ["email"],
            edit: ["email"],
            hidden: [],
          },
          table: {
            list: ["email"],
            hidden: [],
          },
        },
      },
    };

    const result = EntitySchemaValidator.safeParse(entityWithUi);
    expect(result.success).toBe(true);
  });
});
