# Architecture Specification

## Zeno Node Module

### 1. System Architecture Overview

```
┌───────────────────────────────────────────────────────────┐
│                         CLI Interface                     │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐          │
│  │  init   │ │generate │ │validate │ │  watch  │          │
│  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘          │
│       └───────────┴───────────┴───────────┘               │
└───────────────────────────┬───────────────────────────────┘
                            │
┌───────────────────────────▼───────────────────────────────┐
│                      Core Framework                       │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐       │
│  │Schema Loader│  │Config Manager│  │Plugin System│       │
│  └──────┬──────┘  └──────┬───────┘  └──────┬──────┘       │
│         │                │                 │              │
│  ┌──────▼────────────────▼─────────────────▼───────┐      │
│  │              Generation Engine                  │      │
│  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐            │      │
│  │  │Types │ │ ORM  │ │Valid.│ │ UI   │            │      │
│  │  └──────┘ └──────┘ └──────┘ └──────┘            │      │
│  └─────────────────────────────────────────────────┘      │
└───────────────────────────────────────────────────────────┘
                            │
┌───────────────────────────▼───────────────────────────────┐
│                    Output Adapters                        │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐       │
│  │  React  │  │   Vue   │  │ Angular │  │ Svelte  │       │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘       │
└───────────────────────────────────────────────────────────┘
```

### 2. Package Structure

```
json-schema-framework/
├── packages/
│   ├── core/                 # Core framework logic
│   │   ├── src/
│   │   │   ├── schema/      # Schema loading and validation
│   │   │   ├── config/      # Configuration management
│   │   │   ├── generator/   # Generation engine
│   │   │   ├── plugin/      # Plugin system
│   │   │   └── utils/       # Shared utilities
│   │   └── package.json
│   │
│   ├── cli/                  # CLI implementation
│   │   ├── src/
│   │   │   ├── commands/    # CLI commands
│   │   │   ├── utils/       # CLI utilities
│   │   │   └── index.ts     # CLI entry point
│   │   └── package.json
│   │
│   ├── generators/           # Generator implementations
│   │   ├── types/           # TypeScript generator
│   │   ├── drizzle/         # Drizzle ORM generator
│   │   ├── prisma/          # Prisma generator
│   │   ├── zod/             # Zod validation generator
│   │   ├── react/           # React component generator
│   │   └── vue/             # Vue component generator
│   │
│   ├── templates/            # Default templates
│   │   ├── components/      # Component templates
│   │   ├── forms/           # Form templates
│   │   └── tables/          # Table templates
│   │
│   └── plugins/              # Official plugins
│       ├── auth/            # Authentication plugin
│       ├── api/             # API generation plugin
│       └── testing/         # Test generation plugin
│
├── examples/                 # Example projects
├── docs/                     # Documentation
└── tools/                    # Development tools
```

### 3. Core Components

#### 3.1 Schema Loader

```typescript
interface SchemaLoader {
  loadFromDirectory(path: string): Promise<SchemaSet>;
  loadFromFiles(files: string[]): Promise<SchemaSet>;
  validateSchema(schema: TableSchema | EnumSchema): ValidationResult;
  resolveReferences(schemas: SchemaSet): ResolvedSchemaSet;
  detectChanges(oldSchemas: SchemaSet, newSchemas: SchemaSet): SchemaChanges;
}

class SchemaLoaderImpl implements SchemaLoader {
  private validators: Map<string, Validator>;
  private cache: SchemaCache;

  constructor(options: SchemaLoaderOptions) {
    this.validators = this.initValidators();
    this.cache = new SchemaCache(options.cacheDir);
  }
}
```

#### 3.2 Configuration Manager

```typescript
interface ConfigManager {
  loadConfig(path?: string): Promise<FrameworkConfig>;
  validateConfig(config: unknown): FrameworkConfig;
  mergeConfigs(...configs: Partial<FrameworkConfig>[]): FrameworkConfig;
  getGeneratorConfig(generator: string): GeneratorConfig;
}

class ConfigManagerImpl implements ConfigManager {
  private static readonly CONFIG_FILES = [
    "jsf.config.js",
    "jsf.config.ts",
    "jsf.config.json",
    ".jsfrc.json",
  ];

  async loadConfig(path?: string): Promise<FrameworkConfig> {
    const configPath = path || (await this.findConfigFile());
    return this.parseConfigFile(configPath);
  }
}
```

#### 3.3 Generation Engine

```typescript
interface GenerationEngine {
  registerGenerator(name: string, generator: Generator): void;
  generate(
    schemas: SchemaSet,
    options: GenerationOptions
  ): Promise<GenerationResult>;
  generateIncremental(
    changes: SchemaChanges,
    options: GenerationOptions
  ): Promise<GenerationResult>;
}

abstract class Generator {
  abstract name: string;
  abstract version: string;

  abstract canGenerate(schema: Schema): boolean;
  abstract generate(
    schema: Schema,
    context: GenerationContext
  ): Promise<GeneratedFile[]>;

  protected renderTemplate(template: string, data: any): string {
    return this.templateEngine.render(template, data);
  }
}
```

#### 3.4 Plugin System

```typescript
interface PluginManager {
  register(plugin: Plugin): void;
  loadPlugin(name: string): Promise<Plugin>;
  executeHook(hook: string, ...args: any[]): Promise<void>;
  getGenerators(): Map<string, Generator>;
}

interface Plugin {
  name: string;
  version: string;

  install(framework: Framework): void;

  hooks?: {
    beforeLoad?: Hook;
    afterLoad?: Hook;
    beforeGenerate?: Hook;
    afterGenerate?: Hook;
    beforeWrite?: Hook;
    afterWrite?: Hook;
  };

  generators?: Record<string, Generator>;
  validators?: Record<string, Validator>;
  templates?: Record<string, Template>;
}
```

### 4. Data Models

#### 4.1 Schema Types

```typescript
interface TableSchema {
  tableName: string;
  displayName: string;
  icon?: string;
  description?: string;
  columns: Record<string, ColumnSchema>;
  indexes?: Record<string, IndexSchema>;
  relationships?: Record<string, RelationshipSchema>;
  ui?: UISchema;
  seedData?: Record<string, unknown>[];
}

interface ColumnSchema {
  dbConstraints: DatabaseConstraints;
  validation?: ValidationRules;
  ui?: UIConfig;
}

interface EnumSchema {
  values: string[];
  labels?: Record<string, string>;
  colors?: Record<string, string>;
  icons?: Record<string, string>;
  description?: string;
}

interface SchemaSet {
  tables: Map<string, TableSchema>;
  enums: Map<string, EnumSchema>;
  metadata: SchemaMetadata;
}
```

#### 4.2 Generation Types

```typescript
interface GenerationContext {
  schema: Schema;
  config: FrameworkConfig;
  generators: Map<string, Generator>;
  templates: TemplateRegistry;
  utils: GenerationUtils;
}

interface GenerationResult {
  files: GeneratedFile[];
  errors: GenerationError[];
  warnings: GenerationWarning[];
  stats: GenerationStats;
}

interface GeneratedFile {
  path: string;
  content: string;
  type: "create" | "update" | "delete";
  generator: string;
}
```

### 5. Generator Architecture

#### 5.1 Base Generator Pattern

```typescript
abstract class BaseGenerator extends Generator {
  protected config: GeneratorConfig;
  protected templateEngine: TemplateEngine;

  constructor(config: GeneratorConfig) {
    super();
    this.config = config;
    this.templateEngine = new TemplateEngine(config.templates);
  }

  protected async loadTemplate(name: string): Promise<Template> {
    return this.templateEngine.load(name);
  }

  protected formatCode(code: string, language: string): Promise<string> {
    return this.formatter.format(code, language);
  }
}
```

#### 5.2 ORM Generators

```typescript
class DrizzleGenerator extends BaseGenerator {
  name = "drizzle";
  version = "1.0.0";

  async generate(
    schema: TableSchema,
    context: GenerationContext
  ): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = [];

    // Generate schema file
    files.push(await this.generateSchema(schema, context));

    // Generate migration
    if (context.config.database.migrations) {
      files.push(await this.generateMigration(schema, context));
    }

    // Generate seed data
    if (schema.seedData) {
      files.push(await this.generateSeed(schema, context));
    }

    return files;
  }
}
```

#### 5.3 Component Generators

```typescript
class ReactComponentGenerator extends BaseGenerator {
  name = "react-components";
  version = "1.0.0";

  async generate(
    schema: TableSchema,
    context: GenerationContext
  ): Promise<GeneratedFile[]> {
    const files: GeneratedFile[] = [];

    // Generate form component
    if (this.shouldGenerateForm(schema)) {
      files.push(await this.generateForm(schema, context));
    }

    // Generate table component
    if (this.shouldGenerateTable(schema)) {
      files.push(await this.generateTable(schema, context));
    }

    // Generate hooks
    if (context.config.ui.hooks) {
      files.push(await this.generateHooks(schema, context));
    }

    return files;
  }
}
```

### 6. Template System

#### 6.1 Template Engine

```typescript
interface TemplateEngine {
  register(name: string, template: Template): void;
  load(name: string): Promise<Template>;
  render(template: Template | string, data: any): string;
  compile(source: string): CompiledTemplate;
}

class HandlebarsTemplateEngine implements TemplateEngine {
  private handlebars: typeof Handlebars;
  private templates: Map<string, Template>;
  private helpers: Map<string, Helper>;

  constructor() {
    this.handlebars = Handlebars.create();
    this.registerHelpers();
  }

  private registerHelpers(): void {
    this.handlebars.registerHelper("camelCase", toCamelCase);
    this.handlebars.registerHelper("pascalCase", toPascalCase);
    this.handlebars.registerHelper("kebabCase", toKebabCase);
  }
}
```

#### 6.2 Template Structure

```typescript
interface Template {
  name: string;
  source: string;
  partials?: Record<string, string>;
  helpers?: Record<string, Helper>;
  data?: Record<string, any>;
}

interface CompiledTemplate {
  render(data: any): string;
  ast: TemplateAST;
}
```

### 7. CLI Architecture

#### 7.1 Command Structure

```typescript
abstract class Command {
  abstract name: string;
  abstract description: string;
  abstract options: CommandOption[];

  abstract execute(args: CommandArgs): Promise<void>;

  protected async loadFramework(args: CommandArgs): Promise<Framework> {
    const config = await this.loadConfig(args);
    return new Framework(config);
  }
}

class GenerateCommand extends Command {
  name = "generate";
  description = "Generate code from schemas";

  options = [
    { name: "config", alias: "c", description: "Config file path" },
    { name: "watch", alias: "w", description: "Watch mode" },
    { name: "only", alias: "o", description: "Generate only specific types" },
  ];

  async execute(args: CommandArgs): Promise<void> {
    const framework = await this.loadFramework(args);

    if (args.watch) {
      await framework.watch();
    } else {
      await framework.generate();
    }
  }
}
```

### 8. Build and Distribution

#### 8.1 Package Configuration

```json
{
  "name": "@jsf/core",
  "version": "1.0.0",
  "type": "module",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    },
    "./generators/*": {
      "types": "./dist/generators/*.d.ts",
      "import": "./dist/generators/*.js",
      "require": "./dist/generators/*.cjs"
    }
  },
  "bin": {
    "jsf": "./dist/cli/index.js"
  },
  "files": ["dist", "templates"],
  "engines": {
    "node": ">=16.0.0"
  }
}
```

#### 8.2 Build Pipeline

```typescript
// build.config.ts
export default {
  entries: [
    { input: "src/index.ts", output: "dist/index" },
    { input: "src/cli/index.ts", output: "dist/cli/index" },
  ],
  formats: ["esm", "cjs"],
  dts: true,
  clean: true,
  external: ["node:fs", "node:path", "node:url"],
  plugins: [preserveShebang(), copyTemplates()],
};
```

### 9. Testing Strategy

#### 9.1 Test Structure

```
tests/
├── unit/
│   ├── schema-loader.test.ts
│   ├── generators/
│   └── utils/
├── integration/
│   ├── cli.test.ts
│   ├── generation.test.ts
│   └── plugins.test.ts
├── e2e/
│   ├── next-app.test.ts
│   ├── vue-app.test.ts
│   └── api-generation.test.ts
└── fixtures/
    ├── schemas/
    └── configs/
```

#### 9.2 Testing Utilities

```typescript
class TestFramework {
  static async createTestProject(
    config: Partial<FrameworkConfig>
  ): Promise<TestProject> {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "jsf-test-"));
    return new TestProject(tmpDir, config);
  }
}

class TestProject {
  constructor(private dir: string, private config: Partial<FrameworkConfig>) {}

  async addSchema(name: string, schema: TableSchema): Promise<void> {
    const schemaPath = path.join(this.dir, "schemas", `${name}.json`);
    await fs.writeFile(schemaPath, JSON.stringify(schema, null, 2));
  }

  async generate(): Promise<GenerationResult> {
    const framework = new Framework(this.config);
    return framework.generate();
  }
}
```

### 10. Performance Optimisations

#### 10.1 Caching Strategy

```typescript
interface CacheManager {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  invalidate(pattern: string): Promise<void>;
  clear(): Promise<void>;
}

class FileSystemCache implements CacheManager {
  private cacheDir: string;

  constructor(cacheDir: string) {
    this.cacheDir = cacheDir;
  }

  async get<T>(key: string): Promise<T | null> {
    const hash = this.hashKey(key);
    const cachePath = path.join(this.cacheDir, hash);

    try {
      const data = await fs.readFile(cachePath, "utf-8");
      const cached = JSON.parse(data);

      if (cached.expires && cached.expires < Date.now()) {
        await fs.unlink(cachePath);
        return null;
      }

      return cached.value;
    } catch {
      return null;
    }
  }
}
```

#### 10.2 Parallel Processing

```typescript
class ParallelGenerator {
  private workerPool: WorkerPool;

  constructor(workers: number = os.cpus().length) {
    this.workerPool = new WorkerPool(workers);
  }

  async generate(
    schemas: SchemaSet,
    options: GenerationOptions
  ): Promise<GenerationResult> {
    const tasks = this.createGenerationTasks(schemas, options);
    const results = await this.workerPool.executeAll(tasks);
    return this.mergeResults(results);
  }
}
```
