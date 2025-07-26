/**
 * @fileoverview Tests for EnumSchema validation
 */

import { describe, it, expect } from "vitest";
import { EnumSchemaValidator } from "../enumSchema";

describe("EnumSchemaValidator", () => {
  it("validates a valid enum schema", () => {
    const validEnum = {
      description: "User status options",
      values: {
        ACTIVE: {
          label: "Active",
          color: "#10b981",
          icon: "check-circle",
        },
        INACTIVE: {
          label: "Inactive",
          color: "#ef4444",
          icon: "x-circle",
        },
        PENDING: {
          label: "Pending",
          color: "#f59e0b",
          icon: "clock",
        },
      },
    };

    const result = EnumSchemaValidator.safeParse(validEnum);
    expect(result.success).toBe(true);
  });

  it("validates enum without description", () => {
    const enumWithoutDescription = {
      values: {
        ACTIVE: {
          label: "Active",
        },
        INACTIVE: {
          label: "Inactive",
        },
      },
    };

    const result = EnumSchemaValidator.safeParse(enumWithoutDescription);
    expect(result.success).toBe(true);
  });

  it("validates enum without optional fields", () => {
    const minimalEnum = {
      values: {
        YES: {
          label: "Yes",
        },
        NO: {
          label: "No",
        },
      },
    };

    const result = EnumSchemaValidator.safeParse(minimalEnum);
    expect(result.success).toBe(true);
  });

  it("rejects enum with empty values", () => {
    const invalidEnum = {
      description: "Empty enum",
      values: {},
    };

    const result = EnumSchemaValidator.safeParse(invalidEnum);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain("at least one value");
    }
  });

  it("rejects enum with invalid key format", () => {
    const invalidEnum = {
      values: {
        "active": { // Should be uppercase
          label: "Active",
        },
      },
    };

    const result = EnumSchemaValidator.safeParse(invalidEnum);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(JSON.stringify(result.error.issues)).toContain("uppercase with underscores");
    }
  });

  it("rejects enum with invalid hex color", () => {
    const invalidEnum = {
      values: {
        ACTIVE: {
          label: "Active",
          color: "green", // Should be hex format
        },
      },
    };

    const result = EnumSchemaValidator.safeParse(invalidEnum);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain("valid hex color");
    }
  });

  it("rejects enum with empty label", () => {
    const invalidEnum = {
      values: {
        ACTIVE: {
          label: "", // Empty label
        },
      },
    };

    const result = EnumSchemaValidator.safeParse(invalidEnum);
    expect(result.success).toBe(false);
  });

  it("validates enum with mixed case keys (when uppercase)", () => {
    const validEnum = {
      values: {
        VERY_ACTIVE: {
          label: "Very Active",
          color: "#10b981",
        },
        NOT_ACTIVE: {
          label: "Not Active",
          color: "#ef4444",
        },
      },
    };

    const result = EnumSchemaValidator.safeParse(validEnum);
    expect(result.success).toBe(true);
  });

  it("rejects enum with lowercase in key", () => {
    const invalidEnum = {
      values: {
        "Active_User": { // Mixed case not allowed
          label: "Active User",
        },
      },
    };

    const result = EnumSchemaValidator.safeParse(invalidEnum);
    expect(result.success).toBe(false);
  });

  it("validates enum with short hex colors", () => {
    const invalidEnum = {
      values: {
        ACTIVE: {
          label: "Active",
          color: "#fff", // Should be 6 characters
        },
      },
    };

    const result = EnumSchemaValidator.safeParse(invalidEnum);
    expect(result.success).toBe(false);
  });
});