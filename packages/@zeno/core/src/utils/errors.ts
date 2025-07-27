/**
 * Custom error classes for the Zeno framework with context information
 */

/**
 * Error thrown when schema validation fails
 */
export class SchemaValidationError extends Error {
  constructor(
    message: string,
    public readonly filePath: string,
    public readonly lineNumber?: number
  ) {
    super(message);
    this.name = "SchemaValidationError";
  }
}

/**
 * Error thrown during code generation process
 */
export class GenerationError extends Error {
  constructor(
    message: string,
    public readonly generatorName: string,
    public readonly filePath?: string,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = "GenerationError";
  }
}

/**
 * Error thrown when configuration is invalid or missing
 */
export class ConfigurationError extends Error {
  constructor(
    message: string,
    public readonly configPath?: string,
    public readonly property?: string
  ) {
    super(message);
    this.name = "ConfigurationError";
  }
}

/**
 * Error thrown during file system operations
 */
export class FileSystemError extends Error {
  constructor(
    message: string,
    public readonly filePath: string,
    public readonly code: string,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = "FileSystemError";
  }
}
