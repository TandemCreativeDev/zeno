# Zeno Framework: Implementation Plan

## Phase 1: Foundation (Tasks 1-15)

### [x] 1. Monorepo Setup

**Description**: Initialise pnpm workspace with Turborepo configuration  
**Deliverables**:

- `pnpm-workspace.yaml` with package structure
- `turbo.json` with build pipeline
- Root `package.json` with workspace scripts
- `.gitignore`, `.npmrc`, `.editorconfig`
  **Dependencies**: None  
  **Definition of Done**: `pnpm install` works, `pnpm build` runs successfully

### [x] 2. Core Package Scaffold

**Description**: Create @zeno/core package with TypeScript and build configuration  
**Deliverables**:

- `packages/@zeno/core/package.json` with tsup config
- `tsconfig.json` and `tsup.config.ts`
- Empty `src/index.ts` with basic export
  **Dependencies**: Task 1  
  **Definition of Done**: Package builds with `pnpm build`, outputs ESM and CJS

### [ ] 3. Type Definitions Package

**Description**: Define core TypeScript interfaces and types (Ref: Architecture §4.1)  
**Deliverables**:

- `packages/@zeno/types` package
- `EntitySchema`, `EnumSchema`, `PageSchema`, `AppSchema` interfaces
- `SchemaSet`, `GeneratorContext` types
- Export from core package
  **Dependencies**: Task 2  
  **Definition of Done**: Types compile without errors, can import from @zeno/core

### [ ] 4. Schema Validation Rules

**Description**: Implement JSON schema validation using Zod (Ref: Architecture §4.1)  
**Deliverables**:

- Zod schemas for entity, enum, page, app configurations
- `ValidationResult` type with error details
- Unit tests for valid/invalid schemas
  **Dependencies**: Task 3  
  **Definition of Done**: 100% test coverage on validation logic

### [ ] 5. Schema Loader Implementation

**Description**: Create SchemaLoader class to read and validate JSON files (Ref: Architecture §4.1)  
**Deliverables**:

- `SchemaLoader` class with `load()`, `validate()` methods
- File system operations with proper error handling
- Integration tests with fixture files
  **Dependencies**: Tasks 3, 4  
  **Definition of Done**: Can load example schemas from docs/examples, proper error messages

### [ ] 6. Custom Error Classes

**Description**: Implement error handling system (Ref: CLAUDE.md - Error Handling)  
**Deliverables**:

- `SchemaValidationError`, `GenerationError`, `ConfigurationError` classes
- Error context with file path and line numbers
- Unit tests for error scenarios
  **Dependencies**: Task 2  
  **Definition of Done**: Errors provide actionable messages with context

### [ ] 7. Configuration System

**Description**: Implement config loading with defaults (Ref: Architecture §7)  
**Deliverables**:

- `defineConfig()` helper function
- Config validation and merging logic
- Tests for various config scenarios
  **Dependencies**: Tasks 3, 4  
  **Definition of Done**: Can load zeno.config.ts, applies defaults correctly

### [ ] 8. Template Engine Setup

**Description**: Integrate Handlebars with custom helpers (Ref: Architecture §4.3)  
**Deliverables**:

- `TemplateEngine` class with helper registration
- Built-in helpers: case transformers, pluralisation
- Unit tests for template rendering
  **Dependencies**: Task 2  
  **Definition of Done**: Can render templates with all helpers working

### [ ] 9. Generator Base Class

**Description**: Abstract Generator class for all generators (Ref: Architecture §5)  
**Deliverables**:

- `Generator` abstract class with required methods
- `GeneratedFile` interface
- Unit tests for generator lifecycle
  **Dependencies**: Tasks 3, 8  
  **Definition of Done**: Can extend and implement test generator

### [ ] 10. Generation Pipeline

**Description**: Core pipeline for running generators (Ref: Architecture §4.2)  
**Deliverables**:

- `GenerationPipeline` class with registration and execution
- Parallel generation support
- Integration tests with mock generators
  **Dependencies**: Task 9  
  **Definition of Done**: Can register and run multiple generators in sequence

### [ ] 11. File System Utilities

**Description**: Safe file operations with validation  
**Deliverables**:

- Path validation to prevent traversal attacks
- Atomic file writes with backup
- Directory creation utilities
- Unit tests for edge cases
  **Dependencies**: Task 6  
  **Definition of Done**: All file operations are safe and tested

### [ ] 12. Watch Mode Infrastructure

**Description**: File watching system for development (Ref: Requirements §10)  
**Deliverables**:

- Watcher class using chokidar
- Debounced change detection
- Schema change diffing
- Integration tests
  **Dependencies**: Tasks 5, 10  
  **Definition of Done**: Detects changes and triggers incremental generation

### [ ] 13. Schema Change Detection

**Description**: Implement incremental generation logic  
**Deliverables**:

- `SchemaChange` type with change details
- Dependency graph for affected files
- Unit tests for various change scenarios
  **Dependencies**: Task 12  
  **Definition of Done**: Only regenerates affected files on changes

### [ ] 14. Logging System

**Description**: Structured logging with levels  
**Deliverables**:

- Logger with debug/info/warn/error levels
- Context-aware logging
- Integration with CLI output
  **Dependencies**: Task 2  
  **Definition of Done**: Logs are useful for debugging, respects verbosity settings

### [ ] 15. Core Package Integration Tests

**Description**: End-to-end tests for core functionality  
**Deliverables**:

- Test harness for full pipeline
- Fixture projects
- Performance benchmarks
  **Dependencies**: Tasks 1-14  
  **Definition of Done**: Core package works end-to-end with example schemas

## Phase 2: Generators (Tasks 16-30)

### [ ] 16. Model Generator Package

**Description**: Create @zeno/generators/models package (Ref: Requirements §3.1)  
**Deliverables**:

- Package scaffold with dependencies
- Base structure for model generation
  **Dependencies**: Task 15  
  **Definition of Done**: Package builds and exports ModelGenerator class

### [ ] 17. Drizzle Schema Generation

**Description**: Generate Drizzle ORM schemas from entities (Ref: Requirements §3.1)  
**Deliverables**:

- Drizzle schema templates
- Column type mapping
- Relationship handling
- Unit tests with fixtures
  **Dependencies**: Task 16  
  **Definition of Done**: Generates valid Drizzle schemas for all column types

### [ ] 18. TypeScript Type Generation

**Description**: Generate TypeScript interfaces and types (Ref: Requirements §3.1)  
**Deliverables**:

- Base, Insert, Update, Select type variants
- Relationship typing
- Enum type generation
- Unit tests
  **Dependencies**: Task 16  
  **Definition of Done**: Generated types compile without errors

### [ ] 19. Zod Schema Generation

**Description**: Generate Zod validation schemas (Ref: Requirements §3.1)  
**Deliverables**:

- Zod schema templates
- Validation rule mapping
- Custom error messages
- Unit tests
  **Dependencies**: Task 16  
  **Definition of Done**: Validation works correctly for all rules

### [ ] 20. Migration Generator

**Description**: Auto-generate database migrations (Ref: Requirements §3.1)  
**Deliverables**:

- Migration file generation
- Schema diffing logic
- Rollback support
- Integration tests
  **Dependencies**: Task 17  
  **Definition of Done**: Can generate and apply migrations

### [ ] 21. Component Generator Package

**Description**: Create @zeno/generators/components package (Ref: Requirements §3.2)  
**Deliverables**:

- Package scaffold
- Base component templates
  **Dependencies**: Task 15  
  **Definition of Done**: Package builds and exports ComponentGenerator

### [ ] 22. Form Component Generation

**Description**: Generate accessible form components (Ref: Requirements §3.2)  
**Deliverables**:

- Form templates with sections
- Field visibility logic
- Validation integration
- Accessibility attributes
- Unit tests
  **Dependencies**: Task 21  
  **Definition of Done**: Forms are WCAG 2.1 AA compliant, validation works

### [ ] 23. Table Component Generation

**Description**: Generate data table components (Ref: Requirements §3.2)  
**Deliverables**:

- Table templates with sorting/filtering
- Pagination support
- Bulk actions
- Unit tests
  **Dependencies**: Task 21  
  **Definition of Done**: Tables are accessible and fully functional

### [ ] 24. Modal Component Generation

**Description**: Generate entity management modals (Ref: Requirements §3.2)  
**Deliverables**:

- Modal templates
- Focus management
- Keyboard navigation
- Unit tests
  **Dependencies**: Task 21  
  **Definition of Done**: Modals are accessible with proper focus handling

### [ ] 25. Page Generator Package

**Description**: Create @zeno/generators/pages package (Ref: Requirements §3.3)  
**Deliverables**:

- Package scaffold
- Page template structure
  **Dependencies**: Task 15  
  **Definition of Done**: Package builds and exports PageGenerator

### [ ] 26. CRUD Page Generation

**Description**: Generate list/create/edit/view pages (Ref: Requirements §3.3)  
**Deliverables**:

- CRUD page templates
- Route generation
- Layout integration
- Unit tests
  **Dependencies**: Tasks 22-25  
  **Definition of Done**: All CRUD operations work with proper routing

### [ ] 27. Custom Page Generation

**Description**: Generate pages from JSON definitions (Ref: Requirements §8)  
**Deliverables**:

- Section type templates (hero, stats, table, content)
- Dynamic composition
- Unit tests for each section type
  **Dependencies**: Task 25  
  **Definition of Done**: Can generate all example pages correctly

### [ ] 28. API Generator Package

**Description**: Create @zeno/generators/api package (Ref: Requirements §3.4)  
**Deliverables**:

- Package scaffold
- API route templates
  **Dependencies**: Task 15  
  **Definition of Done**: Package builds and exports ApiGenerator

### [ ] 29. CRUD API Generation

**Description**: Generate RESTful API routes (Ref: Requirements §3.4)  
**Deliverables**:

- CRUD route templates
- Validation middleware
- Type-safe responses
- Unit tests
  **Dependencies**: Tasks 19, 28  
  **Definition of Done**: APIs handle all CRUD operations with validation

### [ ] 30. Authentication Integration

**Description**: Generate NextAuth configuration (Ref: Requirements §4.1)  
**Deliverables**:

- Auth route generation
- User table detection
- Session type generation
- Integration tests
  **Dependencies**: Tasks 17, 29  
  **Definition of Done**: Authentication works with generated user tables

## Phase 3: CLI Implementation (Tasks 31-40)

### [ ] 31. CLI Package Setup

**Description**: Create @zeno/cli with oclif (Ref: Architecture §6)  
**Deliverables**:

- oclif project structure
- Base command class
- Package configuration
  **Dependencies**: Task 15  
  **Definition of Done**: CLI runs with help command

### [ ] 32. Init Command

**Description**: Implement project initialisation (Ref: Requirements §5)  
**Deliverables**:

- Interactive prompts with @clack/prompts
- Project scaffolding
- Dependency installation
- Integration tests
  **Dependencies**: Task 31  
  **Definition of Done**: Can create new project and existing project setup

### [ ] 33. Generate Command

**Description**: Implement code generation command (Ref: Architecture §6)  
**Deliverables**:

- Generate command with flags
- Progress indicators
- Error handling
- Unit tests
  **Dependencies**: Tasks 30, 31  
  **Definition of Done**: Generates all code types with proper output

### [ ] 34. Validate Command

**Description**: Schema validation command  
**Deliverables**:

- Validate command implementation
- Detailed error reporting
- Unit tests
  **Dependencies**: Tasks 5, 31  
  **Definition of Done**: Provides clear validation errors with line numbers

### [ ] 35. Migrate Command

**Description**: Database migration command  
**Deliverables**:

- Migration execution
- Rollback support
- Status reporting
- Integration tests
  **Dependencies**: Tasks 20, 31  
  **Definition of Done**: Can run and rollback migrations

### [ ] 36. Dev Command

**Description**: Development mode with watching  
**Deliverables**:

- Combined watch and generate
- HMR integration
- Unit tests
  **Dependencies**: Tasks 12, 33  
  **Definition of Done**: Watches files and regenerates on changes

### [ ] 37. CLI Error Handling

**Description**: Consistent error output  
**Deliverables**:

- Error formatting
- Debug mode support
- Help suggestions
  **Dependencies**: Tasks 6, 31  
  **Definition of Done**: All errors are actionable and well-formatted

### [ ] 38. CLI Configuration

**Description**: Config detection and loading  
**Deliverables**:

- Config file detection
- Environment variable support
- Default handling
  **Dependencies**: Tasks 7, 31  
  **Definition of Done**: Finds and loads configuration correctly

### [ ] 39. Interactive Mode

**Description**: Enhanced interactive features  
**Deliverables**:

- Schema selection prompts
- Confirmation dialogs
- Progress animations
  **Dependencies**: Task 31  
  **Definition of Done**: All interactions are smooth and intuitive

### [ ] 40. CLI Integration Tests

**Description**: End-to-end CLI testing  
**Deliverables**:

- Full command flow tests
- Output verification
- Error scenario coverage
  **Dependencies**: Tasks 31-39  
  **Definition of Done**: All commands work in real scenarios

## Phase 4: Integration & Polish (Tasks 41-50)

### [ ] 41. Create Package

**Description**: Implement @zeno/create for npx usage  
**Deliverables**:

- Standalone create package
- Project templates
- Quick start flow
  **Dependencies**: Task 32  
  **Definition of Done**: `npx @zeno/create my-app` works smoothly

### [ ] 42. Navigation Generation

**Description**: Auto-generate navigation components (Ref: Requirements §4.2)  
**Deliverables**:

- Navigation templates
- Auto-detection logic
- Mobile navigation
- Unit tests
  **Dependencies**: Tasks 23, 27  
  **Definition of Done**: Navigation reflects page definitions correctly

### [ ] 43. Email Configuration

**Description**: Email setup for authentication (Ref: Requirements §4.1)  
**Deliverables**:

- Nodemailer integration
- Verification templates
- Configuration validation
  **Dependencies**: Task 30  
  **Definition of Done**: Email verification works in generated apps

### [ ] 44. Seed Data Implementation

**Description**: Database seeding functionality  
**Deliverables**:

- Seed command
- Data generation from schemas
- Relationship handling
  **Dependencies**: Tasks 17, 35  
  **Definition of Done**: Can seed all example data correctly

### [ ] 45. Performance Optimisation

**Description**: Meet performance targets (Ref: Requirements §9)  
**Deliverables**:

- Parallel generation
- Caching implementation
- Benchmark suite
  **Dependencies**: Task 40  
  **Definition of Done**: Meets all performance targets

### [ ] 46. Accessibility Validation

**Description**: Ensure WCAG compliance (Ref: Requirements §3.2)  
**Deliverables**:

- Accessibility tests
- Component audits
- Documentation
  **Dependencies**: Tasks 22-24  
  **Definition of Done**: All components pass accessibility checks

### [ ] 47. Documentation Site

**Description**: Create documentation with VitePress (Ref: Architecture §13.3)  
**Deliverables**:

- Documentation site setup
- API documentation
- Usage guides
- Examples
  **Dependencies**: Task 40  
  **Definition of Done**: Comprehensive docs deployed

### [ ] 48. Example Projects

**Description**: Create example applications  
**Deliverables**:

- Blog example
- SaaS starter
- E-commerce demo
  **Dependencies**: Task 40  
  **Definition of Done**: Examples build and run correctly

### [ ] 49. Testing Coverage

**Description**: Achieve >90% test coverage (Ref: Architecture §9)  
**Deliverables**:

- Missing test cases
- Coverage reports
- CI integration
  **Dependencies**: All previous tasks  
  **Definition of Done**: Coverage exceeds 90% across all packages

### [ ] 50. Release Preparation

**Description**: Prepare for public release
**Deliverables**:

- NPM organisation setup
- CI/CD pipeline
- Security audit
- Launch materials
  **Dependencies**: All previous tasks  
  **Definition of Done**: Ready for npm publish

## Notes

- Each task should have accompanying tests written first (TDD)
- Tasks within phases can sometimes be worked in parallel by different developers
- Performance benchmarks should be run after each generator implementation
- Accessibility testing should be continuous, not just Task 46
- Documentation should be updated as features are implemented
