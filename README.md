<div align="center">
 <img src="./assets/logo.svg" width="175" height="175" alt="Zeno Logo">
</div>

# Zeno Framework

Standalone Node module that generates production-ready NextJS applications from JSON schema definitions. Eliminates boilerplate development by automatically generating database models, UI components, pages, navigation, and API routes directly into standard NextJS project structure.

## Who is Zeno?

Zeno of Elea was a the Greek philosopher who believed that only one single entity exists that makes up all of reality (the JSON schemas), and rejected the existence of space, time, and motion (the code and infrastructure). In our case, Zeno rejects the existence of boilerplate code and scattered repeated variables, they only believe in the single entity that is JSON schemas. Our schemas are the only thing that is real, nothing else is real, code does not exist (or at least until you `zeno generate` it that is!).

## Tech Stack

**Generated Apps:** NextJS App Router + Drizzle ORM + Zod validation + DaisyUI styling + PostgreSQL + NextAuth

**Framework:** TypeScript + tsup + pnpm workspaces + Turborepo + oclif + Handlebars + Vitest + Biome

## Quick Start

```bash
# Create new project
npx @zeno/create my-app
cd my-app

# Or add to existing NextJS project
npm install -g @zeno/cli
zeno init --existing
```

## Clone & Setup

**HTTPS:**

```bash
git clone https://github.com/TandemCreativeDev/zeno.git
cd zeno
pnpm install
```

**SSH:**

```bash
git clone git@github.com:TandemCreativeDev/zeno.git
cd zeno
pnpm install
```

## Contributing

See [our guidances for contributing](CONTRIBUTING.md) to the project.

## Development

```bash
pnpm dev                    # Start development with watch mode
pnpm build                  # Build all packages
pnpm test                   # Run test suite
pnpm lint                   # Run Biome linter/formatter
```

## Usage

Define your entities, enums, and pages in JSON:

```
my-app/
├── zeno/
│   ├── entities/users.json
│   ├── enums/user_status.json
│   ├── pages/dashboard.json
│   └── app.json
└── zeno.config.ts
```

Generate your entire application:

```bash
zeno generate              # Generate all code
zeno generate --watch      # Watch mode for development
zeno migrate              # Run database migrations
zeno dev                  # Combined watch + dev server
```

## What Gets Generated

- **Database Models:** Drizzle schemas with TypeScript types and Zod validation
- **UI Components:** Accessible React forms, tables, and modals with DaisyUI
- **Pages:** CRUD pages and custom layouts from JSON definitions
- **API Routes:** RESTful endpoints with validation and type safety
- **Navigation:** Header/footer navigation auto-generated from page metadata
- **Authentication:** NextAuth setup with automatic user table detection

## Documentation

- [Functional Requirements](docs/REQUIREMENTS.md)
- [Architecture Specification](docs/ARCHITECTURE.md)
- [Implementation Plan](docs/PLAN.md)
- [Schema Templates](docs/templates/)
- [Working Examples](docs/examples/)

## License

MIT
