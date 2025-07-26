import Handlebars from "handlebars";

import type { TemplateEngine as ITemplateEngine, TemplateHelper } from "./types/core";

export class TemplateEngine implements ITemplateEngine {
  private handlebars: typeof Handlebars;

  constructor() {
    this.handlebars = Handlebars.create();
    this.registerBuiltInHelpers();
  }

  registerHelper(name: string, fn: TemplateHelper): void {
    this.handlebars.registerHelper(name, fn);
  }

  registerPartial(name: string, template: string): void {
    this.handlebars.registerPartial(name, template);
  }

  render(template: string, data: unknown): string {
    const compiledTemplate = this.handlebars.compile(template);
    return compiledTemplate(data);
  }

  private registerBuiltInHelpers(): void {
    this.registerHelper("camelCase", (...args: unknown[]) => {
      const str = args[0];
      if (typeof str !== "string") return "";
      return str.replace(/[-_\s]+(.)?/g, (_, char) => char ? char.toUpperCase() : "");
    });

    this.registerHelper("pascalCase", (...args: unknown[]) => {
      const str = args[0];
      if (typeof str !== "string") return "";
      const camelCased = str.replace(/[-_\s]+(.)?/g, (_, char) => char ? char.toUpperCase() : "");
      return camelCased.charAt(0).toUpperCase() + camelCased.slice(1);
    });

    this.registerHelper("kebabCase", (...args: unknown[]) => {
      const str = args[0];
      if (typeof str !== "string") return "";
      return str
        .replace(/([a-z])([A-Z])/g, "$1-$2")
        .replace(/[\s_]+/g, "-")
        .toLowerCase();
    });

    this.registerHelper("snakeCase", (...args: unknown[]) => {
      const str = args[0];
      if (typeof str !== "string") return "";
      return str
        .replace(/([a-z])([A-Z])/g, "$1_$2")
        .replace(/[\s-]+/g, "_")
        .toLowerCase();
    });

    this.registerHelper("pluralise", (...args: unknown[]) => {
      const str = args[0];
      if (typeof str !== "string") return "";
      if (str.endsWith("y")) {
        return str.slice(0, -1) + "ies";
      }
      if (str.endsWith("s") || str.endsWith("sh") || str.endsWith("ch") || str.endsWith("x") || str.endsWith("z")) {
        return str + "es";
      }
      return str + "s";
    });

    this.registerHelper("singularise", (...args: unknown[]) => {
      const str = args[0];
      if (typeof str !== "string") return "";
      if (str.endsWith("ies")) {
        return str.slice(0, -3) + "y";
      }
      if (str.endsWith("es") && str.length > 2) {
        const withoutEs = str.slice(0, -2);
        if (withoutEs.endsWith("s") || withoutEs.endsWith("sh") || withoutEs.endsWith("ch") || withoutEs.endsWith("x") || withoutEs.endsWith("z")) {
          return withoutEs;
        }
      }
      if (str.endsWith("s") && str.length > 1) {
        return str.slice(0, -1);
      }
      return str;
    });

    this.registerHelper("json", (...args: unknown[]) => {
      const obj = args[0];
      return new this.handlebars.SafeString(JSON.stringify(obj, null, 2));
    });

    this.registerHelper("eq", (...args: unknown[]) => {
      const a = args[0];
      const b = args[1];
      return a === b;
    });

    this.registerHelper("includes", (...args: unknown[]) => {
      const array = args[0];
      const item = args[1];
      if (!Array.isArray(array)) return false;
      return array.includes(item);
    });

    this.registerHelper("when", (...args: unknown[]) => {
      const condition = args[0];
      const truthyValue = args[1];
      const falsyValue = args.length > 2 && typeof args[2] !== "object" ? args[2] : "";
      return condition ? truthyValue : falsyValue;
    });
  }
}

export function createTemplateEngine(): TemplateEngine {
  return new TemplateEngine();
}