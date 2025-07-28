import type { Meta, StoryObj } from "@storybook/react";
import { DataTable } from "../components/DataTable";

const meta: Meta<typeof DataTable> = {
  title: "Components/DataTable",
  component: DataTable,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Full-featured data table with sorting, filtering, search, and action buttons.",
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

const sampleData = [
  {
    id: 1,
    name: "John Doe",
    email: "john@example.com",
    age: 30,
    status: "active",
    createdAt: new Date("2023-01-15"),
    salary: 75000,
    isActive: true,
  },
  {
    id: 2,
    name: "Jane Smith",
    email: "jane@example.com",
    age: 28,
    status: "inactive",
    createdAt: new Date("2023-02-20"),
    salary: 82000,
    isActive: false,
  },
  {
    id: 3,
    name: "Bob Johnson",
    email: "bob@example.com",
    age: 35,
    status: "active",
    createdAt: new Date("2023-03-10"),
    salary: 68000,
    isActive: true,
  },
  {
    id: 4,
    name: "Alice Brown",
    email: "alice@example.com",
    age: 32,
    status: "active",
    createdAt: new Date("2023-04-05"),
    salary: 91000,
    isActive: true,
  },
];

const columns = [
  { key: "name" as const, label: "Name", sortable: true },
  { key: "email" as const, label: "Email", sortable: true },
  { key: "age" as const, label: "Age", sortable: true },
  {
    key: "salary" as const,
    label: "Salary",
    formatter: "currency" as const,
    sortable: true,
  },
  {
    key: "createdAt" as const,
    label: "Created At",
    formatter: "date" as const,
    sortable: true,
  },
  { key: "isActive" as const, label: "Active", formatter: "boolean" as const },
];

export const Basic: Story = {
  args: {
    data: sampleData,
    columns,
    title: "Users",
  },
};

export const WithSearch: Story = {
  args: {
    data: sampleData,
    columns,
    title: "Users",
    searchFields: ["name", "email"],
  },
};

export const WithActions: Story = {
  args: {
    data: sampleData,
    columns,
    title: "Users",
    searchFields: ["name", "email"],
    onView: (item) => alert(`Viewing ${item.name}`),
    onEdit: (item) => alert(`Editing ${item.name}`),
    onDelete: (item) => alert(`Deleting ${item.name}`),
  },
};

export const Loading: Story = {
  args: {
    data: [],
    columns,
    title: "Users",
    loading: true,
  },
};

export const Empty: Story = {
  args: {
    data: [],
    columns,
    title: "Users",
    loading: false,
  },
};

export const Sorted: Story = {
  args: {
    data: sampleData,
    columns,
    title: "Users",
    sortField: "name",
    sortOrder: "asc",
  },
};
