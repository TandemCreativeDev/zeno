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
**Acceptance Criteria**: `pnpm install` works, `pnpm build` runs successfully

### [x] 2. Core Package Scaffold

**Description**: Create @zeno/core package with TypeScript and build configuration  
**Deliverables**:

- `packages/@zeno/core/package.json` with tsup config
- `tsconfig.json` and `tsup.config.ts`
- Empty `src/index.ts` with basic export

**Dependencies**: Task 1  
**Acceptance Criteria**: Package builds with `pnpm build`, outputs ESM and CJS

### [x] 3. Type Definitions

**Description**: Define core TypeScript interfaces and types within @zeno/core package (Ref: Architecture §4.1)  
**Deliverables**:

- `src/types/` directory in @zeno/core
- `EntitySchema`, `EnumSchema`, `PageSchema`, `AppSchema` interfaces
- `SchemaSet`, `GeneratorContext` types
- Export all types from main index

**Dependencies**: Task 2  
**Acceptance Criteria**: Types compile without errors, can import from @zeno/core

### [x] 4. Schema Validation Rules

**Description**: Implement JSON schema validation using Zod (Ref: Architecture §4.1)  
**Deliverables**:

- Zod schemas for entity, enum, page, app configurations
- `ValidationResult` type with error details
- Unit tests for valid/invalid schemas

**Dependencies**: Task 3  
**Acceptance Criteria**: 100% test coverage on validation logic

### [x] 5. Schema Loader Implementation

**Description**: Create SchemaLoader class to read and validate JSON files (Ref: Architecture §4.2)  
**Deliverables**:

- `SchemaLoader` class with `load()`, `validate()` methods
- File system operations with proper error handling
- Integration tests with fixture files

**Dependencies**: Tasks 3, 4  
**Acceptance Criteria**: Can load example schemas from docs/examples, proper error messages

### [x] 6. Custom Error Classes

**Description**: Implement error handling system (Ref: CLAUDE.md - Error Handling)  
**Deliverables**:

- `SchemaValidationError`, `GenerationError`, `ConfigurationError` classes
- Error context with file path and line numbers
- Unit tests for error scenarios

**Dependencies**: Task 2  
**Acceptance Criteria**: Errors provide actionable messages with context

### [x] 7. Configuration System

**Description**: Implement config loading with defaults (Ref: Architecture §8)  
**Deliverables**:

- `defineConfig()` helper function
- Config validation and merging logic
- Tests for various config scenarios

**Dependencies**: Tasks 3, 4  
**Acceptance Criteria**: Can load zeno.config.ts, applies defaults correctly

### [x] 8. Template Engine Setup

**Description**: Integrate Handlebars with custom helpers (Ref: Architecture §4.5)  
**Deliverables**:

- `TemplateEngine` class with helper registration
- Built-in helpers: case transformers, pluralisation
- Unit tests for template rendering

**Dependencies**: Task 2  
**Acceptance Criteria**: Can render templates with all helpers working

### [x] 9. Generator Base Class

**Description**: Abstract Generator class for all generators (Ref: Architecture §5)  
**Deliverables**:

- `Generator` abstract class with required methods
- `GeneratedFile` interface
- Unit tests for generator lifecycle

**Dependencies**: Tasks 3, 8  
**Acceptance Criteria**: Can extend and implement test generator

### [ ] 10. Generation Pipeline

**Description**: Core pipeline for running generators (Ref: Architecture §4.4)  
**Deliverables**:

- `GenerationPipeline` class with registration and execution
- Parallel generation support
- Integration tests with mock generators

**Dependencies**: Task 9  
**Acceptance Criteria**: Can register and run multiple generators in sequence

### [ ] 11. File System Utilities

**Description**: Safe file operations with validation  
**Deliverables**:

- Path validation to prevent traversal attacks
- Atomic file writes with backup
- Directory creation utilities
- Unit tests for edge cases

**Dependencies**: Task 6  
**Acceptance Criteria**: All file operations are safe and tested

### [ ] 12. Watch Mode Infrastructure

**Description**: File watching system for development (Ref: Requirements §10)  
**Deliverables**:

- Watcher class using chokidar
- Debounced change detection
- Schema change diffing
- Integration tests

**Dependencies**: Tasks 5, 10  
**Acceptance Criteria**: Detects changes and triggers incremental generation

### [ ] 13. Schema Change Detection

**Description**: Implement incremental generation logic  
**Deliverables**:

- `SchemaChange` type with change details
- Dependency graph for affected files
- Unit tests for various change scenarios

**Dependencies**: Task 12  
**Acceptance Criteria**: Only regenerates affected files on changes

### [ ] 14. Logging System

**Description**: Structured logging with levels  
**Deliverables**:

- Logger with debug/info/warn/error levels
- Context-aware logging
- Integration with CLI output

**Dependencies**: Task 2  
**Acceptance Criteria**: Logs are useful for debugging, respects verbosity settings

### [ ] 15. Core Package Integration Tests

**Description**: End-to-end tests for core functionality  
**Deliverables**:

- Test harness for full pipeline
- Fixture projects
- Performance benchmarks

**Dependencies**: Tasks 1-14  
**Acceptance Criteria**: Core package works end-to-end with example schemas

## Phase 2: UI Components & Generators (Tasks 16-31)

### [ ] 16. Templates Package

**Description**: Create @zeno/templates package with UI component library and Storybook (Ref: Architecture §5)  
**Deliverables**:

- Package scaffold with React, DaisyUI, React Hook Form dependencies
- All UI components (FormField, DataTable, Modal, etc.)
- Storybook configuration and stories for each component
- Handlebars template files for code generation
- Visual regression testing setup
- Package build and publish configuration

**Dependencies**: Task 15  
**Acceptance Criteria**: Package builds, Storybook runs, components are interactive and tested

### [ ] 17. Model Generator Package

**Description**: Create @zeno/generators/models package (Ref: Requirements §3.1)  
**Deliverables**:

- Package scaffold with dependencies
- Base structure for model generation

**Dependencies**: Task 15  
**Acceptance Criteria**: Package builds and exports ModelGenerator class

### [ ] 18. Drizzle Schema Generation

**Description**: Generate Drizzle ORM schemas from entities (Ref: Requirements §3.1)  
**Deliverables**:

- Drizzle schema templates
- Column type mapping
- Relationship handling
- Unit tests with fixtures

**Dependencies**: Task 17  
**Acceptance Criteria**: Generates valid Drizzle schemas for all column types

### [ ] 19. TypeScript Type Generation

**Description**: Generate TypeScript interfaces and types (Ref: Requirements §3.1)  
**Deliverables**:

- Base, Insert, Update, Select type variants
- Relationship typing
- Enum type generation
- Unit tests

**Dependencies**: Task 17  
**Acceptance Criteria**: Generated types compile without errors

### [ ] 20. Zod Schema Generation

**Description**: Generate Zod validation schemas (Ref: Requirements §3.1)  
**Deliverables**:

- Zod schema templates
- Validation rule mapping
- Custom error messages
- Unit tests

**Dependencies**: Task 17  
**Acceptance Criteria**: Validation works correctly for all rules

### [ ] 21. Migration Generator

**Description**: Auto-generate database migrations (Ref: Requirements §3.1)  
**Deliverables**:

- Migration file generation
- Schema diffing logic
- Rollback support
- Integration tests

**Dependencies**: Task 18  
**Acceptance Criteria**: Can generate and apply migrations

### [ ] 22. Component Generator Package

**Description**: Create @zeno/generators/components package using @zeno/templates (Ref: Requirements §3.2, Architecture §5)  
**Deliverables**:

- Package scaffold with @zeno/templates dependency
- Base generator structure
- Template loading from @zeno/templates
- Component composition system

**Dependencies**: Tasks 15, 16  
**Acceptance Criteria**: Package builds, can import and use @zeno/templates

### [ ] 23. Form Component Generation

**Description**: Generate accessible form components using @zeno/templates (Ref: Requirements §3.2, Architecture §5.2)  
**Deliverables**:

- Form generation using @zeno/templates components
- Multi-section form composition based on entity.ui.formSections
- Field visibility logic for create/edit modes
- Import statements for @zeno/templates
- Unit tests

**Dependencies**: Task 22  
**Acceptance Criteria**: Forms use @zeno/templates components, are WCAG compliant

### [ ] 24. Table Component Generation

**Description**: Generate data table components using @zeno/templates (Ref: Requirements §3.2, Architecture §5.3)  
**Deliverables**:

- Table generation using DataTable from @zeno/templates
- Column definition mapping from entity fields
- Configuration for all DataTable features
- Import statements for @zeno/templates
- Unit tests

**Dependencies**: Task 22  
**Acceptance Criteria**: Tables use @zeno/templates DataTable component

### [ ] 25. Modal Component Generation

**Description**: Generate entity management modals using @zeno/templates (Ref: Requirements §3.2, Architecture §5.1)  
**Deliverables**:

- Modal generation using Modal components from @zeno/templates
- Create/Edit/View modes with form integration
- Confirm dialogs using Confirm component
- Import statements for @zeno/templates
- Unit tests

**Dependencies**: Tasks 22, 23  
**Acceptance Criteria**: Modals use @zeno/templates components

### [ ] 26. Page Generator Package

**Description**: Create @zeno/generators/pages package (Ref: Requirements §3.3)  
**Deliverables**:

- Package scaffold with @zeno/templates dependency
- Page template structure

**Dependencies**: Task 15  
**Acceptance Criteria**: Package builds and exports PageGenerator

### [ ] 27. CRUD Page Generation

**Description**: Generate list/create/edit/view pages using @zeno/templates (Ref: Requirements §3.3, Architecture §5)  
**Deliverables**:

- List pages importing PageHeader, DataTable, Modal from @zeno/templates
- Integration of Alert, Loading, EmptyState components
- State management for modals and data
- Route generation
- Unit tests

**Dependencies**: Tasks 23-26  
**Acceptance Criteria**: Pages use @zeno/templates components consistently

### [ ] 28. Custom Page Generation

**Description**: Generate pages from JSON definitions using @zeno/templates sections (Ref: Requirements §8, Architecture §5)  
**Deliverables**:

- Page generation using section components from @zeno/templates
- Dynamic composition from JSON
- Import statements for all section types
- Unit tests for each section type

**Dependencies**: Task 26  
**Acceptance Criteria**: Can generate pages using @zeno/templates section components

### [ ] 29. API Generator Package

**Description**: Create @zeno/generators/api package (Ref: Requirements §3.4)  
**Deliverables**:

- Package scaffold
- API route templates

**Dependencies**: Task 15  
**Acceptance Criteria**: Package builds and exports ApiGenerator

### [ ] 30. CRUD API Generation

**Description**: Generate RESTful API routes (Ref: Requirements §3.4)  
**Deliverables**:

- CRUD route templates
- Validation middleware
- Type-safe responses
- Unit tests

**Dependencies**: Tasks 20, 29  
**Acceptance Criteria**: APIs handle all CRUD operations with validation

### [ ] 31. Authentication Integration

**Description**: Generate NextAuth configuration (Ref: Requirements §4.1)  
**Deliverables**:

- Auth route generation
- User table detection
- Session type generation
- Integration tests

**Dependencies**: Tasks 18, 30  
**Acceptance Criteria**: Authentication works with generated user tables

## Phase 3: CLI Implementation (Tasks 32-41)

### [ ] 32. CLI Package Setup

**Description**: Create @zeno/cli with oclif (Ref: Architecture §7)  
**Deliverables**:

- oclif project structure
- Base command class
- Package configuration

**Dependencies**: Task 15  
**Acceptance Criteria**: CLI runs with help command

### [ ] 33. Init Command

**Description**: Implement project initialisation with @zeno/templates (Ref: Requirements §5, Architecture §5.1)  
**Deliverables**:

- Interactive prompts with @clack/prompts
- Project scaffolding with NextJS structure
- @zeno/templates package installation
- Dependency installation (React Hook Form, Zod, etc.)
- Integration tests

**Dependencies**: Tasks 16, 32  
**Acceptance Criteria**: Can create new project with @zeno/templates ready to use

### [ ] 34. Generate Command

**Description**: Implement code generation command (Ref: Architecture §7)  
**Deliverables**:

- Generate command with flags
- Progress indicators
- Error handling
- Unit tests

**Dependencies**: Tasks 31, 32  
**Acceptance Criteria**: Generates all code types with proper output

### [ ] 35. Validate Command

**Description**: Schema validation command  
**Deliverables**:

- Validate command implementation
- Detailed error reporting
- Unit tests

**Dependencies**: Tasks 5, 32  
**Acceptance Criteria**: Provides clear validation errors with line numbers

### [ ] 36. Migrate Command

**Description**: Database migration command  
**Deliverables**:

- Migration execution
- Rollback support
- Status reporting
- Integration tests

**Dependencies**: Tasks 21, 32  
**Acceptance Criteria**: Can run and rollback migrations

### [ ] 37. Dev Command

**Description**: Development mode with watching  
**Deliverables**:

- Combined watch and generate
- HMR integration
- Unit tests

**Dependencies**: Tasks 12, 34  
**Acceptance Criteria**: Watches files and regenerates on changes

### [ ] 38. CLI Error Handling

**Description**: Consistent error output  
**Deliverables**:

- Error formatting
- Debug mode support
- Help suggestions

**Dependencies**: Tasks 6, 32  
**Acceptance Criteria**: All errors are actionable and well-formatted

### [ ] 39. CLI Configuration

**Description**: Config detection and loading  
**Deliverables**:

- Config file detection
- Environment variable support
- Default handling

**Dependencies**: Tasks 7, 32  
**Acceptance Criteria**: Finds and loads configuration correctly

### [ ] 40. Interactive Mode

**Description**: Enhanced interactive features  
**Deliverables**:

- Schema selection prompts
- Confirmation dialogs
- Progress animations

**Dependencies**: Task 32  
**Acceptance Criteria**: All interactions are smooth and intuitive

### [ ] 41. CLI Integration Tests

**Description**: End-to-end CLI testing  
**Deliverables**:

- Full command flow tests
- Output verification
- Error scenario coverage

**Dependencies**: Tasks 32-40  
**Acceptance Criteria**: All commands work in real scenarios

## Phase 4: Integration & Polish (Tasks 42-51)

### [ ] 42. Create Package

**Description**: Implement @zeno/create for npx usage with @zeno/templates (Ref: Requirements §5)  
**Deliverables**:

- Standalone create package
- Project templates with @zeno/templates included
- Quick start flow with component examples
- Storybook setup option

**Dependencies**: Tasks 16, 33  
**Acceptance Criteria**: `npx @zeno/create my-app` works smoothly with @zeno/templates

### [ ] 43. Navigation Generation

**Description**: Auto-generate navigation components with @zeno/templates (Ref: Requirements §4.2, Architecture §5.1)  
**Deliverables**:

- Navigation generation using PageHeader from @zeno/templates
- Breadcrumb generation from page hierarchy
- Auto-detection logic for page metadata
- Mobile navigation support
- Unit tests

**Dependencies**: Tasks 22, 24, 28  
**Acceptance Criteria**: Navigation uses @zeno/templates components

### [ ] 44. Email Configuration

**Description**: Email setup for authentication (Ref: Requirements §4.1)  
**Deliverables**:

- Nodemailer integration
- Verification templates
- Configuration validation

**Dependencies**: Tasks 7, 31  
**Acceptance Criteria**: Email verification works in generated apps

### [ ] 45. Seed Data Implementation

**Description**: Database seeding functionality  
**Deliverables**:

- Seed command
- Data generation from schemas
- Relationship handling

**Dependencies**: Tasks 18, 36  
**Acceptance Criteria**: Can seed all example data correctly

### [ ] 46. Performance Optimisation

**Description**: Meet performance targets through optimisation (Ref: Requirements §9)  
**Deliverables**:

- Parallel generation implementation
- @zeno/templates tree-shaking for smaller bundles
- Template caching implementation
- Benchmark suite

**Dependencies**: Task 41  
**Acceptance Criteria**: Meets all performance targets, minimal bundle size

### [ ] 47. Accessibility Validation

**Description**: Ensure WCAG compliance for @zeno/templates components (Ref: Requirements §3.2, Architecture §5.5)  
**Deliverables**:

- Accessibility tests in Storybook
- ARIA attribute validation
- Keyboard navigation testing
- Screen reader compatibility checks
- Component audit documentation

**Dependencies**: Tasks 16, 23-25  
**Acceptance Criteria**: All @zeno/templates components pass WCAG 2.1 AA checks

### [ ] 48. Documentation Site

**Description**: Create documentation with VitePress (Ref: Architecture §14.3)  
**Deliverables**:

- Documentation site setup
- API documentation
- @zeno/templates component reference
- Embedded Storybook for component demos
- Usage guides
- Examples

**Dependencies**: Task 41  
**Acceptance Criteria**: Comprehensive docs with live component playground

### [ ] 49. Example Projects

**Description**: Create example applications showcasing @zeno/templates  
**Deliverables**:

- Blog example with content listings
- SaaS starter with dashboard and CRUD
- E-commerce demo with advanced tables
- Standalone @zeno/templates showcase

**Dependencies**: Task 41  
**Acceptance Criteria**: Examples demonstrate all features, include Storybook

### [ ] 50. Testing Coverage

**Description**: Achieve >90% test coverage including @zeno/templates (Ref: Architecture §10)  
**Deliverables**:

- Missing test cases for generators
- @zeno/templates component unit tests
- Storybook interaction tests
- Visual regression tests
- Coverage reports
- CI integration

**Dependencies**: All previous tasks  
**Acceptance Criteria**: Coverage exceeds 90% across all packages

### [ ] 51. Release Preparation

**Description**: Prepare for public release  
**Deliverables**:

- NPM organisation setup
- CI/CD pipeline
- @zeno/templates published separately
- Security audit
- Launch materials

**Dependencies**: All previous tasks  
**Acceptance Criteria**: Ready for npm publish, @zeno/templates available standalone

## Notes

- Each task should have accompanying tests written first (TDD)
- Tasks within phases can sometimes be worked in parallel by different developers
- Performance benchmarks should be run after each generator implementation
- Accessibility testing should be continuous, not just Task 47
- Documentation should be updated as features are implemented
- @zeno/templates should be developed independently with Storybook before generator integration
- Visual regression testing should be set up early for @zeno/templates components
