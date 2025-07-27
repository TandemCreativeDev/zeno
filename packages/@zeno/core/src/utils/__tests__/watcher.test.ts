/**
 * Integration tests for the Watcher class
 */

import { mkdir, mkdtemp, rmdir, unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { DetailedSchemaChange } from "../../types/core";
import { createWatcher, type Watcher } from "../watcher";

describe("Watcher", () => {
  let tempDir: string;
  let watcher: Watcher;

  const mockEntitySchema = {
    tableName: "users",
    displayName: "Users",
    columns: {
      id: {
        dbConstraints: {
          type: "serial",
          primaryKey: true,
        },
      },
      email: {
        dbConstraints: {
          type: "varchar",
          length: 255,
          unique: true,
        },
        validation: {
          required: true,
          email: true,
        },
      },
    },
  };

  const mockAppSchema = {
    name: "Test App",
    description: "A test application for the watcher",
    url: "https://example.com",
  };

  beforeEach(async () => {
    // Create temporary directory
    tempDir = await mkdtemp(join(tmpdir(), "zeno-watcher-test-"));

    // Create schema directory structure
    await mkdir(join(tempDir, "entities"), { recursive: true });
    await mkdir(join(tempDir, "enums"), { recursive: true });
    await mkdir(join(tempDir, "pages"), { recursive: true });

    // Write initial schema files
    await writeFile(
      join(tempDir, "entities", "users.json"),
      JSON.stringify(mockEntitySchema, null, 2)
    );

    await writeFile(
      join(tempDir, "app.json"),
      JSON.stringify(mockAppSchema, null, 2)
    );
  });

  afterEach(async () => {
    if (watcher?.watching) {
      await watcher.stop();
    }

    try {
      // Clean up temporary directory
      await unlink(join(tempDir, "entities", "users.json"));
      await unlink(join(tempDir, "app.json"));
      await rmdir(join(tempDir, "entities"));
      await rmdir(join(tempDir, "enums"));
      await rmdir(join(tempDir, "pages"));
      await rmdir(tempDir);
    } catch {
      // Ignore cleanup errors
    }
  });

  it("should create a watcher instance", () => {
    watcher = createWatcher(tempDir);
    expect(watcher).toBeDefined();
    expect(watcher.watchedDirectory).toBe(tempDir);
    expect(watcher.watching).toBe(false);
  });

  it("should start watching and emit ready event", async () => {
    watcher = createWatcher(tempDir);

    const readyPromise = new Promise<void>((resolve) => {
      watcher.once("ready", resolve);
    });

    await watcher.start();
    await readyPromise;

    expect(watcher.watching).toBe(true);
  });

  it("should detect file creation", async () => {
    watcher = createWatcher(tempDir, { debounceMs: 50 });

    const changesPromise = new Promise<DetailedSchemaChange[]>((resolve) => {
      watcher.once("change", resolve);
    });

    await watcher.start();

    // Wait for ready
    await new Promise<void>((resolve) => {
      watcher.once("ready", resolve);
    });

    // Create new entity file
    const newEntity = {
      tableName: "posts",
      displayName: "Posts",
      columns: {
        id: {
          dbConstraints: {
            type: "serial",
            primaryKey: true,
          },
        },
        title: {
          dbConstraints: {
            type: "varchar",
            length: 255,
          },
        },
      },
    };

    await writeFile(
      join(tempDir, "entities", "posts.json"),
      JSON.stringify(newEntity, null, 2)
    );

    const changes = await changesPromise;
    expect(changes).toHaveLength(1);
    expect(changes[0]).toMatchObject({
      type: "created",
      schemaType: "entity",
      name: "posts",
    });
  });

  it("should detect file modification", async () => {
    watcher = createWatcher(tempDir, { debounceMs: 50 });

    const changesPromise = new Promise<DetailedSchemaChange[]>((resolve) => {
      watcher.once("change", resolve);
    });

    await watcher.start();

    // Wait for ready
    await new Promise<void>((resolve) => {
      watcher.once("ready", resolve);
    });

    // Modify existing entity file
    const modifiedEntity = {
      ...mockEntitySchema,
      columns: {
        ...mockEntitySchema.columns,
        name: {
          dbConstraints: {
            type: "varchar",
            length: 100,
          },
        },
      },
    };

    await writeFile(
      join(tempDir, "entities", "users.json"),
      JSON.stringify(modifiedEntity, null, 2)
    );

    const changes = await changesPromise;
    expect(changes).toHaveLength(1);
    expect(changes[0]).toMatchObject({
      type: "updated",
      schemaType: "entity",
      name: "users",
    });
  });

  it("should detect file deletion", async () => {
    watcher = createWatcher(tempDir, { debounceMs: 50 });

    const changesPromise = new Promise<DetailedSchemaChange[]>((resolve) => {
      watcher.once("change", resolve);
    });

    await watcher.start();

    // Wait for ready
    await new Promise<void>((resolve) => {
      watcher.once("ready", resolve);
    });

    // Delete entity file
    await unlink(join(tempDir, "entities", "users.json"));

    const changes = await changesPromise;
    expect(changes).toHaveLength(1);
    expect(changes[0]).toMatchObject({
      type: "deleted",
      schemaType: "entity",
      name: "users",
    });
  });

  it("should debounce multiple rapid changes", async () => {
    watcher = createWatcher(tempDir, { debounceMs: 100 });

    let changeCount = 0;
    watcher.on("change", () => {
      changeCount++;
    });

    await watcher.start();

    // Wait for ready
    await new Promise<void>((resolve) => {
      watcher.once("ready", resolve);
    });

    // Make multiple rapid changes
    for (let i = 0; i < 5; i++) {
      const entity = {
        ...mockEntitySchema,
        description: `Updated description ${i}`,
      };
      await writeFile(
        join(tempDir, "entities", "users.json"),
        JSON.stringify(entity, null, 2)
      );
      await new Promise((resolve) => setTimeout(resolve, 10)); // Small delay
    }

    // Wait for debounce to settle
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Should only get one change event due to debouncing
    expect(changeCount).toBe(1);
  });

  it("should handle errors gracefully", async () => {
    watcher = createWatcher("/nonexistent/path");

    await expect(watcher.start()).rejects.toThrow();
  });

  it("should stop watching and cleanup resources", async () => {
    watcher = createWatcher(tempDir);

    await watcher.start();

    // Wait for ready
    await new Promise<void>((resolve) => {
      watcher.once("ready", resolve);
    });

    expect(watcher.watching).toBe(true);

    await watcher.stop();

    expect(watcher.watching).toBe(false);
  });

  it("should ignore non-JSON files", async () => {
    watcher = createWatcher(tempDir, { debounceMs: 50 });

    let changesCalled = false;
    watcher.on("change", () => {
      changesCalled = true;
    });

    await watcher.start();

    // Wait for ready
    await new Promise<void>((resolve) => {
      watcher.once("ready", resolve);
    });

    // Create non-JSON file
    await writeFile(
      join(tempDir, "entities", "test.txt"),
      "This is not a JSON file"
    );

    // Wait to see if change event is triggered
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(changesCalled).toBe(false);
  });

  it("should respect custom ignored patterns", async () => {
    watcher = createWatcher(tempDir, {
      debounceMs: 50,
      ignored: ["**/ignored/**"],
    });

    let changesCalled = false;
    watcher.on("change", () => {
      changesCalled = true;
    });

    await watcher.start();

    // Wait for ready
    await new Promise<void>((resolve) => {
      watcher.once("ready", resolve);
    });

    // Create ignored directory and file
    await mkdir(join(tempDir, "entities", "ignored"), { recursive: true });
    await writeFile(
      join(tempDir, "entities", "ignored", "test.json"),
      JSON.stringify({ name: "test" }, null, 2)
    );

    // Wait to see if change event is triggered
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(changesCalled).toBe(false);
  });
});
