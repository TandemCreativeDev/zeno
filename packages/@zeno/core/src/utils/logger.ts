/**
 * @fileoverview Structured logging system with context-aware functionality
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogEntry {
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  timestamp?: Date;
}

export interface LoggerOptions {
  level?: LogLevel;
  verbose?: boolean;
  context?: Record<string, unknown>;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/**
 * Structured logger with contextual information and level filtering
 */
export class Logger {
  protected readonly level: LogLevel;
  protected readonly verbose: boolean;
  protected readonly context: Record<string, unknown>;

  constructor(options: LoggerOptions = {}) {
    this.level = options.level ?? "info";
    this.verbose = options.verbose ?? false;
    this.context = options.context ?? {};
  }

  /**
   * Create a child logger with additional context
   */
  child(context: Record<string, unknown>): Logger {
    return new Logger({
      level: this.level,
      verbose: this.verbose,
      context: { ...this.context, ...context },
    });
  }

  /**
   * Log debug message
   */
  debug(message: string, context?: Record<string, unknown>): void {
    this.log("debug", message, context);
  }

  /**
   * Log info message
   */
  info(message: string, context?: Record<string, unknown>): void {
    this.log("info", message, context);
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: Record<string, unknown>): void {
    this.log("warn", message, context);
  }

  /**
   * Log error message
   */
  error(message: string, context?: Record<string, unknown>): void {
    this.log("error", message, context);
  }

  /**
   * Log an error object with stack trace
   */
  logError(error: Error, context?: Record<string, unknown>): void {
    const errorContext = {
      ...context,
      error: {
        name: error.name,
        message: error.message,
        stack: this.verbose ? error.stack : undefined,
      },
    };
    this.log("error", error.message, errorContext);
  }

  private log(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>
  ): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry: LogEntry = {
      level,
      message,
      context: { ...this.context, ...context },
      timestamp: new Date(),
    };

    this.output(entry);
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.level];
  }

  private output(entry: LogEntry): void {
    const timestamp =
      entry.timestamp?.toISOString() ?? new Date().toISOString();
    const contextStr = this.formatContext(entry.context);
    const prefix = this.verbose
      ? `[${timestamp}] ${entry.level.toUpperCase()}:`
      : `${entry.level.toUpperCase()}:`;

    const fullMessage = contextStr
      ? `${prefix} ${entry.message} ${contextStr}`
      : `${prefix} ${entry.message}`;

    switch (entry.level) {
      case "debug":
      case "info":
        console.log(fullMessage);
        break;
      case "warn":
        console.warn(fullMessage);
        break;
      case "error":
        console.error(fullMessage);
        break;
    }
  }

  private formatContext(context?: Record<string, unknown>): string {
    if (!context || Object.keys(context).length === 0) {
      return "";
    }

    if (!this.verbose) {
      const simpleContext = Object.entries(context)
        .filter(
          ([, value]) => typeof value === "string" || typeof value === "number"
        )
        .map(([key, value]) => `${key}=${value}`)
        .join(" ");
      return simpleContext ? `(${simpleContext})` : "";
    }

    return `\n${JSON.stringify(context, null, 2)}`;
  }
}

/**
 * Create a new logger instance
 */
export function createLogger(options?: LoggerOptions): Logger {
  return new Logger(options);
}
