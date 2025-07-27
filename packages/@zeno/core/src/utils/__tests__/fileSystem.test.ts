import { constants } from "node:fs";
import { access, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { FileSystemError } from "../errors";
import {
  ensureDirectory,
  fileExists,
  safeJoin,
  safeReadFile,
  safeWriteFile,
  validatePath,
} from "../fileSystem";

describe("fileSystem", () => {
  let testDir: string;
  let workingDir: string;

  beforeEach(async () => {
    testDir = join(tmpdir(), `zeno-test-${Date.now()}-${Math.random()}`);
    workingDir = resolve(testDir);
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    try {
      await rm(testDir, { recursive: true });
    } catch {
      // Cleanup failure is not critical for tests
    }
  });

  describe("validatePath", () => {
    it("should allow valid paths within working directory", () => {
      const validPaths = [
        "file.txt",
        "subdir/file.txt",
        "./file.txt",
        "subdir/../file.txt",
      ];

      for (const path of validPaths) {
        expect(() => validatePath(path, workingDir)).not.toThrow();
      }
    });

    it("should reject path traversal attempts", () => {
      const maliciousPaths = [
        "../file.txt",
        "../../file.txt",
        "subdir/../../file.txt",
        "subdir/../../../file.txt",
      ];

      for (const path of maliciousPaths) {
        expect(() => validatePath(path, workingDir)).toThrow(FileSystemError);
        expect(() => validatePath(path, workingDir)).toThrow(
          /Path traversal detected/
        );
      }
    });

    it("should reject paths with null bytes", () => {
      const nullBytePaths = ["file\0.txt", "subdir/file\0.txt", "\0file.txt"];

      for (const path of nullBytePaths) {
        expect(() => validatePath(path, workingDir)).toThrow(FileSystemError);
        expect(() => validatePath(path, workingDir)).toThrow(
          /Null byte detected/
        );
      }
    });

    it("should return resolved absolute path for valid paths", () => {
      const result = validatePath("file.txt", workingDir);
      expect(result).toBe(join(workingDir, "file.txt"));
    });
  });

  describe("ensureDirectory", () => {
    it("should create directory if it doesn't exist", async () => {
      const dirPath = "test-dir";
      const fullPath = join(workingDir, dirPath);

      await ensureDirectory(dirPath, workingDir);

      await expect(access(fullPath, constants.F_OK)).resolves.not.toThrow();
    });

    it("should succeed if directory already exists", async () => {
      const dirPath = "existing-dir";
      const fullPath = join(workingDir, dirPath);

      await mkdir(fullPath);
      await expect(ensureDirectory(dirPath, workingDir)).resolves.not.toThrow();
    });

    it("should create nested directories", async () => {
      const dirPath = "nested/deep/dir";
      const fullPath = join(workingDir, dirPath);

      await ensureDirectory(dirPath, workingDir);

      await expect(access(fullPath, constants.F_OK)).resolves.not.toThrow();
    });

    it("should reject unsafe paths", async () => {
      await expect(ensureDirectory("../unsafe", workingDir)).rejects.toThrow(
        FileSystemError
      );
    });
  });

  describe("safeReadFile", () => {
    it("should read existing file content", async () => {
      const filePath = "test.txt";
      const content = "Hello, World!";
      const fullPath = join(workingDir, filePath);

      await writeFile(fullPath, content, "utf-8");

      const result = await safeReadFile(filePath, workingDir);
      expect(result).toBe(content);
    });

    it("should throw FileSystemError for non-existent file", async () => {
      await expect(
        safeReadFile("non-existent.txt", workingDir)
      ).rejects.toThrow(FileSystemError);
    });

    it("should reject unsafe paths", async () => {
      await expect(safeReadFile("../unsafe.txt", workingDir)).rejects.toThrow(
        FileSystemError
      );
    });
  });

  describe("safeWriteFile", () => {
    it("should write content to new file", async () => {
      const filePath = "new-file.txt";
      const content = "New content";

      await safeWriteFile(filePath, content, workingDir);

      const writtenContent = await safeReadFile(filePath, workingDir);
      expect(writtenContent).toBe(content);
    });

    it("should overwrite existing file with backup", async () => {
      const filePath = "existing-file.txt";
      const originalContent = "Original content";
      const newContent = "New content";
      const fullPath = join(workingDir, filePath);
      const backupPath = `${fullPath}.backup`;

      await writeFile(fullPath, originalContent, "utf-8");

      await safeWriteFile(filePath, newContent, workingDir, true);

      const writtenContent = await safeReadFile(filePath, workingDir);
      expect(writtenContent).toBe(newContent);

      // Backup should be cleaned up after successful write
      await expect(access(backupPath, constants.F_OK)).rejects.toThrow();
    });

    it("should create parent directories if needed", async () => {
      const filePath = "nested/deep/file.txt";
      const content = "Nested content";

      await safeWriteFile(filePath, content, workingDir);

      const writtenContent = await safeReadFile(filePath, workingDir);
      expect(writtenContent).toBe(content);
    });

    it("should write without backup when disabled", async () => {
      const filePath = "no-backup.txt";
      const originalContent = "Original";
      const newContent = "New";
      const fullPath = join(workingDir, filePath);

      await writeFile(fullPath, originalContent, "utf-8");

      await safeWriteFile(filePath, newContent, workingDir, false);

      const writtenContent = await safeReadFile(filePath, workingDir);
      expect(writtenContent).toBe(newContent);
    });

    it("should reject unsafe paths", async () => {
      await expect(
        safeWriteFile("../unsafe.txt", "content", workingDir)
      ).rejects.toThrow(FileSystemError);
    });
  });

  describe("fileExists", () => {
    it("should return true for existing file", async () => {
      const filePath = "existing.txt";
      const fullPath = join(workingDir, filePath);

      await writeFile(fullPath, "content", "utf-8");

      const exists = await fileExists(filePath, workingDir);
      expect(exists).toBe(true);
    });

    it("should return false for non-existent file", async () => {
      const exists = await fileExists("non-existent.txt", workingDir);
      expect(exists).toBe(false);
    });

    it("should reject unsafe paths", async () => {
      await expect(fileExists("../unsafe.txt", workingDir)).rejects.toThrow(
        FileSystemError
      );
    });
  });

  describe("safeJoin", () => {
    it("should join paths safely", () => {
      const result = safeJoin("base", "sub", "file.txt");
      expect(result).toBe(join("base", "sub", "file.txt"));
    });

    it("should normalise paths", () => {
      const result = safeJoin("base", "./sub", "file.txt");
      expect(result).toBe(join("base", "sub", "file.txt"));
    });

    it("should reject paths with traversal", () => {
      expect(() => safeJoin("base", "..", "file.txt")).toThrow(FileSystemError);
      expect(() => safeJoin("base", "sub", "..", "..", "file.txt")).toThrow(
        FileSystemError
      );
    });

    it("should handle empty path segments", () => {
      const result = safeJoin("base", "", "file.txt");
      expect(result).toBe(join("base", "file.txt"));
    });
  });

  describe("error scenarios", () => {
    it("should provide meaningful error messages", async () => {
      try {
        await safeReadFile("non-existent.txt", workingDir);
      } catch (error) {
        expect(error).toBeInstanceOf(FileSystemError);
        const fsError = error as FileSystemError;
        expect(fsError.filePath).toBe("non-existent.txt");
        expect(fsError.code).toBe("READ_FAILED");
        expect(fsError.message).toContain("Failed to read file");
      }
    });

    it("should include file path in all errors", async () => {
      const invalidPath = "../invalid";

      try {
        validatePath(invalidPath, workingDir);
      } catch (error) {
        expect(error).toBeInstanceOf(FileSystemError);
        const fsError = error as FileSystemError;
        expect(fsError.filePath).toBe(invalidPath);
      }
    });
  });
});
