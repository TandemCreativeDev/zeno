# Zeno Framework: Functional Requirements Specification

## 1. Executive Summary

Zeno is a standalone Node module that generates production-ready NextJS applications from JSON schema definitions. The framework eliminates boilerplate development by automatically generating database models, UI components, pages, navigation, and API routes directly into standard NextJS project structure. Built with accessibility-first principles and complete type safety using Drizzle ORM, Zod validation, and DaisyUI components.

**Technology Stack:** NextJS App Router + Drizzle ORM + Zod validation + DaisyUI styling + PostgreSQL + NextAuth + React Hook Form

## 2. Input/Output Architecture

**Input Structure:**

```
zeno/
├── entities/        # Database entity definitions
├── enums/           # Enum type definitions
├── pages/           # Page route definitions
└── app.json         # Application configuration
```

**Output Structure:** Standard NextJS App Router project with generated code in `src/models/`, `src/components/`, and `src/app/`

[**Configuration Templates**](templates/schemas/)  
[**Configuration Working Examples**](examples/schemas)
[**Reusable UI Components**](templates/ui/)  
[**Generated Components Examples**](examples/components)

## 3. Code Generation Pipeline

### 3.1 Model Generation

- **Drizzle Schemas**: PostgreSQL schemas with constraints, indexes, and relationships
- **TypeScript Types**: Base, insert, update, and select variants with relationship typing
- **Zod Validation**: Client/server validation schemas with custom error messages
- **Migrations**: Auto-generated migration files for schema changes

### 3.2 Component Generation

- **Forms**: Auto-generated with validation, sections, and field visibility controls
- **Tables**: Data tables with sorting, filtering, pagination, and bulk actions
- **Modals**: Entity management dialogs
- **Navigation**: Header, footer, and mobile navigation from page definitions

#### Form Component Architecture

Forms are generated as **composite components** using a standardised set of UI building blocks. The wrapper of the generated component is a form element containing:

- Multiple [Fieldset components](templates/ui/Fieldset.tsx) for each data entry section
- Multiple [FormField components](templates/ui/FormField.tsx) is a universal field component handling ALL input types
- A standardised set of form buttons in [FormActions](templates/ui/FormActions.tsx)

An examples of the generated components is this [UsersForm component](examples/components/user/UserForm.tsx).

**Required UI Components for Forms:**

1. **FormField Component**

   - Props: name, label, type, required, placeholder, helpText, validation, register, errors
   - Supports: text, email, tel, number, date, datetime-local, select, textarea, checkbox, file
   - Built-in validation integration with react-hook-form
   - Accessibility: proper label association, aria-describedby for help/errors, aria-required

2. **Fieldset Component**

   - Props: legend, children, columns (1-3), className
   - Responsive grid layout
   - Semantic HTML with fieldset/legend elements

3. **FormActions Component**

   - Props: mode, loading, onCancel, onReset, submitText
   - Loading states with spinner
   - Responsive layout

#### Table Component Architecture

Tables are generated using the full-featured data table with sorting, filtering, search [**DataTable component**](templates/ui/DataTable.tsx) with column definitions. An examples of the generated components is this [UsersTable component](examples/components/user/UserTable.tsx).

**Required UI Components for Tables:**

1. [**DataTable Component**](templates/ui/DataTable.tsx)

   - Props: data, columns, searchFields, sortField, sortOrder, onEdit, onDelete, onView, loading, title
   - Column sorting with visual indicators
   - Global search across specified fields
   - Action buttons for CRUD operations
   - Loading states
   - Item count display

2. [**TableCell Component**](templates/ui/TableCell.tsx)

   - Handles cell formatting
   - Props: value, formatter, prefix, suffix
   - Formatters: currency, date, datetime, boolean, text
   - Null/undefined handling

**Accessibility Requirements**:

- WCAG 2.1 AA compliance
- Semantic HTML structure (form, fieldset, legend, label, table, thead, tbody)
- Minimal div nesting, use sparingly only when needed
- ARIA attributes (aria-labelledby, aria-describedby, aria-required, role="alert")
- Keyboard navigation support (tab order, enter/space activation)
- Screen reader compatibility (proper labels, live regions)
- User motion preferences detection
- Focus management (visible focus states, focus trapping in modals)
- Live announcements for dynamic content
- Skip to main content link

### 3.3 Page Generation

- **CRUD Pages**: List, create, edit, and view pages for each entity
- **Custom Pages**: Composed from section types (hero, stats, tables, content)
- **Authentication Pages**: Auto-generated signin/signup/profile pages
- **Layouts**: Root layout with integrated navigation

### 3.4 API Generation

- **CRUD Routes**: RESTful API routes for all entities with enable/disable controls
- **Authentication Routes**: NextAuth integration with automatic user table detection
- **Validation Middleware**: Server-side validation using generated Zod schemas
- **Type Safety**: Fully typed API responses and request bodies

## 4. Opinionated Features

### 4.1 Authentication Integration

- **Auto-Detection**: Automatically identifies user tables and generates NextAuth configuration
- **Generated Pages**: `/signin`, `/signup`, `/profile` routes created automatically
- **Route Protection**: Automatic protection based on page auth requirements
- **Session Management**: Type-safe session handling with user data
- **Automated emailing**: Verification on signup

### 4.2 Navigation System

- **Page-Driven**: Navigation structure generated from individual page definitions
- **Auto-Detection**: Header and footer navigation built from page metadata
- **Asset Detection**: `icon.svg` or `logo.svg` automatically detected from `app/` or `public/` folders

### 4.3 Smart Defaults

- **Form Sections**: Intelligent grouping of related fields using Fieldset components
- **Field Visibility**: Context-aware show/hide controls for create/edit forms
- **Relationship Detection**: Automatic foreign key and many-to-many relationship handling
- **Generation Controls**: Per-entity controls for form/table/API/page generation
- **Validation Integration**: Automatic react-hook-form + Zod integration

## 5. CLI Interface

```bash
# Project Setup
zeno init [project-name]          # Create new NextJS project with Zeno
zeno init --existing              # Add Zeno to existing NextJS project

# Code Generation
zeno generate                     # Generate all code from schemas
zeno generate --watch             # Watch mode for development
zeno generate --models            # Models only
zeno generate --components        # Components only
zeno generate --pages             # Pages only
zeno generate --api               # API routes only

# Development
zeno dev                          # Start with watching enabled
zeno validate                     # Validate schema files
zeno migrate                      # Generate and run migrations
zeno seed                         # Run seed data
```

## 6. Framework Configuration

[**Core Config**](examples/zeno.config.ts)

Key configuration options:

- **Schema Directory**: Default `./zeno`
- **Output Directory**: Default `./src`
- **Database**: PostgreSQL connection and migration settings
- **Generation Controls**: Enable/disable specific generators
- **Development**: Watch mode and verbose logging

## 7. Entity Configuration

[**Entity Template**](templates/schemas/entity.json)  
[**Entity Examples**](examples/schemas/entities/)

Key features:

- **Generation Controls**: Per-entity enable/disable for forms, tables, APIs, pages
- **Field Configuration**: Database constraints, validation rules, and UI metadata
- **Relationships**: Foreign keys and associations with automatic detection
- **Form Sections**: Grouped fields with collapsible sections
- **Field Visibility**: Different fields for create/edit forms and list/detail views
- **Seed Data**: Development data for rapid prototyping

## 8. Page System

[**Page Template**](templates/schemas/page.json)  
[**Page Examples**](examples/schemas/pages/)

**Section Types:**

- **Hero**: Header sections with title/subtitle
- **Stats**: Metric displays with database queries
- **Table**: Entity data with filtering and display options (uses [DataTable component](templates/ui/DataTable.tsx))
- **Content**: Markdown content blocks
- **Custom**: Custom component integration

**Navigation Integration:** Pages define their own header/footer placement, eliminating centralised navigation configuration.

## 9. Performance & Quality

**Performance Targets:**

- < 2s complete application generation (50 entities)
- < 30s NextJS build time
- Incremental generation for schema changes
- Optimised bundle sizes through component reuse

**Code Quality:**

- TypeScript strict mode compliance
- ESLint and Prettier integration
- Accessibility validation (axe-core integration)
- Generated test scaffolding (optional)
- Component reusability through shared UI components

## 10. Migration & Development

**Schema Evolution:**

- Automatic migration generation from schema changes
- Data preservation during updates
- Rollback support for safety

**Development Experience:**

- Hot reload integration with NextJS dev server
- Comprehensive error messages with schema validation
- Debug mode with detailed generation reports
- Dry-run capability for previewing changes
- Component preview in Storybook

## 11. Security Requirements

**Input Security:**

- Schema sanitisation to prevent injection attacks
- File path validation within project boundaries
- Secure template rendering without code execution

**Generated Code Security:**

- SQL injection prevention via Drizzle ORM prepared statements
- XSS protection with automatic HTML escaping
- CSRF protection via NextJS built-in security
- Route protection with NextAuth session management
- Form validation on both client and server

## 12. Documentation and Developer Resources

**Auto-Generated Documentation:**

- API documentation from generated routes
- Component documentation with usage examples
- Schema reference documentation
- UI component library documentation

**Developer Resources:**

- Interactive CLI tutorial for first-time setup
- Best practices guide for schema design
- Troubleshooting guide for common issues
- Migration guide for schema evolution
- UI component customisation guide
