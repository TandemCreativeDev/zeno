# Functional Requirements Specification

## Zeno Node Module

### 1. Executive Summary

Transform the existing Next.js JSON schema generator into a standalone, framework-agnostic node module that enables rapid application development through JSON configuration. The module will provide a CLI tool and programmatic API for generating TypeScript types, database schemas, validation logic, and UI components from JSON definitions.

### 2. Core Functionality

#### 2.1 Schema Definition System

- **JSON Configuration Format**

  - Support for table definitions with columns, constraints, validation rules
  - Enum definitions with UI metadata (labels, colours, icons)
  - Relationship definitions (one-to-one, one-to-many, many-to-many)
  - Index specifications for performance optimisation
  - Seed data configuration

- **Schema Validation**
  - Validate JSON configuration files against schema
  - Provide clear error messages for invalid configurations
  - Support for custom validation rules
  - Schema versioning and migration paths

#### 2.2 Code Generation Engine

- **TypeScript Types**

  - Generate base types from validation schemas
  - Create insert/update/select type variants
  - Generate API request/response types
  - Support for relationship types

- **Database Schemas**

  - Pluggable ORM support (Drizzle, Prisma, TypeORM)
  - Generate migration files
  - Index and constraint generation
  - Foreign key relationship mapping

- **Validation Schemas**

  - Pluggable validation library support (Zod, Yup, Joi)
  - Client and server-side validation
  - Custom validation rule support
  - Error message customisation

- **UI Components**
  - Framework-agnostic component generation
  - Support for React, Vue, Angular, Svelte
  - Form components with validation
  - Table/list components with sorting/filtering
  - Customisable component templates

#### 2.3 CLI Interface

- **Commands**

  - `zeno init` - Initialise new project
  - `zeno generate` - Generate code from schemas
  - `zeno validate` - Validate schema files
  - `zeno watch` - Watch mode for development
  - `zeno migrate` - Generate database migrations
  - `zeno seed` - Generate and run seed scripts

- **Options**
  - `--config` - Custom configuration file path
  - `--target` - Target framework (next, nuxt, sveltekit)
  - `--orm` - ORM choice (drizzle, prisma, typeorm)
  - `--ui` - UI framework (react, vue, angular, svelte)
  - `--style` - Styling solution (tailwind, css-modules, styled-components)

#### 2.4 Programmatic API

```typescript
interface ZenoFramework {
  // Initialisation
  create(config: FrameworkConfig): Framework;

  // Schema operations
  loadSchemas(path: string): Promise<SchemaSet>;
  validateSchemas(schemas: SchemaSet): ValidationResult;

  // Generation
  generateTypes(schemas: SchemaSet, options: TypeOptions): Promise<void>;
  generateDatabase(schemas: SchemaSet, options: DatabaseOptions): Promise<void>;
  generateValidation(
    schemas: SchemaSet,
    options: ValidationOptions
  ): Promise<void>;
  generateComponents(
    schemas: SchemaSet,
    options: ComponentOptions
  ): Promise<void>;

  // Utilities
  watch(path: string, callback: WatchCallback): Watcher;
  migrate(options: MigrationOptions): Promise<void>;
  seed(options: SeedOptions): Promise<void>;
}
```

### 3. Configuration System

#### 3.1 Framework Configuration

```typescript
interface FrameworkConfig {
  // Project settings
  projectRoot: string;
  outputDir: string;
  schemaDir: string;

  // Framework targets
  framework: "next" | "nuxt" | "sveltekit" | "remix" | "vanilla";
  orm: "drizzle" | "prisma" | "typeorm" | "kysely";
  validation: "zod" | "yup" | "joi" | "valibot";
  ui: "react" | "vue" | "angular" | "svelte" | "solid";

  // Styling
  styling: {
    solution: "tailwind" | "css-modules" | "styled-components" | "emotion";
    componentLibrary?: "daisyui" | "shadcn" | "mantine" | "mui";
  };

  // Generation options
  generation: {
    types: boolean;
    database: boolean;
    validation: boolean;
    components: boolean;
    api?: boolean;
    tests?: boolean;
  };

  // Custom templates
  templates?: {
    component?: string;
    form?: string;
    table?: string;
    api?: string;
  };
}
```

#### 3.2 Schema Extensions

- Plugin system for custom column types
- Custom validation rule definitions
- UI component mapping overrides
- Database type mappings
- Generation hooks and middleware

### 4. Output Structure

#### 4.1 Generated File Organisation

```
generated/
├── types/           # TypeScript type definitions
├── database/        # ORM schemas and migrations
├── validation/      # Validation schemas
├── components/      # UI components
├── api/            # API route handlers (optional)
├── hooks/          # Custom hooks (optional)
└── tests/          # Generated tests (optional)
```

#### 4.2 Import Conventions

- Barrel exports for easy imports
- Tree-shakeable output
- TypeScript declaration files
- Source maps for debugging

### 5. Developer Experience

#### 5.1 Error Handling

- Clear, actionable error messages
- Schema validation with line numbers
- Generation failure recovery
- Rollback capabilities

#### 5.2 Performance

- Incremental generation
- Parallel processing
- Caching mechanisms
- Minimal dependencies

#### 5.3 Debugging

- Verbose logging options
- Generation reports
- Schema visualisation
- Dry-run mode

### 6. Extensibility

#### 6.1 Plugin System

```typescript
interface Plugin {
  name: string;
  version: string;

  // Hooks
  beforeGenerate?: (schemas: SchemaSet) => Promise<void>;
  afterGenerate?: (results: GenerationResults) => Promise<void>;

  // Custom generators
  generators?: {
    [key: string]: Generator;
  };

  // Schema extensions
  schemaExtensions?: SchemaExtension[];
}
```

#### 6.2 Template System

- Override default templates
- Custom template variables
- Template inheritance
- Partial template support

### 7. Integration Features

#### 7.1 IDE Support

- VS Code extension for schema authoring
- JSON schema for autocompletion
- Live validation in editor
- Quick actions for generation

#### 7.2 Build Tool Integration

- Webpack plugin
- Vite plugin
- Rollup plugin
- ESBuild plugin

#### 7.3 CI/CD Integration

- GitHub Actions
- Pre-commit hooks
- Schema change detection
- Automated migration generation

### 8. Non-Functional Requirements

#### 8.1 Compatibility

- Node.js 16+ support
- TypeScript 4.5+ support
- ESM and CommonJS dual package
- Cross-platform (Windows, macOS, Linux)

#### 8.2 Performance Targets

- < 1s for typical schema validation
- < 5s for full generation (100 tables)
- < 100ms for incremental updates
- < 50MB package size

#### 8.3 Security

- No arbitrary code execution
- Sanitised file paths
- Secure template rendering
- Dependency vulnerability scanning

### 9. Documentation Requirements

#### 9.1 User Documentation

- Getting started guide
- Configuration reference
- Schema format specification
- Migration guide from v1
- Troubleshooting guide

#### 9.2 API Documentation

- TypeScript declarations
- JSDoc comments
- Interactive API explorer
- Code examples

#### 9.3 Developer Documentation

- Architecture overview
- Plugin development guide
- Contributing guidelines
- Testing strategies
