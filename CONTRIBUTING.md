# Contributing to Zeno Framework

Thank you for your interest in contributing to Zeno! This guide will help you get started with the contribution process.

## Prerequisites

- Node.js 18+
- pnpm package manager
- Git

## Getting Started

### 1. Fork the Repository

1. Navigate to the [Zeno repository](https://github.com/TandemCreativeDev/zeno)
2. Click the "Fork" button in the top right corner
3. Select your GitHub account as the destination for the fork

### 2. Clone Your Fork

**HTTPS:**

```bash
git clone https://github.com/[YOUR_USERNAME]/zeno.git
cd zeno
```

**SSH:**

```bash
git clone git@github.com:[YOUR_USERNAME]/zeno.git
cd zeno
```

### 3. Set Up the Development Environment

```bash
pnpm install
pnpm build
```

### 4. Create a Branch

```bash
git checkout -b your-feature-name
```

### 5. Make Your Changes

- Follow the code standards outlined in [CLAUDE.md](CLAUDE.md)
- Write tests for new functionality
- Ensure your code passes validation:
  ```bash
  npx tsc --noEmit
  pnpm lint
  pnpm build
  pnpm test
  ```

### 6. Test CLI Changes (if applicable)

```bash
cd packages/cli
pnpm start generate --help
pnpm start init test-project
```

### 7. Commit Your Changes

Use conventional commits:

```bash
git add .
git commit -m "feat(core): add your feature description"
```

Format: `type(scope): description`

- **Types:** `feat`, `fix`, `docs`, `refactor`, `test`, `chore`
- **Scopes:** `core`, `cli`, `generators`, `create`

### 8. Push to Your Fork

```bash
git push origin your-feature-name
```

### 9. Create a Pull Request

1. Navigate to your fork on GitHub
2. Click "New Pull Request"
3. Select the base repository (your-org/zeno) and base branch (main)
4. Select your fork and feature branch
5. Fill out the pull request template

## Code Standards

For detailed development standards, see [CLAUDE.md](CLAUDE.md).

## Project Structure

- `/packages/@zeno/core` - Schema loading, validation, pipeline
- `/packages/@zeno/cli` - CLI implementation with oclif
- `/packages/@zeno/generators/*` - Code generators (models, components, pages, api)
- `/packages/@zeno/create` - Project scaffolding utilities
- `/examples/` - Example projects and configurations
- `/docs/` - Documentation and specifications

## Documentation

- [Functional Requirements](docs/REQUIREMENTS.md)
- [Architecture Specification](docs/ARCHITECTURE.md)
- [Implementation Plan](docs/PLAN.md)
- [Schema Templates](docs/templates/)
- [Working Examples](docs/examples/)

## Release Process

We use changesets for versioning:

```bash
pnpm changeset             # Create changeset for your changes
```

Maintainers will handle version bumping and publishing.

## Questions?

Check the documentation or open an issue for clarification.
