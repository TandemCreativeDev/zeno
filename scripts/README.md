# GitHub Issue Sync Script

This script automatically syncs tasks from `docs/PLAN.md` with GitHub issues.

## Setup

1. **Create a GitHub Personal Access Token**

   - Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Generate a new token with `repo` scope
   - Copy the token

2. **Configure Environment Variables**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` and add your values:

   ```env
   GITHUB_TOKEN=ghp_your_token_here
   GITHUB_OWNER=your-username
   GITHUB_REPO=your-repo-name
   ```

3. **Install Dependencies**
   ```bash
   pnpm install
   ```

## Usage

### Initial Sync

Run the sync script to create all GitHub issues:

```bash
pnpm sync-issues
```

### Regular Sync

After the initial setup, just run the sync script to update issue status:

```bash
pnpm sync-issues
```

## What it does

### First Run

- Parses all tasks from `docs/PLAN.md`
- Creates GitHub issues for ALL tasks (both completed and uncompleted)
- Immediately closes issues for completed tasks (those marked with `[x]`)
- Adds labels: `zeno` and clean phase names (e.g., "foundation", "generators")
- Stores sync state in `.github-sync-state.json`

### Subsequent Runs

- Checks for status changes in tasks
- Closes GitHub issues when tasks are marked complete (`[x]`)
- Updates issue content if task details change
- Maintains sync state

## Issue Format

Each GitHub issue includes:

- **Title**: Clean task title (e.g., "Generator Base Class")
- **Body**:
  - **Development Phase**: Just the phase number (e.g., "1", "2", "3", "4")
  - Description, deliverables, dependencies (as issue references like "Issue #1, #3"), and acceptance criteria
  - Footer with link to Zeno's implementation plan
- **Labels**: `zeno`, phase name (e.g., "foundation", "generators", "cli implementation", "integration & polish")
- **State**: Open for incomplete tasks, closed for completed tasks

## Phase Label Colors

- **foundation**: Blue (#0052CC)
- **generators**: Green (#0E8A16)
- **cli implementation**: Red (#D93F0B)
- **integration & polish**: Purple (#5319E7)

## Sync State

The script maintains a `.github-sync-state.json` file (gitignored) that tracks:

- Which tasks have corresponding GitHub issues
- Issue numbers for each task
- Last sync timestamps
- Completion status

## Example Output

### Sync Script Output

```
🔄 Syncing tasks with GitHub issues...

📋 Found 50 tasks in plan file

✅ Created and closed issue #1: Monorepo Setup
✅ Created and closed issue #2: Core Package Scaffold
...
✅ Created and closed issue #8: Template Engine Setup
✅ Created issue #9: Generator Base Class
✅ Created issue #10: Generation Pipeline
...

✨ Sync completed!

📊 Summary:
   Total tasks: 50
   GitHub issues: 50
   Completed: 8
   Open: 42
```

## Troubleshooting

- **Authentication Error**: Check your `GITHUB_TOKEN` is valid and has `repo` scope
- **Repository Not Found**: Verify `GITHUB_OWNER` and `GITHUB_REPO` are correct
- **Rate Limiting**: The script respects GitHub API rate limits automatically
- **Parsing Issues**: Ensure `docs/PLAN.md` follows the expected format with `### [x]` or `### [ ]` task headers
