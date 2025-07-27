import { describe, expect, it } from "vitest";

import { createTemplateEngine, TemplateEngine } from "../TemplateEngine";

describe("TemplateEngine", () => {
  describe("factory function", () => {
    it("creates a TemplateEngine instance", () => {
      const engine = createTemplateEngine();
      expect(engine).toBeInstanceOf(TemplateEngine);
    });
  });

  describe("basic template rendering", () => {
    it("renders simple templates", () => {
      const engine = new TemplateEngine();
      const result = engine.render("Hello {{name}}", { name: "World" });
      expect(result).toBe("Hello World");
    });

    it("renders complex templates with nested data", () => {
      const engine = new TemplateEngine();
      const template = "{{user.name}} has {{user.posts.length}} posts";
      const data = {
        user: {
          name: "Alice",
          posts: [{ title: "Post 1" }, { title: "Post 2" }],
        },
      };
      const result = engine.render(template, data);
      expect(result).toBe("Alice has 2 posts");
    });

    it("renders empty template with empty string", () => {
      const engine = new TemplateEngine();
      const result = engine.render("", {});
      expect(result).toBe("");
    });
  });

  describe("helper registration", () => {
    it("registers and uses custom helpers", () => {
      const engine = new TemplateEngine();
      engine.registerHelper("uppercase", (...args: unknown[]) => {
        const str = args[0] as string;
        return str.toUpperCase();
      });

      const result = engine.render("{{uppercase name}}", { name: "hello" });
      expect(result).toBe("HELLO");
    });

    it("allows overriding built-in helpers", () => {
      const engine = new TemplateEngine();
      engine.registerHelper("camelCase", () => "custom-camel");

      const result = engine.render("{{camelCase 'test-string'}}", {});
      expect(result).toBe("custom-camel");
    });
  });

  describe("partial registration", () => {
    it("registers and uses partials", () => {
      const engine = new TemplateEngine();
      engine.registerPartial("greeting", "Hello {{name}}!");

      const result = engine.render("{{> greeting}}", { name: "World" });
      expect(result).toBe("Hello World!");
    });

    it("uses partials with context", () => {
      const engine = new TemplateEngine();
      engine.registerPartial("userCard", "{{name}} ({{email}})");

      const template =
        "Users: {{#each users}}{{> userCard}}{{#unless @last}}, {{/unless}}{{/each}}";
      const data = {
        users: [
          { name: "Alice", email: "alice@example.com" },
          { name: "Bob", email: "bob@example.com" },
        ],
      };

      const result = engine.render(template, data);
      expect(result).toBe(
        "Users: Alice (alice@example.com), Bob (bob@example.com)"
      );
    });
  });

  describe("camelCase helper", () => {
    it("converts kebab-case to camelCase", () => {
      const engine = new TemplateEngine();
      const result = engine.render("{{camelCase 'hello-world'}}", {});
      expect(result).toBe("helloWorld");
    });

    it("converts snake_case to camelCase", () => {
      const engine = new TemplateEngine();
      const result = engine.render("{{camelCase 'hello_world'}}", {});
      expect(result).toBe("helloWorld");
    });

    it("converts space separated to camelCase", () => {
      const engine = new TemplateEngine();
      const result = engine.render("{{camelCase 'hello world'}}", {});
      expect(result).toBe("helloWorld");
    });

    it("handles already camelCase strings", () => {
      const engine = new TemplateEngine();
      const result = engine.render("{{camelCase 'helloWorld'}}", {});
      expect(result).toBe("helloWorld");
    });

    it("handles empty strings", () => {
      const engine = new TemplateEngine();
      const result = engine.render("{{camelCase ''}}", {});
      expect(result).toBe("");
    });

    it("handles non-string input", () => {
      const engine = new TemplateEngine();
      const result = engine.render("{{camelCase null}}", {});
      expect(result).toBe("");
    });
  });

  describe("pascalCase helper", () => {
    it("converts kebab-case to PascalCase", () => {
      const engine = new TemplateEngine();
      const result = engine.render("{{pascalCase 'hello-world'}}", {});
      expect(result).toBe("HelloWorld");
    });

    it("converts snake_case to PascalCase", () => {
      const engine = new TemplateEngine();
      const result = engine.render("{{pascalCase 'hello_world'}}", {});
      expect(result).toBe("HelloWorld");
    });

    it("converts camelCase to PascalCase", () => {
      const engine = new TemplateEngine();
      const result = engine.render("{{pascalCase 'helloWorld'}}", {});
      expect(result).toBe("HelloWorld");
    });

    it("handles single word", () => {
      const engine = new TemplateEngine();
      const result = engine.render("{{pascalCase 'hello'}}", {});
      expect(result).toBe("Hello");
    });
  });

  describe("kebabCase helper", () => {
    it("converts camelCase to kebab-case", () => {
      const engine = new TemplateEngine();
      const result = engine.render("{{kebabCase 'helloWorld'}}", {});
      expect(result).toBe("hello-world");
    });

    it("converts PascalCase to kebab-case", () => {
      const engine = new TemplateEngine();
      const result = engine.render("{{kebabCase 'HelloWorld'}}", {});
      expect(result).toBe("hello-world");
    });

    it("converts snake_case to kebab-case", () => {
      const engine = new TemplateEngine();
      const result = engine.render("{{kebabCase 'hello_world'}}", {});
      expect(result).toBe("hello-world");
    });

    it("converts spaces to kebab-case", () => {
      const engine = new TemplateEngine();
      const result = engine.render("{{kebabCase 'hello world'}}", {});
      expect(result).toBe("hello-world");
    });
  });

  describe("snakeCase helper", () => {
    it("converts camelCase to snake_case", () => {
      const engine = new TemplateEngine();
      const result = engine.render("{{snakeCase 'helloWorld'}}", {});
      expect(result).toBe("hello_world");
    });

    it("converts PascalCase to snake_case", () => {
      const engine = new TemplateEngine();
      const result = engine.render("{{snakeCase 'HelloWorld'}}", {});
      expect(result).toBe("hello_world");
    });

    it("converts kebab-case to snake_case", () => {
      const engine = new TemplateEngine();
      const result = engine.render("{{snakeCase 'hello-world'}}", {});
      expect(result).toBe("hello_world");
    });

    it("converts spaces to snake_case", () => {
      const engine = new TemplateEngine();
      const result = engine.render("{{snakeCase 'hello world'}}", {});
      expect(result).toBe("hello_world");
    });
  });

  describe("pluralise helper", () => {
    it("pluralises regular words", () => {
      const engine = new TemplateEngine();
      expect(engine.render("{{pluralise 'cat'}}", {})).toBe("cats");
      expect(engine.render("{{pluralise 'dog'}}", {})).toBe("dogs");
    });

    it("handles words ending in 'y'", () => {
      const engine = new TemplateEngine();
      expect(engine.render("{{pluralise 'city'}}", {})).toBe("cities");
      expect(engine.render("{{pluralise 'party'}}", {})).toBe("parties");
    });

    it("handles words ending in 's', 'sh', 'ch', 'x', 'z'", () => {
      const engine = new TemplateEngine();
      expect(engine.render("{{pluralise 'class'}}", {})).toBe("classes");
      expect(engine.render("{{pluralise 'dish'}}", {})).toBe("dishes");
      expect(engine.render("{{pluralise 'church'}}", {})).toBe("churches");
      expect(engine.render("{{pluralise 'box'}}", {})).toBe("boxes");
      expect(engine.render("{{pluralise 'buzz'}}", {})).toBe("buzzes");
    });

    it("handles non-string input", () => {
      const engine = new TemplateEngine();
      const result = engine.render("{{pluralise null}}", {});
      expect(result).toBe("");
    });
  });

  describe("singularise helper", () => {
    it("singularises regular plural words", () => {
      const engine = new TemplateEngine();
      expect(engine.render("{{singularise 'cats'}}", {})).toBe("cat");
      expect(engine.render("{{singularise 'dogs'}}", {})).toBe("dog");
    });

    it("handles words ending in 'ies'", () => {
      const engine = new TemplateEngine();
      expect(engine.render("{{singularise 'cities'}}", {})).toBe("city");
      expect(engine.render("{{singularise 'parties'}}", {})).toBe("party");
    });

    it("handles words ending in 'es'", () => {
      const engine = new TemplateEngine();
      expect(engine.render("{{singularise 'classes'}}", {})).toBe("class");
      expect(engine.render("{{singularise 'dishes'}}", {})).toBe("dish");
      expect(engine.render("{{singularise 'churches'}}", {})).toBe("church");
      expect(engine.render("{{singularise 'boxes'}}", {})).toBe("box");
    });

    it("handles already singular words", () => {
      const engine = new TemplateEngine();
      expect(engine.render("{{singularise 'cat'}}", {})).toBe("cat");
      expect(engine.render("{{singularise 'person'}}", {})).toBe("person");
    });

    it("handles non-string input", () => {
      const engine = new TemplateEngine();
      const result = engine.render("{{singularise null}}", {});
      expect(result).toBe("");
    });
  });

  describe("json helper", () => {
    it("stringifies objects", () => {
      const engine = new TemplateEngine();
      const data = { user: { name: "Alice", age: 30 } };
      const result = engine.render("{{json user}}", data);
      expect(result).toBe(JSON.stringify(data.user, null, 2));
    });

    it("handles arrays", () => {
      const engine = new TemplateEngine();
      const data = { items: ["a", "b", "c"] };
      const result = engine.render("{{json items}}", data);
      expect(result).toBe(JSON.stringify(data.items, null, 2));
    });

    it("handles primitives", () => {
      const engine = new TemplateEngine();
      const result = engine.render("{{json 'hello'}}", {});
      expect(result).toBe('"hello"');
    });
  });

  describe("eq helper", () => {
    it("compares equal values", () => {
      const engine = new TemplateEngine();
      expect(
        engine.render("{{#if (eq status 'active')}}Yes{{/if}}", {
          status: "active",
        })
      ).toBe("Yes");
      expect(
        engine.render("{{#if (eq count 5)}}Yes{{/if}}", { count: 5 })
      ).toBe("Yes");
    });

    it("compares unequal values", () => {
      const engine = new TemplateEngine();
      expect(
        engine.render("{{#if (eq status 'inactive')}}Yes{{else}}No{{/if}}", {
          status: "active",
        })
      ).toBe("No");
      expect(
        engine.render("{{#if (eq count 3)}}Yes{{else}}No{{/if}}", { count: 5 })
      ).toBe("No");
    });
  });

  describe("includes helper", () => {
    it("checks if array includes item", () => {
      const engine = new TemplateEngine();
      const data = { tags: ["red", "blue", "green"] };
      expect(
        engine.render("{{#if (includes tags 'blue')}}Yes{{/if}}", data)
      ).toBe("Yes");
      expect(
        engine.render(
          "{{#if (includes tags 'yellow')}}Yes{{else}}No{{/if}}",
          data
        )
      ).toBe("No");
    });

    it("handles non-array input", () => {
      const engine = new TemplateEngine();
      expect(
        engine.render("{{#if (includes null 'item')}}Yes{{else}}No{{/if}}", {})
      ).toBe("No");
      expect(
        engine.render(
          "{{#if (includes 'string' 'item')}}Yes{{else}}No{{/if}}",
          {}
        )
      ).toBe("No");
    });
  });

  describe("when helper", () => {
    it("returns truthy value when condition is true", () => {
      const engine = new TemplateEngine();
      const result = engine.render("{{when true 'yes' 'no'}}", {});
      expect(result).toBe("yes");
    });

    it("returns falsy value when condition is false", () => {
      const engine = new TemplateEngine();
      const result = engine.render("{{when false 'yes' 'no'}}", {});
      expect(result).toBe("no");
    });

    it("returns empty string when falsy value not provided", () => {
      const engine = new TemplateEngine();
      const result = engine.render("{{when false 'yes'}}", {});
      expect(result).toBe("");
    });

    it("works with variables", () => {
      const engine = new TemplateEngine();
      const data = { isActive: true, name: "Alice" };
      const result = engine.render("{{when isActive name 'Unknown'}}", data);
      expect(result).toBe("Alice");
    });
  });

  describe("helper combination", () => {
    it("combines multiple helpers", () => {
      const engine = new TemplateEngine();
      const template = "{{pascalCase (pluralise entityName)}}";
      const data = { entityName: "user-profile" };
      const result = engine.render(template, data);
      expect(result).toBe("UserProfiles");
    });

    it("uses helpers in conditionals", () => {
      const engine = new TemplateEngine();
      const template =
        "{{#if (eq (snakeCase name) 'hello_world')}}Match{{else}}No match{{/if}}";
      const data = { name: "helloWorld" };
      const result = engine.render(template, data);
      expect(result).toBe("Match");
    });
  });
});
