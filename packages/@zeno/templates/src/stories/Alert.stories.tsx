import type { Meta, StoryObj } from "@storybook/react";
import { Alert } from "../components/Alert";

const meta: Meta<typeof Alert> = {
  title: "Components/Alert",
  component: Alert,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Alert component for displaying important messages with different variants and dismissible options.",
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Info: Story = {
  args: {
    variant: "info",
    children: "This is an informational message.",
  },
};

export const Success: Story = {
  args: {
    variant: "success",
    children: "Operation completed successfully!",
  },
};

export const Warning: Story = {
  args: {
    variant: "warning",
    children: "Please review your settings before continuing.",
  },
};

export const ErrorAlert: Story = {
  args: {
    variant: "error",
    children: "An error occurred while processing your request.",
  },
};

export const WithTitle: Story = {
  args: {
    variant: "warning",
    title: "Important Notice",
    children:
      "Your subscription will expire in 3 days. Please renew to continue using our services.",
  },
};

export const Dismissible: Story = {
  args: {
    variant: "info",
    title: "New Feature Available",
    children:
      "Check out our new dashboard design! Click to explore the updated interface.",
    dismissible: true,
    onDismiss: () => alert("Alert dismissed"),
  },
};
