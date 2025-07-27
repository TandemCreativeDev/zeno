/**
 * @fileoverview Tests for PageSchema validation
 */

import { describe, expect, it } from "vitest";
import { PageSchemaValidator } from "../pageSchema";

describe("PageSchemaValidator", () => {
  it("validates a valid page schema", () => {
    const validPage = {
      route: "/dashboard",
      title: "Dashboard",
      description: "Main dashboard page",
      layout: "default",
      navigation: {
        header: {
          include: true,
          icon: "home",
          order: 1,
        },
        footer: {
          include: false,
        },
      },
      sections: [
        {
          type: "hero",
          title: "Welcome to Dashboard",
          subtitle: "Manage your data",
          padding: "lg",
          background: "primary",
        },
        {
          type: "stats",
          title: "Key Metrics",
          columns: 3,
          stats: [
            {
              title: "Total Users",
              value: "1,234",
              icon: "users",
              color: "#10b981",
            },
            {
              title: "Active Posts",
              value: "567",
              icon: "document",
              color: "#3b82f6",
            },
          ],
        },
        {
          type: "table",
          title: "Recent Users",
          entity: "users",
          display: "table",
          filters: {
            limit: 10,
            orderBy: "created_at",
          },
        },
      ],
      metadata: {
        title: "Dashboard - My App",
        description: "Application dashboard",
        keywords: ["dashboard", "analytics"],
      },
      auth: {
        required: true,
        roles: ["admin", "user"],
        redirect: "/login",
      },
    };

    const result = PageSchemaValidator.safeParse(validPage);
    expect(result.success).toBe(true);
  });

  it("validates minimal page schema", () => {
    const minimalPage = {
      route: "/about",
      title: "About",
      sections: [
        {
          type: "content",
          content: "This is the about page",
        },
      ],
    };

    const result = PageSchemaValidator.safeParse(minimalPage);
    expect(result.success).toBe(true);
  });

  it("rejects page with invalid route format", () => {
    const invalidPage = {
      route: "dashboard", // Missing leading slash
      title: "Dashboard",
      sections: [
        {
          type: "hero",
          title: "Welcome",
        },
      ],
    };

    const result = PageSchemaValidator.safeParse(invalidPage);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain("start with /");
    }
  });

  it("rejects page with uppercase in route", () => {
    const invalidPage = {
      route: "/Dashboard", // Should be lowercase
      title: "Dashboard",
      sections: [
        {
          type: "hero",
          title: "Welcome",
        },
      ],
    };

    const result = PageSchemaValidator.safeParse(invalidPage);
    expect(result.success).toBe(false);
  });

  it("rejects page with no sections", () => {
    const invalidPage = {
      route: "/empty",
      title: "Empty Page",
      sections: [], // Must have at least one section
    };

    const result = PageSchemaValidator.safeParse(invalidPage);
    expect(result.success).toBe(false);
  });

  it("rejects table section without entity", () => {
    const invalidPage = {
      route: "/users",
      title: "Users",
      sections: [
        {
          type: "table",
          title: "User List",
          // Missing entity field
        },
      ],
    };

    const result = PageSchemaValidator.safeParse(invalidPage);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain(
        "Section type requirements"
      );
    }
  });

  it("rejects stats section without stats array", () => {
    const invalidPage = {
      route: "/metrics",
      title: "Metrics",
      sections: [
        {
          type: "stats",
          title: "Key Metrics",
          // Missing stats array
        },
      ],
    };

    const result = PageSchemaValidator.safeParse(invalidPage);
    expect(result.success).toBe(false);
  });

  it("rejects content section without content", () => {
    const invalidPage = {
      route: "/about",
      title: "About",
      sections: [
        {
          type: "content",
          title: "About Us",
          // Missing content field
        },
      ],
    };

    const result = PageSchemaValidator.safeParse(invalidPage);
    expect(result.success).toBe(false);
  });

  it("validates custom section type", () => {
    const pageWithCustomSection = {
      route: "/custom",
      title: "Custom Page",
      sections: [
        {
          type: "custom",
          title: "Custom Component",
        },
      ],
    };

    const result = PageSchemaValidator.safeParse(pageWithCustomSection);
    expect(result.success).toBe(true);
  });

  it("rejects invalid stat color format", () => {
    const invalidPage = {
      route: "/stats",
      title: "Stats",
      sections: [
        {
          type: "stats",
          stats: [
            {
              title: "Users",
              value: "100",
              color: "red", // Should be hex format
            },
          ],
        },
      ],
    };

    const result = PageSchemaValidator.safeParse(invalidPage);
    expect(result.success).toBe(false);
  });

  it("validates nested route paths", () => {
    const nestedPage = {
      route: "/admin/users/settings",
      title: "User Settings",
      sections: [
        {
          type: "hero",
          title: "Settings",
        },
      ],
    };

    const result = PageSchemaValidator.safeParse(nestedPage);
    expect(result.success).toBe(true);
  });

  it("validates page with auth configuration", () => {
    const authPage = {
      route: "/admin",
      title: "Admin Panel",
      sections: [
        {
          type: "hero",
          title: "Admin",
        },
      ],
      auth: {
        required: true,
        roles: ["admin"],
        redirect: "/login",
      },
    };

    const result = PageSchemaValidator.safeParse(authPage);
    expect(result.success).toBe(true);
  });
});
