#!/usr/bin/env node

import { readFile, writeFile } from "fs/promises";
import { createHash } from "crypto";
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

interface Task {
  number: number;
  title: string;
  description: string;
  deliverables: string[];
  dependencies: string;
  definitionOfDone: string;
  phase: string;
  completed: boolean;
}

interface SyncStateItem {
  issueNumber: number;
  completed: boolean;
  lastSync: string;
  contentHash: string;
}

interface SyncState {
  [key: string]: SyncStateItem;
}

class GitHubIssueSync {
  private syncState: SyncState = {};

  async loadSyncState(): Promise<void> {
    try {
      const data = await readFile(SYNC_STATE_FILE, "utf8");
      this.syncState = JSON.parse(data);
    } catch (error) {
      // File doesn't exist yet, start with empty state
      this.syncState = {};
    }
  }

  async saveSyncState(): Promise<void> {
    await writeFile(SYNC_STATE_FILE, JSON.stringify(this.syncState, null, 2));
  }

  parsePlanFile(content: string): Task[] {
    const tasks: Task[] = [];
    const lines = content.split("\n");
    let currentPhase: string | null = null;

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
        let deliverables: string[] = [];
        let dependencies = "";
        let definitionOfDone = "";

        // Look ahead for task details
        for (let j = i + 1; j < lines.length; j++) {
          const nextLine = lines[j];

          // Stop at next task, phase, or notes section
          if (
            nextLine.startsWith("### [") ||
            nextLine.startsWith("## Phase") ||
            nextLine.startsWith("## Notes")
          ) {
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
                delivLine.startsWith("## Phase") ||
                delivLine.startsWith("## Notes")
              ) {
                break;
              }
              if (delivLine.trim().startsWith("-")) {
                deliverables.push(delivLine.trim().substring(1).trim());
              }
              // Check for dependencies and acceptance criteria in the deliverables section
              if (delivLine.includes("**Dependencies**:")) {
                dependencies = delivLine.split("**Dependencies**:")[1].trim();
              }
              if (delivLine.includes("**Acceptance Criteria**:")) {
                definitionOfDone = delivLine
                  .split("**Acceptance Criteria**:")[1]
                  .trim();
              }
            }
          } else if (nextLine.startsWith("**Dependencies**:")) {
            dependencies = nextLine.replace("**Dependencies**:", "").trim();
          } else if (nextLine.startsWith("**Acceptance Criteria**:")) {
            definitionOfDone = nextLine
              .replace("**Acceptance Criteria**:", "")
              .trim();
          }
        }

        if (currentPhase) {
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
    }

    return tasks;
  }

  extractPhaseLabel(phaseString: string): string {
    // Extract phase name from "Phase X: Name (Tasks Y-Z)" format
    const match = phaseString.match(/Phase \d+: (.+?) \(/);
    if (match) {
      return match[1].toLowerCase();
    }
    return phaseString.toLowerCase();
  }

  generateContentHash(task: Task): string {
    // Create a hash of the task content to detect changes
    const content = JSON.stringify({
      title: task.title,
      description: task.description,
      deliverables: task.deliverables,
      dependencies: task.dependencies,
      definitionOfDone: task.definitionOfDone,
      phase: task.phase,
    });
    return createHash("md5").update(content).digest("hex");
  }

  formatIssueBody(task: Task): string {
    // Extract phase number from "Phase X: Name (Tasks Y-Z)" format
    const phaseMatch = task.phase.match(/Phase (\d+):/);
    const phaseNumber = phaseMatch ? phaseMatch[1] : "Unknown";

    let body = `**Development Phase:** ${phaseNumber}\n\n`;

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
      // Convert task references to issue references
      let formattedDeps = task.dependencies
        // Handle "Tasks X, Y" format
        .replace(/Tasks (\d+(?:,\s*\d+)*)/g, (match, numbers) => {
          const issueNumbers = numbers
            .split(",")
            .map((n) => `#${n.trim()}`)
            .join(", ");
          return `Issues ${issueNumbers}`;
        })
        // Handle individual "Task X" format
        .replace(/Task (\d+)/g, "Issue #$1");

      body += `**Dependencies:** ${formattedDeps}\n\n`;
    }

    if (task.definitionOfDone) {
      body += `**Acceptance Criteria:** ${task.definitionOfDone}\n\n`;
    }

    body += `---\n*This issue was automatically generated from task #${task.number} in [Zeno's implementation plan](/${GITHUB_OWNER}/${GITHUB_REPO}/blob/main/docs/PLAN.md)*`;

    return body;
  }

  async createIssue(task: Task): Promise<any> {
    const title = task.title; // Remove "Task X:" prefix
    const body = this.formatIssueBody(task);
    const phaseLabel = this.extractPhaseLabel(task.phase);

    try {
      // Create the issue first
      const response = await octokit.rest.issues.create({
        owner: GITHUB_OWNER!,
        repo: GITHUB_REPO!,
        title,
        body,
        labels: ["zeno", phaseLabel],
      });

      // If the task is completed, immediately close the issue
      if (task.completed) {
        await octokit.rest.issues.update({
          owner: GITHUB_OWNER!,
          repo: GITHUB_REPO!,
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
        (error as Error).message
      );
      return null;
    }
  }

  async updateIssue(issueNumber: number, task: Task): Promise<void> {
    const title = task.title; // Remove "Task X:" prefix
    const body = this.formatIssueBody(task);
    const phaseLabel = this.extractPhaseLabel(task.phase);

    try {
      await octokit.rest.issues.update({
        owner: GITHUB_OWNER!,
        repo: GITHUB_REPO!,
        issue_number: issueNumber,
        title,
        body,
        labels: ["zeno", phaseLabel],
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
        (error as Error).message
      );
    }
  }

  async syncTasks(): Promise<void> {
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
            contentHash: this.generateContentHash(task),
            lastSync: new Date().toISOString(),
          };
        }
      } else {
        // Check for changes (status or content)
        const currentContentHash = this.generateContentHash(task);
        const statusChanged = existingIssue.completed !== task.completed;
        const contentChanged = existingIssue.contentHash !== currentContentHash;

        if (statusChanged || contentChanged) {
          await this.updateIssue(existingIssue.issueNumber, task);
          this.syncState[taskKey].completed = task.completed;
          this.syncState[taskKey].contentHash = currentContentHash;
          this.syncState[taskKey].lastSync = new Date().toISOString();

          if (contentChanged && !statusChanged) {
            console.log(
              `📝 Updated content for issue #${existingIssue.issueNumber}: ${task.title}`
            );
          }
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
