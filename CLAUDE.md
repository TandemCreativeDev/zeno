# Project: Zeno Framework

## Project Overview

Standalone Node module that generates production-ready NextJS applications from JSON schema definitions. Eliminates boilerplate development by automatically generating database models, UI components, pages, navigation, and API routes directly into standard NextJS project structure.

## Tech Stack

- **Languages:** TypeScript, JavaScript
- **Build Tools:** tsup (esbuild wrapper), Turborepo with pnpm workspaces
- **CLI Framework:** oclif with @clack/prompts for interactive UI
- **Template Engine:** Handlebars for code generation
- **Testing:** Vitest with coverage reporting
- **Code Quality:** Biome (linter + formatter), changesets for versioning

## Code Style & Conventions

### Architectural Principles

- DRY principles and avoiding unnecessary code duplication, but with AHA in mind
- Separation of concerns and component responsibility boundaries
- DOTADIW (Do One Thing And Do It Well) and single responsibility principle application
- UNIX philosophy and modular design patterns
- KISS principles and simplicity-first approaches
- React composition patterns and state management strategies
- TypeScript type system design and constraint modelling
- Modular code organisation and reusable component design
- Maintainability assessment and technical debt identification

### Import Standards (strictly enforced)

```typescript
// 1. Node.js built-ins
import { readFile } from "node:fs/promises";
import { join } from "node:path";

// 2. External libraries (alphabetical)
import { Command, Flags } from "@oclif/core";
import Handlebars from "handlebars";

// 3. Internal packages (@zeno/*)
import { SchemaLoader } from "@zeno/core";
import { Generator } from "@zeno/generators";

// 4. Relative imports
import { validateSchema } from "./validation";

// 5. Types (always last)
import type { EntitySchema, GeneratorContext } from "@zeno/types";
```

### Function Declaration Patterns

- **Class methods:** Use method syntax
- **Standalone utilities:** Function declarations
- **Event handlers/callbacks:** Arrow functions

```typescript
// ✅ Class methods
export class SchemaLoader {
  async load(path: string): Promise<SchemaSet> {}
}

// ✅ Standalone utilities as function declarations
export function validateSchema(schema: EntitySchema): ValidationResult {}

// ✅ Event handlers and callbacks as arrows
const onSchemaChange = (changes: SchemaChange[]) => {};
```

### File Naming Conventions

- **Utilities:** camelCase (`schemaLoader.ts`)
- **Main Classes/Generators:** PascalCase (`TemplateEngine.ts`, `ModelGenerator.ts`)
- **Commands:** Simple names (`generate.ts`)
- **Types:** Simple names (`entity.ts`, `generator.ts`)

### TypeScript Standards

- **Inferred types** where clear, **explicit for interfaces**
- **NO `any` type allowed** - use proper typing
- **Minimal use of `unknown`** - prefer specific types
- **Explicit return types** for public API functions
- **Zod as single source of truth** - infer TypeScript types from Zod schemas (ref [Architecture](docs/ARCHITECTURE.md) 4.1)
- **Nested partial schemas** - define nested schemas separately when using `.partial()` with defaults
- **Handlebar helpers** - Use `(...args: unknown[]) => unknown` signature to handle options object properly
- **Structured outputs (JSON)** - Use `SafeString` to prevent HTML escaping

```typescript
// ✅ Good - inferred where clear, explicit for public APIs
export function loadSchema(path: string): Promise<EntitySchema> {
  const config = { validateOnLoad: true }; // inferred
  return processSchema(config);
}

// ❌ Bad - using any
function processData(data: any): any {}
```

### Error Handling

Use custom error classes with context:

```typescript
export class SchemaValidationError extends Error {
  constructor(
    message: string,
    public readonly filePath: string,
    public readonly lineNumber?: number
  ) {
    super(message);
    this.name = "SchemaValidationError";
  }
}

// Usage
throw new SchemaValidationError("Invalid email validation", "users.json", 15);
```

### Export Patterns

Named exports with explicit index files:

```typescript
// src/SchemaLoader.ts
export class SchemaLoader {}
export function createSchemaLoader(): SchemaLoader {}

// src/index.ts
export { SchemaLoader, createSchemaLoader } from "./SchemaLoader";
export { TemplateEngine } from "./TemplateEngine";

// Usage
import { SchemaLoader, ModelGenerator } from "@zeno/core";
```

### CLI Output Standards

Use @clack/prompts for consistent user experience:

```typescript
import { intro, outro, spinner, log } from "@clack/prompts";

export async function runGeneration() {
  intro("Zeno Framework");

  const s = spinner();
  s.start("Loading schemas...");

  try {
    await generateFiles();
    s.stop("Generated 12 files in 1.2s");
    outro("Generation complete!");
  } catch (error) {
    s.stop("Generation failed");
    log.error(error.message);
  }
}
```

### Async/Await Patterns

Mixed approach based on dependencies:

```typescript
// Parallel loading where possible
const [schemas, templates] = await Promise.all([
  loadSchemas(context.schemaDir),
  loadTemplates(context.templateDir),
]);

// Sequential for dependent operations
for (const schema of schemas.entities) {
  const content = await renderTemplate(templates.entity, schema);
  await writeFile(getOutputPath(schema), content);
}
```

### Comments and Documentation

- **No inline comments** except for complex business logic
- **JSDoc for all public APIs**

```typescript
/**
 * Loads and validates entity schemas from the specified directory.
 * @param schemaDir - Path to directory containing schema files
 * @returns Validated schema set ready for generation
 * @throws {SchemaValidationError} When schema files are invalid
 */
export async function loadSchemas(schemaDir: string): Promise<SchemaSet> {
  // Implementation without comments
}
```

## Development Workflow

- **Branch Strategy:** Feature branches from main
- **Commit Messages:** Conventional commits with scope (`feat(core):`, `fix(cli):`, `docs(generators):`)
- **Monorepo:** pnpm workspaces with Turborepo for build orchestration

## Testing Strategy

From architecture specification:

- **Unit Tests:** Schema validation, generator output, template rendering, utilities
- **Integration Tests:** Full generation pipeline, plugin integration
- **E2E Tests:** Complete project generation and build verification

Coverage target: >90% with Vitest

## Common Commands

```bash
# Development
pnpm dev                    # Start development with watch mode
pnpm build                  # Build all packages with Turborepo
pnpm test                   # Run test suite with coverage
pnpm lint                   # Run Biome linter and formatter

# Package management
pnpm changeset             # Create changeset for release
pnpm version               # Version packages with changesets
pnpm release               # Build and publish to NPM

# CLI testing (from packages/cli)
pnpm start init my-app     # Test init command
pnpm start generate        # Test generate command
pnpm start validate        # Test schema validation
```

## Project Structure

- `/packages/@zeno/core` - Core framework engine (schema loading, validation, pipeline)
- `/packages/@zeno/cli` - CLI implementation with oclif
- `/packages/@zeno/generators/*` - Output generators (models, components, pages, api)
- `/packages/@zeno/create` - Project scaffolding utilities
- `/examples/` - Example projects and configurations
- `/docs/` - Documentation site and specifications

## Post-Implementation Process

### Review Process Guidelines

Before submitting any code, ensure the following steps are completed:

1. **Run all validation commands:**

   ```bash
   npx tsc --noEmit
   pnpm lint
   pnpm build
   pnpm test
   ```

2. **Test CLI commands** if changes affect user interface:

   ```bash
   cd packages/cli
   pnpm start generate --help
   pnpm start init test-project
   ```

3. **Assess compliance:**
   For each standard, explicitly state ✅ or ❌ and explain why:

   - **Import Order:** Node built-ins → External → Internal (@zeno/\*) → Relative → Types
   - **Function Patterns:** Class methods, function declarations for utilities, arrows for callbacks
   - **File Naming:** camelCase utilities, PascalCase classes, simple command/type names
   - **TypeScript:** No `any` types, minimal `unknown`, explicit public API returns
   - **Zod Type Inference:** Types inferred from Zod schemas with clean re-exports
   - **Error Handling:** Custom error classes with context information
   - **Export Patterns:** Named exports with explicit index file re-exports
   - **CLI Output:** @clack/prompts for consistent user experience
   - **Documentation:** JSDoc for public APIs only, no inline comments

4. **Self-review checklist:**
   - [ ] Function declarations used for standalone utilities
   - [ ] Imports properly ordered with types last
   - [ ] No `any` types used anywhere in codebase
   - [ ] Types inferred from Zod schemas where validation exists
   - [ ] Custom error classes provide sufficient context
   - [ ] CLI output uses @clack/prompts consistently
   - [ ] Public APIs have JSDoc documentation
   - [ ] File names follow role-based conventions
   - [ ] Async operations optimised for performance where possible

### Documentation Updates

1. **Mark the task as done in `PLAN.md`**
2. **If the implementation touched other tasks or was unusual** - update the task itself or other tasks as relevant, note any important decisions if applicable (OPTIONAL)
3. **If applicable, update `CLAUDE.md`** with any learned standards or patterns picked up from the review process - these must be abstracted into concise documentation (OPTIONAL)
4. If there have been significant changes, update `REQUIREMENTS.md` or `ARCHITECTURE.md` as required (OPTIONAL)

**IMPORTANT**: Be concise, don't repeat yourself, double check and remove duplication/reduce where possible

### Commit

- **Format code before commiting** - run command `npx prettier path/to/file.ts`
- **Granular commits** - do not commit all in single commit, break them up for optimal traceability
- **Informative and concise commits** - multiline is encouraged but try to keep it less than 3 lines
- **Follow commit guidance** outlined above
- **You may use gh cli** - it is installed and functioning

## Known Issues & Workarounds

- Template generation can be slow for large schema sets - use incremental generation in development
- File watching on some systems requires polling mode for proper change detection
- CLI progress indicators may not render correctly in some terminal environments

## Performance Targets

- < 50ms per table generation
- < 10MB memory per table
- < 2s complete application generation (50 entities)
- Parallel generation support with worker threads

## References

- [Architecture Specification](docs/ARCHITECTURE.md)
- [Functional Requirements](docs/REQUIREMENTS.md)
- [Implementation Plan](docs/PLAN.md)
- [oclif Documentation](https://oclif.io/docs)
- [tsup Configuration](https://tsup.egoist.sh/)
- [Turborepo Guide](https://turbo.build/repo/docs)
