# Zeno Framework: Architecture Specification

## 1. System Overview

Zeno is a standalone Node module that generates production-ready NextJS applications from JSON schema definitions. Built with modern tooling and accessibility-first principles.

```
┌───────────────────────────────────────────┐
│                CLI (oclif)                │
│  ┌──────┐ ┌────────┐ ┌────────┐ ┌─────┐   │
│  │ init │ │validate│ │generate│ │watch│   │
│  └───┬──┘ └────┬───┘ └───┬────┘ └──┬──┘   │
│      └─────────┴────┬────┴─────────┘      │
└─────────────────────┼─────────────────────┘
                      │
┌─────────────────────▼─────────────────────┐
│                Core Engine                │
│  ┌──────────┐ ┌──────────┐ ┌───────────┐  │
│  │  Schema  │ │ Template │ │ Generator │  │
│  │  Loader  │ │  Engine  │ │ Pipeline  │  │
│  └───┬──────┘ └─────┬────┘ └──────┬────┘  │
│      └──────────────┼─────────────┘       │
└─────────────────────┼─────────────────────┘
                      │
┌─────────────────────▼─────────────────────┐
│              Output Plugins               │
│  ┌────────┐ ┌───────┐ ┌───────┐ ┌─────┐   │
│  │ Models │ │ Comps │ │ Pages │ │ API │   │
│  └────────┘ └───────┘ └───────┘ └─────┘   │
└───────────────────────────────────────────┘
```

## 2. Technology Stack

### Build & Development

- **tsup**: Zero-config TypeScript bundler (wraps esbuild) for lightning-fast builds
- **TypeScript 5.0+**: Strict mode with ES2022 target
- **pnpm workspaces**: Efficient monorepo package management
- **Turborepo**: Build orchestration with intelligent caching
- **Storybook**: Component development and documentation for @zeno/templates

### CLI Framework

- **oclif**: Enterprise-grade CLI framework from Salesforce/Heroku
- **@clack/prompts**: Beautiful interactive prompts

### Code Generation

- **Handlebars**: Battle-tested template engine
- **Plop**: Micro-generator framework for file scaffolding

### Testing & Quality

- **Vitest**: Blazing fast test runner with HMR support
- **Biome**: All-in-one linter/formatter (replaces ESLint + Prettier)
- **changesets**: Flexible version management and publishing
- **Chromatic**: Visual regression testing for @zeno/templates components

### Generated App Stack

- **Next + Tailwind**: Full-stack framework
- **NextAuth**: Authentication with automated configuration
- **Nodemailer**: Email verification
- **Drizzle ORM**: Type-safe database operations
- **PostgreSQL**: RDBMS
- **Zod**: Runtime validation
- **DaisyUI**: Accessible component styling
- **Tailwind Typography**: Convenient re-usable prose styles
- **React Hook Form**: Form state management with validation

## 3. Package Structure

```
zeno/
├── packages/
│   ├── @zeno/core           # Core framework engine
│   ├── @zeno/cli            # CLI implementation
│   ├── @zeno/templates      # UI component library & templates
│   ├── @zeno/generators/    # Output generators
│   │   ├── models           # Drizzle + TypeScript + Zod
│   │   ├── components       # React components
│   │   ├── pages            # NextJS pages
│   │   └── api              # API routes
│   └── @zeno/create         # Project scaffolding
├── examples/                # Example projects
├── docs/                    # Documentation site
└── turbo.json               # Turborepo config
```

**@zeno/templates Package Contents:**

- React UI components (FormField, DataTable, Modal, etc.)
- Handlebars templates for code generation
- Storybook stories and documentation
- Component tests and visual regression
- Export as standalone npm package

## 4. Core Architecture

### 4.1 Type System & Validation

Zeno uses **Zod as the single source of truth** for all data structures, ensuring runtime validation matches compile-time types:

```typescript
// Validation schema defines structure and validation rules
export const EntitySchemaValidator = z.object({
  name: z.string().min(1),
  columns: z.array(EntityColumnSchema),
  ui: EntityUiSchema.optional(),
});

// TypeScript types inferred from Zod schemas
export type EntitySchema = z.infer<typeof EntitySchemaValidator>;
export type EntityColumn = z.infer<typeof EntityColumnSchema>;

// Clean re-exports for organized imports
// src/types/entity.ts
export type { EntitySchema, EntityColumn } from "../validation/entitySchema";
```

**Benefits:**

- **Single source of truth**: Schema changes automatically update types
- **Runtime safety**: Validation matches TypeScript types exactly
- **Maintainability**: No manual type synchronization required
- **Developer experience**: IntelliSense works seamlessly with validated data

### 4.2 Nested Partial Schema Handling

When using Zod `.partial()` with nested objects that have defaults, define schemas separately:

```typescript
// ❌ Problematic pattern - TypeScript errors with nested defaults
const schema = z.object({
  database: z
    .object({
      dir: z.string().default("./drizzle"),
      auto: z.boolean().default(false),
    })
    .default({}),
});

const partialSchema = schema.partial();
// Error: Property 'dir' is missing when trying to use { auto: true }

// ✅ Correct pattern - separate nested schemas
const migrationsSchema = z.object({
  dir: z.string().default("./drizzle"),
  auto: z.boolean().default(false),
});

const partialMigrationsSchema = migrationsSchema.partial();

const partialDatabaseSchema = z
  .object({
    provider: z.literal("postgresql").optional(),
    connection: z.string().optional(),
    migrations: partialMigrationsSchema.optional(),
  })
  .strict();
```

This enables intuitive config authoring like `{ migrations: { auto: true } }` while maintaining type safety.

### 4.3 Schema System

```typescript
interface SchemaLoader {
  load(path: string): Promise<SchemaSet>;
  validate(schema: Schema): ValidationResult;
  watch(path: string, onChange: (changes: SchemaChange[]) => void): Watcher;
}

interface SchemaSet {
  entities: Map<string, EntitySchema>;
  enums: Map<string, EnumSchema>;
  pages: Map<string, PageSchema>;
  app: AppSchema;
}
```

Schema specifications:

- [Entity Template](templates/schemas/entity.json)
- [Enum Template](templates/schemas/enum.json)
- [Page Template](templates/schemas/page.json)
- [App Template](templates/schemas/app.json)

### 4.4 Generation Pipeline

```typescript
interface GenerationPipeline {
  register(generator: Generator): this;
  generate(schemas: SchemaSet, config: Config): Promise<Result>;
  generateChanges(changes: SchemaChange[]): Promise<Result>;
}

abstract class Generator {
  abstract name: string;
  abstract generate(context: GeneratorContext): Promise<GeneratedFile[]>;
  abstract supports(schema: Schema): boolean;
}
```

### 4.5 Template Engine

```typescript
interface TemplateEngine {
  registerHelper(name: string, fn: Helper): void;
  registerPartial(name: string, template: string): void;
  render(template: string, data: unknown): string;
}
```

Built-in helpers:

- Case transformers: `camelCase`, `pascalCase`, `kebabCase`, `snakeCase`
- Pluralisation: `pluralise`, `singularise`
- Utilities: `json`, `eq`, `includes`, `when`

### Template Helper Implementation

Handlebars helpers use flexible signatures to accommodate the framework's argument passing:

```typescript
export type TemplateHelper = (...args: unknown[]) => unknown;

// Helper implementation pattern
this.registerHelper("when", (...args: unknown[]) => {
  const condition = args[0];
  const truthyValue = args[1];
  const falsyValue =
    args.length > 2 && typeof args[2] !== "object" ? args[2] : "";
  return condition ? truthyValue : falsyValue;
});

// Prevent HTML escaping for structured output
this.registerHelper("json", (...args: unknown[]) => {
  const obj = args[0];
  return new this.handlebars.SafeString(JSON.stringify(obj, null, 2));
});
```

**Implementation Notes:**

- Handlebars passes an options object as the final argument to helpers
- Use `SafeString` to prevent HTML entity escaping for JSON/structured output
- Modern Handlebars (4.7+) includes TypeScript definitions

## 5. UI Component Architecture

### 5.1 Component Library Structure

The framework provides a comprehensive library of reusable UI components through the **@zeno/templates** package. This ensures consistency, maintainability, and accessibility compliance.

**Package Features:**

- Standalone UI component library built with DaisyUI + React
- Storybook integration for component development and documentation
- Template files for code generation (Handlebars)
- Visual regression testing with Storybook
- Published separately for independent use

**Component Categories:**

- **Forms**: FormField, Fieldset, FormActions
- **Tables**: DataTable, TableCell, Pagination
- **Modals**: Modal, Confirm
- **Layout**: PageHeader, HeroSection, StatsSection, ContentSection
- **Feedback**: Alert, Loading, EmptyState, Error

### 5.2 Component Development

Components are developed using Storybook:

- Interactive component playground
- Visual documentation of all props and states
- Accessibility testing integration
- Story files serve as both tests and examples
- Hot reload development workflow

### 5.3 Component Composition Principles

Generated components import from @zeno/templates and follow strict composition patterns:

1. **Forms** compose FormField components within Fieldset groups
2. **Tables** use DataTable with column definitions
3. **Pages** compose section components
4. **Modals** simple composition that wraps a form

### 5.4 Feature Requirements

All generated interfaces must support:

- **Data Tables**: Sorting, filtering, pagination, search, bulk operations, row actions
- **Forms**: Validation integration, section grouping, field visibility, loading states
- **Modals**: Focus management, backdrop handling, keyboard navigation
- **Pages**: Breadcrumbs, hero sections, stats displays, content blocks
- **Global**: Loading states, error handling, empty states, confirmations

### 5.5 Accessibility Architecture

Every UI component implements WCAG 2.1 AA compliance through:

- Semantic HTML structure
- Comprehensive ARIA attributes
- Keyboard navigation support
- Focus management and trapping
- Live region announcements
- Motion preference detection
- Skip navigation links

## 6. Generator Architecture

Each generator follows a consistent pattern while utilising the @zeno/templates package:

```typescript
import { FormTemplate, TableTemplate, ModalTemplate } from "@zeno/templates";

export class ComponentGenerator extends Generator {
  name = "components";

  supports(schema: Schema): boolean {
    return (
      schema.type === "entity" && (schema.generateForm || schema.generateTable)
    );
  }

  async generate(context: GeneratorContext): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = [];

    for (const [name, entity] of context.schemas.entities) {
      if (entity.generateForm) {
        files.push(await this.generateForm(entity));
      }
      if (entity.generateTable) {
        files.push(await this.generateTable(entity));
      }
      if (entity.generateForm) {
        files.push(await this.generateModal(entity));
      }
    }

    return files;
  }
}
```

**Generation Patterns:**

- **Import Dependencies**: Generated files import from `@zeno/templates` package
- **Forms**: Compose FormField components within Fieldset groups based on entity.ui.formSections
- **Tables**: Map entity fields to ColumnDef arrays with appropriate formatters
- **Modals**: Simple confirmation or wraps forms
- **Pages**: Assemble section components (Hero, Stats, Content, Table) from page definitions

## 7. CLI Architecture

Using oclif for robust CLI features:

```typescript
import { Command, Flags } from "@oclif/core";

export class Generate extends Command {
  static description = "Generate code from schemas";

  static flags = {
    watch: Flags.boolean({ char: "w", description: "Watch for changes" }),
    only: Flags.string({
      multiple: true,
      options: ["models", "components", "pages", "api"],
    }),
  };

  async run() {
    const { flags } = await this.parse(Generate);
    const zeno = await Zeno.create();

    if (flags.watch) {
      await zeno.watch({ generators: flags.only });
    } else {
      await zeno.generate({ generators: flags.only });
    }
  }
}
```

## 8. Configuration

[**Example zeno config file**](examples/zeno.config.ts)

Configuration via `zeno.config.ts`:

```typescript
export default defineConfig({
  schemaDir: "./zeno",
  outputDir: "./src",

  database: {
    provider: "postgresql",
    connection: process.env.DATABASE_URL!,
    migrations: {
      dir: "./drizzle",
      auto: true,
    },
  },

  email: {
    host: process.env.EMAIL_HOST!,
    port: parseInt(process.env.EMAIL_PORT || "587"),
    auth: {
      user: process.env.EMAIL_USER!,
      pass: process.env.EMAIL_PASS!,
    },
  },

  generate: {
    models: true,
    components: true,
    pages: true,
    api: true,
  },
});
```

## 9. Build Configuration

Using tsup for zero-config builds, in `tsup.config.ts`:

```javascript
export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs", "esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  external: ["node:*"],
  treeshaking: true,
});
```

## 10. Testing Strategy

Using Vitest for modern testing, in`vitest.config.ts`:

```typescript
export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      exclude: ["**/node_modules/**", "**/dist/**"],
    },
  },
});
```

Test categories:

- **Unit**: Schema validation, generator output correctness, template rendering, utility functions, CLI command behaviour
- **Integration**: Full generation pipeline, file system operations, UI component composition
- **Visual**: Storybook tests for @zeno/templates components
- **E2E**: Complete project generation and build verification
- **Accessibility**: WCAG compliance testing for all generated components

## 11. Publishing & Release

Using changesets for automated releases, in `.changeset/config.json`:

```json
{
  "changelog": "@changesets/cli/changelog",
  "commit": false,
  "linked": [["@zeno/*"]],
  "access": "public",
  "baseBranch": "main"
}
```

GitHub Actions workflow handles:

- Automated testing on PRs
- Version bumping via changesets
- NPM publishing on main branch
- GitHub release creation

## 12. Performance Optimisations

### Incremental Generation

- Only regenerate changed schemas
- Content hashing for file-level caching
- Dependency graph for minimal regeneration
- Parallel generation using worker threads

### Build Caching

- Turborepo for local and remote caching
- Granular task dependencies
- Shared cache across team

### Development Mode

- File watching with chokidar
- In-memory caching
- HMR-style updates for generated files
- Minimal file writes to preserve hot reload

## 13. Error Handling

Clear, actionable error messages with source mapping:

```
✖ Invalid schema in zeno/entities/users.json:15:8

  Property "email" validation error:
  Cannot use both "email: true" and "pattern" together

  13 │   "validation": {
  14 │     "required": true,
  15 │     "email": true,
     ╵     ^^^^^^^^^^^^
  16 │     "pattern": "^[a-z]+@example.com$"
  17 │   }
```

## 14. Developer Experience

### 14.1 IDE Support

- JSON schemas for autocompletion in schema files
- TypeScript declaration maps for debugging
- Source maps for generated code

### 14.2 CLI Features

- Interactive prompts for complex commands with @clack/prompts
- Progress indicators for long operations
- Coloured output with semantic meaning
- Debug mode with verbose logging

### 14.3 Documentation

- Auto-generated API docs from JSDoc
- Interactive examples in documentation
- Migration guides between versions
- Storybook for @zeno/templates component documentation
- Embedded component playground
- UI component usage guides

## 15. Security Considerations

- **Input Validation**: Schema sanitisation prevents injection
- **Path Safety**: All file operations within project boundaries
- **Template Sandboxing**: No arbitrary code execution in templates
- **Dependency Scanning**: Automated security audits in CI
- **Email Security**: TLS enforcement, credential encryption
