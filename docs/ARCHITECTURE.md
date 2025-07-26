# Zeno Framework: Architecture Specification

## 1. System Overview

Zeno transforms JSON schema definitions into TypeScript types, database schemas, validation logic, and UI components. Built as a framework-agnostic node module with CLI and programmatic APIs.

```
┌───────────────────────────────────────────┐
│                CLI (oclif)                │
│  ┌──────┐ ┌────────┐ ┌──────┐ ┌───────┐   │
│  │ init │ │generate│ │watch │ │migrate│   │
│  └───┬──┘ └───┬────┘ └───┬──┘ └───┬───┘   │
│      └────────┴─────┬────┴────────┘       │
└─────────────────────┼─────────────────────┘
                      │
┌─────────────────────▼─────────────────────┐
│                Core Engine                │
│  ┌────────┐ ┌──────────┐ ┌─────────────┐  │
│  │ Schema │ │ Template │ │  Generator  │  │
│  │ Loader │ │  Engine  │ │  Pipeline   │  │
│  └───┬────┘ └─────┬────┘ └──────┬──────┘  │
│      └────────────┼─────────────┘         │
└───────────────────┼───────────────────────┘
                    │
┌───────────────────▼───────────────────────┐
│           Output Plugins                  │
│  ┌──────┐ ┌─────┐ ┌──────┐ ┌──────────┐   │
│  │Types │ │ ORM │ │Valid │ │Components│   │
│  └──────┘ └─────┘ └──────┘ └──────────┘   │
└───────────────────────────────────────────┘
```

## 2. Technology Stack

**Build & Development**

- **tsup**: Zero-config TypeScript bundler (wraps esbuild)
- **TypeScript 5.0+**: With strict mode and ES2022 target
- **pnpm workspaces**: Monorepo package management
- **Turborepo**: Build orchestration and caching

**CLI Framework**

- **oclif**: Enterprise-grade CLI framework
- **commander.js**: Fallback for simpler commands

**Template Engine**

- **Handlebars**: Template rendering
- **plop**: File scaffolding automation

**Testing & Quality**

- **Vitest**: Fast, modern test runner
- **Biome**: Linting and formatting
- **changesets**: Version management and publishing

## 3. Package Structure

```
zeno/
├── packages/
│   ├── @zeno/core           # Core framework
│   ├── @zeno/cli            # CLI implementation
│   ├── @zeno/generators/    # Generator plugins
│   │   ├── types            # TypeScript types
│   │   ├── drizzle          # Drizzle ORM
│   │   ├── zod              # Zod validation
│   │   └── react            # React components
│   └── @zeno/create         # Scaffolding tool
├── examples/                # Example projects
├── docs/                    # Documentation site
└── turbo.json               # Turborepo config
```

## 4. Core Architecture

### 4.1 Schema System

Schemas follow the structure defined in:

- [Entity Template](templates/entity.json)
- [Enum Template](templates/enum.json)
- [Page Template](templates/page.json)
- [App Template](templates/app.json)

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

### 4.2 Generation Pipeline

```typescript
interface GenerationPipeline {
  // Plugin registration
  use(generator: Generator): this;

  // Generation execution
  generate(schemas: SchemaSet, config: Config): Promise<Result>;

  // Incremental generation
  generateChanges(changes: SchemaChange[]): Promise<Result>;
}

abstract class Generator {
  abstract name: string;
  abstract generate(context: GeneratorContext): Promise<GeneratedFile[]>;
}
```

### 4.3 Template Engine

Using Handlebars with custom helpers:

```typescript
interface TemplateEngine {
  registerHelper(name: string, fn: Helper): void;
  registerPartial(name: string, template: string): void;
  render(template: string, data: unknown): string;
}

// Built-in helpers
const helpers = {
  camelCase,
  pascalCase,
  kebabCase,
  snakeCase,
  pluralise,
  singularise,
  json,
  eq,
  includes,
};
```

## 5. Generator Architecture

Each generator is a standalone package following this pattern:

```typescript
// packages/generators/drizzle/src/index.ts
export class DrizzleGenerator extends Generator {
  name = "drizzle";

  async generate(context: GeneratorContext): Promise<GeneratedFile[]> {
    const { entities, enums } = context.schemas;
    const files: GeneratedFile[] = [];

    // Generate schemas
    for (const [name, entity] of entities) {
      files.push({
        path: `database/schema/${name}.ts`,
        content: await this.generateSchema(entity),
      });
    }

    // Generate migrations
    if (context.config.migrations) {
      files.push(...(await this.generateMigrations(context)));
    }

    return files;
  }
}
```

## 6. CLI Architecture

Using oclif for robust CLI features:

```typescript
// packages/cli/src/commands/generate.ts
import { Command, Flags } from "@oclif/core";

export class Generate extends Command {
  static description = "Generate code from schemas";

  static flags = {
    watch: Flags.boolean({ char: "w" }),
    only: Flags.string({ multiple: true }),
  };

  async run() {
    const { flags } = await this.parse(Generate);
    const zeno = await Zeno.create();

    if (flags.watch) {
      await zeno.watch();
    } else {
      await zeno.generate({ only: flags.only });
    }
  }
}
```

## 7. Configuration

```typescript
// zeno.config.ts
export default defineConfig({
  schemas: "./zeno",
  output: "./src",

  generators: {
    types: true,
    drizzle: {
      migrations: true,
      seed: true,
    },
    zod: true,
    components: {
      framework: "react",
      styling: "tailwind",
    },
  },

  templates: {
    // Custom template overrides
    "component/form": "./templates/custom-form.hbs",
  },
});
```

### 8. Build Configuration

Using tsup for zero-config builds:

```javascript
// tsup.config.ts
export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs", "esm"],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ["node:*"],
});
```

### 9. Testing Strategy

Using Vitest for fast, modern testing:

```typescript
// vitest.config.ts
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

Example test:

```typescript
describe("SchemaLoader", () => {
  it("loads entity schemas", async () => {
    const loader = new SchemaLoader();
    const schemas = await loader.load("./test/fixtures");

    expect(schemas.entities.get("users")).toBeDefined();
    expect(schemas.enums.get("user_status")).toBeDefined();
  });
});
```

### 10. Publishing & Release

Using changesets for automated releases:

```json
// .changeset/config.json
{
  "changelog": "@changesets/cli/changelog",
  "commit": false,
  "linked": [["@zeno/*"]],
  "access": "public",
  "baseBranch": "main"
}
```

GitHub Action for releases:

```yaml
name: Release
on:
  push:
    branches: [main]

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - run: pnpm install
      - run: pnpm build
      - run: pnpm test

      - uses: changesets/action@v1
        with:
          publish: pnpm release
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```

### 11. Plugin System

Simple, powerful plugin API:

```typescript
interface Plugin {
  name: string;

  // Lifecycle hooks
  setup?(zeno: Zeno): void | Promise<void>;
  beforeGenerate?(context: Context): void | Promise<void>;
  afterGenerate?(result: Result): void | Promise<void>;

  // Custom generators
  generators?: Generator[];

  // Template extensions
  templates?: Record<string, string>;
  helpers?: Record<string, Helper>;
}

// Usage
export default defineConfig({
  plugins: [
    zenoAuth(), // Authentication generator
    zenoGraphQL(), // GraphQL schema generator
    zenoOpenAPI(), // OpenAPI spec generator
  ],
});
```

### 12. Performance Optimisations

**Incremental Generation**

- File-level caching with content hashing
- Dependency graph for minimal regeneration
- Parallel generation using worker threads

**Build Caching**

- Turborepo for cross-machine caching
- Granular task dependencies
- Remote caching support

**Development Mode**

- Hot reload via file watching
- In-memory caching
- Partial generation on change

### 13. Error Handling

Clear, actionable error messages:

```typescript
class SchemaValidationError extends Error {
  constructor(
    public file: string,
    public line: number,
    public column: number,
    public details: string
  ) {
    super(`Invalid schema in ${file}:${line}:${column}\n${details}`)
  }
}

// Pretty error output
✖ Invalid schema in schemas/users.json:15:8

  Property "email" validation error:
  Cannot use both "email: true" and "pattern" together

  13 │   "validation": {
  14 │     "required": true,
  15 │     "email": true,
     ╵     ^^^^^^^^^^^^
  16 │     "pattern": "^[a-z]+@example.com$"
  17 │   }
```

### 14. Developer Experience

**TypeScript-First**

- Full type inference from schemas
- Strict mode by default
- Declaration maps for debugging

**IDE Support**

- JSON schemas for autocompletion
- VS Code extension (future)
- Inline documentation

**CLI Features**

- Interactive prompts with @clack/prompts
- Progress indicators
- Colored output
- Debug mode with verbose logging

### 15. Security Considerations

- Path sanitisation for file operations
- Template sandboxing
- No arbitrary code execution
- Dependency scanning in CI
- Regular security audits

### 16. Non-Functional Requirements

**Performance**

- < 100ms startup time
- < 1s for 100 table generation
- < 50ms incremental updates

**Compatibility**

- Node.js 18+ (LTS versions)
- ESM and CommonJS dual package
- Windows, macOS, Linux support

**Package Size**

- Core: < 2MB
- CLI: < 5MB
- Generators: < 1MB each

### 17. Migration Path

From existing Next.js implementation:

1. Extract core logic to @zeno/core
2. Maintain backwards compatibility via adapter
3. Gradual deprecation with clear migration guides
4. Automated migration tool using plop
