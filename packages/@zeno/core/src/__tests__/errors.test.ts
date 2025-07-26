import { describe, it, expect } from "vitest";
import {
  SchemaValidationError,
  GenerationError,
  ConfigurationError,
} from "../errors";

describe("SchemaValidationError", () => {
  it("should create error with file path", () => {
    const error = new SchemaValidationError(
      "Invalid schema format",
      "/path/to/schema.json"
    );

    expect(error.name).toBe("SchemaValidationError");
    expect(error.message).toBe("Invalid schema format");
    expect(error.filePath).toBe("/path/to/schema.json");
    expect(error.lineNumber).toBeUndefined();
    expect(error instanceof Error).toBe(true);
  });

  it("should create error with file path and line number", () => {
    const error = new SchemaValidationError(
      "Missing required property 'name'",
      "/path/to/users.json",
      15
    );

    expect(error.name).toBe("SchemaValidationError");
    expect(error.message).toBe("Missing required property 'name'");
    expect(error.filePath).toBe("/path/to/users.json");
    expect(error.lineNumber).toBe(15);
  });

  it("should be an instance of Error", () => {
    const error = new SchemaValidationError("Test", "/test");
    expect(error instanceof Error).toBe(true);
    expect(error instanceof SchemaValidationError).toBe(true);
  });
});

describe("GenerationError", () => {
  it("should create error with generator name", () => {
    const error = new GenerationError(
      "Failed to generate model",
      "ModelGenerator"
    );

    expect(error.name).toBe("GenerationError");
    expect(error.message).toBe("Failed to generate model");
    expect(error.generatorName).toBe("ModelGenerator");
    expect(error.filePath).toBeUndefined();
    expect(error.context).toBeUndefined();
  });

  it("should create error with all context", () => {
    const context = { entityName: "User", fieldCount: 5 };
    const error = new GenerationError(
      "Template rendering failed",
      "ComponentGenerator",
      "/src/components/UserForm.tsx",
      context
    );

    expect(error.name).toBe("GenerationError");
    expect(error.message).toBe("Template rendering failed");
    expect(error.generatorName).toBe("ComponentGenerator");
    expect(error.filePath).toBe("/src/components/UserForm.tsx");
    expect(error.context).toEqual(context);
  });

  it("should be an instance of Error", () => {
    const error = new GenerationError("Test", "TestGenerator");
    expect(error instanceof Error).toBe(true);
    expect(error instanceof GenerationError).toBe(true);
  });
});

describe("ConfigurationError", () => {
  it("should create error with message only", () => {
    const error = new ConfigurationError("Invalid configuration");

    expect(error.name).toBe("ConfigurationError");
    expect(error.message).toBe("Invalid configuration");
    expect(error.configPath).toBeUndefined();
    expect(error.property).toBeUndefined();
  });

  it("should create error with config path", () => {
    const error = new ConfigurationError(
      "Configuration file not found",
      "/project/zeno.config.ts"
    );

    expect(error.name).toBe("ConfigurationError");
    expect(error.message).toBe("Configuration file not found");
    expect(error.configPath).toBe("/project/zeno.config.ts");
    expect(error.property).toBeUndefined();
  });

  it("should create error with config path and property", () => {
    const error = new ConfigurationError(
      "Missing required property",
      "/project/zeno.config.ts",
      "database.connection"
    );

    expect(error.name).toBe("ConfigurationError");
    expect(error.message).toBe("Missing required property");
    expect(error.configPath).toBe("/project/zeno.config.ts");
    expect(error.property).toBe("database.connection");
  });

  it("should be an instance of Error", () => {
    const error = new ConfigurationError("Test");
    expect(error instanceof Error).toBe(true);
    expect(error instanceof ConfigurationError).toBe(true);
  });
});

describe("Error inheritance", () => {
  it("should maintain proper error stack traces", () => {
    const schemaError = new SchemaValidationError("Schema error", "/test");
    const generationError = new GenerationError("Generation error", "TestGen");
    const configError = new ConfigurationError("Config error");

    expect(schemaError.stack).toBeDefined();
    expect(generationError.stack).toBeDefined();
    expect(configError.stack).toBeDefined();
  });

  it("should be catchable as base Error", () => {
    const errors = [
      new SchemaValidationError("Schema error", "/test"),
      new GenerationError("Generation error", "TestGen"),
      new ConfigurationError("Config error"),
    ];

    for (const error of errors) {
      expect(() => {
        throw error;
      }).toThrow(Error);
    }
  });
});