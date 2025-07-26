/**
 * @fileoverview Tests for AppSchema validation
 */

import { describe, it, expect } from "vitest";
import { AppSchemaValidator } from "../appSchema";

describe("AppSchemaValidator", () => {
  it("validates a valid app schema", () => {
    const validApp = {
      name: "My Awesome App",
      description: "A comprehensive application built with Zeno Framework",
      url: "https://myapp.com",
      theme: {
        primary: "#3b82f6",
        secondary: "#10b981",
        accent: "#f59e0b",
        neutral: "#6b7280",
      },
      features: {
        search: true,
        rounded: true,
        darkMode: true,
        highContrast: false,
        breadcrumbs: true,
        pagination: true,
        comments: false,
        analytics: true,
      },
      metadata: {
        keywords: ["app", "productivity", "tools"],
        author: "John Doe",
        language: "en",
      },
    };

    const result = AppSchemaValidator.safeParse(validApp);
    expect(result.success).toBe(true);
  });

  it("validates minimal app schema", () => {
    const minimalApp = {
      name: "Simple App",
      description: "A simple application",
      url: "https://simple.com",
    };

    const result = AppSchemaValidator.safeParse(minimalApp);
    expect(result.success).toBe(true);
  });

  it("rejects app with empty name", () => {
    const invalidApp = {
      name: "",
      description: "An app with empty name",
      url: "https://example.com",
    };

    const result = AppSchemaValidator.safeParse(invalidApp);
    expect(result.success).toBe(false);
  });

  it("rejects app with empty description", () => {
    const invalidApp = {
      name: "Test App",
      description: "",
      url: "https://example.com",
    };

    const result = AppSchemaValidator.safeParse(invalidApp);
    expect(result.success).toBe(false);
  });

  it("rejects app with invalid URL", () => {
    const invalidApp = {
      name: "Test App",
      description: "A test application",
      url: "not-a-url",
    };

    const result = AppSchemaValidator.safeParse(invalidApp);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain("valid URL");
    }
  });

  it("rejects app with invalid hex colors", () => {
    const invalidApp = {
      name: "Test App",
      description: "A test application",
      url: "https://test.com",
      theme: {
        primary: "blue", // Should be hex
        secondary: "#10b981",
      },
    };

    const result = AppSchemaValidator.safeParse(invalidApp);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain("valid hex color");
    }
  });

  it("rejects app with short hex colors", () => {
    const invalidApp = {
      name: "Test App",
      description: "A test application",
      url: "https://test.com",
      theme: {
        primary: "#fff", // Should be 6 characters
      },
    };

    const result = AppSchemaValidator.safeParse(invalidApp);
    expect(result.success).toBe(false);
  });

  it("rejects app with invalid language code", () => {
    const invalidApp = {
      name: "Test App",
      description: "A test application",
      url: "https://test.com",
      metadata: {
        language: "english", // Should be 2-character code
      },
    };

    const result = AppSchemaValidator.safeParse(invalidApp);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain("2-character ISO code");
    }
  });

  it("rejects app with name too long", () => {
    const invalidApp = {
      name: "A".repeat(101), // Over 100 characters
      description: "A test application",
      url: "https://test.com",
    };

    const result = AppSchemaValidator.safeParse(invalidApp);
    expect(result.success).toBe(false);
  });

  it("rejects app with description too long", () => {
    const invalidApp = {
      name: "Test App",
      description: "A".repeat(501), // Over 500 characters
      url: "https://test.com",
    };

    const result = AppSchemaValidator.safeParse(invalidApp);
    expect(result.success).toBe(false);
  });

  it("validates app with partial theme", () => {
    const appWithPartialTheme = {
      name: "Test App",
      description: "A test application",
      url: "https://test.com",
      theme: {
        primary: "#3b82f6",
        // Only primary color specified
      },
    };

    const result = AppSchemaValidator.safeParse(appWithPartialTheme);
    expect(result.success).toBe(true);
  });

  it("validates app with partial features", () => {
    const appWithPartialFeatures = {
      name: "Test App",
      description: "A test application",
      url: "https://test.com",
      features: {
        darkMode: true,
        search: false,
        // Only some features specified
      },
    };

    const result = AppSchemaValidator.safeParse(appWithPartialFeatures);
    expect(result.success).toBe(true);
  });

  it("validates app with empty keywords array", () => {
    const appWithEmptyKeywords = {
      name: "Test App",
      description: "A test application",
      url: "https://test.com",
      metadata: {
        keywords: [],
        author: "John Doe",
      },
    };

    const result = AppSchemaValidator.safeParse(appWithEmptyKeywords);
    expect(result.success).toBe(true);
  });

  it("rejects app with empty keyword strings", () => {
    const invalidApp = {
      name: "Test App",
      description: "A test application",
      url: "https://test.com",
      metadata: {
        keywords: ["valid", "", "also-valid"], // Empty string not allowed
      },
    };

    const result = AppSchemaValidator.safeParse(invalidApp);
    expect(result.success).toBe(false);
  });
});