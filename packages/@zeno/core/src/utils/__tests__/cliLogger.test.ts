/**
 * @fileoverview Tests for CLI-aware logging system
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { CliLogger, createCliLogger } from "../cliLogger";

describe("CliLogger", () => {
  let consoleSpy: {
    log: ReturnType<typeof vi.spyOn>;
    warn: ReturnType<typeof vi.spyOn>;
    error: ReturnType<typeof vi.spyOn>;
  };

  beforeEach(() => {
    consoleSpy = {
      log: vi.spyOn(console, "log").mockImplementation(() => {}),
      warn: vi.spyOn(console, "warn").mockImplementation(() => {}),
      error: vi.spyOn(console, "error").mockImplementation(() => {}),
    };
  });

  describe("createCliLogger", () => {
    it("should create a CLI logger with default options", () => {
      const logger = createCliLogger();
      expect(logger).toBeInstanceOf(CliLogger);
    });

    it("should create a CLI logger with custom options", () => {
      const logger = createCliLogger({
        level: "debug",
        verbose: true,
        useClackPrompts: true,
        context: { module: "cli" },
      });
      expect(logger).toBeInstanceOf(CliLogger);
    });
  });

  describe("CLI-specific methods", () => {
    it("should log success messages with checkmark", () => {
      const logger = createCliLogger({ level: "info" });

      logger.success("Operation completed");

      expect(consoleSpy.log).toHaveBeenCalledWith(
        "INFO: ✅ Operation completed"
      );
    });

    it("should log step messages with arrow", () => {
      const logger = createCliLogger({ level: "info" });

      logger.step("Processing schema");

      expect(consoleSpy.log).toHaveBeenCalledWith("INFO: → Processing schema");
    });

    it("should include context in CLI messages", () => {
      const logger = createCliLogger({
        level: "info",
        context: { module: "cli" },
      });

      logger.success("Done", { files: 5 });

      expect(consoleSpy.log).toHaveBeenCalledWith(
        "INFO: ✅ Done (module=cli files=5)"
      );
    });
  });

  describe("spinner integration", () => {
    it("should use spinner when provided", () => {
      const mockSpinner = {
        start: vi.fn(),
        stop: vi.fn(),
      };

      const logger = createCliLogger({
        level: "info",
        spinner: mockSpinner,
      });

      logger.startSpinner("Loading schemas");

      expect(mockSpinner.start).toHaveBeenCalledWith("Loading schemas");
      expect(consoleSpy.log).not.toHaveBeenCalled();
    });

    it("should stop spinner with completion message", () => {
      const mockSpinner = {
        start: vi.fn(),
        stop: vi.fn(),
      };

      const logger = createCliLogger({
        level: "info",
        spinner: mockSpinner,
      });

      logger.stopSpinner("Schemas loaded");

      expect(mockSpinner.stop).toHaveBeenCalledWith("Schemas loaded");
      expect(consoleSpy.log).not.toHaveBeenCalled();
    });

    it("should fallback to regular logging when no spinner provided", () => {
      const logger = createCliLogger({ level: "info" });

      logger.startSpinner("Loading schemas");
      logger.stopSpinner("Schemas loaded");

      expect(consoleSpy.log).toHaveBeenCalledWith("INFO: 🔄 Loading schemas");
      expect(consoleSpy.log).toHaveBeenCalledWith("INFO: ✅ Schemas loaded");
    });

    it("should only log start message when stopping without message and no spinner", () => {
      const logger = createCliLogger({ level: "info" });

      logger.startSpinner("Loading");
      logger.stopSpinner();

      expect(consoleSpy.log).toHaveBeenCalledTimes(1);
      expect(consoleSpy.log).toHaveBeenCalledWith("INFO: 🔄 Loading");
    });
  });

  describe("child logger", () => {
    it("should create child CLI logger with merged context", () => {
      const parentLogger = createCliLogger({
        level: "info",
        context: { module: "parent" },
        useClackPrompts: true,
      });

      const childLogger = parentLogger.child({ operation: "child" });

      expect(childLogger).toBeInstanceOf(CliLogger);

      childLogger.success("Child operation done");

      expect(consoleSpy.log).toHaveBeenCalledWith(
        "INFO: ✅ Child operation done (module=parent operation=child)"
      );
    });

    it("should inherit spinner from parent", () => {
      const mockSpinner = {
        start: vi.fn(),
        stop: vi.fn(),
      };

      const parentLogger = createCliLogger({
        level: "info",
        spinner: mockSpinner,
      });

      const childLogger = parentLogger.child({ operation: "child" });

      childLogger.startSpinner("Child operation");

      expect(mockSpinner.start).toHaveBeenCalledWith("Child operation");
    });
  });

  describe("inheritance from Logger", () => {
    it("should inherit all base logger functionality", () => {
      const logger = createCliLogger({ level: "info" });

      logger.debug("debug message");
      logger.info("info message");
      logger.warn("warn message");
      logger.error("error message");

      expect(consoleSpy.log).toHaveBeenCalledWith("INFO: info message");
      expect(consoleSpy.warn).toHaveBeenCalledWith("WARN: warn message");
      expect(consoleSpy.error).toHaveBeenCalledWith("ERROR: error message");
      expect(consoleSpy.log).not.toHaveBeenCalledWith("DEBUG: debug message");
    });

    it("should handle error logging", () => {
      const logger = createCliLogger({ level: "error", verbose: false });
      const error = new Error("Test CLI error");

      logger.logError(error, { component: "cli" });

      const call = consoleSpy.error.mock.calls[0][0];
      expect(call).toContain("ERROR: Test CLI error");
      expect(call).toContain("component=cli");
    });
  });

  describe("clack prompts integration", () => {
    it("should work with useClackPrompts flag", () => {
      const logger = createCliLogger({
        level: "info",
        useClackPrompts: true,
      });

      logger.success("Success with clack");
      logger.step("Step with clack");

      expect(consoleSpy.log).toHaveBeenCalledWith(
        "INFO: ✅ Success with clack"
      );
      expect(consoleSpy.log).toHaveBeenCalledWith("INFO: → Step with clack");
    });

    it("should work without useClackPrompts flag", () => {
      const logger = createCliLogger({
        level: "info",
        useClackPrompts: false,
      });

      logger.success("Success without clack");
      logger.step("Step without clack");

      expect(consoleSpy.log).toHaveBeenCalledWith(
        "INFO: ✅ Success without clack"
      );
      expect(consoleSpy.log).toHaveBeenCalledWith("INFO: → Step without clack");
    });
  });
});
