/**
 * @fileoverview CLI-aware logger that integrates with @clack/prompts for consistent user experience
 */

import type { LoggerOptions } from "./logger";
import { Logger } from "./logger";

export interface CliLoggerOptions extends LoggerOptions {
  useClackPrompts?: boolean;
  spinner?: {
    start: (message: string) => void;
    stop: (message?: string) => void;
  };
}

/**
 * CLI-aware logger that integrates with @clack/prompts for consistent user experience.
 * When CLI package is available, this can use @clack/prompts for better output formatting.
 */
export class CliLogger extends Logger {
  private readonly useClackPrompts: boolean;
  private readonly spinner?: CliLoggerOptions["spinner"];

  constructor(options: CliLoggerOptions = {}) {
    super(options);
    this.useClackPrompts = options.useClackPrompts ?? false;
    this.spinner = options.spinner;
  }

  /**
   * Create a child CLI logger with additional context
   */
  override child(context: Record<string, unknown>): CliLogger {
    const options: CliLoggerOptions = {
      level: this.level,
      verbose: this.verbose,
      context: { ...this.context, ...context },
      useClackPrompts: this.useClackPrompts,
    };
    if (this.spinner) {
      options.spinner = this.spinner;
    }
    return new CliLogger(options);
  }

  /**
   * Start a spinner with message (for long operations)
   */
  startSpinner(message: string): void {
    if (this.spinner) {
      this.spinner.start(message);
    } else {
      this.info(`🔄 ${message}`);
    }
  }

  /**
   * Stop the spinner with optional completion message
   */
  stopSpinner(message?: string): void {
    if (this.spinner) {
      this.spinner.stop(message);
    } else if (message) {
      this.info(`✅ ${message}`);
    }
  }

  /**
   * Log a success message
   */
  success(message: string, context?: Record<string, unknown>): void {
    if (this.useClackPrompts) {
      this.info(`✅ ${message}`, context);
    } else {
      this.info(`✅ ${message}`, context);
    }
  }

  /**
   * Log an operation step
   */
  step(message: string, context?: Record<string, unknown>): void {
    if (this.useClackPrompts) {
      this.info(`→ ${message}`, context);
    } else {
      this.info(`→ ${message}`, context);
    }
  }
}

/**
 * Create a new CLI logger instance
 */
export function createCliLogger(options?: CliLoggerOptions): CliLogger {
  return new CliLogger(options);
}
