import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Alert } from "../Alert";

describe("Alert", () => {
  it("renders basic alert", () => {
    render(<Alert>Test message</Alert>);
    expect(screen.getByText("Test message")).toBeInTheDocument();
  });

  it("renders with title", () => {
    render(<Alert title="Test Title">Test message</Alert>);
    expect(screen.getByText("Test Title")).toBeInTheDocument();
    expect(screen.getByText("Test message")).toBeInTheDocument();
  });

  it("applies correct variant class", () => {
    render(<Alert variant="success">Success message</Alert>);
    const alert = screen.getByRole("alert");
    expect(alert).toHaveClass("alert-success");
  });

  it("shows dismiss button when dismissible", () => {
    const onDismiss = vi.fn();
    render(
      <Alert dismissible onDismiss={onDismiss}>
        Dismissible message
      </Alert>
    );
    expect(screen.getByLabelText("Dismiss alert")).toBeInTheDocument();
  });
});
