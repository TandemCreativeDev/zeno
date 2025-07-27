import { constants } from "node:fs";
import {
  access,
  mkdir,
  readFile,
  rename,
  unlink,
  writeFile,
} from "node:fs/promises";
import { dirname, join, normalize, relative, resolve } from "node:path";

import { FileSystemError } from "./errors";

/**
 * Validates that a path is safe and within allowed boundaries
 * @param filePath - Path to validate
 * @param workingDir - Working directory to validate against
 * @returns Resolved safe path
 * @throws {FileSystemError} When path is unsafe
 */
export function validatePath(filePath: string, workingDir: string): string {
  const normalisedPath = normalize(filePath);
  const resolvedPath = resolve(workingDir, normalisedPath);
  const resolvedWorkingDir = resolve(workingDir);

  const relativePath = relative(resolvedWorkingDir, resolvedPath);

  if (relativePath.startsWith("..") || relativePath.includes("..")) {
    throw new FileSystemError(
      `Path traversal detected: ${filePath}`,
      filePath,
      "PATH_TRAVERSAL"
    );
  }

  if (normalisedPath.includes("\0")) {
    throw new FileSystemError(
      `Null byte detected in path: ${filePath}`,
      filePath,
      "NULL_BYTE"
    );
  }

  return resolvedPath;
}

/**
 * Ensures a directory exists, creating it if necessary
 * @param dirPath - Directory path to ensure
 * @param workingDir - Working directory for validation
 * @throws {FileSystemError} On file system errors
 */
export async function ensureDirectory(
  dirPath: string,
  workingDir: string
): Promise<void> {
  const safePath = validatePath(dirPath, workingDir);

  try {
    await access(safePath, constants.F_OK);
  } catch {
    try {
      await mkdir(safePath, { recursive: true });
    } catch (error) {
      throw new FileSystemError(
        `Failed to create directory: ${dirPath}`,
        dirPath,
        "MKDIR_FAILED",
        error instanceof Error ? error : undefined
      );
    }
  }
}

/**
 * Safely reads a file with path validation
 * @param filePath - File path to read
 * @param workingDir - Working directory for validation
 * @returns File contents as string
 * @throws {FileSystemError} On file system errors
 */
export async function safeReadFile(
  filePath: string,
  workingDir: string
): Promise<string> {
  const safePath = validatePath(filePath, workingDir);

  try {
    return await readFile(safePath, "utf-8");
  } catch (error) {
    throw new FileSystemError(
      `Failed to read file: ${filePath}`,
      filePath,
      "READ_FAILED",
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Atomically writes a file with backup and validation
 * @param filePath - File path to write
 * @param content - Content to write
 * @param workingDir - Working directory for validation
 * @param createBackup - Whether to create a backup of existing file
 * @throws {FileSystemError} On file system errors
 */
export async function safeWriteFile(
  filePath: string,
  content: string,
  workingDir: string,
  createBackup = true
): Promise<void> {
  const safePath = validatePath(filePath, workingDir);
  const tempPath = `${safePath}.tmp`;
  const backupPath = `${safePath}.backup`;

  try {
    await ensureDirectory(dirname(safePath), workingDir);

    let hasExistingFile = false;
    try {
      await access(safePath, constants.F_OK);
      hasExistingFile = true;
    } catch {
      // File doesn't exist, which is fine
    }

    if (hasExistingFile && createBackup) {
      try {
        await rename(safePath, backupPath);
      } catch (error) {
        throw new FileSystemError(
          `Failed to create backup: ${filePath}`,
          filePath,
          "BACKUP_FAILED",
          error instanceof Error ? error : undefined
        );
      }
    }

    try {
      await writeFile(tempPath, content, "utf-8");
      await rename(tempPath, safePath);

      if (hasExistingFile && createBackup) {
        try {
          await unlink(backupPath);
        } catch {
          // Backup cleanup failure is not critical
        }
      }
    } catch (error) {
      try {
        await unlink(tempPath);
      } catch {
        // Temp file cleanup failure is not critical
      }

      if (hasExistingFile && createBackup) {
        try {
          await rename(backupPath, safePath);
        } catch {
          // Restore failure is critical but we're already in error state
        }
      }

      throw new FileSystemError(
        `Failed to write file: ${filePath}`,
        filePath,
        "WRITE_FAILED",
        error instanceof Error ? error : undefined
      );
    }
  } catch (error) {
    if (error instanceof FileSystemError) {
      throw error;
    }
    throw new FileSystemError(
      `Unexpected error writing file: ${filePath}`,
      filePath,
      "UNKNOWN_ERROR",
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Checks if a file exists safely
 * @param filePath - File path to check
 * @param workingDir - Working directory for validation
 * @returns True if file exists, false otherwise
 * @throws {FileSystemError} On path validation errors
 */
export async function fileExists(
  filePath: string,
  workingDir: string
): Promise<boolean> {
  const safePath = validatePath(filePath, workingDir);

  try {
    await access(safePath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Safely joins paths and validates the result
 * @param basePath - Base path
 * @param paths - Additional path segments
 * @returns Safely joined path
 * @throws {FileSystemError} On path validation errors
 */
export function safeJoin(basePath: string, ...paths: string[]): string {
  // Check for path traversal in individual segments before joining
  for (const path of paths) {
    if (path.includes("..")) {
      throw new FileSystemError(
        `Path traversal detected in path segment: ${path}`,
        path,
        "PATH_TRAVERSAL"
      );
    }
  }

  const joinedPath = join(basePath, ...paths);
  const normalisedPath = normalize(joinedPath);
  const baseName = normalize(basePath);

  // Double-check that the result doesn't escape the base path
  const relativePath = relative(baseName, normalisedPath);
  if (relativePath.startsWith("..")) {
    throw new FileSystemError(
      `Path traversal detected in joined path: ${joinedPath}`,
      joinedPath,
      "PATH_TRAVERSAL"
    );
  }

  return normalisedPath;
}
