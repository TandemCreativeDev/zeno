/**
 * @fileoverview Tests for structured logging system
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { LogLevel } from "../logger";
import { createLogger, Logger } from "../logger";

describe("Logger", () => {
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

  describe("createLogger", () => {
    it("should create a logger with default options", () => {
      const logger = createLogger();
      expect(logger).toBeInstanceOf(Logger);
    });

    it("should create a logger with custom options", () => {
      const logger = createLogger({
        level: "debug",
        verbose: true,
        context: { module: "test" },
      });
      expect(logger).toBeInstanceOf(Logger);
    });
  });

  describe("log levels", () => {
    it("should respect log level filtering", () => {
      const logger = createLogger({ level: "warn" });

      logger.debug("debug message");
      logger.info("info message");
      logger.warn("warn message");
      logger.error("error message");

      expect(consoleSpy.log).not.toHaveBeenCalled();
      expect(consoleSpy.warn).toHaveBeenCalledWith("WARN: warn message");
      expect(consoleSpy.error).toHaveBeenCalledWith("ERROR: error message");
    });

    it("should log debug messages when level is debug", () => {
      const logger = createLogger({ level: "debug" });

      logger.debug("debug message");

      expect(consoleSpy.log).toHaveBeenCalledWith("DEBUG: debug message");
    });

    it("should log info messages when level is info or lower", () => {
      const logger = createLogger({ level: "info" });

      logger.info("info message");

      expect(consoleSpy.log).toHaveBeenCalledWith("INFO: info message");
    });

    it("should log warn messages to console.warn", () => {
      const logger = createLogger({ level: "warn" });

      logger.warn("warning message");

      expect(consoleSpy.warn).toHaveBeenCalledWith("WARN: warning message");
    });

    it("should log error messages to console.error", () => {
      const logger = createLogger({ level: "error" });

      logger.error("error message");

      expect(consoleSpy.error).toHaveBeenCalledWith("ERROR: error message");
    });
  });

  describe("context", () => {
    it("should include context in log messages", () => {
      const logger = createLogger({
        level: "info",
        context: { module: "test", version: "1.0.0" },
      });

      logger.info("message with context");

      expect(consoleSpy.log).toHaveBeenCalledWith(
        "INFO: message with context (module=test version=1.0.0)"
      );
    });

    it("should merge additional context with base context", () => {
      const logger = createLogger({
        level: "info",
        context: { module: "test" },
      });

      logger.info("message", { operation: "validate" });

      expect(consoleSpy.log).toHaveBeenCalledWith(
        "INFO: message (module=test operation=validate)"
      );
    });

    it("should format complex context in verbose mode", () => {
      const logger = createLogger({
        level: "info",
        verbose: true,
        context: { module: "test" },
      });

      logger.info("message", { data: { id: 1, name: "test" } });

      const expectedCall = expect.stringContaining("INFO: message");
      expect(consoleSpy.log).toHaveBeenCalledWith(expectedCall);

      const actualCall = consoleSpy.log.mock.calls[0][0];
      expect(actualCall).toContain('"module": "test"');
      expect(actualCall).toContain('"data": {');
      expect(actualCall).toContain('"id": 1');
      expect(actualCall).toContain('"name": "test"');
    });

    it("should only include simple values in non-verbose mode", () => {
      const logger = createLogger({
        level: "info",
        verbose: false,
        context: { module: "test" },
      });

      logger.info("message", {
        operation: "validate",
        data: { complex: "object" },
        count: 5,
      });

      expect(consoleSpy.log).toHaveBeenCalledWith(
        "INFO: message (module=test operation=validate count=5)"
      );
    });
  });

  describe("verbose mode", () => {
    it("should include timestamp in verbose mode", () => {
      const logger = createLogger({ level: "info", verbose: true });

      logger.info("verbose message");

      const call = consoleSpy.log.mock.calls[0][0];
      expect(call).toMatch(
        /^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] INFO: verbose message/
      );
    });

    it("should not include timestamp in non-verbose mode", () => {
      const logger = createLogger({ level: "info", verbose: false });

      logger.info("non-verbose message");

      expect(consoleSpy.log).toHaveBeenCalledWith("INFO: non-verbose message");
    });
  });

  describe("child logger", () => {
    it("should create child logger with merged context", () => {
      const parentLogger = createLogger({
        level: "info",
        context: { module: "parent" },
      });

      const childLogger = parentLogger.child({ operation: "child" });

      childLogger.info("child message");

      expect(consoleSpy.log).toHaveBeenCalledWith(
        "INFO: child message (module=parent operation=child)"
      );
    });

    it("should inherit parent settings", () => {
      const parentLogger = createLogger({
        level: "warn",
        verbose: true,
      });

      const childLogger = parentLogger.child({ operation: "child" });

      childLogger.info("should not log");
      childLogger.warn("should log");

      expect(consoleSpy.log).not.toHaveBeenCalled();
      expect(consoleSpy.warn).toHaveBeenCalled();

      const call = consoleSpy.warn.mock.calls[0][0];
      expect(call).toMatch(
        /^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] WARN: should log/
      );
    });
  });

  describe("logError", () => {
    it("should log error with stack trace in verbose mode", () => {
      const logger = createLogger({ level: "error", verbose: true });
      const error = new Error("Test error");

      logger.logError(error);

      const call = consoleSpy.error.mock.calls[0][0];
      expect(call).toContain("ERROR: Test error");
      expect(call).toContain('"name": "Error"');
      expect(call).toContain('"message": "Test error"');
      expect(call).toContain('"stack":');
    });

    it("should log error without stack trace in non-verbose mode", () => {
      const logger = createLogger({ level: "error", verbose: false });
      const error = new Error("Test error");

      logger.logError(error);

      const call = consoleSpy.error.mock.calls[0][0];
      expect(call).toBe("ERROR: Test error");
    });

    it("should include additional context with error", () => {
      const logger = createLogger({ level: "error", verbose: false });
      const error = new Error("Test error");

      logger.logError(error, { operation: "validate", file: "test.json" });

      const call = consoleSpy.error.mock.calls[0][0];
      expect(call).toBe(
        "ERROR: Test error (operation=validate file=test.json)"
      );
    });
  });

  describe("log level constants", () => {
    const levels: Array<{ level: LogLevel; shouldLog: LogLevel[] }> = [
      { level: "debug", shouldLog: ["debug", "info", "warn", "error"] },
      { level: "info", shouldLog: ["info", "warn", "error"] },
      { level: "warn", shouldLog: ["warn", "error"] },
      { level: "error", shouldLog: ["error"] },
    ];

    levels.forEach(({ level, shouldLog }) => {
      it(`should only log appropriate levels for ${level}`, () => {
        const logger = createLogger({ level });

        logger.debug("debug");
        logger.info("info");
        logger.warn("warn");
        logger.error("error");

        const totalCalls =
          consoleSpy.log.mock.calls.length +
          consoleSpy.warn.mock.calls.length +
          consoleSpy.error.mock.calls.length;

        expect(totalCalls).toBe(shouldLog.length);
      });
    });
  });
});
