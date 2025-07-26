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

### Generated App Stack

- **Next + Tailwind**: Full-stack framework
- **NextAuth**: Authentication with automated configuration
- **Nodemailer**: Email verification
- **Drizzle ORM**: Type-safe database operations
- **PostgreSQL**: RDBMS
- **Zod**: Runtime validation
- **DaisyUI**: Accessible component styling

## 3. Package Structure

## 3. Package Structure

```
zeno/
├── packages/
│   ├── @zeno/core           # Core framework engine
│   ├── @zeno/cli            # CLI implementation
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

## 4. Core Architecture

### 4.1 Schema System

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

- [Entity Template](templates/entity.json)
- [Enum Template](templates/enum.json)
- [Page Template](templates/page.json)
- [App Template](templates/app.json)

### 4.2 Generation Pipeline

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

### 4.3 Template Engine

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

## 5. Generator Architecture

Each generator follows a consistent pattern:

```typescript
export class ModelGenerator extends Generator {
  name = "models";

  supports(schema: Schema): boolean {
    return schema.type === "entity" || schema.type === "enum";
  }

  async generate(context: GeneratorContext): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = [];

    for (const [name, entity] of context.schemas.entities) {
      files.push(
        await this.generateSchema(entity),
        await this.generateTypes(entity),
        await this.generateValidation(entity)
      );
    }

    return files;
  }
}
```

## 6. CLI Architecture

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

## 7. Configuration

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

## 8. Build Configuration

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

### 9. Testing Strategy

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

Test categories:

- **Unit**: Schema validation, generator output correctness, template rendering, utility functions, CLI command behaviour
- **Integration**: Full generation pipeline, file system operations
- **E2E**: Complete project generation and build verification

## 10. Publishing & Release

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

## 11. Performance Optimisations

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

## 12. Error Handling

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

## 13. Developer Experience

### 13.1 IDE Support

- JSON schemas for autocompletion in schema files
- TypeScript declaration maps for debugging
- Source maps for generated code

### 13.2 CLI Features

- Interactive prompts for complex commands with @clack/prompts
- Progress indicators for long operations
- Coloured output with semantic meaning
- Debug mode with verbose logging

### 13.3 Documentation

- Auto-generated API docs from JSDoc
- Interactive examples in documentation
- Migration guides between versions

## 14. Security Considerations

- **Input Validation**: Schema sanitisation prevents injection
- **Path Safety**: All file operations within project boundaries
- **Template Sandboxing**: No arbitrary code execution in templates
- **Dependency Scanning**: Automated security audits in CI
- **Email Security**: TLS enforcement, credential encryption
