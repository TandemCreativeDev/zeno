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

Run the sync script:

```bash
pnpm sync-issues
```

## What it does

### First Run

- Parses all tasks from `docs/PLAN.md`
- Creates GitHub issues for all uncompleted tasks (those marked with `[ ]`)
- Adds labels: `zeno-task` and `phase-{phase-name}`
- Stores sync state in `.github-sync-state.json`

### Subsequent Runs

- Checks for status changes in tasks
- Closes GitHub issues when tasks are marked complete (`[x]`)
- Updates issue content if task details change
- Maintains sync state

## Issue Format

Each GitHub issue includes:

- **Title**: `Task {number}: {title}`
- **Body**: Formatted with phase, description, deliverables, dependencies, and definition of done
- **Labels**: `zeno-task`, `phase-{phase-name}`
- **State**: Open for incomplete tasks, closed for completed tasks

## Sync State

The script maintains a `.github-sync-state.json` file (gitignored) that tracks:

- Which tasks have corresponding GitHub issues
- Issue numbers for each task
- Last sync timestamps
- Completion status

## Example Output

```
🔄 Syncing tasks with GitHub issues...

📋 Found 50 tasks in plan file

✅ Created issue #123: Task 9: Generator Base Class
✅ Created issue #124: Task 10: Generation Pipeline
✅ Closed issue #120: Task 6: Custom Error Classes

✨ Sync completed!

📊 Summary:
   Total tasks: 50
   GitHub issues: 45
   Completed: 8
   Open: 37
```

## Troubleshooting

- **Authentication Error**: Check your `GITHUB_TOKEN` is valid and has `repo` scope
- **Repository Not Found**: Verify `GITHUB_OWNER` and `GITHUB_REPO` are correct
- **Rate Limiting**: The script respects GitHub API rate limits automatically
- **Parsing Issues**: Ensure `docs/PLAN.md` follows the expected format with `### [x]` or `### [ ]` task headers
