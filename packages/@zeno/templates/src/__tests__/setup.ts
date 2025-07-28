import { beforeEach } from "vitest";
import "@testing-library/jest-dom";

// Mock HTMLDialogElement for modal tests
global.HTMLDialogElement = class MockHTMLDialogElement extends HTMLElement {
  open = false;
  returnValue = "";

  showModal() {
    this.open = true;
  }

  show() {
    this.open = true;
  }

  close(returnValue?: string) {
    this.open = false;
    if (returnValue !== undefined) {
      this.returnValue = returnValue;
    }
    // Dispatch close event
    this.dispatchEvent(new Event("close"));
  }
};

beforeEach(() => {
  // Reset any global state between tests
});
