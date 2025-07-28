import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Modal } from "../components/Modal";

const meta: Meta<typeof Modal> = {
  title: "Components/Modal",
  component: Modal,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Accessible modal dialog with focus management and keyboard navigation.",
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

interface ModalWrapperProps {
  [key: string]: unknown;
}

const ModalWrapper = (args: ModalWrapperProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <button
        type="button"
        className="btn btn-primary"
        onClick={() => setIsOpen(true)}
      >
        Open Modal
      </button>
      <Modal {...args} isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </div>
  );
};

export const Basic: Story = {
  render: ModalWrapper,
  args: {
    title: "Basic Modal",
    children: (
      <div className="space-y-4">
        <p>This is a basic modal with some content.</p>
        <p>Click the X button or press Escape to close.</p>
      </div>
    ),
  },
};

export const WithForm: Story = {
  render: ModalWrapper,
  args: {
    title: "Create User",
    size: "lg",
    children: (
      <form className="space-y-4">
        <div className="form-control">
          <label className="label" htmlFor="name-input">
            <span className="label-text">Name</span>
          </label>
          <input id="name-input" type="text" className="input input-bordered" />
        </div>
        <div className="form-control">
          <label className="label" htmlFor="email-input">
            <span className="label-text">Email</span>
          </label>
          <input
            id="email-input"
            type="email"
            className="input input-bordered"
          />
        </div>
        <div className="flex gap-4 justify-end">
          <button type="button" className="btn btn-outline">
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            Create
          </button>
        </div>
      </form>
    ),
  },
};

export const Small: Story = {
  render: ModalWrapper,
  args: {
    title: "Small Modal",
    size: "sm",
    children: (
      <div>
        <p>This is a small modal.</p>
      </div>
    ),
  },
};

export const Large: Story = {
  render: ModalWrapper,
  args: {
    title: "Large Modal",
    size: "lg",
    children: (
      <div className="space-y-4">
        <p>This is a large modal with more content.</p>
        <p>It has more space for complex layouts.</p>
        <div className="grid grid-cols-2 gap-4">
          <div className="card bg-base-200 p-4">
            <h3 className="font-bold">Section 1</h3>
            <p>Some content here</p>
          </div>
          <div className="card bg-base-200 p-4">
            <h3 className="font-bold">Section 2</h3>
            <p>More content here</p>
          </div>
        </div>
      </div>
    ),
  },
};
