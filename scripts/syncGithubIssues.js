#!/usr/bin/env node

import { readFile, writeFile } from "fs/promises";
import { Octokit } from "@octokit/rest";
import { config } from "dotenv";

// Load environment variables
config();

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_OWNER = process.env.GITHUB_OWNER;
const GITHUB_REPO = process.env.GITHUB_REPO;
const PLAN_FILE = "docs/PLAN.md";
const SYNC_STATE_FILE = ".github-sync-state.json";

if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
  console.error("Missing required environment variables:");
  console.error("- GITHUB_TOKEN: Your GitHub personal access token");
  console.error("- GITHUB_OWNER: GitHub username/organization");
  console.error("- GITHUB_REPO: Repository name");
  process.exit(1);
}

const octokit = new Octokit({ auth: GITHUB_TOKEN });

class GitHubIssueSync {
  constructor() {
    this.syncState = {};
  }

  async loadSyncState() {
    try {
      const data = await readFile(SYNC_STATE_FILE, "utf8");
      this.syncState = JSON.parse(data);
    } catch (error) {
      // File doesn't exist yet, start with empty state
      this.syncState = {};
    }
  }

  async saveSyncState() {
    await writeFile(SYNC_STATE_FILE, JSON.stringify(this.syncState, null, 2));
  }

  parsePlanFile(content) {
    const tasks = [];
    const lines = content.split("\n");
    let currentPhase = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Detect phase headers
      if (line.startsWith("## Phase")) {
        currentPhase = line.replace("## ", "").trim();
        continue;
      }

      // Detect task headers
      const taskMatch = line.match(/^### \[([ x])\] (\d+)\. (.+)$/);
      if (taskMatch) {
        const [, completed, taskNumber, title] = taskMatch;
        const isCompleted = completed === "x";

        // Extract task details
        let description = "";
        let deliverables = [];
        let dependencies = "";
        let definitionOfDone = "";

        // Look ahead for task details
        for (let j = i + 1; j < lines.length; j++) {
          const nextLine = lines[j];

          // Stop at next task or phase
          if (nextLine.startsWith("### [") || nextLine.startsWith("## Phase")) {
            break;
          }

          if (nextLine.startsWith("**Description**:")) {
            description = nextLine.replace("**Description**:", "").trim();
          } else if (nextLine.startsWith("**Deliverables**:")) {
            // Collect deliverables until next section
            for (let k = j + 1; k < lines.length; k++) {
              const delivLine = lines[k];
              if (
                delivLine.startsWith("**") ||
                delivLine.startsWith("### [") ||
                delivLine.startsWith("## Phase")
              ) {
                break;
              }
              if (delivLine.trim().startsWith("-")) {
                deliverables.push(delivLine.trim().substring(1).trim());
              }
            }
          } else if (nextLine.startsWith("**Dependencies**:")) {
            dependencies = nextLine.replace("**Dependencies**:", "").trim();
          } else if (nextLine.startsWith("**Definition of Done**:")) {
            definitionOfDone = nextLine
              .replace("**Definition of Done**:", "")
              .trim();
          }
        }

        tasks.push({
          number: parseInt(taskNumber),
          title,
          description,
          deliverables,
          dependencies,
          definitionOfDone,
          phase: currentPhase,
          completed: isCompleted,
        });
      }
    }

    return tasks;
  }

  formatIssueBody(task) {
    let body = `**Phase:** ${task.phase}\n\n`;

    if (task.description) {
      body += `**Description:** ${task.description}\n\n`;
    }

    if (task.deliverables.length > 0) {
      body += `**Deliverables:**\n`;
      task.deliverables.forEach((deliverable) => {
        body += `- ${deliverable}\n`;
      });
      body += "\n";
    }

    if (task.dependencies) {
      body += `**Dependencies:** ${task.dependencies}\n\n`;
    }

    if (task.definitionOfDone) {
      body += `**Definition of Done:** ${task.definitionOfDone}\n\n`;
    }

    body += `---\n*This issue was automatically generated from docs/PLAN.md*`;

    return body;
  }

  async createIssue(task) {
    const title = `Task ${task.number}: ${task.title}`;
    const body = this.formatIssueBody(task);

    try {
      // Create the issue first
      const response = await octokit.rest.issues.create({
        owner: GITHUB_OWNER,
        repo: GITHUB_REPO,
        title,
        body,
        labels: [
          "zeno-task",
          `phase-${task.phase.toLowerCase().replace(/\s+/g, "-")}`,
        ],
      });

      // If the task is completed, immediately close the issue
      if (task.completed) {
        await octokit.rest.issues.update({
          owner: GITHUB_OWNER,
          repo: GITHUB_REPO,
          issue_number: response.data.number,
          state: "closed",
        });
        console.log(
          `✅ Created and closed issue #${response.data.number}: ${title}`
        );
      } else {
        console.log(`✅ Created issue #${response.data.number}: ${title}`);
      }

      return response.data;
    } catch (error) {
      console.error(
        `❌ Failed to create issue for task ${task.number}:`,
        error.message
      );
      return null;
    }
  }

  async updateIssue(issueNumber, task) {
    const title = `Task ${task.number}: ${task.title}`;
    const body = this.formatIssueBody(task);

    try {
      await octokit.rest.issues.update({
        owner: GITHUB_OWNER,
        repo: GITHUB_REPO,
        issue_number: issueNumber,
        title,
        body,
        state: task.completed ? "closed" : "open",
      });

      const status = task.completed ? "closed" : "updated";
      console.log(
        `✅ ${
          status.charAt(0).toUpperCase() + status.slice(1)
        } issue #${issueNumber}: ${title}`
      );
    } catch (error) {
      console.error(
        `❌ Failed to update issue #${issueNumber}:`,
        error.message
      );
    }
  }

  async syncTasks() {
    console.log("🔄 Syncing tasks with GitHub issues...\n");

    // Load current sync state
    await this.loadSyncState();

    // Parse the plan file
    const planContent = await readFile(PLAN_FILE, "utf8");
    const tasks = this.parsePlanFile(planContent);

    console.log(`📋 Found ${tasks.length} tasks in plan file\n`);

    // Process each task
    for (const task of tasks) {
      const taskKey = `task-${task.number}`;
      const existingIssue = this.syncState[taskKey];

      if (!existingIssue) {
        // Create new issue for ALL tasks (both completed and uncompleted)
        const issue = await this.createIssue(task);
        if (issue) {
          this.syncState[taskKey] = {
            issueNumber: issue.number,
            completed: task.completed,
            lastSync: new Date().toISOString(),
          };
        }
      } else {
        // Update existing issue if status changed
        const statusChanged = existingIssue.completed !== task.completed;

        if (statusChanged) {
          await this.updateIssue(existingIssue.issueNumber, task);
          this.syncState[taskKey].completed = task.completed;
          this.syncState[taskKey].lastSync = new Date().toISOString();
        }
      }
    }

    // Save updated sync state
    await this.saveSyncState();

    console.log("\n✨ Sync completed!");

    // Print summary
    const totalIssues = Object.keys(this.syncState).length;
    const completedTasks = tasks.filter((t) => t.completed).length;
    const openIssues = totalIssues - completedTasks;

    console.log(`\n📊 Summary:`);
    console.log(`   Total tasks: ${tasks.length}`);
    console.log(`   GitHub issues: ${totalIssues}`);
    console.log(`   Completed: ${completedTasks}`);
    console.log(`   Open: ${openIssues}`);
  }
}

// Run the sync
const sync = new GitHubIssueSync();
sync.syncTasks().catch(console.error);
